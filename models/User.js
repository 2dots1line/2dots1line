import mongoose from "mongoose";
import crypto from "crypto";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true }, // Store hashed password
  role: { type: String, enum: ["parent", "child"], required: true },
  householdId: { type: mongoose.Schema.Types.ObjectId, ref: "Household" }, // Link to family
  activeChild: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // Parent can switch between children
  activationCode: { type: String }, // For child account activation
  activated: { type: Boolean, default: false }, // Whether a child account has been activated
  createdAt: { type: Date, default: Date.now }
});

// Generate activation code for child users
userSchema.pre('save', function(next) {
  if (this.isNew && this.role === 'child' && !this.activationCode) {
    // Generate a random 8-character alphanumeric code
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    this.activationCode = code;
  }
  
  // Hash password if it's new or modified
  if (this.isNew || this.isModified('passwordHash')) {
    // In a production environment, you should use bcrypt instead
    this.passwordHash = crypto
      .createHash("sha256")
      .update(this.passwordHash)
      .digest("hex");
  }
  
  next();
});

// Static method to hash a password
userSchema.statics.hashPassword = function(password) {
  return crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");
};

export default mongoose.models.User || mongoose.model("User", userSchema);