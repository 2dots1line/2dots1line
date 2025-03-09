import dbConnect from "../../../lib/mongodb";
import Story from "../../../models/Story";
import User from "../../../models/User";
import mongoose from "mongoose";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { storyId, content, authorId, aiAnalysis } = req.body;

    // Validate required fields - storyId is always required
    if (!storyId) {
      return res.status(400).json({ error: "Missing story ID" });
    }

    // Find the story by ID
    const story = await Story.findById(storyId);

    if (!story) {
      return res.status(404).json({ error: "Story not found" });
    }

    // For regular updates (content changes), we need authorId and content
    if (content && authorId) {
      // Verify author exists
      const author = await User.findById(authorId);
      if (!author) {
        return res.status(404).json({ error: "Author not found" });
      }

      // Check if author has permission to edit this story
      if (author.role === 'parent') {
        // Check if child belongs to author's household
        const child = await User.findById(story.child);
        if (!child || !child.householdId || child.householdId.toString() !== author.householdId.toString()) {
          return res.status(403).json({ error: "Parent can only edit stories for children in their household" });
        }
      } else if (author.role === 'child') {
        // Child can only edit their own stories
        if (story.author.toString() !== authorId) {
          return res.status(403).json({ error: "You can only edit your own stories" });
        }
      }

      // Update the content
      story.content = content;
    }

    // Update AI analysis if provided
    if (aiAnalysis) {
      console.log("Updating story with AI analysis:", aiAnalysis);
      story.aiAnalysis = aiAnalysis;
    }

    // Update the timestamp
    story.updatedAt = new Date();
    
    await story.save();

    return res.status(200).json({ 
      message: "Story updated successfully",
      story 
    });
  } catch (error) {
    console.error("Error updating story:", error);
    return res.status(500).json({ error: "Failed to update story", details: error.message });
  }
} 