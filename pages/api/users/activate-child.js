import dbConnect from "../../../lib/mongodb";
import User from "../../../models/User";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { activationCode, email, password } = req.body;

    // Validate required fields
    if (!activationCode || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Find child user by activation code
    const childUser = await User.findOne({
      activationCode: activationCode,
      role: "child"
    });

    if (!childUser) {
      return res.status(404).json({ error: "Invalid activation code" });
    }

    if (childUser.activated) {
      return res.status(400).json({ error: "This account has already been activated" });
    }

    // Update child user with email and password
    childUser.email = email;
    childUser.passwordHash = password; // In production, this should be hashed
    childUser.activated = true;
    
    await childUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: childUser._id, email: childUser.email, role: childUser.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    // Return user data and token
    return res.status(200).json({
      message: "Child account activated successfully",
      token,
      user: {
        _id: childUser._id,
        name: childUser.name,
        email: childUser.email,
        role: childUser.role,
        householdId: childUser.householdId
      }
    });
  } catch (error) {
    console.error("Error activating child account:", error);
    return res.status(500).json({ error: "Failed to activate child account", details: error.message });
  }
} 