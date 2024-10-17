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
  return embedding.reduce((chunks, _, i) => {
    if (i % chunkSize === 0) {
      chunks.push({
        chunk: embedding.slice(i, i + chunkSize),
        startIndex: i,
        endIndex: Math.min(i + chunkSize, embedding.length),
      });
    }
    return chunks;
  }, []);
}

async function processDocument(file: File) {
  const content = await file.text();
  const embedding = await generateEmbedding(content);
  const embeddingChunks = chunkEmbedding(embedding, CHUNK_SIZE);
  return { name: file.name, content, embeddingChunks };
}

async function createChatbotWithDocuments(name: string, automaticPopup: boolean, popupText: string, userId: string, processedDocuments: any[]) {
  const chatbot = await Chatbot.create({ name, automaticPopup, popupText, userId });
  const createdDocuments = await Promise.all(processedDocuments.map(doc => 
    Document.create({ ...doc, chatbotId: chatbot._id })
  ));
  chatbot.documents = createdDocuments.map(doc => doc._id);
  await chatbot.save();
  return chatbot;
}

async function authenticateRequest(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    await connectMongo();

    const formData = await req.formData();
    const name = formData.get('name') as string;
    const automaticPopup = formData.get('automaticPopup') === 'true';
    const popupText = formData.get('popupText') as string;
    const documents = formData.getAll('documents') as File[];

    if (!name || documents.length === 0) {
      return NextResponse.json({ error: "Name and documents are required" }, { status: 400 });
    }

    const processedDocuments = await Promise.all(documents.map(processDocument));
    const chatbot = await createChatbotWithDocuments(name, automaticPopup, popupText, user.id, processedDocuments);

    return NextResponse.json(chatbot.toJSON(), { status: 201 });
  } catch (error) {
    console.error("Error creating chatbot:", error);
    return NextResponse.json({ error: "Failed to create chatbot", details: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    await connectMongo();

    const chatbots = await Chatbot.find({ userId: user.id });
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
  try {
    const user = await authenticateRequest(req);
    await connectMongo();

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Chatbot ID is required" }, { status: 400 });
    }

    const chatbot = await Chatbot.findOneAndDelete({ _id: id, userId: user.id });

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
  try {
    const user = await authenticateRequest(req);
    await connectMongo();

    const { messages, chatbotId } = await req.json();

    const chatbot = await Chatbot.findOne({ _id: chatbotId, userId: user.id });
    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found or unauthorized" }, { status: 404 });
    }

    const response = await sendOpenAi(messages, parseInt(chatbotId));

    if (response) {
      return NextResponse.json({ response });
    } else {
      return NextResponse.json({ error: 'Empty response from AI' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: 'Failed to get response from AI', details: error.message }, { status: 500 });
  }
}
