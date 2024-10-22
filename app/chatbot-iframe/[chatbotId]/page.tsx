'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Send, X } from 'lucide-react'

export default function ChatbotIframe() {
  const params = useParams()
  const chatbotId = params?.chatbotId as string
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: 'assistant', content: "👋 Hi! I am er, how can I help you?" }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async () => {
    if (!input.trim()) return

    setIsLoading(true)
    const newMessages = [...messages, { role: 'user', content: input }]
    setMessages(newMessages)
    setInput('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, chatbotId }),
      })
      const data = await response.json()
      setMessages([...newMessages, { role: 'assistant', content: data.response }])
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white rounded-lg overflow-hidden shadow-lg">
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'assistant' && (
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold mr-2">
                C
              </div>
            )}
            <div className={`max-w-[70%] p-3 rounded-lg ${message.role === 'user' ? 'bg-black text-white' : 'bg-gray-200 text-gray-800'}`}>
              {message.content}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t relative">
        <div className="flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Message..."
            className="flex-grow p-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading}
            className="absolute right-6 p-2 text-black"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
      <button
        onClick={() => window.parent.postMessage('closeChatbot', '*')}
        className="absolute bottom-20 right-4 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white"
      >
        <X className="h-6 w-6" />
      </button>
    </div>
  )
}
