import mongoose from "mongoose";

const ChatbotSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
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
  // Add any other fields you need for your chatbot
}, { timestamps: true });

export default mongoose.models.Chatbot || mongoose.model("Chatbot", ChatbotSchema);
