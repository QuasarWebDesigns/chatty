"use client";

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'react-hot-toast';
import { ChatInterface } from '@/components/ChatInterface';
import { Settings } from 'lucide-react'; // Import the Settings icon
import { EmbeddingModal } from '@/components/EmbeddingModal';
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

export function ChatbotCard({ chatbot, onDelete }: { chatbot: SerializedChatbot; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [chatInterfaceOpen, setChatInterfaceOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [embeddingModalOpen, setEmbeddingModalOpen] = useState(false);

  const handleEmbedding = () => {
    setEmbeddingModalOpen(true);
  };

  const handleSettings = () => {
    setSettingsDialogOpen(true);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmation === chatbot.name) {
      try {
        // First, delete the embeddings from Pinecone
        await apiClient.delete(`/chatbot/${chatbot.id}/embeddings`);
        
        // Then, delete the chatbot from MongoDB
        await apiClient.delete(`/chatbot/${chatbot.id}`);
        
        onDelete(chatbot.id);
        setDeleteDialogOpen(false);
        setDeleteConfirmation('');
        toast.success('Chatbot deleted successfully');
      } catch (error) {
        console.error('Error deleting chatbot:', error);
        toast.error('Failed to delete chatbot. Please try again.');
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{chatbot.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p><strong>Automatic Popup:</strong> {chatbot.automaticPopup ? 'Yes' : 'No'}</p>
            {chatbot.automaticPopup && chatbot.popupText && (
              <p><strong>Popup Text:</strong> {chatbot.popupText}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setChatInterfaceOpen(true)}>Test Chatbot</Button>
              <Button onClick={handleEmbedding}>Embedding</Button>
              <Button onClick={handleSettings}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button variant="destructive" onClick={handleDeleteClick}>Delete</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chatbot</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this chatbot? This action cannot be undone.</p>
          <p>Type the chatbot name <strong>{chatbot.name}</strong> to confirm:</p>
          <Input
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            placeholder="Type chatbot name here"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Delete</Button>
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

      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Settings for {chatbot.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Add settings fields here */}
            <p>Chatbot settings coming soon!</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setSettingsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EmbeddingModal
        isOpen={embeddingModalOpen}
        onClose={() => setEmbeddingModalOpen(false)}
        chatbotId={chatbot.id}
        chatbotName={chatbot.name}
      />
    </>
  );
}
