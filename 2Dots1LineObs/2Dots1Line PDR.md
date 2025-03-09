
**📌 Product Overview: 2 Dots 1 Line**

  

**2 Dots 1 Line** is an **AI-powered interactive storytelling canvas** designed for parents to document and explore their child’s personal growth through stories. The platform allows parents to **log stories in various formats (text, audio, images, video)**, with AI acting as a **thought partner**—analyzing input, identifying hidden strengths, and dynamically linking past experiences to create a rich, evolving narrative.

  

**🔹 Key Features**

  

✅ **Endless Interactive Canvas** – Parents create **story blocks** anywhere by double-clicking, adding **text, voice, images, and video**.

✅ **AI-Powered Reflection & Synthesis** – AI provides **immediate analysis** of each story, extracting **underlying strengths and traits**.

✅ **Thematic Story Mapping** – AI **automatically links** stories across time using **vector-based semantic understanding**.

✅ **Branching Growth Visualization** – AI **suggests personality traits** as **branches** growing from each story, helping parents discover patterns.

✅ **Dynamic Story Linking** – AI **recommends past stories** based on thematic connections, allowing deeper storytelling.

✅ **“Grow” Feature** – Parents can **select stories and qualities**, and AI generates a **cohesive personal narrative** for their child.

✅ **Multimodal Experience** – Supports **text, speech-to-text, AI-generated summaries, and animation** to bring stories to life.

---

**📌 Tech Stack Architecture**

  

The system is designed with **scalability and flexibility** in mind, using **modular AI and data processing layers**.

  

**🔹 Frontend (User Interface)**

|**Technology**|**Purpose**|
|---|---|
|**Next.js**|Full-stack React framework for handling both UI and backend API.|
|**Tailwind CSS**|UI styling for a clean and modern user experience.|
|**Fabric.js / Konva.js**|For the **endless interactive storytelling canvas** and block-based story creation.|
|**React Flow**|For **AI-generated branching traits visualization**.|
|**Framer Motion**|For smooth UI animations (e.g., story blocks appearing, branches growing).|
|**Recharts / D3.js**|For generating **AI-powered growth trajectory visualizations**.|

  

---

**🔹 Backend (APIs & AI Processing)**

|**Technology**|**Purpose**|
|---|---|
|**Next.js API Routes**|Serves as backend API (handles user authentication, story storage, AI processing requests).|
|**MongoDB (via Mongoose)**|NoSQL database to store **user accounts, stories, AI insights, thematic mappings**.|
|**Firebase / S3 (optional)**|Cloud storage for **image, audio, and video** uploads.|
|**DeepSeek V3 API**|AI model for **story analysis, thematic trait extraction, and narrative synthesis**.|
|**Pinecone / Weaviate**|Vector database for **semantic story retrieval & similarity search**.|

  

---

**🔹 AI System Architecture**

  

The AI system is **multi-layered**, with components handling **story embedding, thematic mapping, and real-time interactions**.

  

**🧠 AI Thought Partner (DeepSeek V3)**

  

✅ **Story Synthesis & Reflection** – AI analyzes new stories and extracts key **themes, strengths, and qualities**.

✅ **Trait Growth Mapping** – AI assigns **vectors** to traits like “creativity,” “resilience,” and “leadership” based on storytelling patterns.

✅ **Multi-Story Synthesis** – AI **links stories** to generate larger narratives with **growth trajectory insights**.

  

**📌 Vector-Based Story Mapping (Pinecone)**

  

✅ **Every story is converted into a numerical vector embedding.**

✅ **Similar past stories are retrieved** dynamically, even if they use different words.

✅ **AI predicts potential “growth vectors”** based on story progression (e.g., “Vivian tends to repurpose objects creatively”).

---

**🔹 Database Schema (Mongoose)**

  

**1️⃣ User Schema**

```
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  role: { type: String, enum: ["parent", "child"], required: true },
  passwordHash: String,
  householdId: { type: mongoose.Schema.Types.ObjectId, ref: "Household" },
  createdAt: { type: Date, default: Date.now },
});
```

**2️⃣ Story Schema**

```
const storySchema = new mongoose.Schema({
  child: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  media: [{ filename: String, type: String, data: String }], 
  vectorEmbedding: { type: [Number] }, // AI-generated vector representation
  relatedStories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }], 
  aiInsights: { type: String }, // AI-generated analysis
  createdAt: { type: Date, default: Date.now }
});
```

**3️⃣ Thematic Mapping Schema**

```
const thematicMappingSchema = new mongoose.Schema({
  child: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  story: { type: mongoose.Schema.Types.ObjectId, ref: "Story", required: true },
  themeVector: { type: [Number] }, // Vector embedding for deep meaning analysis
  similarStories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }], 
  createdAt: { type: Date, default: Date.now },
});
```

  

---

**📌 User Flow (How It Works)**

  

**1️⃣ Story Creation**

• Parent **double-clicks on the canvas** to create a **new story block**.

• Adds **text, voice, images, or video**.

• AI **analyzes the story in real time**.

  

**2️⃣ AI Story Analysis & Branching Traits**

• AI extracts **strengths & themes** (e.g., “creative problem-solving”).

• **Branches visually grow** from the story block, showing **AI-generated traits**.

• Parent can **select, refine, or add their own description**.

  

**3️⃣ AI-Driven Story Linking**

• AI **suggests past stories** with **similar traits**.

• Parent can **edit, refine, or link stories** together.

  

**4️⃣ “Grow” Feature – AI Narrative Synthesis**

• Parent **selects a series of stories**.

• AI **generates a cohesive narrative** highlighting **patterns of growth**.

• AI **suggests next steps for development** based on thematic progression.

---

**📌 Future Enhancements**

  

🚀 **AI-Generated Animations** – Turn drawings into **short animated clips**.

🚀 **Personalized Growth Reports** – Parents receive **AI insights over time** tracking their child’s evolution.

🚀 **Mentorship & Community Features** – Parents can **compare growth paths** with similar children.

---

**📌 Summary**

  

✅ **2 Dots 1 Line is a first-of-its-kind AI-powered storytelling platform** that helps parents **document, analyze, and nurture their child’s personal growth**.

✅ **Multi-modal input** (text, voice, image, video) makes it a **rich experience**.

✅ **AI-powered analysis and thematic story mapping** reveal **hidden strengths** and **long-term patterns**.

✅ **A visual, interactive canvas** makes storytelling an **engaging, dynamic experience**.

  

**🔹 Refined User & Family Schema for 2 Dots 1 Line (Inspired by Duolingo)**

  

To ensure **scalability and flexibility**, we need a **clear structure** for handling **parent-child relationships**, **household management**, and **user roles**.

---

**📌 Key Design Considerations**

  

✅ **Each family has one household** → A parent creates a **household** and can **add multiple child accounts**.

✅ **Each user has their own login** → Both parents and children can log in with separate accounts.

✅ **Role-based access control** → Parents can **see all children’s progress**, while children only see their own stories.

✅ **Easy account switching** → Parents can **switch between children’s profiles**, like Duolingo’s family feature.

---

**🔹 Mongoose Schema for User & Household Management**

  

**1️⃣ Household Schema (Manages the Family)**

```
const householdSchema = new mongoose.Schema({
  familyName: String, // Family name or household identifier
  parent: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Household owner (parent)
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // List of child users
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Household || mongoose.model("Household", householdSchema);
```

📌 **Why This?**

✅ **Each household has a single parent account** that manages the family.

✅ **Multiple children can be added** under the same household.

✅ **Easy to extend** (e.g., adding multiple guardians or mentors later).

---

**2️⃣ User Schema (Handles Individual Accounts)**

```
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  passwordHash: String, // Stores hashed password
  role: { type: String, enum: ["parent", "child"], required: true }, // Defines user type
  householdId: { type: mongoose.Schema.Types.ObjectId, ref: "Household" }, // Links to family
  activeChild: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // For parents switching between children
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.User || mongoose.model("User", userSchema);
```

📌 **Why This?**

✅ **Supports both parent and child accounts** under one schema.

✅ **Parents can switch between active children** (like Duolingo).

✅ **Role-based access control** is **built-in** (parent vs. child permissions).

---

**🔹 User Roles & Access Control**

|**Role**|**Permissions**|
|---|---|
|**Parent**|Can **add/manage child accounts**, view all stories, and switch between child profiles.|
|**Child**|Can only **see & create their own stories**.|

📌 **Example Behavior**

• Parent logs in → **Sees a dropdown to switch between children**.

• Child logs in → **Sees only their own stories** (no access to siblings).

---

**🔹 API Routes for Family Management**

|**API Route**|**Method**|**Description**|
|---|---|---|
|/api/auth/register|POST|Registers a **new parent or child account**.|
|/api/auth/login|POST|Authenticates a user (parent or child).|
|/api/household|POST|Creates a **new household** (for the first parent).|
|/api/household/add-child|POST|Allows a **parent to add a child** to the household.|
|/api/household/switch-child|POST|**Parent switches active child profile** for story viewing.|

  

---

**🔹 Example API: Add Child to Household**

  

📌 **pages/api/household/add-child.js**

```
import { connectToDatabase } from "../../../lib/mongodb";
import Household from "../../../models/Household";
import User from "../../../models/User";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  await connectToDatabase();
  const { parentId, childName, childEmail, password } = req.body;

  const parent = await User.findById(parentId);
  if (!parent || parent.role !== "parent") return res.status(403).json({ error: "Unauthorized" });

  const newChild = new User({ 
    name: childName, 
    email: childEmail, 
    passwordHash: password, 
    role: "child", 
    householdId: parent.householdId 
  });
  await newChild.save();

  await Household.findByIdAndUpdate(parent.householdId, { $push: { children: newChild._id } });

  res.status(201).json({ message: "Child account created successfully." });
}
```

📌 **What This Does?**

✅ **Parent can add a child account** under their household.

✅ **Child is automatically linked** to the family.

✅ **Ensures only parents can create child accounts** (security).

---

**🔹 Example API: Parent Switches Between Children**

  

📌 **pages/api/household/switch-child.js**

```
import { connectToDatabase } from "../../../lib/mongodb";
import User from "../../../models/User";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  await connectToDatabase();
  const { parentId, childId } = req.body;

  const parent = await User.findById(parentId);
  if (!parent || parent.role !== "parent") return res.status(403).json({ error: "Unauthorized" });

  parent.activeChild = childId;
  await parent.save();

  res.status(200).json({ message: "Switched to child profile successfully." });
}
```

📌 **What This Does?**

✅ **Parent can switch between children’s profiles** dynamically.

✅ **When they switch, they see only that child’s stories**.

✅ **Faster than logging in/out each time**.

---

**🔹 How This Translates to UI**

  

**👤 Parent Experience**

• Logs in → Sees **household dashboard**.

• Clicks dropdown → **Switches between children**.

• Can **add new child accounts** anytime.

  

**👶 Child Experience**

• Logs in → Sees **only their own stories**.

• Cannot see **sibling’s stories or AI traits**.

  

📌 **Example UI: Parent Dashboard**

```
export default function ParentDashboard({ user }) {
  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <label>Switch Child:</label>
      <select onChange={(e) => switchChild(e.target.value)}>
        {user.children.map((child) => (
          <option key={child._id} value={child._id}>{child.name}</option>
        ))}
      </select>
    </div>
  );
}
```

  

---

**🔹 Why This Schema?**

  

✅ **Scalable for multiple children per household** (like Duolingo).

✅ **Allows seamless parent-child switching** (no need for multiple logins).

✅ **Role-based security** ensures **children only see their own stories**.

✅ **Future-proof** → Can add features like **mentorship & multi-guardian support** later.

