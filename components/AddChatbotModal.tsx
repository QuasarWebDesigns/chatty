"use client";
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function AddChatbotModal() {
  const [name, setName] = useState('');
  const [automaticPopup, setAutomaticPopup] = useState(false);
  const [popupText, setPopupText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log({ name, automaticPopup, popupText });
  };

  return (
    <Dialog>
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
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="automaticPopup"
              checked={automaticPopup}
              onCheckedChange={(checked) => setAutomaticPopup(checked as boolean)}
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
              />
            </div>
          )}
          <Button type="submit">Create Chatbot</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
