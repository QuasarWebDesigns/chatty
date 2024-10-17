import mongoose from "mongoose";

const ChatbotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  automaticPopup: {
    type: Boolean,
    default: false,
  },
  popupText: {
    type: String,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

export default mongoose.models.Chatbot || mongoose.model("Chatbot", ChatbotSchema);

