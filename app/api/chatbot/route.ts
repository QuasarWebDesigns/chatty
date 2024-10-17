import { NextResponse, NextRequest } from "next/server";
import connectMongo from "@/libs/mongoose";
import Chatbot from "@/models/chatbot";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectMongo();

  const body = await req.json();

  if (!body.name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const chatbot = await Chatbot.create({
      name: body.name,
      automaticPopup: body.automaticPopup,
      popupText: body.popupText,
      userId: session.user.id,
    });

    // Serialize the chatbot data before sending it back
    const serializedChatbot = {
      id: chatbot._id.toString(),
      name: chatbot.name,
      automaticPopup: chatbot.automaticPopup,
      popupText: chatbot.popupText,
      userId: chatbot.userId.toString(),
      createdAt: chatbot.createdAt.toISOString(),
      updatedAt: chatbot.updatedAt.toISOString()
    };

    return NextResponse.json(serializedChatbot, { status: 201 });
  } catch (error) {
    console.error("Error creating chatbot:", error);
    return NextResponse.json({ error: "Failed to create chatbot" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectMongo();

  try {
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

  try {
    const chatbot = await Chatbot.findOneAndDelete({ _id: id, userId: session.user.id });

    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found or not authorized to delete" }, { status: 404 });
    }

    return NextResponse.json({ message: "Chatbot deleted successfully" });
  } catch (error) {
    console.error("Error deleting chatbot:", error);
    return NextResponse.json({ error: "Failed to delete chatbot" }, { status: 500 });
  }
}
