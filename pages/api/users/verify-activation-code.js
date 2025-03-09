import dbConnect from "../../../lib/mongodb";
import User from "../../../models/User";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { activationCode } = req.body;

    // Validate required fields
    if (!activationCode) {
      return res.status(400).json({ error: "Missing activation code" });
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

    // Return success with child name
    return res.status(200).json({
      success: true,
      childName: childUser.name
    });
  } catch (error) {
    console.error("Error verifying activation code:", error);
    return res.status(500).json({ error: "Failed to verify activation code", details: error.message });
  }
} 