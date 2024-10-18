import { NextResponse, NextRequest } from "next/server";
import connectMongo from "@/libs/mongoose";
import Chatbot from "@/models/chatbot";
import Document from "@/models/document";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import OpenAI from "openai";
import { sendOpenAi } from '@/libs/gpt';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CHUNK_SIZE = 1000; // Adjust based on your needs
const CHUNK_OVERLAP = 200; // Overlap between chunks to maintain context

async function generateEmbedding(text: string) {
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float",
  });
  return embedding.data[0].embedding;
}

function chunkText(text: string, chunkSize: number, overlap: number) {
  const chunks = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + chunkSize, text.length);
    chunks.push({
      text: text.slice(startIndex, endIndex),
      startIndex,
      endIndex
    });
    startIndex += chunkSize - overlap;
  }

  return chunks;
}

async function processDocument(file: File) {
  const content = await file.text();
  const chunks = chunkText(content, CHUNK_SIZE, CHUNK_OVERLAP);
  const embeddingChunks = [];
  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk.text);
    embeddingChunks.push({
      embedding,
      startIndex: chunk.startIndex,
      endIndex: chunk.endIndex,
    });
  }
  return { name: file.name, embeddingChunks };
}

async function createChatbotWithDocuments(name: string, automaticPopup: boolean, popupText: string, userId: string, processedDocuments: any[]) {
  const chatbot = await Chatbot.create({ name, automaticPopup, popupText, userId });
  const createdDocuments = await Promise.all(processedDocuments.map(doc => 
    Document.create({ name: doc.name, embeddingChunks: doc.embeddingChunks, chatbotId: chatbot._id })
  ));
  chatbot.documents = createdDocuments.map(doc => doc._id);
  await chatbot.save();
  return chatbot;
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
    const chatbot = await Chatbot.create({ name, automaticPopup, popupText, userId: session.user.id });

    console.log(`Processing ${documents.length} documents for chatbot: ${name}`);

    const processedDocuments = [];
    for (let i = 0; i < documents.length; i++) {
      const file = documents[i];
      console.log(`Processing document ${i + 1}/${documents.length}: ${file.name}`);
      
      const processedDoc = await processDocument(file);
      console.log(`Generating embeddings for ${file.name}`);
      
      const createdDoc = await Document.create({ 
        name: processedDoc.name, 
        embeddingChunks: processedDoc.embeddingChunks, 
        chatbotId: chatbot._id 
      });
      processedDocuments.push(createdDoc._id);
      
      console.log(`Finished processing ${file.name}`);
      console.log(`Progress: ${Math.round(((i + 1) / documents.length) * 100)}%`);
    }

    chatbot.documents = processedDocuments;
    await chatbot.save();

    console.log(`Finished processing all documents for chatbot: ${name}`);

    return NextResponse.json(chatbot.toJSON(), { status: 201 });
  } catch (error) {
    console.error("Error creating chatbot:", error);
    return NextResponse.json({ error: "Failed to create chatbot", details: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();

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
  try {
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

    // Find the chatbot
    const chatbot = await Chatbot.findOne({ _id: id, userId: session.user.id });

    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found or not authorized to delete" }, { status: 404 });
    }

    // Delete all associated documents and their embeddings
    await Document.deleteMany({ chatbotId: chatbot._id });

    // Delete the chatbot
    await Chatbot.findByIdAndDelete(chatbot._id);

    return NextResponse.json({ message: "Chatbot and associated documents deleted successfully" });
  } catch (error) {
    console.error("Error deleting chatbot:", error);
    return NextResponse.json({ error: "Failed to delete chatbot", details: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();

    const { messages, chatbotId } = await req.json();

    const chatbot = await Chatbot.findOne({ _id: chatbotId, userId: session.user.id });
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
