import dbConnect from "../../../lib/mongodb";
import Story from "../../../models/Story";
import mongoose from "mongoose";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { childId } = req.query;

    if (!childId) {
      return res.status(400).json({ error: "Missing required query parameter: childId" });
    }

    // Find stories for the child
    const stories = await Story.find({ 
      child: new mongoose.Types.ObjectId(childId) 
    }).sort({ createdAt: -1 }); // Sort by newest first

    return res.status(200).json({ stories });
  } catch (error) {
    console.error("Error fetching stories:", error);
    return res.status(500).json({ error: "Failed to fetch stories", details: error.message });
  }
} 