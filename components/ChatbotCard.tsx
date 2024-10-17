"use client";

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from 'react-hot-toast';

interface SerializedChatbot {
  id: string;
  name: string;
  automaticPopup: boolean;
  popupText?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export function ChatbotCard({ chatbot, onDelete }: { chatbot: SerializedChatbot; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false);

  const handleEmbedding = () => {
    // Implement embedding logic here
    toast.success('Embedding feature coming soon!');
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this chatbot?')) {
      try {
        const response = await fetch(`/api/chatbot?id=${chatbot.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          onDelete(chatbot.id);
          toast.success('Chatbot deleted successfully');
          setOpen(false);
        } else {
          throw new Error('Failed to delete chatbot');
        }
      } catch (error) {
        console.error('Error deleting chatbot:', error);
        toast.error('Failed to delete chatbot');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer">
          <CardContent className="h-32 flex items-center justify-center">
            <h3 className="text-lg font-semibold">{chatbot.name}</h3>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{chatbot.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p><strong>Automatic Popup:</strong> {chatbot.automaticPopup ? 'Yes' : 'No'}</p>
          {chatbot.automaticPopup && chatbot.popupText && (
            <p><strong>Popup Text:</strong> {chatbot.popupText}</p>
          )}
          <div className="flex space-x-2">
            <Button onClick={() => setOpen(false)}>Close</Button>
            <Button onClick={handleEmbedding}>Embedding</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
