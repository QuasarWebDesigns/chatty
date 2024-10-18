import { getServerSession } from "next-auth";
import { authOptions } from "../libs/next-auth";
import { NextResponse } from "next/server";
import connectMongo from "../libs/mongoose";

export async function authenticateUser() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session };
}

export async function connectToDatabase() {
  await connectMongo();
}

export function handleApiError(error: any, errorMessage: string) {
  console.error(errorMessage, error);
  return NextResponse.json({ error: errorMessage, details: error.message }, { status: 500 });
}
