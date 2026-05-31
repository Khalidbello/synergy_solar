import { GoogleGenAI, Type, FunctionDeclaration, GenerateContentResponse } from "@google/genai";
import { LeadsService } from "./db";
import { generateSystemQuotation } from "../src/calculatorUtils";

// Initialize Gemini Client using system-wide secret
export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

/**
 * Premium Localized Vector-like RAG knowledge base for Kaduna, Nigeria environment
 */
const KADUNA_SOLAR_RESOURCES = [
  {
    keywords: ["kaedco", "nepa", "grid", "flues", "blackout", "fluctuation", "surge", "outage"],
    content: "Kaduna Electricity Distribution Company (KAEDCO) is Kaduna's primary grid distributor, but supply remains highly erratic, averaging 3 to 7 hours daily in key districts (Barnawa, Narayi, Cabin, Sabon Tasha, Malali, Tudun Wada). High-voltage surges are extremely frequent, which can destroy residential solar gear. Synergy Renewable Energy integrates pure sine wave hybrid smart inverters with advanced Class-II SPD surge protectors as standards to isolate grid fluctuations."
  },
  {
    keywords: ["temperature", "heat", "derating", "efficiency", "hot", "sun", "dusty", "harmattan"],
    content: "Kaduna experiences temperatures above 38°C during dry seasons. Heat forces standard solar panels to undergo temperature de-rating, dropping power efficiency by around 12% to 15%. Synergy resolves this by utilizing premium Tier-1 Mono-crystalline Panels with exceptionally low thermal coefficients, mounting them on 150mm raised ventilated alloy brackets to prevent heat traps. We also apply a customized 1.3 design scaling factor for all Kaduna solar arrays."
  },
  {
    keywords: ["warranty", "repair", "guarantee", "victron", "growatt", "replace", "cycles"],
    content: "Synergy Renewable Energy provides a 3-year direct swap warranty on Pure Sine Wave Smart hybrid inverters and an industry-standard 5-year full guarantee on our customized LiFePO4 Lithium Iron Phosphate battery banks. While lead-acid batteries fail within 1-2 years in Kaduna due to ambient heat, our high-density smart BMS lithium packs sustain up to 6,000 charge cycles at 80% Depth of Discharge."
  },
  {
    keywords: ["price", "cost", "tariff", "packages", "rates", "pricing", "naira", "how much"],
    content: "Synergy Solar offers three customizable premium tiers for Kaduna clients:\n1. Silver Tier (3.5kVA Pure Sine Inverter, 1.2kW Panel array, 2.4kWh/5kWh Lithium storage): Best for backup power, light AC, laptops, TVs, fans, booster pumps. Price: ₦2,200,000 to ₦3,800,000.\n2. Gold Tier (5kVA Pure Sine Inverter, 3.5kW Panel array, 5kWh/10kWh Lithium storage): Supports refrigerators, cooling tools, inverters, and basic home cooling. Price: ₦4,500,000 to ₦6,800,000.\n3. Platinum Tier (8kVA+ Pure Sine Inverter, 6kW - 10kW Panel array, 10kWh - 20kWh Lithium storage): Fully off-grid power house for continuous cooling, multiple refrigerators, booster grids, and boreholes. Price: ₦7,500,000 to ₦14,000,000."
  },
  {
    keywords: ["borehole", "water", "ac", "refrigerator", "cooling", "pump", "heavy"],
    content: "In Kaduna, borehole water pumps and air conditioning are standard high-demand loads. Water pumping is best powered directly during solar peak hours (10 AM to 3 PM) to prevent rapid energy drain on battery batteries. Our smart inverters support generator load-shifting algorithms, directing direct solar production to active water pumps or heavy AC loads without cycles."
  }
];

/**
 * Mock Vector Search RAG context retriever
 */
export async function retrieveContext(query: string): Promise<string> {
  const normalizedQuery = query.toLowerCase();
  const matchedChunks = KADUNA_SOLAR_RESOURCES.filter(resource => {
    return resource.keywords.some(keyword => normalizedQuery.includes(keyword));
  });

  if (matchedChunks.length === 0) {
    // Return a solid base context of Kaduna solar installations
    return "Synergy Renewable Energy Limited provides premier grid-independent hybrid solar power systems in Kaduna, Nigeria with custom Pure Sine Smart Inverters, robust LiFePO4 battery backups, heat-tolerant mono arrays, and full engineer-led site deployments.";
  }

  return matchedChunks.map(c => c.content).join("\n\n");
}

// Function Declarations for Gemini Tool Calling
const createOrUpdateLeadTool: FunctionDeclaration = {
  name: "createOrUpdateLead",
  description: "Updates or registers a customer lead in the Synergy customer records database",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Full name of the customer, e.g., Alhaji Ibrahim Musa" },
      phone: { type: Type.STRING, description: "Nigeria phone number, preferably 11-digits starting with 0, e.g., 08038086258" },
      email: { type: Type.STRING, description: "Customer's email address if available" },
      monthlyBill: { type: Type.NUMBER, description: "Estimated average monthly electricity bill in Naira (₦)" },
      powerGoal: { type: Type.STRING, description: "Power priorities (e.g., bypass KAEDCO blackouts, constant AC, borehole support)" }
    },
    required: ["name", "phone"]
  }
};

const generateQuotationTool: FunctionDeclaration = {
  name: "generateQuotation",
  description: "Calculates optimized solar sizes and outputs a detailed quotation for the client",
  parameters: {
    type: Type.OBJECT,
    properties: {
      monthlyBill: { type: Type.NUMBER, description: "Monthly utility bill expense in Naira" },
      powerGoal: { type: Type.STRING, description: "Primary goal, e.g. constant AC, borehole pump, grid independence" }
    },
    required: ["monthlyBill", "powerGoal"]
  }
};

const triggerHumanHandoffTool: FunctionDeclaration = {
  name: "triggerHumanHandoff",
  description: "Flags customer lead status for immediate human engineering override if requested or if needs premium manual sizing",
  parameters: {
    type: Type.OBJECT,
    properties: {
      phone: { type: Type.STRING, description: "The customer's registered phone number to identify their record" },
      reason: { type: Type.STRING, description: "Brief explanation why handoff is requested, e.g., customer wants structural warranty discount" }
    },
    required: ["phone", "reason"]
  }
};

/**
 * Execute tool calls locally
 */
async function executeTool(name: string, args: any): Promise<any> {
  console.log(`Executing AI Tool: ${name} with args:`, args);
  try {
    if (name === "createOrUpdateLead") {
      const result = await LeadsService.create({
        name: args.name,
        phone: args.phone,
        email: args.email,
        monthlyBill: args.monthlyBill,
        powerGoal: args.powerGoal,
        status: "AI_CHATTING"
      });
      return { success: true, message: `Lead updated successfully for ${result.name}.`, id: result._id };
    }

    if (name === "generateQuotation") {
      const quote = generateSystemQuotation(args.monthlyBill, args.powerGoal);
      
      // Build an elegant, highly structured markdown text table detailing quotation
      const tableMarkdown = `
### 🛠️ Synergy Custom Solar Quotation
**System Sizing Analysis for ₦${Number(args.monthlyBill).toLocaleString()} Monthly Bill**

| Component / Sizing Metric | Specification / Capacity |
| :--- | :--- |
| **Recommended Solar Array** | **${(quote.solarWatts / 1000).toFixed(2)} kW** (${quote.solarWatts.toLocaleString()} Watts Peak) |
| **Smart Hybrid Inverter** | **${quote.inverterKva} kVA** (Pure Sine Wave MPPT) |
| **Lithium Battery Bank** | **${quote.batteryKwh.toFixed(1)} kWh** (48V ${quote.batteryAh}Ah LiFePO4 Energy Battery) |
| **Estimated System Hardware & Deployment Cost** | **₦${quote.estimatedCost.toLocaleString()}** |

**⚡ quotation breakdown:**
${quote.breakdown.map(item => `- **${item.item}** (x${item.quantity}): ${item.spec} - *₦${item.cost.toLocaleString()}*`).join("\n")}

*Prices include full mechanical installations, premium wind-resistant ground/roof rails, pure sine inverters, safety fuses, lightning rods, and 3-year warranty deployment in Kaduna.*
      `;
      return { success: true, quotationTable: tableMarkdown, details: quote };
    }

    if (name === "triggerHumanHandoff") {
      const lead = await LeadsService.getByPhone(args.phone);
      if (lead) {
        await LeadsService.updateById(lead._id, {
          status: "HUMAN_INTERVENTION",
          powerGoal: args.reason ? `Handoff requested: ${args.reason}. Prior prioritites: ${lead.powerGoal}` : lead.powerGoal
        });
        return {
          success: true,
          message: "A human engineering expert has been alerted to provide custom support.",
          contactPhone: "0803 808 6258"
        };
      } else {
        return {
          success: false,
          message: "Could not find a lead under this phone number. Please register your details first.",
        };
      }
    }
  } catch (err) {
    console.error(`AI Tool ${name} error:`, err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Core AI agent execution loop. Runs RAG + Tool-Calling logic with Gemini
 */
export async function executeAiAgent(message: string, leadInstance: any): Promise<{ reply: string, handoffTriggered: boolean }> {
  // 1. Fetch RAG content
  const ragContext = await retrieveContext(message);

  // 2. Prepare System Instructions targeting Nigeria/Kaduna contexts
  const systemInstruction = `
You are a highly professional, polite, and technical Hybrid Solar Energy Sales Engineer for "Synergy Renewable Energy Limited", based in Kaduna, Nigeria.
Your objective is to consult prospects, register leads, render automated solar quotations, and gracefully handover high-complexity accounts to human engineers.

🎯 KEY CONTEXTS:
- Company Name: Synergy Renewable Energy Limited
- Area of Operations: Kaduna, Nigeria (Barnawa, Narayi, Cabin, Sabon Tasha, Malali, Tudun Wada, etc.)
- Kaduna Electricity Provider: KAEDCO / NEPA (notoriously unstable, high surge risk, massive blackouts)
- Primary Accents: Nigerian, friendly, authoritative, absolute integrity.

💬 DIALOGUE RULES:
1. Always be welcoming and highly technical yet clear. Refer to bills in Nigerian Naira (₦).
2. If the user tells you their name and phone, immediately trigger 'createOrUpdateLead' tool to register/update them. Always request Name and Phone number before delivering quotations so you can log them!
3. If the user asks for a quote or estimates, use 'generateQuotation' tool.
4. If they specifically ask to speak to a human, require custom multi-site discounts, or express frustration, use 'triggerHumanHandoff' tool.
5. Use the Kaduna Localized context information below to answer specific technical questions:
${ragContext}

👉 ACTIVE CUSTOMER DATA:
- Current customer in chat: name("${leadInstance?.name || 'Unknown'}"), phone("${leadInstance?.phone || 'none'}"), monthlyBill(₦"${leadInstance?.monthlyBill || '0'}"), powerGoal("${leadInstance?.powerGoal || 'none'}").
  `;

  try {
    // Call the Gemini-3.5-flash model
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: {
        systemInstruction,
        tools: [{
          functionDeclarations: [
            createOrUpdateLeadTool,
            generateQuotationTool,
            triggerHumanHandoffTool
          ]
        }],
        toolConfig: { includeServerSideToolInvocations: true }
      }
    });

    const functionCalls = response.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
      // Execute the first tool call
      const toolCall = functionCalls[0];
      const toolResult = await executeTool(toolCall.name, toolCall.args);

      // Re-feed the tool outputs back to Gemini to get a natural final response summary
      const response2 = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          { role: "user", parts: [{ text: message }] } as any,
          { role: "model", parts: [{ functionCalls: [toolCall] }] } as any,
          { role: "user", parts: [{ text: `TOOL_RESULT for ${toolCall.name}: ${JSON.stringify(toolResult)}` }] } as any
        ],
        config: {
          systemInstruction,
          tools: [{
            functionDeclarations: [
              createOrUpdateLeadTool,
              generateQuotationTool,
              triggerHumanHandoffTool
            ]
          }],
          toolConfig: { includeServerSideToolInvocations: true }
        }
      });

      const reply = response2.text || "Your request was processed successfully.";
      const isHandoff = toolCall.name === "triggerHumanHandoff";
      return { reply, handoffTriggered: isHandoff };
    }

    return {
      reply: response.text || "I appreciate your response. How else may Synergy Renewable Energy power your property today?",
      handoffTriggered: false
    };

  } catch (error) {
    console.error("Gemini AI agent execution error:", error);
    return {
      reply: "Sincere apologies. Our smart solar planning servers are experiencing high load in Kaduna. You can contact our sales engineers directly at 0803 808 6258.",
      handoffTriggered: false
    };
  }
}
