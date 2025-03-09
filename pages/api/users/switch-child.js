import dbConnect from "../../../lib/mongodb";
import User from "../../../models/User";
import mongoose from "mongoose";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { parentId, childId } = req.body;

    // Validate required fields
    if (!parentId || !childId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Find the parent user
    const parent = await User.findById(parentId);
    
    if (!parent) {
      return res.status(404).json({ error: "Parent user not found" });
    }

    if (parent.role !== "parent") {
      return res.status(403).json({ error: "Only parent users can switch active child" });
    }

    // Find the child user
    const child = await User.findOne({ 
      _id: new mongoose.Types.ObjectId(childId),
      role: "child"
    });

    if (!child) {
      return res.status(404).json({ error: "Child user not found" });
    }

    // Update the parent's activeChild field
    parent.activeChild = new mongoose.Types.ObjectId(childId);
    await parent.save();

    return res.status(200).json({ 
      message: "Active child switched successfully",
      parent: {
        _id: parent._id,
        name: parent.name,
        email: parent.email,
        role: parent.role,
        activeChild: parent.activeChild
      }
    });
  } catch (error) {
    console.error("Error switching active child:", error);
    return res.status(500).json({ error: "Failed to switch active child", details: error.message });
  }
} 