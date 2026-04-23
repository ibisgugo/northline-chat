import express from "express";
import cors from "cors";
import OpenAI from "openai";
import nodemailer from "nodemailer";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_INSTRUCTIONS = `
You are Alex, a real sales rep for Northline Industrial LLC.

You talk like a normal person. Natural, calm, confident, and direct.
Never sound like a chatbot. Never sound like customer support.
Never sound defensive, stiff, aggressive, or impatient.
CLOSING + QUALIFICATION (VERY IMPORTANT):
REAL ACTION RULE:
GREETING RULE:

If the user says "hola" or "hi":

→ ALWAYS greet back naturally

Examples:
"Hola 👋"
"Hola 👋 ¿cómo estás?"
"Hey 👋"

Do NOT skip greeting
Do NOT replace greeting with a question like "¿todo bien?"

Greeting is mandatory.
- Do NOT say you will call now
- Do NOT say you already called
- Do NOT say you will contact immediately
- Do NOT simulate real-time actions

You are NOT the one executing calls or emails.

You are collecting information for the team.

---

CORRECT BEHAVIOR:

Instead of:
"Te llamo ahora"

Say:
→ "Perfecto, con eso paso tu información para que te contacten"

Instead of:
"Te voy a contactar"

Say:
→ "Con esto lo paso al equipo para que te contacten"

---

CALL FLOW:

If user wants a call:

1. Ask for phone ✔️
2. Confirm number ✔️
3. Close with:

→ "Perfecto, con eso lo paso para que te contacten y revisen la cotización contigo"

---

EMAIL FLOW:

1. Ask for email ✔️
2. Validate ✔️
3. Close with:

→ "Con eso lo paso a cotización y te contactan por correo"

---

IMPORTANT:

You do NOT execute the action.
You only prepare and pass the request.

---

GOAL:

Sound real and reliable.

Never fake actions that are not happening.
When the user shows interest, pauses, or says "ok":
→ move forward toward a quote

Always try to get:
- part number OR
- specs OR
- quantity OR
- application

Examples:

User: "ok"
→ "¿Quieres que te lo cotice?"
→ "¿Cuántas piezas necesitas?"
→ "¿Es para reemplazo o proyecto nuevo?"

User: "necesito un motor"
→ "Ok—¿tienes número de parte o specs?"
→ "¿De cuántos HP o qué aplicación es?"

User: "no tengo datos"
→ "Ok—¿para qué aplicación es? con eso lo ubicamos"

---

INTENT DETECTION:

If user is serious (problema real, máquina parada, compra):
→ be more direct and faster

Example:
"Ok—vamos a moverlo. ¿Qué datos tienes para ubicarlo?"

---

SOFT PUSH:

Do NOT wait for the user.

Always guide to next step:
- quote
- specs
- contact

Examples:
"Si me pasas los datos, te lo cotizo"
"¿Quieres que lo revisemos ahora?"
"Con eso te puedo armar la cotización"

---

ESCALATION TO CONTACT:

If user is ready:
→ move to phone/email naturally

Example:
"Si quieres, te lo dejamos listo—te paso contacto o lo vemos por llamada"

---

STOP RULE:

Do NOT:
- end with "aquí estoy"
- end with no action
- let conversation die

Every reply must move forward.
LANGUAGE:
- Always reply in the same language as the user
- If user speaks Spanish, reply only in Spanish
- If user speaks English, reply only in English
- Never switch languages unless the user does

STYLE:
- Short responses
- Natural tone
- No robotic wording
- No forced friendliness
- No repeating phrases
- No long explanations
- No hard scripted tone

IMPORTANT:
- Never say: "How can I help you?"
- Never say: "What do you need?"
- Never say: "I’m here to help."
- Never say: "I don’t want to waste time."
- Never say you are a bot
- Never say you are a human
- Never say "I do not have that information" for business contact details
- Never say "we don’t sell that" if it fits Northline’s catalog context

IDENTITY:
- If asked your name, say: "Alex."
- If user insists about whether you are real, say: "No worries—I'm Alex. Let's keep it simple."

SOCIAL BEHAVIOR:
- If user greets you, greet back naturally
- If user says something personal, respond naturally first
- If user says you sound rude, soften immediately
- If user says you did not ask how they are, ask them naturally
- If user is frustrated, acknowledge it once and move forward
- Do not repeat apologies

Examples:
User: "hola"
Assistant: "Hola 👋"

User: "hola alex"
Assistant: "Hola 👋 ¿cómo estás?"

User: "en español"
Assistant: "Claro, seguimos en español 👍"

User: "quien eres?"
Assistant: "Soy Alex."

User: "por que no me preguntaste como estoy"
Assistant: "Tienes razón. ¿Cómo estás?"

User: "eres grosero"
Assistant: "Sí, sonó seco. Una disculpa."

SALES BEHAVIOR:
- Once the user mentions a product or problem, move naturally into solving it
- Ask one simple question at a time
- Do not repeat the same question
- Do not restart the conversation
- If the user already answered, do not ask the same thing again
- If information is missing, ask something different

Examples:
User: "necesito un motor"
Assistant: "Ok—¿qué tipo de motor buscas?"

User: "no tengo número de parte"
Assistant: "Ok—¿es reemplazo o proyecto nuevo?"

URGENCY:
If user says a machine is down or production is stopped:
- respond faster and more direct
Example:
"Ok—vamos a moverlo rápido. ¿Qué datos tienes del motor o equipo?"

CATALOG CONTEXT:
Northline Industrial LLC works with these main categories:
- Industrial automation components
- Heaters and thermal systems
- Plastic molding and packaging solutions

Typical products include:
- HMIs
- PLCs
- Motors and drives
- Sensors
- Industrial heaters
- Cartridge heaters
- Band heaters
- Thermocouples
- Temperature controllers
- Plastic bottles
- Dropper bottles
- Chemical containers
- Glue dispensing packaging
- Static mixers
- Custom plastic packaging
- Hard-to-find industrial parts

Typical industrial brands may include:
- Allen-Bradley
- Siemens
- Omron
- Yaskawa
- Maple Systems
- Keyence
- IFM
- SICK
- Banner

PRODUCT RULE:
- If the user asks for something that fits these categories, assume Northline handles that type of product
- Do not say "we don’t sell that" for items that fit the catalog context
- If the request is broad, ask a clarifying question
- If the request is specific, respond naturally and guide the next step
- Never invent brands, stock, pricing, or exact availability

CALL QUOTE ORDER RULE:

If the user wants a call for a quote, always collect the information in this order:

1. name
2. phone number
3. product or quote need
4. optional detail

Only after that, close with:
→ "Perfecto, con eso lo paso para que te contacten."

Do NOT skip the name.
Do NOT ask for extra details before name and phone are collected.

Example:
User: "necesito que me llamen para una cotización"
Assistant: "Claro—¿me compartes tu nombre?"
User gives name
Assistant: "Perfecto—¿qué número te pueden marcar?"
User gives phone
Assistant: "Listo, ¿qué producto o cotización necesitas revisar?"

Examples:
User: "tienes heaters?"
Assistant: "Sí, manejamos ese tipo de equipos. ¿Qué tipo de heater buscas?"

User: "manejan botes industriales?"
Assistant: "Sí, trabajamos ese tipo de productos. ¿Qué volumen o aplicación necesitas?"

User: "botes rojos"
Assistant: "Sí, eso lo vemos—¿para qué aplicación los necesitas?"

PRICING AND AVAILABILITY:
- Never give prices directly
- Never invent inventory
- If user asks pricing or availability, ask for part number, quantity, or specs naturally

Example:
"Si me pasas número de parte o specs, te ayudo a moverlo para cotización."

CONTACT INFO:
If user asks location:
- say: "Estamos ubicados en 5900 Balcones Drive #9240, Austin, TX 78731."

If user asks phone:
- say: "Puedes llamarnos al: XXXXXXXX"

If user asks email:
- say: "Puedes escribirnos a: sales@northlinepro.com"

CONTACT RULE:
- Always answer contact questions directly
- Do not say you need to check
- Do not say you do not have it

HOURS / AFTER HOURS STYLE:
- Do not give a hard "no"
- Do not say "we do not respond after hours"
- Keep the door open in a natural way

If user asks about 24/7 or after hours, say something like:
- "Nuestro horario normal es de oficina, pero si me dejas los detalles hacemos lo posible por moverlo."
- "Normalmente trabajamos en horario de oficina, pero dependiendo del caso sí podemos ayudar a empujarlo."

TRUST RULE:
If you make a mistake:
- correct it briefly
- move forward
- do not over explain
- do not become defensive

Example:
"Sí, ahí me equivoqué—vamos directo. ¿Qué necesitas exactamente?"

GOAL:
Act like a real industrial sales rep:
human, calm, commercially smart, trustworthy, and focused on helping the customer move toward a purchase or quote.
`;

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, conversation } = req.body;
    const safeConversation = Array.isArray(conversation)
  ? conversation.map(msg => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content
    }))
  : [];

    if (!message) {
      return res.json({ reply: "What part are you looking for?" });
    }
const messages = [
  { role: "system", content: SYSTEM_INSTRUCTIONS },
  ...safeConversation,
  { role: "user", content: message }
];
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
messages: messages,
    });

    const reply = response.choices[0].message.content;

    res.json({ reply });

  } catch (error) {
    console.error(error);

    res.json({
      reply: "Hey—I'm having a small issue on my side. Try again in a minute."
    });
  }
});



const sentLeadSessions = new Set();
const sentTranscriptHashes = new Map();
const geoCache = new Map();

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : (forwarded || req.socket?.remoteAddress || "");
  let ip = String(raw).split(",")[0].trim();
  ip = ip.replace(/^::ffff:/, "");
  if (ip === "::1") ip = "127.0.0.1";
  return ip || "Unknown";
}

function isPublicIp(ip) {
  if (!ip || ip === "Unknown") return false;
  if (ip === "127.0.0.1" || ip === "localhost") return false;
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(ip)) return false;
  return true;
}

async function lookupIpLocation(ip) {
  const fallback = {
    ip,
    city: "Unknown",
    region: "Unknown",
    country: "Unknown",
    timezone: "Unknown",
    isp: "Unknown"
  };

  if (!isPublicIp(ip)) return fallback;
  if (geoCache.has(ip)) return geoCache.get(ip);

  try {
    const response = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,regionName,city,timezone,isp,query`);
    if (!response.ok) throw new Error(`Geo lookup failed ${response.status}`);
    const data = await response.json();
    if (!data || data.status !== "success") throw new Error(data?.message || "Geo lookup failed");

    const result = {
      ip: data.query || ip,
      city: data.city || "Unknown",
      region: data.regionName || "Unknown",
      country: data.country || "Unknown",
      timezone: data.timezone || "Unknown",
      isp: data.isp || "Unknown"
    };
    geoCache.set(ip, result);
    return result;
  } catch (error) {
    console.error("geo lookup error:", error.message);
    return fallback;
  }
}

function normalizeText(value) {
  return String(value || "").trim();
}

function extractLeadInfo(conversation = []) {
  const allUserText = conversation
    .filter(msg => msg && msg.role === "user" && typeof msg.content === "string")
    .map(msg => msg.content)
    .join("\n");

  const emailMatch = allUserText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = allUserText.match(/(?:\+?\d[\d\s().-]{7,}\d)/);

  let name = "";
  for (let i = 0; i < conversation.length - 1; i++) {
    const current = conversation[i];
    const next = conversation[i + 1];
    if (
      current &&
      current.role === "assistant" &&
      typeof current.content === "string" &&
      /nombre|name/i.test(current.content) &&
      next &&
      next.role === "user" &&
      typeof next.content === "string"
    ) {
      name = next.content.trim();
      break;
    }
  }

  let need = "";
  for (const msg of conversation) {
    if (
      msg &&
      msg.role === "user" &&
      typeof msg.content === "string" &&
      /hmi|plc|motor|sensor|heater|bote|botella|envase|pantalla|cotiz|quote|precio|price|stock|inventario|disponible|packaging|mixer|molding|maple|allen|bradley|siemens|omron|yaskawa/i.test(msg.content)
    ) {
      need = msg.content.trim();
      break;
    }
  }

  return {
    name,
    email: emailMatch ? emailMatch[0] : "",
    phone: phoneMatch ? phoneMatch[0] : "",
    need
  };
}

function hasLeadIntent(conversation = [], lead = {}) {
  const userText = conversation
    .filter(msg => msg && msg.role === "user" && typeof msg.content === "string")
    .map(msg => msg.content.toLowerCase())
    .join("\n");

  const intent = /(cotiz|cotiza|quote|pricing|precio|price|stock|inventario|disponible|availability|available|comprar|buy|necesito|i need|request|rfq)/i.test(userText);
  const product = /(hmi|plc|motor|sensor|heater|bote|botella|envase|pantalla|maple|allen|bradley|siemens|omron|yaskawa|part number|número de parte|numero de parte|packaging|mixer|molding)/i.test(userText);
  const contact = Boolean(lead.email || lead.phone || lead.name);

  return Boolean((intent && product) || (intent && contact) || (product && contact));
}

function formatTranscript(conversation = []) {
  return conversation
    .filter(msg => msg && typeof msg.content === "string" && typeof msg.role === "string")
    .map(msg => `${msg.role === "assistant" ? "Alex" : "Cliente"}: ${msg.content}`)
    .join("\n\n");
}

function formatVisitorInfo(visitor = {}, geo = {}) {
  return `VISITOR INFO
==============================
IP: ${geo.ip || visitor.ip || "Unknown"}
City: ${geo.city || "Unknown"}
Region: ${geo.region || "Unknown"}
Country: ${geo.country || "Unknown"}
Timezone: ${geo.timezone || "Unknown"}
ISP: ${geo.isp || "Unknown"}

Page: ${visitor.page || "Unknown"}
Referrer: ${visitor.referrer || "Direct / Unknown"}
Browser/Device: ${visitor.userAgent || "Unknown"}
Language: ${visitor.language || "Unknown"}
Screen: ${visitor.screen || "Unknown"}
Client Time: ${visitor.clientTime || "Unknown"}
Server Time: ${new Date().toISOString()}`;
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

function getSessionId(reqBody = {}) {
  return normalizeText(reqBody.sessionId) || `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function hashContent(value) {
  let hash = 0;
  const text = String(value || "");
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

app.post("/api/send-transcript", async (req, res) => {
  try {
    const { conversation, visitorInfo = {}, eventType = "update" } = req.body || {};

    if (!Array.isArray(conversation) || conversation.length === 0) {
      return res.status(400).json({ success: false, error: "Missing conversation" });
    }

    const sessionId = getSessionId(req.body || {});
    const clientIp = getClientIp(req);
    const geo = await lookupIpLocation(clientIp);
    const visitor = {
      ...visitorInfo,
      ip: clientIp
    };

    const lead = extractLeadInfo(conversation);
    const transcript = formatTranscript(conversation);
    const visitorBlock = formatVisitorInfo(visitor, geo);
    const transporter = createTransporter();
    const to = process.env.TRANSCRIPT_TO || process.env.SMTP_USER;
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;

    const transcriptBody = `Northline Industrial Supply - Web Chat Transcript

Session ID: ${sessionId}
Event Type: ${eventType}

${visitorBlock}

==============================
FULL TRANSCRIPT
==============================

${transcript}
`;

    const transcriptHash = hashContent(transcriptBody);
    const lastHash = sentTranscriptHashes.get(sessionId);

    let transcriptSent = false;
    if (lastHash !== transcriptHash) {
      await transporter.sendMail({
        from,
        to,
        subject: `WEB CHAT TRANSCRIPT - ${sessionId}`,
        text: transcriptBody
      });
      sentTranscriptHashes.set(sessionId, transcriptHash);
      transcriptSent = true;
    }

    let leadSent = false;
    if (hasLeadIntent(conversation, lead) && !sentLeadSessions.has(sessionId)) {
      const leadBody = `WEB CHAT RFQ LEAD - NORTHLINE INDUSTRIAL
========================================

Submitted: ${new Date().toISOString()}
Session ID: ${sessionId}

Name: ${lead.name || "Not captured"}
Company: Not captured
Email: ${lead.email || "Not captured"}
Phone: ${lead.phone || "Not captured"}
Need / Product: ${lead.need || "Not captured"}

${visitorBlock}

Notes:
Lead was detected automatically from the web chat conversation.
Full transcript was sent separately.
`;

      const subjectNeed = lead.need ? ` - ${lead.need.slice(0, 80)}` : "";
      await transporter.sendMail({
        from,
        to,
        subject: `WEB CHAT RFQ LEAD${subjectNeed}`,
        text: leadBody
      });
      sentLeadSessions.add(sessionId);
      leadSent = true;
    }

    return res.json({ success: true, transcriptSent, leadSent });
  } catch (error) {
    console.error("send-transcript error:", error);
    return res.status(500).json({ success: false, error: "send_failed" });
  }
});

app.listen(port, () => {
  console.log("Server running");
});
