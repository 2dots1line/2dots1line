import { connectToDatabase } from "../../lib/mongodb";

export default async function handler(req, res) {
  try {
    await connectToDatabase();
    res.status(200).json({ message: "✅ MongoDB Connected Successfully!" });
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ message: "❌ Database Connection Failed" });
  }
}