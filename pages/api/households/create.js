import dbConnect from "../../../lib/mongodb";
import Household from "../../../models/Household";
import User from "../../../models/User";
import mongoose from "mongoose";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    await dbConnect();

    const { parentId, children } = req.body;

    // Validate required fields
    if (!parentId) {
      return res.status(400).json({ error: "Missing required field: parentId" });
    }

    // Verify parent exists
    const parent = await User.findById(parentId);
    if (!parent) {
      return res.status(404).json({ error: "Parent not found" });
    }

    // Create new household
    const newHousehold = new Household({ 
      primaryParent: new mongoose.Types.ObjectId(parentId),
      parents: [new mongoose.Types.ObjectId(parentId)],
      children: children ? children.map(id => new mongoose.Types.ObjectId(id)) : [] 
    });
    
    await newHousehold.save();
    
    // Update parent with householdId
    parent.householdId = newHousehold._id;
    await parent.save();
    
    res.status(201).json({ message: "Household created successfully", household: newHousehold });
  } catch (error) {
    console.error("Error creating household:", error);
    res.status(500).json({ error: "Failed to create household", details: error.message });
  }
}