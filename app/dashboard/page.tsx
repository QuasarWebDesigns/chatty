import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Play, ArrowRight } from "lucide-react";
import SubscriptionBanner from "@/components/SubscriptionBanner";
import ButtonAccount from "@/components/ButtonAccount";

export const dynamic = "force-dynamic";

// This is a private page: It's protected by the layout.js component which ensures the user is authenticated.
// It's a server component which means you can fetch data (like the user profile) before the page is rendered.
// See https://shipfa.st/docs/tutorials/private-page
export default async function Dashboard() {
  return (
    <div className="flex flex-col min-h-screen">
      <SubscriptionBanner />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 pb-24">
          <section className="max-w-xl mx-auto space-y-8">
            <h1 className="text-3xl md:text-4xl font-extrabold">Private Page</h1>
          </section>

          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Chatbots</h2>
            <div className="flex items-center space-x-4">
              <Input type="search" placeholder="Search your chatbot" className="max-w-sm" />
              <ButtonAccount />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
            <Card className="bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center h-full p-6">
                <Plus size={24} className="mb-2" />
                <p className="text-center">Add chatbot</p>
              </CardContent>
            </Card>

            {/* Placeholder cards for other chatbots */}
            {[...Array(7)].map((_, i) => (
              <Card key={i} className="bg-gray-100">
                <CardContent className="h-32 flex items-center justify-center">
                  <div className="w-full h-4 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>

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
