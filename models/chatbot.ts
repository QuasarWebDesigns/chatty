import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  content: String,
  embedding: [Number],
});

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
  documents: {
    type: [DocumentSchema],
    default: [],
  },
}, { timestamps: true });

// Add a toJSON method to ensure documents are properly serialized
ChatbotSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    if (ret.documents) {
      ret.documents = ret.documents.map((doc: any) => ({
        id: doc._id.toString(),
        name: doc.name,
        content: doc.content ? doc.content.substring(0, 100) + '...' : 'No content',
        // Omit the embedding from the JSON representation
      }));
    } else {
      ret.documents = [];
    }
    return ret;
  }
});

const Chatbot = mongoose.models.Chatbot || mongoose.model("Chatbot", ChatbotSchema);

export default Chatbot;
