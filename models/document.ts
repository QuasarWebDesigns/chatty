import mongoose from "mongoose";

const EmbeddingChunkSchema = new mongoose.Schema({
  chunk: [Number],
  startIndex: Number,
  endIndex: Number,
});

const DocumentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  content: String,
  embeddingChunks: [EmbeddingChunkSchema],
  chatbotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chatbot',
    required: true
  }
}, { timestamps: true });

const Document = mongoose.models.Document || mongoose.model("Document", DocumentSchema);

export default Document;
