import { NextResponse, NextRequest } from "next/server";
import connectMongo from "@/libs/mongoose";
import Chatbot from "@/models/chatbot";
import Document from "@/models/document";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { sendOpenAi } from '@/libs/gpt';
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CHUNK_SIZE = 300; // Adjust this value based on your needs

async function generateEmbedding(text: string) {
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float",
  });
  return embedding.data[0].embedding;
}

function chunkEmbedding(embedding: number[], chunkSize: number) {
  const chunks = [];
  for (let i = 0; i < embedding.length; i += chunkSize) {
    chunks.push({
      chunk: embedding.slice(i, i + chunkSize),
      startIndex: i,
      endIndex: Math.min(i + chunkSize, embedding.length),
    });
  }
  return chunks;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectMongo();

  const formData = await req.formData();
  const name = formData.get('name') as string;
  const automaticPopup = formData.get('automaticPopup') === 'true';
  const popupText = formData.get('popupText') as string;
  const documents = formData.getAll('documents') as File[];

  if (!name || documents.length === 0) {
    return NextResponse.json({ error: "Name and documents are required" }, { status: 400 });
  }

  try {
    console.log("Processing documents...");
    const processedDocuments = await Promise.all(documents.map(async (file, index) => {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const content = buffer.toString('utf-8');
      console.log(`Generating embedding for document ${index + 1}: ${file.name}`);
      const embedding = await generateEmbedding(content);
      const embeddingChunks = chunkEmbedding(embedding, CHUNK_SIZE);
      console.log(`Embedding generated and chunked for ${file.name}. Chunks: ${embeddingChunks.length}`);
      return {
        name: file.name,
        content,
        embeddingChunks,
      };
    }));

    console.log("Creating chatbot...");
    const chatbot = await Chatbot.create({
      name,
      automaticPopup,
      popupText,
      userId: session.user.id,
    });

    // Create documents and link them to the chatbot
    const createdDocuments = await Promise.all(processedDocuments.map(async (doc) => {
      const document = await Document.create({
        name: doc.name,
        content: doc.content,
        embeddingChunks: doc.embeddingChunks,
        chatbotId: chatbot._id,
      });
      return document._id;
    }));

    // Update chatbot with document references
    chatbot.documents = createdDocuments;
    await chatbot.save();

    console.log("Created chatbot with documents:", JSON.stringify(chatbot, null, 2));

    const serializedChatbot = chatbot.toJSON();
    console.log("Serialized chatbot:", JSON.stringify(serializedChatbot, null, 2));

    return NextResponse.json(serializedChatbot, { status: 201 });
  } catch (error) {
    console.error("Error creating chatbot:", error);
    return NextResponse.json({ error: "Failed to create chatbot", details: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectMongo();

  try {
    const chatbots = await Chatbot.find({ userId: session.user.id });
    const serializedChatbots = chatbots.map(chatbot => ({
      id: chatbot._id.toString(),
      name: chatbot.name,
      automaticPopup: chatbot.automaticPopup,
      popupText: chatbot.popupText,
      userId: chatbot.userId.toString(),
      createdAt: chatbot.createdAt.toISOString(),
      updatedAt: chatbot.updatedAt.toISOString(),
    }));

    return NextResponse.json(serializedChatbots);
  } catch (error) {
    console.error("Error fetching chatbots:", error);
    return NextResponse.json({ error: "Failed to fetch chatbots" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectMongo();

  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: "Chatbot ID is required" }, { status: 400 });
  }

  try {
    const chatbot = await Chatbot.findOneAndDelete({ _id: id, userId: session.user.id });

    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found or not authorized to delete" }, { status: 404 });
    }

    return NextResponse.json({ message: "Chatbot deleted successfully" });
  } catch (error) {
    console.error("Error deleting chatbot:", error);
    return NextResponse.json({ error: "Failed to delete chatbot" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectMongo();

  const { messages, chatbotId } = await req.json();

  try {
    // Verify that the chatbot belongs to the user
    const chatbot = await Chatbot.findOne({ _id: chatbotId, userId: session.user.id });
    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found or unauthorized" }, { status: 404 });
    }

    console.log("Sending messages to OpenAI:", messages);
    const response = await sendOpenAi(messages, parseInt(chatbotId));
    console.log("LLM Response:", response);

    if (response) {
      return NextResponse.json({ response });
    } else {
      console.log("Empty response from LLM");
      return NextResponse.json({ error: 'Empty response from AI' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: 'Failed to get response from AI', details: error.message }, { status: 500 });
  }
}
