import OpenAI from 'openai';
import Chatbot from '../models/chatbot';
import Document from '../models/document';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

async function generateEmbedding(text: string) {
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float",
  });
  return embedding.data[0].embedding;
}

function chunkText(text: string, chunkSize: number, overlap: number) {
  const chunks = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + chunkSize, text.length);
    chunks.push({
      text: text.slice(startIndex, endIndex),
      startIndex,
      endIndex
    });
    startIndex += chunkSize - overlap;
  }

  return chunks;
}

export async function processDocument(file: File) {
  const content = await file.text();
  const chunks = chunkText(content, CHUNK_SIZE, CHUNK_OVERLAP);
  const embeddingChunks = await Promise.all(chunks.map(async (chunk) => {
    const embedding = await generateEmbedding(chunk.text);
    return {
      embedding,
      startIndex: chunk.startIndex,
      endIndex: chunk.endIndex,
    };
  }));
  return { name: file.name, embeddingChunks };
}

export async function createChatbotWithDocuments(name: string, automaticPopup: boolean, popupText: string, userId: string, processedDocuments: any[]) {
  const chatbot = await Chatbot.create({ name, automaticPopup, popupText, userId });
  const createdDocuments = await Promise.all(processedDocuments.map(doc => 
    Document.create({ name: doc.name, embeddingChunks: doc.embeddingChunks, chatbotId: chatbot._id })
  ));
  chatbot.documents = createdDocuments.map(doc => doc._id);
  await chatbot.save();
  return chatbot;
}
