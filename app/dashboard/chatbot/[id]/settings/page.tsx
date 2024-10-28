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
      <div className="mb-12">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold mb-2">Settings for {chatbot.name}</h1>
          <p className="text-muted-foreground">
            Manage your chatbot's documents and settings
          </p>
        </div>
        <div className="flex justify-end">
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-12">
        {/* Sidebar Navigation */}
        <div className="col-span-4">
          <div className="sticky top-6 bg-card rounded-lg border p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Navigation</h2>
              <p className="text-sm text-muted-foreground">
                Configure your chatbot settings
              </p>
            </div>
            <Separator className="my-4" />
            <div className="space-y-2">
              <Button 
                variant="ghost" 
                className="w-full justify-start hover:bg-primary/10" 
                asChild
              >
                <Link href={`/dashboard/chatbot/${params.id}/files`}>
                  <FileText className="h-4 w-4 mr-3 text-primary" />
                  <span className="font-medium">Files</span>
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start hover:bg-primary/10" 
                asChild
              >
                <Link href={`/dashboard/chatbot/${params.id}/web`}>
                  <Globe className="h-4 w-4 mr-3 text-primary" />
                  <span className="font-medium">Web Sources</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-8">
          <div className="bg-card rounded-lg border p-6 shadow-sm max-w-3xl">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Uploaded Documents</h2>
                <Button variant="outline" size="sm">
                  Upload New
                </Button>
              </div>

              {documents.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-6" />
                    <h3 className="font-medium mb-3">No documents uploaded</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Upload documents to train your chatbot
                    </p>
                    <Button>Upload Documents</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {documents.map((doc) => (
                    <Card key={doc._id.toString()} className="group hover:shadow-md transition-all">
                      <CardContent className="flex items-center p-3">
                        <div className="p-1.5 rounded-lg bg-primary/5 mr-3">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.chunkCount} chunks • Added {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
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
    </div>
  );
}
