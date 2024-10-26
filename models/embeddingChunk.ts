import mongoose from "mongoose";

const EmbeddingChunkSchema = new mongoose.Schema({
  chunkId: {
    type: String,
    required: true,
    unique: true
  },
  vectorId: {
    type: String,
    required: true,
    unique: true
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  }
}, { timestamps: true });

const EmbeddingChunk = mongoose.models.EmbeddingChunk || mongoose.model("EmbeddingChunk", EmbeddingChunkSchema);

export default EmbeddingChunk;
