import OpenAI from 'openai';
import Chatbot from '../models/chatbot';
import Document from '../models/document';
import { Pinecone } from "@pinecone-database/pinecone";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

const pinecone = new Pinecone();

async function initPinecone() {
  return pinecone.Index("embeds-test");
}

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

export async function processDocument(file: File, chatbotId: string) {
  const content = await file.text();
  const chunks = chunkText(content, CHUNK_SIZE, CHUNK_OVERLAP);
  const index = await initPinecone();

  const vectors = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await generateEmbedding(chunk.text);
    vectors.push({
      id: `${file.name}-chunk-${i}`,
      values: embedding,
      metadata: {
        text: chunk.text,
        startIndex: chunk.startIndex,
        endIndex: chunk.endIndex,
        fileName: file.name,
        chatbotId: chatbotId
      }
    });
  }

  await index.upsert(vectors);

  return { name: file.name, chunkCount: chunks.length };
}

export async function createChatbotWithDocuments(name: string, automaticPopup: boolean, popupText: string, userId: string, processedDocuments: any[]) {
  const chatbot = await Chatbot.create({ name, automaticPopup, popupText, userId });
  const createdDocuments = await Promise.all(processedDocuments.map(doc => 
    Document.create({ name: doc.name, chunkCount: doc.chunkCount, chatbotId: chatbot._id })
  ));
  chatbot.documents = createdDocuments.map(doc => doc._id);
  await chatbot.save();
  return chatbot;
}

export async function searchEmbeddings(inputQuery: string, chatbotId: string, resultNum: number = 8) {
  try {
    console.log(`Searching embeddings for query: "${inputQuery}" and chatbotId: ${chatbotId}`);
    const index = await initPinecone();

    const queryVector = await generateEmbedding(inputQuery);

    const queryResponse = await index.query({
      vector: queryVector,
      topK: resultNum,
      includeMetadata: true,
    });

    const matches = queryResponse.matches || [];
    console.log(`Found ${matches.length} matches`);

    // Log all matches for debugging
    matches.forEach((match, index) => {
      console.log(`Match ${index + 1}:`);
      console.log(`ID: ${match.id}`);
      console.log(`Score: ${match.score}`);
      console.log('Metadata:', match.metadata);
    });

    // Prepare context for GPT
    const contextChunks = matches.map(match => {
      const fileName = match.metadata?.fileName || 'Unknown File';
      const content = match.metadata?.text || 'No content available';
      const embeddingChatbotId = match.metadata?.chatbotId || 'Unknown ChatbotId';
      return `File: ${fileName}\nChatbotId: ${embeddingChatbotId}\nContent: ${content}`;
    });
    const context = contextChunks.join('\n\n');

    console.log('Generated context:', context);

    return {
      context,
      matches: matches.map(match => ({
        id: match.id,
        score: match.score,
        content: match.metadata?.text || 'No content available',
        fileName: match.metadata?.fileName || 'Unknown File',
        chatbotId: match.metadata?.chatbotId || 'Unknown ChatbotId',
      }))
    };
  } catch (error) {
    console.error('Error searching embeddings:', error);
    throw error;
  }
}
