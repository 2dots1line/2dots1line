import dbConnect from "../../../lib/mongodb";
import Household from "../../../models/Household";
import User from "../../../models/User";
import mongoose from "mongoose";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { parentId, householdId } = req.query;

    if (!parentId && !householdId) {
      return res.status(400).json({ error: "Missing required query parameter: parentId or householdId" });
    }

    let household;

    if (parentId) {
      // Find the parent user
      const parent = await User.findById(parentId);
      
      if (!parent) {
        return res.status(404).json({ error: "Parent user not found" });
      }

      // If parent has a householdId, use that
      if (parent.householdId) {
        household = await Household.findById(parent.householdId);
      } else {
        // Otherwise look for household where parent is primary or in parents array
        household = await Household.findOne({
          $or: [
            { primaryParent: new mongoose.Types.ObjectId(parentId) },
            { parents: new mongoose.Types.ObjectId(parentId) }
          ]
        });
      }
    } else {
      // Find the household by ID
      household = await Household.findById(householdId);
    }

    if (!household) {
      return res.status(404).json({ error: "Household not found" });
    }

    // Populate children and parents information
    const populatedHousehold = await Household.findById(household._id)
      .populate({
        path: 'children',
        model: User,
        select: '_id name role activationCode activated'
      })
      .populate({
        path: 'parents',
        model: User,
        select: '_id name email'
      })
      .populate({
        path: 'primaryParent',
        model: User,
        select: '_id name email'
      });

    return res.status(200).json({ household: populatedHousehold });
  } catch (error) {
    console.error("Error fetching household:", error);
    return res.status(500).json({ error: "Failed to fetch household", details: error.message });
  }
} 