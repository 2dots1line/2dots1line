import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
  child: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Story is linked to a child
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Person who created the story
  authorName: { type: String }, // Name of the author for easy display
  content: { type: String, required: true },
  media: [{ filename: String, type: String, data: String }], // Optional images/audio
  aiAnalysis: { 
    type: Object, 
    default: null,
    // Structure:
    // {
    //   strengths: [String],
    //   traits: [String],
    //   summary: String,
    //   ai_insights: String,
    //   related_story_ids: [String]
    // }
  }, 
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

export default mongoose.models.Story || mongoose.model("Story", storySchema);