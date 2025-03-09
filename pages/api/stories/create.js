import mongoose from "mongoose";
import dbConnect from "../../../lib/mongodb";
import Story from "../../../models/Story";
import User from "../../../models/User";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { childId, content, media, authorId } = req.body;

    // Validate required fields
    if (!childId || !content || !authorId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify child exists
    const childExists = await User.findOne({ 
      _id: new mongoose.Types.ObjectId(childId), 
      role: "child" 
    });
    
    if (!childExists) {
      return res.status(404).json({ error: "Child not found" });
    }

    // Verify author exists
    const author = await User.findById(authorId);
    if (!author) {
      return res.status(404).json({ error: "Author not found" });
    }

    // Check if author has permission to create story for this child
    if (author.role === 'parent') {
      // Check if child belongs to author's household
      if (!childExists.householdId || childExists.householdId.toString() !== author.householdId.toString()) {
        return res.status(403).json({ error: "Parent can only create stories for children in their household" });
      }
    } else if (author.role === 'child') {
      // Child can only create stories for themselves
      if (authorId !== childId) {
        return res.status(403).json({ error: "Child can only create stories for themselves" });
      }
    }

    const newStory = new Story({
      child: new mongoose.Types.ObjectId(childId),
      author: new mongoose.Types.ObjectId(authorId),
      authorName: author.name,
      content,
      media: media || []
    });

    await newStory.save();

    return res.status(201).json({ message: "Story created successfully", story: newStory });
  } catch (error) {
    console.error("Error creating story:", error);
    return res.status(500).json({ error: "Story creation failed", details: error.message });
  }
}