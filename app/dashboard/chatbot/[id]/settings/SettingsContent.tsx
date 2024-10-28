"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Globe, LayoutDashboard, Trash2, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

export default function SettingsContent({ chatbotId }: { chatbotId: string }) {
  const [activeView, setActiveView] = useState<'files' | 'web'>('files');
  const [chatbot, setChatbot] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [chatbotRes, documentsRes] = await Promise.all([
          fetch(`/api/chatbots/${chatbotId}`),
          fetch(`/api/chatbots/${chatbotId}/documents`)
        ]);
        
        const chatbotData = await chatbotRes.json();
        const documentsData = await documentsRes.json();
        
        setChatbot(chatbotData);
        setDocuments(documentsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [chatbotId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-[1200px] mx-auto p-6">
      {/* Header */}
      <div className="mb-12">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold mb-2">Settings for {chatbot?.name}</h1>
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
                className={`w-full justify-start hover:bg-primary/10 ${activeView === 'files' ? 'bg-primary/10' : ''}`}
                onClick={() => setActiveView('files')}
              >
                <FileText className="h-4 w-4 mr-3 text-primary" />
                <span className="font-medium">Files</span>
              </Button>
              <Button 
                variant="ghost" 
                className={`w-full justify-start hover:bg-primary/10 ${activeView === 'web' ? 'bg-primary/10' : ''}`}
                onClick={() => setActiveView('web')}
              >
                <Globe className="h-4 w-4 mr-3 text-primary" />
                <span className="font-medium">Web Sources</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-8">
          <div className="bg-card rounded-lg border p-6 shadow-sm max-w-xl">
            {activeView === 'files' ? (
              <div className="space-y-8">
                <div className="flex flex-col items-center text-center gap-4">
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
                          <div className="flex-1 min-w-0 text-center">
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
            ) : (
              <div className="space-y-8">
                <div className="flex flex-col items-center text-center gap-4">
                  <h2 className="text-xl font-semibold">Website</h2>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Crawl</h3>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="https://www.example.com" 
                        className="flex-1"
                      />
                      <Button variant="outline">
                        Fetch links
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      This will crawl all the links starting with the URL (not including files on the website).
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-medium">Submit Sitemap</h3>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="https://www.example.com/sitemap.xml"
                        className="flex-1"
                      />
                      <Button variant="outline">
                        Load sitemap
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-medium">Included Links</h3>
                    <Button variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add URL
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
