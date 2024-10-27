import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { redirect } from "next/navigation";
import connectMongo from "@/libs/mongoose";
import Chatbot from "@/models/chatbot";
import Document from "@/models/document";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Globe, LayoutDashboard, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
    <div className="max-w-[1200px] mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Settings for {chatbot.name}</h1>
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground mt-2">
          Manage your chatbot's documents and settings
        </p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Sidebar Navigation */}
        <div className="col-span-3">
          <div className="space-y-1 sticky top-6">
            <div className="mb-4 px-3 py-2">
              <h2 className="text-lg font-semibold mb-2">Navigation</h2>
              <p className="text-sm text-muted-foreground">
                Configure your chatbot settings
              </p>
            </div>
            <Separator className="my-4" />
            <Button 
              variant="ghost" 
              className="w-full justify-start text-primary" 
              asChild
            >
              <Link href={`/dashboard/chatbot/${params.id}/files`}>
                <FileText className="h-4 w-4 mr-3" />
                Files
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start" 
              asChild
            >
              <Link href={`/dashboard/chatbot/${params.id}/web`}>
                <Globe className="h-4 w-4 mr-3" />
                Web Sources
              </Link>
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-9">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Uploaded Documents</h2>
              <Button variant="outline" size="sm">
                Upload New
              </Button>
            </div>

            {documents.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">No documents uploaded</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload documents to train your chatbot
                  </p>
                  <Button>Upload Documents</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {documents.map((doc) => (
                  <Card key={doc._id.toString()} className="group hover:shadow-md transition-all">
                    <CardContent className="flex items-center p-4">
                      <div className="p-2 rounded-lg bg-primary/5 mr-4">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.chunkCount} chunks • Added {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
