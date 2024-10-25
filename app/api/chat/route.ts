import { NextResponse } from 'next/server';
import { sendOpenAi } from '@/libs/gpt';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages, chatbotId } = await req.json();
  try {
    const response = await sendOpenAi(messages, parseInt(chatbotId), session.user.id);
    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: 'Failed to get response from AI' }, { status: 500 });
  }
}
