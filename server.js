import express from "express";
import cors from "cors";
import OpenAI from "openai";
import nodemailer from "nodemailer";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.text({ type: "text/plain", limit: "1mb" }));

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
      /hmi|plc|motor|sensor|heater|heater|botes|botes industriales|pantalla|cotiz|quote|packaging|mixer|molding/i.test(msg.content)
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


function getPayload(req) {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      return {};
    }
  }
  return req.body || {};
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : (forwarded || req.socket?.remoteAddress || "");
  return String(raw).split(",")[0].trim().replace(/^::ffff:/, "");
}

async function getGeoInfo(ip) {
  const empty = {
    ip: ip || "Not available",
    city: "Not available",
    region: "Not available",
    country: "Not available",
    timezone: "Not available"
  };

  if (!ip || ip === "::1" || ip === "127.0.0.1" || ip.startsWith("10.") || ip.startsWith("192.168.")) {
    return empty;
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,regionName,city,timezone,query`);
    if (!response.ok) return empty;
    const data = await response.json();
    if (!data || data.status !== "success") return empty;
    return {
      ip: data.query || ip,
      city: data.city || "Not available",
      region: data.regionName || "Not available",
      country: data.country || "Not available",
      timezone: data.timezone || "Not available"
    };
  } catch (error) {
    return empty;
  }
}

function formatVisitorInfo(visitor = {}, geo = {}) {
  return `==============================
VISITOR INFO
==============================

IP: ${geo.ip || "Not available"}
City: ${geo.city || "Not available"}
Region: ${geo.region || "Not available"}
Country: ${geo.country || "Not available"}
Timezone: ${geo.timezone || "Not available"}

Page: ${visitor.page || "Not available"}
Referrer: ${visitor.referrer || "Not available"}
Language: ${visitor.language || "Not available"}
Screen: ${visitor.screen || "Not available"}
User Agent: ${visitor.userAgent || "Not available"}
Timestamp: ${visitor.timestamp || new Date().toISOString()}
Event: ${visitor.event || "Not available"}`;
}

function hasLeadIntent(conversation = []) {
  const userText = conversation
    .filter(msg => msg && msg.role === "user" && typeof msg.content === "string")
    .map(msg => msg.content)
    .join("\n")
    .toLowerCase();

  const intent = /(cotiz|quote|precio|price|cost|compr|buy|purchase|stock|inventario|available|availability|disponible|necesito|need|requiero|pantalla|hmi|plc|motor|sensor|heater|maple|allen|siemens|omron|yaskawa|qty|cantidad|piezas|pieces)/i.test(userText);
  return intent;
}

app.post("/api/send-transcript", async (req, res) => {
  try {
    const payload = getPayload(req);
    const { conversation, visitor } = payload || {};

    if (!Array.isArray(conversation) || conversation.length === 0) {
      return res.status(400).json({ success: false, error: "Missing conversation" });
    }

    const lead = extractLeadInfo(conversation);
    const clientIp = getClientIp(req);
    const geo = await getGeoInfo(clientIp);
    const visitorInfo = formatVisitorInfo(visitor || {}, geo);

    const transcript = conversation
      .filter(msg => msg && typeof msg.content === "string" && typeof msg.role === "string")
      .map(msg => `${msg.role === "assistant" ? "Alex" : "Cliente"}: ${msg.content}`)
      .join("\n\n");

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const transcriptText = `Northline Chat Transcript

${visitorInfo}

==============================
TRANSCRIPT COMPLETO
==============================

${transcript}
`;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.TRANSCRIPT_TO || process.env.SMTP_USER,
      subject: `Northline Chat Transcript | ${geo.city || "Unknown"} | ${visitor?.page || "Website"}`,
      text: transcriptText
    });

    let leadSent = false;
    if (hasLeadIntent(conversation)) {
      const leadText = `Northline RFQ Lead

Nombre: ${lead.name || "No capturado"}
Telefono: ${lead.phone || "No capturado"}
Correo: ${lead.email || "No capturado"}
Necesidad: ${lead.need || "No capturada"}

${visitorInfo}
`;

      const subjectNeed = lead.need ? ` | ${lead.need.slice(0, 80)}` : "";
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: process.env.TRANSCRIPT_TO || process.env.SMTP_USER,
        subject: `Northline RFQ Lead${subjectNeed}`,
        text: leadText
      });
      leadSent = true;
    }

    return res.json({ success: true, leadSent });
  } catch (error) {
    console.error("send-transcript error:", error);
    return res.status(500).json({ success: false, error: "send_failed" });
  }
});

app.listen(port, () => {
  console.log("Server running");
});
