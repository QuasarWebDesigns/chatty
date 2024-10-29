import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, connectToDatabase, handleApiError } from '@/libs/utils';
import Document from '@/models/document';
import Chatbot from '@/models/chatbot';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await authenticateUser();
    if (error) return error;

    await connectToDatabase();

    // First verify the chatbot exists
    const chatbot = await Chatbot.findById(params.id);
    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });
    }

    // Find documents and populate necessary fields
    const documents = await Document.find({ chatbotId: params.id })
      .select('name chunkCount createdAt updatedAt')
      .sort({ createdAt: -1 });

    return NextResponse.json(documents);
  } catch (error) {
    return handleApiError(error, "Error fetching documents");
  }
} 