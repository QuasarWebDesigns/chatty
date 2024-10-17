"use client";
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from 'react-hot-toast';

interface AddChatbotModalProps {
  onChatbotCreated: (newChatbot: any) => void;
}

export function AddChatbotModal({ onChatbotCreated }: AddChatbotModalProps) {
  const [name, setName] = useState('');
  const [automaticPopup, setAutomaticPopup] = useState(false);
  const [popupText, setPopupText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, automaticPopup, popupText }),
      });

      if (response.ok) {
        const newChatbot = await response.json();
        onChatbotCreated(newChatbot);
        toast.success('Chatbot created successfully!');
        setOpen(false);
      } else {
        toast.error('Failed to create chatbot');
      }
    } catch (error) {
      console.error('Error creating chatbot:', error);
      toast.error('An error occurred while creating the chatbot');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 text-white hover:bg-blue-700 transition-colors w-full h-full">
          Add chatbot
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Chatbot</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name of Chatbot</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter chatbot name"
              disabled={isLoading}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="automaticPopup"
              checked={automaticPopup}
              onCheckedChange={(checked) => setAutomaticPopup(checked as boolean)}
              disabled={isLoading}
            />
            <Label htmlFor="automaticPopup">Automatic pop-up</Label>
          </div>
          {automaticPopup && (
            <div className="space-y-2">
              <Label htmlFor="popupText">Pop-up Text</Label>
              <Input
                id="popupText"
                value={popupText}
                onChange={(e) => setPopupText(e.target.value)}
                placeholder="Enter pop-up text"
                disabled={isLoading}
              />
            </div>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-sm mr-2"></span>
                Creating...
              </>
            ) : (
              'Create Chatbot'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
