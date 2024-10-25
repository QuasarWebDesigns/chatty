import { NextResponse, NextRequest } from "next/server";
import connectMongo from "@/libs/mongoose";
import Chatbot from "@/models/chatbot";
import Document from "@/models/document";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { sendOpenAi } from '@/libs/gpt';
import { processDocument, createChatbotWithDocuments, searchEmbeddings } from '@/libs/chatbotProcessing';
import { Types } from 'mongoose';

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
    // Create chatbot first to get the ID
    const chatbot = await Chatbot.create({ name, automaticPopup, popupText, userId: session.user.id });

    // Process each document
    const processedDocuments = [];
    const errors = [];
    for (let i = 0; i < documents.length; i++) {
      const file = documents[i];
      console.log(`Processing document ${i + 1}/${documents.length}: ${file.name}`);
      
      try {
        const processedDoc = await processDocument(file, chatbot._id.toString(), chatbot.name);
        console.log(`Generated embeddings for ${file.name}`);
        
        processedDocuments.push(processedDoc);
        
        console.log(`Finished processing ${file.name}`);
        console.log(`Progress: ${Math.round(((i + 1) / documents.length) * 100)}%`);
      } catch (docError) {
        console.error(`Error processing document ${file.name}:`, docError);
        errors.push({ file: file.name, error: docError.message });
      }
    }

    // Update chatbot with processed documents
    const createdDocuments = await Promise.all(processedDocuments.map(doc => 
      Document.create({ name: doc.name, chunkCount: doc.chunkCount, chatbotId: chatbot._id })
    ));
    chatbot.documents = createdDocuments.map(doc => doc._id);
    await chatbot.save();

    console.log(`Finished processing all documents for chatbot: ${name}`);

    return NextResponse.json({ 
      chatbot: chatbot.toJSON(), 
      processedCount: processedDocuments.length,
      errors: errors.length > 0 ? errors : undefined 
    }, { status: 201 });
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

    if (!Types.ObjectId.isValid(chatbotId)) {
      return NextResponse.json({ error: 'Invalid chatbotId' }, { status: 400 });
    }

    const chatbot = await Chatbot.findById(chatbotId);
    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found or unauthorized" }, { status: 404 });
    }

    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) {
      return NextResponse.json({ error: 'No user message found' }, { status: 400 });
    }

    const { context } = await searchEmbeddings(lastUserMessage.content, chatbotId);

    const systemMessage = messages.find(m => m.role === 'system');
    const updatedSystemMessage = {
      role: 'system',
      content: systemMessage ? `${systemMessage.content}\n\nUse the following context to answer the user's question:\n\n${context}` : `Use the following context to answer the user's question:\n\n${context}`
    };

    const messagesWithContext = [
      updatedSystemMessage,
      ...messages.filter(m => m.role !== 'system')
    ];

    const response = await sendOpenAi(messagesWithContext, parseInt(session.user.id), chatbotId);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error processing chatbot request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
