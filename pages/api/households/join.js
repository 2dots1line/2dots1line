import dbConnect from "../../../lib/mongodb";
import Household from "../../../models/Household";
import User from "../../../models/User";
import mongoose from "mongoose";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { parentId, familyCode } = req.body;

    // Validate required fields
    if (!parentId || !familyCode) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Find the parent user
    const parent = await User.findById(parentId);
    
    if (!parent) {
      return res.status(404).json({ error: "Parent user not found" });
    }

    if (parent.role !== "parent") {
      return res.status(403).json({ error: "Only parent users can join households" });
    }

    // Find the household by family code
    const household = await Household.findOne({ familyCode: familyCode });

    if (!household) {
      return res.status(404).json({ error: "Household not found with the provided family code" });
    }

    // Update the parent's householdId
    parent.householdId = household._id;
    await parent.save();

    // Add parent to the household's parents array if not already there
    if (!household.parents.includes(parentId)) {
      household.parents.push(new mongoose.Types.ObjectId(parentId));
      await household.save();
    }

    // Get fully populated household data
    const populatedHousehold = await Household.findById(household._id)
      .populate({
        path: 'children',
        select: 'name _id'
      })
      .populate({
        path: 'parents',
        select: 'name _id email'
      });

    return res.status(200).json({ 
      message: "Successfully joined household",
      household: populatedHousehold
    });
  } catch (error) {
    console.error("Error joining household:", error);
    return res.status(500).json({ error: "Failed to join household", details: error.message });
  }
} 