'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { toast } from 'react-hot-toast'
import ChatbotPreview from './ChatbotPreview'

interface EmbeddingModalProps {
  isOpen: boolean
  onClose: () => void
  chatbotId: string
  chatbotName: string
}

export function EmbeddingModal({ isOpen, onClose, chatbotId, chatbotName }: EmbeddingModalProps) {
  const [domain, setDomain] = useState('')
  const [embedType, setEmbedType] = useState<'script' | 'iframe'>('script')

  useEffect(() => {
    setDomain(window.location.origin)
  }, [])

  const configScript = `<script>
window.embeddedChatbotConfig = {
  chatbotId: "${chatbotId}",
  domain: "${domain}"
}
</script>`

  const embedScript = `<script
  src="${domain}/embed.min.js"
  chatbotId="${chatbotId}"
  domain="${domain}"
  defer>
</script>`

  const iframeEmbed = `<iframe
  src="${domain}/chatbot-iframe/${chatbotId}"
  width="100%"
  style="height: 100%; min-height: 700px"
  frameborder="0">
</iframe>`

  const fullEmbedCode = embedType === 'script' 
    ? configScript + '\n' + embedScript
    : iframeEmbed

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard!')
    }).catch((err) => {
      console.error('Failed to copy: ', err)
      toast.error('Failed to copy')
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Embed {chatbotName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-center space-x-4">
            <Button 
              onClick={() => setEmbedType('script')} 
              variant={embedType === 'script' ? 'default' : 'outline'}
            >
              Script Embed
            </Button>
            <Button 
              onClick={() => setEmbedType('iframe')} 
              variant={embedType === 'iframe' ? 'default' : 'outline'}
            >
              iFrame Embed
            </Button>
          </div>
          <p>Add the following code to your website to embed this chatbot:</p>
          <div className="h-[200px] w-full rounded-md border p-4 overflow-auto">
            <pre className="text-sm">{fullEmbedCode}</pre>
          </div>
          <div className="flex justify-end space-x-2">
            <Button onClick={() => copyToClipboard(fullEmbedCode)}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Code
            </Button>
            <Button onClick={onClose}>Close</Button>
          </div>
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-2">Preview</h3>
            <div className="relative h-[400px] border rounded-lg">
              {embedType === 'script' ? (
                <ChatbotPreview chatbotId={chatbotId} chatbotName={chatbotName} />
              ) : (
                <iframe
                  src={`${domain}/chatbot-iframe/${chatbotId}`}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
