import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Play, ArrowRight, FileText, HelpCircle } from "lucide-react";
import SubscriptionBanner from "@/components/SubscriptionBanner";
import { Sidebar } from "@/components/Sidebar";
import connectMongo from "@/libs/mongoose";
import Chatbot from "@/models/chatbot";
import { ChatbotList } from "@/components/ChatbotList";
import { Card, CardContent } from "@/components/ui/card";
import config from "@/config";
import User from "@/models/User";
import ButtonAccount from "@/components/ButtonAccount";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return <div>Please log in to access the dashboard.</div>;
  }

  await connectMongo();
  const chatbots = await Chatbot.find({ userId: session.user.id });
  const user = await User.findById(session.user.id);
  
  // Get the current plan details
  const currentPlan = config.stripe.plans.find(plan => plan.priceId === user?.priceId);

  // Serialize the chatbot data
  const serializedChatbots = chatbots.map(chatbot => ({
    id: chatbot._id.toString(),
    name: chatbot.name,
    automaticPopup: chatbot.automaticPopup,
    popupText: chatbot.popupText,
    userId: chatbot.userId.toString(),
    createdAt: chatbot.createdAt.toISOString(),
    updatedAt: chatbot.updatedAt.toISOString()
  }));

  return (
    <div className="flex flex-col min-h-screen">
      <SubscriptionBanner />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 pb-24">
          <div className="max-w-[1200px] mx-auto">
            {/* Header with Plan Info */}
            <div className="mb-12">
              <div className="text-center mb-4">
                <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                <p className="text-muted-foreground">
                  Manage your chatbots and settings
                </p>
                {currentPlan && (
                  <div className="mt-4 space-y-2">
                    <span className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary">
                      Current Plan: {currentPlan.name} - ${currentPlan.price}/month
                    </span>
                    <div>
                      <ButtonAccount /> {/* This includes the billing portal access */}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Chatbots Section */}
            <div className="bg-card rounded-lg border p-6 shadow-sm mb-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Your Chatbots</h2>
                  <p className="text-sm text-muted-foreground">
                    Create and manage your AI chatbots
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <Input 
                    type="search" 
                    placeholder="Search chatbots..." 
                    className="max-w-sm"
                  />
                </div>
              </div>

              <ChatbotList initialChatbots={serializedChatbots} />
            </div>

            {/* Get Started Section */}
            <div className="bg-card rounded-lg border p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-1">Get Started</h2>
                <p className="text-sm text-muted-foreground">
                  Learn how to use and configure your chatbots
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="group hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                        <Play className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-semibold">Quick Start Guide</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Learn how to create and configure your chatbots
                    </p>
                    <Button variant="outline" className="w-full rounded-full">
                      <Play size={16} className="mr-2" /> Watch Tutorial
                    </Button>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-semibold">Documentation</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Learn the basics of ChatBot within minutes
                    </p>
                    <Button variant="outline" className="w-full rounded-full">
                      Start Learning
                    </Button>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                        <HelpCircle className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-semibold">Help Center</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Visit our Help Center to learn more
                    </p>
                    <Button variant="outline" className="w-full rounded-full" asChild>
                      <Link href="/help-center">
                        Explore <ArrowRight size={16} className="ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
