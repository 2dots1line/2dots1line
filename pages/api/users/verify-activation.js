import dbConnect from "../../../lib/mongodb";
import User from "../../../models/User";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { activationCode } = req.body;

    if (!activationCode) {
      return res.status(400).json({ error: "Activation code is required" });
    }

    // Find child with this activation code
    const child = await User.findOne({ 
      activationCode: activationCode,
      role: 'child'
    });

    if (!child) {
      return res.status(404).json({ error: "Invalid activation code" });
    }

    // Return child data without sensitive information
    return res.status(200).json({ 
      success: true,
      child: {
        _id: child._id,
        name: child.name,
        activated: child.activated
      }
    });
  } catch (error) {
    console.error("Error verifying activation code:", error);
    return res.status(500).json({ error: "Failed to verify activation code", details: error.message });
  }
} 