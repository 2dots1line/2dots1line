import dbConnect from "../../../lib/mongodb";
import User from "../../../models/User";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { userId, email } = req.query;

    if (!userId && !email) {
      return res.status(400).json({ error: "Missing required query parameter: userId or email" });
    }

    let user;

    if (userId) {
      user = await User.findById(userId).select('-passwordHash');
    } else {
      user = await User.findOne({ email }).select('-passwordHash');
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ error: "Failed to fetch user", details: error.message });
  }
} 