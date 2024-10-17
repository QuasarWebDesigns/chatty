import mongoose from "mongoose";

const EmbeddingChunkSchema = new mongoose.Schema({
  embedding: [Number],
  startIndex: Number,
  endIndex: Number,
});

const DocumentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  embeddingChunks: [EmbeddingChunkSchema],
  chatbotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chatbot',
    required: true
  }
}, { timestamps: true });

const Document = mongoose.models.Document || mongoose.model("Document", DocumentSchema);

export default Document;
