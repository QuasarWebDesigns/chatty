'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, X, Send } from "lucide-react"
import { toast } from 'react-hot-toast'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export default function ChatbotPreview({ chatbotId, chatbotName }: { chatbotId: string, chatbotName: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `👋 Hi! I am ${chatbotName}, how can I help you?` },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const toggleChat = () => {
    setIsOpen(!isOpen)
  }

  const handleSend = async () => {
    if (input.trim() && !isLoading) {
      setIsLoading(true)
      const newMessages: Message[] = [...messages, { role: 'user', content: input }]
      setMessages(newMessages)
      setInput('')

      try {
        const response = await fetch('/api/chatbot-preview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ messages: newMessages, chatbotId }),
        })

        if (!response.ok) {
          throw new Error('Failed to get response from chatbot')
        }

        const data = await response.json()
        
        if (data.response) {
          setMessages([...newMessages, { role: 'assistant', content: data.response }])
        } else {
          throw new Error('Empty response from AI')
        }
      } catch (error) {
        console.error('Error in chat:', error)
        toast.error("I'm sorry, I encountered an error. Please try again.")
        setMessages([...newMessages, { role: 'assistant', content: "I'm sorry, I encountered an error. Please try again." }])
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="fixed bottom-4 right-4">
      <Button
        className={`w-16 h-16 rounded-full shadow-lg transition-all duration-300 ease-in-out ${
          isOpen ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'
        }`}
        onClick={toggleChat}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white" />
        )}
        <span className="sr-only">{isOpen ? 'Close chat' : 'Open chat'}</span>
      </Button>
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-80 bg-background border rounded-lg shadow-lg overflow-hidden">
          <div className="h-96 p-4 overflow-y-auto">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                {message.role === 'assistant' && (
                  <div className="h-8 w-8 mr-2 rounded-full bg-primary flex items-center justify-center text-white">
                    C
                  </div>
                )}
                <div className={`p-2 rounded-lg ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {message.content}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                disabled={isLoading}
              />
              <Button onClick={handleSend} disabled={isLoading}>
                {isLoading ? 'Sending...' : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
