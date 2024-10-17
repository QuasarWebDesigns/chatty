"use client";

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'react-hot-toast';
import { ChatInterface } from '@/components/ChatInterface';

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [chatInterfaceOpen, setChatInterfaceOpen] = useState(false);

  const handleEmbedding = () => {
    toast.success('Embedding feature coming soon!');
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmation.toLowerCase() === chatbot.name.toLowerCase()) {
      try {
        const response = await fetch(`/api/chatbot?id=${chatbot.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          onDelete(chatbot.id);
          toast.success('Chatbot deleted successfully');
          setOpen(false);
          setDeleteDialogOpen(false);
        } else {
          throw new Error('Failed to delete chatbot');
        }
      } catch (error) {
        console.error('Error deleting chatbot:', error);
        toast.error('Failed to delete chatbot');
      }
    } else {
      toast.error('Chatbot name does not match. Deletion cancelled.');
    }
  };

  return (
    <>
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
              <Button onClick={() => setChatInterfaceOpen(true)}>Test Chatbot</Button>
              <Button onClick={handleEmbedding}>Embedding</Button>
              <Button variant="destructive" onClick={handleDeleteClick}>Delete</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Chatbot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Deleting this chatbot will permanently remove all its data. This action cannot be undone.</p>
            <p>To confirm, please type the name of the chatbot: <strong>{chatbot.name}</strong></p>
            <div className="space-y-2">
              <Label htmlFor="deleteConfirmation">Chatbot Name</Label>
              <Input
                id="deleteConfirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Enter chatbot name to confirm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Delete Chatbot</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={chatInterfaceOpen} onOpenChange={setChatInterfaceOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Chat with {chatbot.name}</DialogTitle>
          </DialogHeader>
          <ChatInterface chatbotId={chatbot.id} />
        </DialogContent>
      </Dialog>
    </>
  );
}
