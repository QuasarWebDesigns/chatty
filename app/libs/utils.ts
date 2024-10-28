import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";

export async function authenticateUser(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session };
}

export async function connectToDatabase() {
  await connectMongo();
}

export function handleApiError(error: any, message: string) {
  console.error(message, error);
  return NextResponse.json({ error: message, details: error.message }, { status: 500 });
} 