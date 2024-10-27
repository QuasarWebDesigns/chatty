import OpenAI from 'openai';
import Chatbot from '../models/chatbot';
import Document from '../models/document';
import { Pinecone } from "@pinecone-database/pinecone";
import mammoth from 'mammoth';
import docxParser from 'docx-parser';
import EmbeddingChunk from '../models/embeddingChunk';

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

async function extractTextFromDocx(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const buffer = Buffer.from(arrayBuffer);
    const result = await mammoth.extractRawText({ buffer: buffer });
    return result.value;
  } catch (error) {
    console.error("Error extracting text from DOCX:", error);
    throw new Error("Failed to extract text from DOCX file");
  }
}

async function extractTextFromDoc(arrayBuffer: ArrayBuffer): Promise<string> {
  return new Promise((resolve, reject) => {
    docxParser.parseDocx(arrayBuffer, (err: Error | null, output: string) => {
      if (err) {
        reject(err);
      } else {
        resolve(output);
      }
    });
  });
}

export async function processDocument(file: File, chatbotId: string, chatbotName: string) {
  let text = '';

  try {
    // Check if document already exists
    const existingDoc = await Document.findOne({ 
      name: file.name, 
      chatbotId: chatbotId 
    });

    if (existingDoc) {
      console.log(`Document ${file.name} already exists for this chatbot`);
      return { 
        name: existingDoc.name, 
        chunkCount: existingDoc.chunkCount 
      };
    }

    const arrayBuffer = await file.arrayBuffer();

    if (file.name.toLowerCase().endsWith('.docx')) {
      text = await extractTextFromDocx(arrayBuffer);
    } else if (file.name.toLowerCase().endsWith('.doc')) {
      text = await extractTextFromDoc(arrayBuffer);
    } else {
      text = await file.text();
    }

    const jsonContent = {
      fileName: file.name,
      content: text,
      chatbotId: chatbotId,
      chatbotName: chatbotName
    };

    const chunks = chunkJsonContent(jsonContent, CHUNK_SIZE, CHUNK_OVERLAP);
    const index = await initPinecone();

    const vectors = [];
    const embeddingChunks = [];

    // Create a new document in MongoDB with a unique compound index
    const document = await Document.create({
      name: file.name,
      chunkCount: chunks.length,
      chatbotId: chatbotId
    });

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await generateEmbedding(JSON.stringify(chunk));
      const chunkId = `${file.name}-chunk-${i}`;
      const vectorId = chunkId; // Using the same ID for both chunkId and vectorId
      
      vectors.push({
        id: vectorId,
        values: embedding,
        metadata: {
          chatbotId: chatbotId,
          content: chunk.content,
          documentId: document._id.toString()
        }
      });

      embeddingChunks.push({
        chunkId: chunkId,
        vectorId: vectorId,
        documentId: document._id
      });
    }

    // Save embedding chunks to MongoDB
    const savedEmbeddingChunks = await EmbeddingChunk.insertMany(embeddingChunks);

    // Update the document with the embedding chunk IDs
    document.embeddingChunks = savedEmbeddingChunks.map(chunk => chunk._id);
    await document.save();

    // Use chatbotName and chatbotId as the namespace
    const namespace = `${chatbotName}-${chatbotId}`;
    await index.namespace(namespace).upsert(vectors);

    console.log(`Processed document: ${file.name}`);
    console.log(`Saved ${savedEmbeddingChunks.length} embedding chunks to MongoDB`);
    console.log(`Upserted ${vectors.length} vectors to Pinecone`);

    return { name: file.name, chunkCount: chunks.length };
  } catch (error) {
    console.error(`Error processing document ${file.name}:`, error);
    throw error;
  }
}

function chunkJsonContent(jsonContent: any, chunkSize: number, overlap: number) {
  const chunks = [];
  const content = jsonContent.content;
  let startIndex = 0;

  while (startIndex < content.length) {
    const endIndex = Math.min(startIndex + chunkSize, content.length);
    chunks.push({
      fileName: jsonContent.fileName,
      content: content.slice(startIndex, endIndex),
      chatbotId: jsonContent.chatbotId,
      chatbotName: jsonContent.chatbotName,
      startIndex,
      endIndex
    });
    startIndex += chunkSize - overlap;
  }

  return chunks;
}

export async function createChatbotWithDocuments(name: string, automaticPopup: boolean, popupText: string, userId: string, processedDocuments: any[]) {
  const chatbot = await Chatbot.create({ name, automaticPopup, popupText, userId });
  
  const createdDocuments = await Promise.all(processedDocuments.map(async doc => {
    const document = await Document.findOne({ name: doc.name, chatbotId: chatbot._id });
    if (!document) {
      console.error(`Document not found: ${doc.name}`);
      return null;
    }
    return document;
  }));

  chatbot.documents = createdDocuments.filter(doc => doc !== null).map(doc => doc._id);
  await chatbot.save();

  console.log(`Created chatbot: ${chatbot.name}`);
  console.log(`Associated ${chatbot.documents.length} documents with the chatbot`);

  return chatbot;
}

const MAX_CHUNKS = 3;
const MIN_RELEVANCE_SCORE = 0.7; // Adjust this value based on your needs

export async function searchEmbeddings(inputQuery: string, chatbotId: string, resultNum: number = MAX_CHUNKS) {
  try {
    console.log(`Searching embeddings for query: "${inputQuery}" and chatbotId: ${chatbotId}`);
    const index = await initPinecone();

    const chatbot = await Chatbot.findById(chatbotId);
    if (!chatbot) {
      console.error(`Chatbot with id ${chatbotId} not found`);
      return { context: '', matches: [] };
    }

    const queryVector = await generateEmbedding(inputQuery);

    const namespace = `${chatbot.name}-${chatbotId}`;
    console.log(`Querying Pinecone namespace: ${namespace}`);
    const queryResponse = await index.namespace(namespace).query({
      vector: queryVector,
      topK: resultNum,
      includeMetadata: true,
      filter: { chatbotId: chatbotId }
    });

    console.log('Raw Pinecone response:', JSON.stringify(queryResponse, null, 2));

    const matches = queryResponse.matches || [];
    console.log(`Found ${matches.length} matches`);

    if (matches.length === 0) {
      console.log('No matches found in Pinecone');
      return { context: '', matches: [] };
    }

    console.log('First match:', JSON.stringify(matches[0], null, 2));

    const contextChunks = matches
      .slice(0, MAX_CHUNKS)
      .map(match => ({
        content: match.metadata?.content || 'No content available',
        score: match.score ?? 0
      }));

    console.log(`Using ${contextChunks.length} chunks`);
    console.log('First context chunk:', JSON.stringify(contextChunks[0], null, 2));

    const combinedContext = contextChunks
      .map((chunk, index) => `[${index + 1}] ${chunk.content}`)
      .join('\n\n');

    console.log('Generated context:', combinedContext);

    if (!combinedContext.trim()) {
      console.log('Generated context is empty');
    }

    return {
      context: combinedContext,
      matches: matches.slice(0, MAX_CHUNKS).map(match => ({
        id: match.id,
        score: match.score ?? 0,
        content: match.metadata?.content || 'No content available',
        documentId: match.metadata?.documentId || 'Unknown DocumentId',
        chatbotId: match.metadata?.chatbotId || 'Unknown ChatbotId',
      }))
    };
  } catch (error) {
    console.error('Error searching embeddings:', error);
    return { context: '', matches: [] };
  }
}
