import dbConnect from "../../../lib/mongodb";
import User from "../../../models/User";
import mongoose from "mongoose";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    await dbConnect();

    const { name, email, password, role, householdId, activationCode, childId } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // If this is a child account with activation code, verify and update existing account
    if (role === 'child' && activationCode) {
      // Find the child account with this activation code
      const existingChild = await User.findOne({ 
        activationCode: activationCode,
        role: 'child'
      });

      if (!existingChild) {
        return res.status(400).json({ error: "Invalid activation code" });
      }

      if (existingChild.activated) {
        return res.status(400).json({ error: "This account has already been activated" });
      }

      // Update the existing child account with name, email, password
      existingChild.name = name;
      existingChild.email = email;
      existingChild.passwordHash = password; // Will be hashed by pre-save hook
      existingChild.activated = true;
      
      await existingChild.save();
      
      // Remove passwordHash from response
      const childResponse = existingChild.toObject();
      delete childResponse.passwordHash;
      
      return res.status(200).json({ 
        message: "Child account activated successfully", 
        user: childResponse 
      });
    }

    // For other account types, check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    // Create new user with hashed password
    const newUser = new User({ 
      name, 
      email, 
      passwordHash: password, // Will be hashed by the pre-save hook
      role,
      householdId: householdId ? new mongoose.Types.ObjectId(householdId) : undefined
    });
    
    await newUser.save();
    
    // Remove passwordHash from response
    const userResponse = newUser.toObject();
    delete userResponse.passwordHash;
    
    res.status(201).json({ 
      message: "User created successfully", 
      user: userResponse 
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user", details: error.message });
  }
}