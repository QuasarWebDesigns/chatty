import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  chunkCount: {
    type: Number,
    required: true
  },
  chatbotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chatbot',
    required: true
  },
  embeddingChunks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmbeddingChunk'
  }]
}, { timestamps: true });

const Document = mongoose.models.Document || mongoose.model("Document", DocumentSchema);

export default Document;
