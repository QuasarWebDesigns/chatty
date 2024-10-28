import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import Chatbot from "@/models/chatbot";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await connectMongo();

  const chatbot = await Chatbot.findById(params.id);
  if (!chatbot || chatbot.userId.toString() !== session.user.id) {
    return new NextResponse("Not found", { status: 404 });
  }

  return NextResponse.json(chatbot);
}
