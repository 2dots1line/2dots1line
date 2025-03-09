import mongoose from "mongoose";
import dbConnect from "../../../lib/mongodb";
import User from "../../../models/User";
import Household from "../../../models/Household";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { name, parentId, householdId } = req.body;

    // Validate required fields
    if (!name || !parentId || !householdId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify parent exists
    const parent = await User.findById(parentId);
    if (!parent) {
      return res.status(404).json({ error: "Parent not found" });
    }

    if (parent.role !== "parent") {
      return res.status(403).json({ error: "Only parents can create child accounts" });
    }

    // Verify household exists
    const household = await Household.findById(householdId);
    if (!household) {
      return res.status(404).json({ error: "Household not found" });
    }

    // Verify parent is part of this household
    const isParentInHousehold = household.parents.some(
      id => id.toString() === parentId.toString()
    ) || household.primaryParent.toString() === parentId.toString();

    if (!isParentInHousehold) {
      return res.status(403).json({ error: "Parent is not part of this household" });
    }

    // Generate activation code
    const activationCode = generateActivationCode();

    // Generate a secure random password for the child account
    const securePassword = generateSecurePassword();

    // Create a child user
    const childUser = new User({
      name,
      email: `child_${Date.now()}@placeholder.com`, // Placeholder email for child
      passwordHash: securePassword, // Will be hashed by pre-save hook
      role: "child",
      householdId: new mongoose.Types.ObjectId(householdId),
      activationCode,
      activated: false
    });

    // Save the child user first and make sure it succeeds
    const savedChild = await childUser.save();
    console.log("Child user saved:", savedChild);

    if (!savedChild || !savedChild._id) {
      throw new Error("Failed to save child user");
    }
    
    // Ensure the activation code is set
    if (!savedChild.activationCode) {
      console.error("Activation code not generated properly");
      savedChild.activationCode = generateActivationCode();
      await savedChild.save();
    }

    // Update the household to include this child
    const updatedHousehold = await Household.findByIdAndUpdate(
      householdId,
      { $push: { children: savedChild._id } },
      { new: true } // Return the updated document
    )
    .populate({
      path: 'children',
      select: 'name _id activationCode'
    });

    if (!updatedHousehold) {
      throw new Error("Failed to update household with child");
    }

    // Update the parent's activeChild field if this is their first child
    if (!parent.activeChild) {
      await User.findByIdAndUpdate(
        parentId,
        { activeChild: savedChild._id },
        { new: true }
      );
    }

    // Generate activation link for the frontend
    const activationLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/activate/${savedChild._id}/${activationCode}`;

    return res.status(201).json({ 
      message: "Child created successfully", 
      child: {
        ...savedChild.toObject(),
        activationLink
      },
      household: updatedHousehold
    });
  } catch (error) {
    console.error("Error creating child:", error);
    return res.status(500).json({ error: "Failed to create child", details: error.message });
  }
}

// Helper function to generate a random activation code
function generateActivationCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

// Generate a secure random password
function generateSecurePassword() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return password;
}