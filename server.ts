import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { LeadsService } from "./server/db";
import { executeAiAgent } from "./server/ai";

// Load Environment variables at startup
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // --- API Routes ---

  // Health / Status endpoint showing MongoDB vs fallback activation
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      fallbackMode: LeadsService.isFallbackMode(),
      currentTime: new Date().toISOString(),
      kadunaTarget: "Synergy Renewable Energy, Kaduna, Nigeria"
    });
  });

  // Fetch all leads
  app.get("/api/crm/leads", async (req, res) => {
    try {
      const leads = await LeadsService.getAll();
      res.json({ success: true, leads });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // Create or Update Lead directly
  app.post("/api/crm/leads", async (req, res) => {
    try {
      const lead = await LeadsService.create(req.body);
      res.json({ success: true, lead });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // Update lead status/details by ID
  app.post("/api/crm/leads/update", async (req, res) => {
    const { id, ...updates } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, error: "ID parameter is required" });
    }
    try {
      const lead = await LeadsService.updateById(id, updates);
      if (!lead) {
        return res.status(404).json({ success: false, error: "Lead not found" });
      }
      res.json({ success: true, lead });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // Delete lead
  app.delete("/api/crm/leads/:id", async (req, res) => {
    try {
      const success = await LeadsService.deleteById(req.params.id);
      res.json({ success });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // Unified AI chat agent route (servicing Web and Webhooks)
  app.post("/api/chat", async (req, res) => {
    const { message, senderId, source, leadInfo } = req.body;

    if (!message || !senderId) {
      return res.status(400).json({ success: false, error: "Message and senderId are required fields." });
    }

    try {
      // 1. Resolve or create lead from data
      let lead = await LeadsService.getByPhone(senderId);
      
      if (!lead && leadInfo) {
        // Form submitted details to trigger upsert
        lead = await LeadsService.create({
          name: leadInfo.name,
          phone: senderId,
          email: leadInfo.email,
          monthlyBill: leadInfo.monthlyBill,
          powerGoal: leadInfo.powerGoal,
          status: "NEW"
        });
      } else if (!lead) {
        // Auto-generate implicit lead to continue chat
        lead = await LeadsService.create({
          name: `Kaduna Prospect (${senderId.slice(-4)})`,
          phone: senderId,
          email: "",
          monthlyBill: 0,
          powerGoal: "Consultation Outage Backup",
          status: "AI_CHATTING"
        });
      }

      // 2. Strict Lead Handoff Block
      // If of HUMAN_INTERVENTION status, do NOT query AI. Block output instantly.
      if (lead.status === "HUMAN_INTERVENTION") {
        const handoffNotice = "⚠️ A human solar expert from Synergy Renewable Energy has taken over this conversation to design your robust Kaduna installation. Please call us directly on 0803 808 6258 or standby for our prompt reply.";
        
        // Log user query anyway so agent sees it in CRM
        await LeadsService.addChatMessage(lead._id, {
          role: "user",
          content: message,
          timestamp: new Date().toISOString()
        });

        return res.json({
          reply: handoffNotice,
          handoffTriggered: true,
          leadStatus: "HUMAN_INTERVENTION"
        });
      }

      // Move lead into chatting state if still NEW
      if (lead.status === "NEW") {
        await LeadsService.updateById(lead._id, { status: "AI_CHATTING" });
        lead.status = "AI_CHATTING";
      }

      // Log User query
      const userMessageObj = {
        role: "user" as const,
        content: message,
        timestamp: new Date().toISOString()
      };
      await LeadsService.addChatMessage(lead._id, userMessageObj);
      lead.chatHistory.push(userMessageObj);

      // 3. Execute RAG + Gemini Agent
      const result = await executeAiAgent(message, lead);

      // Log Assistant response
      const assistantMessageObj = {
        role: "model" as const,
        content: result.reply,
        timestamp: new Date().toISOString()
      };
      await LeadsService.addChatMessage(lead._id, assistantMessageObj);

      res.json({
        reply: result.reply,
        handoffTriggered: result.handoffTriggered,
        leadStatus: result.handoffTriggered ? "HUMAN_INTERVENTION" : lead.status
      });

    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // WhatsApp Webhook endpoint matching standard formats
  app.post("/api/whatsapp/webhook", async (req, res) => {
    let message = req.body.message || "";
    let senderId = req.body.senderId || "08038086258"; // Fallback demo phone
    
    // Parse authentic WhatsApp webhook JSON payload structures if detected
    if (req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const msgObj = req.body.entry[0].changes[0].value.messages[0];
      const phoneObj = req.body.entry[0].changes[0].value.contacts?.[0];
      
      message = msgObj.text?.body || "Hello";
      senderId = msgObj.from || "unknown_whatsapp";
    }

    try {
      // Find or create lead implicitly
      let lead = await LeadsService.getByPhone(senderId);
      if (!lead) {
        lead = await LeadsService.create({
          name: `WhatsApp User (${senderId})`,
          phone: senderId,
          email: "whatsapp_payload@synergy.xyz",
          monthlyBill: 100000,
          powerGoal: "Bypassing KAEDCO Grid Fluctuations",
          status: "AI_CHATTING"
        });
      }

      // Bypass if human intervened
      if (lead.status === "HUMAN_INTERVENTION") {
        await LeadsService.addChatMessage(lead._id, {
          role: "user",
          content: message,
          timestamp: new Date().toISOString()
        });
        return res.json({
          status: "by-passed",
          reply: "⚠️ Human intervention active on 0803 808 6258"
        });
      }

      // Add user log
      await LeadsService.addChatMessage(lead._id, {
        role: "user",
        content: message,
        timestamp: new Date().toISOString()
      });
      lead.chatHistory.push({ role: "user", content: message, timestamp: new Date().toISOString() });

      // Run AI Chat
      const aiResult = await executeAiAgent(message, lead);

      // Add model log
      await LeadsService.addChatMessage(lead._id, {
        role: "model",
        content: aiResult.reply,
        timestamp: new Date().toISOString()
      });

      // Simulate sending WhatsApp payload back via dispatch logs
      console.log(`[WhatsApp Dispatch API] Outbound to ${senderId}: "${aiResult.reply}"`);
      
      res.json({
        success: true,
        recipient: senderId,
        reply: aiResult.reply,
        handoffTriggered: aiResult.handoffTriggered
      });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // --- Vite & Client Side Asset Serving ---

  if (process.env.NODE_ENV !== "production") {
    // Mount Vite dev server middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware mounted on Express.");
  } else {
    // Serve production static assets compiled under dist/
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Server running in Production Mode, serving built assets.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Synergy Solar system running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
