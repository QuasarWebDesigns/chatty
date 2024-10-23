import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, connectToDatabase, handleApiError } from '@/libs/utils';
import Chatbot from '@/models/chatbot';
import Document from '@/models/document';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await authenticateUser();
    if (error) return error;

    await connectToDatabase();

    const chatbot = await Chatbot.findById(params.id);
    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });
    }

    // Delete associated documents
    await Document.deleteMany({ chatbotId: chatbot._id });

    // Delete the chatbot
    await Chatbot.findByIdAndDelete(params.id);

    return NextResponse.json({ message: "Chatbot deleted successfully" });
  } catch (error) {
    return handleApiError(error, "Error deleting chatbot");
  }
}
