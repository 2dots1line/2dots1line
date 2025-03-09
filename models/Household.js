import mongoose from "mongoose";

const householdSchema = new mongoose.Schema({
  primaryParent: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  parents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  familyCode: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now }
});

// Generate a random 6-character family code before saving
householdSchema.pre('save', function(next) {
  if (!this.familyCode) {
    // Generate a random 6-character alphanumeric code
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    this.familyCode = code;
  }
  
  // Make sure primary parent is also in the parents array
  if (this.primaryParent && this.isNew) {
    if (!this.parents) {
      this.parents = [];
    }
    
    // Check if primaryParent is already in parents array
    const parentExists = this.parents.some(parentId => 
      parentId.toString() === this.primaryParent.toString()
    );
    
    if (!parentExists) {
      this.parents.push(this.primaryParent);
    }
  }
  
  next();
});

export default mongoose.models.Household || mongoose.model("Household", householdSchema);