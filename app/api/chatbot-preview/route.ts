import { NextRequest, NextResponse } from 'next/server';
import { searchEmbeddings } from '@/libs/chatbotProcessing';
import { sendOpenAi } from '@/libs/gpt';

export async function POST(req: NextRequest) {
  try {
    const { messages, chatbotId } = await req.json();

    if (!messages || !chatbotId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1].content;
    const { context } = await searchEmbeddings(lastUserMessage, chatbotId);
    
    const response = await sendOpenAi(messages, parseInt(chatbotId), context);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in chatbot preview:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
