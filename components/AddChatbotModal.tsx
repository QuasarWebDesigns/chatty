"use client";
import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { X } from 'lucide-react'; // Import the X icon from lucide-react

interface AddChatbotModalProps {
  onChatbotCreated: (newChatbot: any) => void;
}

export function AddChatbotModal({ onChatbotCreated }: AddChatbotModalProps) {
  const [name, setName] = useState('');
  const [automaticPopup, setAutomaticPopup] = useState(false);
  const [popupText, setPopupText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  };

  const removeFile = (fileToRemove: File) => {
    setSelectedFiles(prevFiles => prevFiles.filter(file => file !== fileToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selectedFiles.length === 0) {
      toast.error('Please provide a name and upload at least one document.');
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('automaticPopup', automaticPopup.toString());
    formData.append('popupText', popupText);
    selectedFiles.forEach((file) => {
      formData.append('documents', file);
    });

    try {
      const response = await axios.post('/api/chatbot', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 201) {
        const newChatbot = response.data;
        onChatbotCreated(newChatbot);
        toast.success('Chatbot created successfully!');
        setOpen(false);
        resetForm();
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

  const resetForm = () => {
    setName('');
    setAutomaticPopup(false);
    setPopupText('');
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
            <Label htmlFor="name">Name of Chatbot*</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter chatbot name"
              disabled={isLoading}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="documents">Upload Documents* (PDF, DOC, TXT)</Label>
            <Input
              id="documents"
              type="file"
              onChange={handleFileChange}
              disabled={isLoading}
              accept=".pdf,.doc,.docx,.txt"
              multiple
              ref={fileInputRef}
            />
            {selectedFiles.length > 0 && (
              <div className="mt-2 space-y-1">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                    <span className="text-sm truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
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
          <Button type="submit" disabled={isLoading || selectedFiles.length === 0}>
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
