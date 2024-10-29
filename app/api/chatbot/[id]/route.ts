import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, connectToDatabase, handleApiError } from '@/libs/utils';
import Chatbot from '@/models/chatbot';
import Document from '@/models/document';
import { Pinecone } from "@pinecone-database/pinecone";

// Get a single chatbot
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await authenticateUser();
    if (error) return error;

    await connectToDatabase();

    const chatbot = await Chatbot.findById(params.id);
    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });
    }

    return NextResponse.json(chatbot);
  } catch (error) {
    return handleApiError(error, "Error fetching chatbot");
  }
}

// Delete a chatbot and its associated data
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await authenticateUser();
    if (error) return error;

    await connectToDatabase();

    const chatbot = await Chatbot.findById(params.id);
    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });
    }

    // Check if the chatbot has associated documents
    const documents = await Document.find({ chatbotId: chatbot._id });

    if (documents.length > 0) {
      // Delete embeddings from Pinecone
      try {
        const pinecone = new Pinecone();
        const index = pinecone.Index("embeds-test");
        const namespace = `${chatbot.name}-${chatbot.id}`;
        await index.namespace(namespace).deleteAll();
      } catch (pineconeError) {
        console.error("Error deleting Pinecone embeddings:", pineconeError);
      }

      // Delete associated documents
      await Document.deleteMany({ chatbotId: chatbot._id });
    }

    // Delete the chatbot
    await Chatbot.findByIdAndDelete(params.id);

    return NextResponse.json({ message: "Chatbot and associated data deleted successfully" });
  } catch (error) {
    return handleApiError(error, "Error deleting chatbot");
  }
}
