import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { redirect } from "next/navigation";
import connectMongo from "@/libs/mongoose";
import Chatbot from "@/models/chatbot";
import Document from "@/models/document";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

// Add dynamic rendering to ensure fresh data
export const dynamic = "force-dynamic";

export default async function ChatbotSettings({ params }: { params: { id: string } }) {
  // Authenticate user
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/login");
  }

  await connectMongo();

  // Fetch chatbot and its documents
  const chatbot = await Chatbot.findById(params.id);
  if (!chatbot) {
    redirect("/dashboard"); // Redirect if chatbot not found
  }

  // Ensure user owns this chatbot
  if (chatbot.userId.toString() !== session.user.id) {
    redirect("/dashboard");
  }

  // Fetch documents associated with this chatbot
  const documents = await Document.find({ chatbotId: chatbot._id });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Settings for {chatbot.name}</h1>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Uploaded Documents</h2>
        {documents.length === 0 ? (
          <p className="text-gray-500">No documents uploaded yet.</p>
        ) : (
          <div className="grid gap-4">
            {documents.map((doc) => (
              <Card key={doc._id.toString()}>
                <CardContent className="flex items-center p-4">
                  <FileText className="h-6 w-6 mr-3 text-gray-500" />
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-gray-500">
                      Chunks: {doc.chunkCount} | 
                      Added: {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
