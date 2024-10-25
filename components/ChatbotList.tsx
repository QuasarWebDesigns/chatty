"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { AddChatbotModal } from "@/components/AddChatbotModal";
import { ChatbotCard } from "@/components/ChatbotCard";
import apiClient from '@/libs/api';

interface SerializedChatbot {
  id: string;
  name: string;
  automaticPopup: boolean;
  popupText?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export function ChatbotList({ initialChatbots }: { initialChatbots: SerializedChatbot[] }) {
  const [chatbots, setChatbots] = useState<SerializedChatbot[]>(initialChatbots);

  const fetchChatbots = async () => {
    try {
      const response = await apiClient.get('/chatbot');
      if (response.data && Array.isArray(response.data)) {
        setChatbots(response.data);
      } else {
        console.error('Invalid response data:', response.data);
      }
    } catch (error) {
      console.error('Error fetching chatbots:', error);
    }
  };

  const addChatbot = (newChatbot: SerializedChatbot) => {
    setChatbots(prevChatbots => [...prevChatbots, newChatbot]);
  };

  const deleteChatbot = (id: string) => {
    setChatbots(prevChatbots => prevChatbots.filter(chatbot => chatbot.id !== id));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
      <Card className="bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer">
        <CardContent className="flex flex-col items-center justify-center h-full p-6">
          <AddChatbotModal onChatbotCreated={fetchChatbots} />
        </CardContent>
      </Card>

      {chatbots && chatbots.map((chatbot) => (
        <ChatbotCard key={chatbot.id} chatbot={chatbot} onDelete={deleteChatbot} />
      ))}
    </div>
  );
}
