import { NextResponse, NextRequest } from "next/server";
import connectMongo from "@/libs/mongoose";
import Chatbot from "@/models/chatbot";
import Document from "@/models/document";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { sendOpenAi } from '@/libs/gpt';
import { processDocument, createChatbotWithDocuments, searchEmbeddings } from '@/libs/chatbotProcessing';

// POST route to create a new chatbot
export async function POST(req: NextRequest) {
  // Authenticate user
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
    // Check for existing chatbot with the same name
    const existingChatbot = await Chatbot.findOne({ name, userId: session.user.id });
    if (existingChatbot) {
      return NextResponse.json({ error: "A chatbot with this name already exists" }, { status: 409 });
    }

    console.log(`Processing ${documents.length} documents for chatbot: ${name}`);

    // Process each document
    const processedDocuments = [];
    for (let i = 0; i < documents.length; i++) {
      const file = documents[i];
      console.log(`Processing document ${i + 1}/${documents.length}: ${file.name}`);
      
      const processedDoc = await processDocument(file, session.user.id);
      console.log(`Generated embeddings for ${file.name}`);
      
      processedDocuments.push(processedDoc);
      
      console.log(`Finished processing ${file.name}`);
      console.log(`Progress: ${Math.round(((i + 1) / documents.length) * 100)}%`);
    }

    // Create chatbot with processed documents
    const chatbot = await createChatbotWithDocuments(name, automaticPopup, popupText, session.user.id, processedDocuments);

    console.log(`Finished processing all documents for chatbot: ${name}`);

    return NextResponse.json(chatbot.toJSON(), { status: 201 });
  } catch (error) {
    console.error("Error creating chatbot:", error);
    return NextResponse.json({ error: "Failed to create chatbot", details: error.message }, { status: 500 });
  }
}

// GET route to fetch all chatbots for a user
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

// DELETE route to remove a chatbot and its associated documents
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

// PUT route to handle chat interactions
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

    // Get the last user message
    const lastUserMessage = messages[messages.length - 1].content;

    console.log(`Searching embeddings for chatbot ${chatbotId} with query: "${lastUserMessage}"`);

    // Search for relevant embeddings
    const { context } = await searchEmbeddings(lastUserMessage, chatbotId);

    console.log('Context retrieved:', context);

    // Send to OpenAI with context
    const response = await sendOpenAi(messages, parseInt(chatbotId), context);

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
