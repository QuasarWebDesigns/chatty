"use client";

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ChatbotCardProps {
  chatbot: {
    _id: string;
    name: string;
    automaticPopup: boolean;
    popupText?: string;
  };
}

export function ChatbotCard({ chatbot }: ChatbotCardProps) {
  const [open, setOpen] = useState(false);

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
          <Button onClick={() => setOpen(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
