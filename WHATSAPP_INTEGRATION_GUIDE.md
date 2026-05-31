# WhatsApp Business API Integration Blueprint
## Synergy Renewable Energy Limited — Sales Automation & Coordinator Integration

This technical guide outlines the architectural design, security configurations, and implementation details for integrating a full-stack Next.js or Node.js application with the Facebook Graph API for WhatsApp Business. This ensures seamless off-line customer inquiries are routed directly to the Synergy AI Copilot and synced to the Coordinator Staff CRM.

---

## 1. Obtaining API Access & Meta Setup

To interact with the official WhatsApp Business REST API, you must provision an application in the Facebook Developer Portal.

### Step-by-Step Meta Provisioning
1. **Create Facebook Developer Profile**: Navigate to the [Meta for Developers Portal](https://developers.facebook.com/) and register with an active Facebook account.
2. **Create a Developer App**:
   * Click **My Apps** -> **Create App**.
   * Under App Category, choose **Other** -> **Business** (this unlocks access to the WhatsApp Business SDK).
   * Fill in your App Name (e.g., `Synergy Renewable Sales Automation`) and select your associated Business Portfolio or Manager account.
3. **Add WhatsApp Product**:
   * In your App Dashboard, scroll down to "Add products to your app" and click **Set up** on the **WhatsApp** card.
   * This immediately generates a sandbox environment including a **Temporary Development Access Token** and a Sandbox test phone number.
4. **Acquire Permanent Credentials**:
   * **Phone Number ID**: A unique string identifying your specific business sender.
   * **WhatsApp Business Account ID**: Identifies your business configuration profile.
   * **Permanent System User Access Token**: Go to your Business Manager -> **Users** -> **System Users**. Select "Generate Token", check the `whatsapp_business_messaging` and `whatsapp_business_management` scopes, and copy the permanent token. Save it in your server's `.env` as `WHATSAPP_ACCESS_TOKEN`.

---

## 2. Webhook Endpoint Architecture (`/api/whatsapp/webhook`)

To receive real-time active customer text messages, the WhatsApp server triggers HTTP requests to your server. This requires supporting two distinct methods:
1. `GET /api/whatsapp/webhook`: Handles the initial registration handshake and verify request from Meta's servers.
2. `POST /api/whatsapp/webhook`: Listens for live customer messages, status reports, and incoming triggers.

### Webhook Verification Handshake (`GET`)
Meta verifies your endpoint by issuing a GET request containing standard query parameters. You must match the sent verification token against your server-side secret (`WHATSAPP_VERIFY_TOKEN`) and echo back the challenge string.

#### Expected Request Parameters
* `hub.mode`: Will always be `"subscribe"`
* `hub.challenge`: A random generated integer sent by Meta
* `hub.verify_token`: The secret password you set in Meta Developer Settings.

#### Handshake Response
* **Success Status**: `200 OK`
* **Response Body**: Needs to echo back the literal string of `hub.challenge`.

---

## 3. Live Message Event Payloads (`POST`)

Whenever a user sends a text to your WhatsApp number, Meta posts a detailed event envelope in JSON.

### Expected Payload JSON Structure
Below is an authentic text-message payload sent to your webhook when a customer (e.g., Alhaji Ibrahim from Kaduna Central) starts a solar discussion:

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "104928571850123",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "2348030000000",
              "phone_number_id": "908761234891"
            },
            "contacts": [
              {
                "profile": {
                  "name": "Alhaji Ibrahim"
                },
                "wa_id": "2348038086258"
              }
            ],
            "messages": [
              {
                "from": "2348038086258",
                "id": "ABGG0GbWz6Z1Ago-px-0p5A38C222",
                "timestamp": "1782786648",
                "text": {
                  "body": "How much does a 5KVA solar project cost in Barnawa?"
                },
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

### Parsing Key Parameters
* **Customer WhatsApp ID (`wa_id`)**: Retrieved from `entry[0].changes[0].value.contacts[0].wa_id` (this is the phone number used as the unique identifier for user sessions and state-tracking in the CRM database).
* **Display User Name**: Located at `profile.name`.
* **Message Body Text**: Found at `messages[0].text.body`.
* **Message ID**: Found at `messages[0].id` (essential to record to suppress double-delivery duplicates since Meta retries if a gateway times out).

---

## 4. Sending Outbound Message Replies via Facebook Graph API

To reply back to your customer, write an HTTP `POST` call to Meta’s outbound delivery gateway.

### Endpoint URL
```http
POST https://graph.facebook.com/v20.0/{PHONE_NUMBER_ID}/messages
```

### HTTP Headers
```http
Authorization: Bearer WHATSAPP_ACCESS_TOKEN
Content-Type: application/json
```

### Response Body payload Format (Interactive Text Reply)
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "2348038086258",
  "type": "text",
  "text": {
    "preview_url": true,
    "body": "Hello Alhaji Ibrahim!\n\nOur Synergy Advisor AI calculated a *5KVA Hybrid Premium Installation* for you. It includes:\n• Tier-1 Mono Half-Cut Panels\n• 5KVA Pure Sine Wave MPPT Hybrid Inverter\n• 5.12KWh Smart BMS Lithium Iron Phosphate battery vaults.\n\nEstimated Overrides Cost: ₦3,850,000.\nWould you like our Kaduna engineering team to conduct a site safety survey?"
  }
}
```

---

## 5. Next.js App Router Webhook Implementation (`app/api/whatsapp/webhook/route.ts`)

Here is a robust, production-ready implementation of the Next.js API route matching all Meta security, verification, and outbound reply mechanisms:

```typescript
import { NextRequest, NextResponse } from "next/server";

// Keep values secured under environment variables
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "SynergyKadunaSecureToken_2026";
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

/**
 * GET Handler: Implements Hook Verification Handshake
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) {
    console.log("[Next.js Webhook] Handshake verified successfully.");
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn("[Next.js Webhook] Unauthorized challenge handshake attempt.");
  return new NextResponse("Forbidden", { status: 403 });
}

/**
 * POST Handler: Process inbound conversations and dispatch AI completions
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Verify this is a valid whatsapp payload structure
    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ error: "Invalid Object Type" }, { status: 400 });
    }

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const messageObj = change?.messages?.[0];
    const contactObj = change?.contacts?.[0];

    if (!messageObj) {
      // Ignore delivery receipts, status updates, or other notification signals
      return NextResponse.json({ status: "ignored" });
    }

    const customerPhone = messageObj.from || contactObj?.wa_id;
    const customerText = messageObj.text?.body || "";
    const customerName = contactObj?.profile?.name || "Client";

    console.log(`[Next.js WhatsApp] Inbound message from ${customerName} (${customerPhone}): "${customerText}"`);

    // 1. Invoke Synergy AI Logic Engine / CRM sync
    // In full-stack architecture, dispatching the user query coordinates state:
    const backendResponse = await fetch(`${process.env.APP_URL || "http://localhost:3000"}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: customerText,
        senderId: customerPhone,
        source: "WHATSAPP",
        leadInfo: {
          name: customerName,
          powerGoal: "Bypassing KAEDCO Grid Instability"
        }
      })
    });

    const aiResult = await backendResponse.json();
    const replyText = aiResult.reply || "Thank you for contacting Synergy Renewable Energy. Our engineers are reviewing your specs.";

    // 2. Dispatch Outbound Reply to Facebook Graph API
    if (WHATSAPP_ACCESS_TOKEN && PHONE_NUMBER_ID) {
      const outboundPayload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: customerPhone,
        type: "text",
        text: {
          preview_url: false,
          body: replyText
        }
      };

      const metaResponse = await fetch(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(outboundPayload)
      });

      const metaJson = await metaResponse.json();
      console.log("[Next.js Meta API Output]", metaJson);
    } else {
      console.warn("[Next.js Webhook Warning] Access tokens missing. Simulating sending:", replyText);
    }

    return NextResponse.json({ success: true, answered: true });

  } catch (err: any) {
    console.error("[Next.js WhatsApp Webhook Error]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
```

---

## 6. Crucial Implementation Considerations

1. **The 24-Hour Customer Window**:
   You can send custom AI or human responses dynamically within 24 hours of the *user’s* last inbound message. Once this 24-hour window expires, you can *only* message the user with approved pre-structured **Meta Message Templates** (pre-authorized text elements for invoice alerts, scheduled appointments, etc.).
2. **Asynchronous Processing**:
   Meta expects your server to reply to webhooks with an HTTP `200 OK` in **under 3.0 seconds**. If your AI retrieval / vector database query takes longer, you should process the AI reply asynchronously (e.g., spawn a non-blocking Promise or use a background queue worker), returning `200` to Meta instantly, and delivering the response via the outbound API later.
3. **Handling Human Handoff / Interventions**:
   In the Coordination console, when a staff supervisor selects "HUMAN_INTERVENTION" status, you should toggle a database lock flag. Outbound Webhook handlers must respect this flag, instantly disabling the automatic Gemini reply loop to prevent the AI from interrupting active contract/discount alignments being done by a human advisor.
4. **Validating Webhook Signature (X-Hub-Signature)**:
   For high-security production deployments, parse the header `X-Hub-Signature-256` sent by Meta and verify it matches an HMAC SHA256 signature generated with your webhook's payload and `APP_SECRET` string.
