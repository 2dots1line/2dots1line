import dbConnect from "../../../lib/mongodb";
import Story from "../../../models/Story";
import User from "../../../models/User";
import mongoose from "mongoose";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { storyId } = req.query;

    if (!storyId) {
      return res.status(400).json({ error: "Missing required query parameter: storyId" });
    }

    // Find the story by ID
    const story = await Story.findById(storyId);

    if (!story) {
      return res.status(404).json({ error: "Story not found" });
    }

    // Get child and author information
    const child = await User.findById(story.child);
    const author = await User.findById(story.author);

    // Return the story with additional information
    return res.status(200).json({ 
      story: {
        ...story.toObject(),
        childName: child ? child.name : null,
        authorName: author ? author.name : null
      } 
    });
  } catch (error) {
    console.error("Error fetching story:", error);
    return res.status(500).json({ error: "Failed to fetch story", details: error.message });
  }
} 