import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, connectToDatabase, handleApiError } from '@/libs/utils';
import Chatbot from '@/models/chatbot';
import { Pinecone } from "@pinecone-database/pinecone";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await authenticateUser();
    if (error) return error;

    await connectToDatabase();

    const chatbot = await Chatbot.findById(params.id);
    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });
    }

    // Initialize Pinecone
    const pinecone = new Pinecone();
    const index = pinecone.Index("embeds-test");

    // Delete the namespace
    const namespace = `${chatbot.name}-${chatbot.id}`;
    await index.namespace(namespace).deleteAll();

    return NextResponse.json({ message: "Embeddings deleted successfully" });
  } catch (error) {
    return handleApiError(error, "Error deleting embeddings");
  }
}
