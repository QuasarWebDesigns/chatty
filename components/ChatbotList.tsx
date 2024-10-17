"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { AddChatbotModal } from "@/components/AddChatbotModal";
import { ChatbotCard } from "@/components/ChatbotCard";

interface Chatbot {
  _id: string;
  name: string;
  automaticPopup: boolean;
  popupText?: string;
}

export function ChatbotList({ initialChatbots }: { initialChatbots: Chatbot[] }) {
  const [chatbots, setChatbots] = useState<Chatbot[]>(initialChatbots);

  const addChatbot = (newChatbot: Chatbot) => {
    setChatbots(prevChatbots => [...prevChatbots, newChatbot]);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
      <Card className="bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer">
        <CardContent className="flex flex-col items-center justify-center h-full p-6">
          <AddChatbotModal onChatbotCreated={addChatbot} />
        </CardContent>
      </Card>

      {chatbots.map((chatbot) => (
        <ChatbotCard key={chatbot._id.toString()} chatbot={chatbot} />
      ))}
    </div>
  );
}
