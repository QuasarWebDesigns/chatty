import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Play, ArrowRight } from "lucide-react";
import SubscriptionBanner from "@/components/SubscriptionBanner";
import { Sidebar } from "@/components/Sidebar";
import connectMongo from "@/libs/mongoose";
import Chatbot from "@/models/chatbot";
import { ChatbotList } from "@/components/ChatbotList";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return <div>Please log in to access the dashboard.</div>;
  }

  await connectMongo();
  const chatbots = await Chatbot.find({ userId: session.user.id });

  return (
    <div className="flex flex-col min-h-screen">
      <SubscriptionBanner />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 pb-24">
          <section className="max-w-xl mx-auto space-y-8">
            <h1 className="text-3xl md:text-4xl font-extrabold">Dashboard</h1>
          </section>

          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Chatbots</h2>
            <div className="flex items-center space-x-4">
              <Input type="search" placeholder="Search your chatbot" className="max-w-sm" />
            </div>
          </div>

          <ChatbotList initialChatbots={chatbots} />

          <section>
            <h2 className="text-2xl font-semibold mb-4">Get started</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-yellow-400 mr-4"></div>
                    <h3 className="font-semibold">How to start building your chatbots</h3>
                  </div>
                  <Button variant="outline" className="rounded-full">
                    <Play size={16} className="mr-2" /> Watch
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-green-400 mr-4"></div>
                    <h3 className="font-semibold">Learn the basics of ChatBot within minutes</h3>
                  </div>
                  <Button variant="outline" className="rounded-full">Start lesson</Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">Help Center</h3>
                  <p className="mb-4">Visit our Help Center to learn more about ChatBot setup.</p>
                  <Button variant="outline" className="rounded-full" asChild>
                    <Link href="/help-center">
                      Explore <ArrowRight size={16} className="ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
