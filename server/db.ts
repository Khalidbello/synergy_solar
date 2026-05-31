import mongoose, { Schema, Document, Model } from "mongoose";
import { Lead as LeadType, ChatMessage } from "../src/types";

// State variable to track fallback database mode
let isFallback = true;
let fallbackLeads: LeadType[] = [
  {
    _id: "lead_1",
    name: "Alhaji Ibrahim Musa",
    phone: "08031234567",
    email: "musa.ibrahim@outlook.com",
    monthlyBill: 120000,
    powerGoal: "Bypassing KAEDCO Grid Instability & AC Backup",
    status: "NEW",
    chatHistory: [
      { role: "user", content: "Hello, I am interested in solar system for my office in Kaduna.", timestamp: new Date(Date.now() - 3600000).toISOString() },
      { role: "model", content: "Greetings Alhaji! Sincere greetings from Synergy Renewable Energy. We would be absolutely delighted to help power your Kaduna office with our premium, high-efficiency solar energy. What is your typical monthly electricity bill at the office?", timestamp: new Date(Date.now() - 3500000).toISOString() }
    ],
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    _id: "lead_2",
    name: "Dr. Chioma Nwachukwu",
    phone: "08059876543",
    email: "chioma.n@yahoo.com",
    monthlyBill: 180000,
    powerGoal: "Constant Cooling & Lab Refrigerator Backup",
    status: "HUMAN_INTERVENTION",
    chatHistory: [
      { role: "user", content: "I need to configure a 10kW system with high battery storage.", timestamp: new Date(Date.now() - 17200000).toISOString() },
      { role: "model", content: "Excellent choice Dr. Chioma. A 10kW solar array will satisfy your cooling and lab refrigeration backup needs beautifully. Let me calculate your exact custom battery requirements.", timestamp: new Date(Date.now() - 17100000).toISOString() },
      { role: "user", content: "Can I talk to a human agent? I need to verify custom specifications and tax discounts.", timestamp: new Date(Date.now() - 15000000).toISOString() },
      { role: "model", content: "Absolutely. I will halt AI automatic responses and flag an engineering representative for your project. Please standby.", timestamp: new Date(Date.now() - 14900000).toISOString() }
    ],
    createdAt: new Date(Date.now() - 17200000).toISOString()
  },
  {
    _id: "lead_3",
    name: "Kaduna Tech Hub",
    phone: "08123456789",
    email: "facilities@kadunatech.ng",
    monthlyBill: 450000,
    powerGoal: "Complete Off-Grid Setup & Server Room Autonomy",
    status: "QUOTED",
    chatHistory: [
      { role: "user", content: "How much is a full off grid setup for a co-working space?", timestamp: new Date(Date.now() - 86400000 * 2).toISOString() }
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

// Document interface for Mongoose
interface ILeadDoc extends Document {
  name: string;
  phone: string;
  email: string;
  monthlyBill: number;
  powerGoal: string;
  status: 'NEW' | 'QUOTED' | 'AI_CHATTING' | 'HUMAN_INTERVENTION' | 'CLOSED';
  chatHistory: ChatMessage[];
  createdAt: Date;
}

const chatHistorySchema = new Schema({
  role: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const leadSchema = new Schema<ILeadDoc>({
  name: { type: String, required: true },
  phone: { type: String, required: true, index: true, unique: true },
  email: { type: String, required: true },
  monthlyBill: { type: Number, required: true },
  powerGoal: { type: String, default: "" },
  status: {
    type: String,
    enum: ['NEW', 'QUOTED', 'AI_CHATTING', 'HUMAN_INTERVENTION', 'CLOSED'],
    default: 'NEW'
  },
  chatHistory: [chatHistorySchema],
  createdAt: { type: Date, default: Date.now }
});

let MongooseLeadModel: Model<ILeadDoc>;

// Try preparing mongoose
try {
  MongooseLeadModel = mongoose.models.Lead || mongoose.model<ILeadDoc>("Lead", leadSchema);
} catch (error) {
  console.warn("Mongoose initialization warning, relying on dynamic activation: ", error);
}

// Connect to MongoDB
export async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.log("No MONGODB_URI found in environment variables. Operating in file/memory Fallback Mode.");
    isFallback = true;
    return false;
  }

  try {
    // Avoid double connect
    if (mongoose.connection.readyState === 1) {
      isFallback = false;
      return true;
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB connected successfully via Mongoose.");
    isFallback = false;
    return true;
  } catch (err) {
    console.error("MongoDB connection fail. Falling back gracefully to memory storage: ", (err as Error).message);
    isFallback = true;
    return false;
  }
}

// Ensure database connection is triggered
connectDB();

/**
 * Lead Service Layer - encapsulates Database operations handling fallback dynamically
 */
export const LeadsService = {
  isFallbackMode: () => {
    return isFallback;
  },

  async getAll(): Promise<LeadType[]> {
    if (isFallback) {
      return [...fallbackLeads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    await connectDB();
    const docs = await MongooseLeadModel.find().sort({ createdAt: -1 });
    return docs.map(docToLead);
  },

  async getByPhone(phone: string): Promise<LeadType | null> {
    if (isFallback) {
      const lead = fallbackLeads.find(l => l.phone.trim() === phone.trim());
      return lead ? { ...lead } : null;
    }
    await connectDB();
    const doc = await MongooseLeadModel.findOne({ phone: phone.trim() });
    return doc ? docToLead(doc) : null;
  },

  async getById(id: string): Promise<LeadType | null> {
    if (isFallback) {
      const lead = fallbackLeads.find(l => l._id === id);
      return lead ? { ...lead } : null;
    }
    await connectDB();
    try {
      const doc = await MongooseLeadModel.findById(id);
      return doc ? docToLead(doc) : null;
    } catch {
      return null;
    }
  },

  async create(data: Partial<LeadType>): Promise<LeadType> {
    const freshData: LeadType = {
      _id: isFallback ? `lead_${Date.now()}` : "",
      name: data.name || "Unknown Lead",
      phone: (data.phone || "").trim(),
      email: data.email || "",
      monthlyBill: Number(data.monthlyBill) || 0,
      powerGoal: data.powerGoal || "General Grid Instability Backup",
      status: data.status || "NEW",
      chatHistory: data.chatHistory || [],
      createdAt: new Date().toISOString()
    };

    if (isFallback) {
      // Check for duplicate phone
      const duplicateIndex = fallbackLeads.findIndex(l => l.phone.trim() === freshData.phone);
      if (duplicateIndex !== -1) {
        // Upsert behaviour or throw
        fallbackLeads[duplicateIndex] = { ...fallbackLeads[duplicateIndex], ...freshData, _id: fallbackLeads[duplicateIndex]._id };
        return fallbackLeads[duplicateIndex];
      }
      fallbackLeads.push(freshData);
      return freshData;
    }

    await connectDB();
    // Use upsert mechanism in MongoDB or find-and-save to prevent index errors
    let existingDoc = await MongooseLeadModel.findOne({ phone: freshData.phone });
    if (existingDoc) {
      existingDoc.name = freshData.name;
      existingDoc.email = freshData.email;
      existingDoc.monthlyBill = freshData.monthlyBill;
      existingDoc.powerGoal = freshData.powerGoal;
      existingDoc.status = freshData.status;
      if (freshData.chatHistory.length > 0) {
        existingDoc.chatHistory = freshData.chatHistory;
      }
      await existingDoc.save();
      return docToLead(existingDoc);
    }

    const doc = new MongooseLeadModel({
      name: freshData.name,
      phone: freshData.phone,
      email: freshData.email,
      monthlyBill: freshData.monthlyBill,
      powerGoal: freshData.powerGoal,
      status: freshData.status,
      chatHistory: freshData.chatHistory,
      createdAt: new Date(freshData.createdAt)
    });
    await doc.save();
    return docToLead(doc);
  },

  async updateById(id: string, update: Partial<LeadType>): Promise<LeadType | null> {
    if (isFallback) {
      const index = fallbackLeads.findIndex(l => l._id === id);
      if (index === -1) return null;
      fallbackLeads[index] = {
        ...fallbackLeads[index],
        ...update,
        _id: id // Ensure id never changes
      } as LeadType;
      return fallbackLeads[index];
    }

    await connectDB();
    try {
      const rawUpdate: any = { ...update };
      if (update.createdAt) {
        rawUpdate.createdAt = new Date(update.createdAt);
      }
      const doc = await MongooseLeadModel.findByIdAndUpdate(
        id,
        { $set: rawUpdate },
        { new: true }
      );
      return doc ? docToLead(doc) : null;
    } catch {
      return null;
    }
  },

  async addChatMessage(id: string, msg: ChatMessage): Promise<LeadType | null> {
    if (isFallback) {
      const lead = fallbackLeads.find(l => l._id === id);
      if (!lead) return null;
      lead.chatHistory.push(msg);
      return { ...lead };
    }

    await connectDB();
    try {
      const doc = await MongooseLeadModel.findByIdAndUpdate(
        id,
        { $push: { chatHistory: msg } },
        { new: true }
      );
      return doc ? docToLead(doc) : null;
    } catch {
      return null;
    }
  },

  async deleteById(id: string): Promise<boolean> {
    if (isFallback) {
      const initialLength = fallbackLeads.length;
      fallbackLeads = fallbackLeads.filter(l => l._id !== id);
      return fallbackLeads.length < initialLength;
    }
    await connectDB();
    try {
      const result = await MongooseLeadModel.findByIdAndDelete(id);
      return result !== null;
    } catch {
      return false;
    }
  }
};

/**
 * Mapper helper to clean mongoose docs into normal TS interface data
 */
function docToLead(doc: ILeadDoc): LeadType {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    phone: doc.phone,
    email: doc.email,
    monthlyBill: doc.monthlyBill,
    powerGoal: doc.powerGoal || "General Instability Bypass",
    status: doc.status,
    chatHistory: doc.chatHistory.map((h: any) => ({
      role: h.role,
      content: h.content,
      timestamp: h.timestamp instanceof Date ? h.timestamp.toISOString() : String(h.timestamp)
    })),
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt)
  };
}
