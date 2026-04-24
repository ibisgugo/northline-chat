import express from "express";
import cors from "cors";
import OpenAI from "openai";

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

---

RFQ CONFIRMATION FORMAT RULE (CRITICAL):

When the user provides enough information for a quote request in one message or across the conversation, especially:
- name
- email
- phone
- company
- product(s)
- quantity

you MUST reply with this consistent structure and no extra variation:

"Perfecto, tengo tus datos:

- Nombre: [name or "No capturado"]
- Correo: [email or "No capturado"]
- Teléfono: [phone or "No capturado"]
- Empresa: [company or "No capturada"]
- Productos:
  - [product 1] ([quantity if available])
  - [product 2] ([quantity if available])

Con eso lo paso a cotización para que te contacten por correo."

Rules:
- Do not only say "tengo tus datos" without listing the captured fields.
- Do not omit company if the user provided it.
- Do not omit phone or email if the user provided them.
- If there are multiple products, list each one on its own line.
- Keep the reply short.
- Do not say you sent the quote.
- Do not say you emailed the customer.
- Do not say you will call.
- Say only that the information will be passed to the quote team.
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



function buildReadableId(prefix) {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${prefix}-${yyyy}${mm}${dd}-${hh}${min}${ss}`;
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return (req.headers["x-real-ip"] || req.socket?.remoteAddress || "").toString();
}

function formatTranscript(conversation = []) {
  return conversation
    .filter(msg => msg && typeof msg.content === "string" && typeof msg.role === "string")
    .map(msg => `${msg.role === "assistant" ? "Alex" : "Cliente"}: ${msg.content}`)
    .join("\n\n");
}

function hasLeadIntent(conversation = [], lead = {}) {
  const text = conversation
    .filter(msg => msg && typeof msg.content === "string")
    .map(msg => msg.content)
    .join("\n")
    .toLowerCase();

  return Boolean(
    lead.need ||
    lead.email ||
    lead.phone ||
    /cotiz|quote|precio|price|stock|disponible|inventario|compr|necesito|pantalla|hmi|plc|motor|sensor|heater|maple|cantidad|qty|rfq/.test(text)
  );
}

function parseRequestBody(rawBody = {}) {
  if (typeof rawBody === "string") {
    try {
      return JSON.parse(rawBody);
    } catch {
      return {};
    }
  }
  return rawBody && typeof rawBody === "object" ? rawBody : {};
}

function cleanIp(ip = "") {
  return String(ip || "")
    .split(",")[0]
    .trim()
    .replace("::ffff:", "");
}

async function getGeoFromIp(ip = "") {
  const safeIp = cleanIp(ip);
  if (!safeIp || safeIp === "::1" || safeIp === "127.0.0.1") {
    return {
      city: "Not captured",
      region: "Not captured",
      country: "Not captured",
      timezone: "Not captured",
      org: "Not captured"
    };
  }

  try {
    const response = await fetch(`https://ipapi.co/${encodeURIComponent(safeIp)}/json/`, {
      headers: { "User-Agent": "NorthlineChat/1.0" }
    });

    if (!response.ok) {
      throw new Error(`Geo lookup failed ${response.status}`);
    }

    const data = await response.json();

    return {
      city: data.city || "Not captured",
      region: data.region || data.region_code || "Not captured",
      country: data.country_name || data.country || "Not captured",
      timezone: data.timezone || "Not captured",
      org: data.org || data.asn || "Not captured"
    };
  } catch (error) {
    console.warn("Geo lookup skipped:", error.message);
    return {
      city: "Not captured",
      region: "Not captured",
      country: "Not captured",
      timezone: "Not captured",
      org: "Not captured"
    };
  }
}

async function buildVisitorInfo(req, visitor = {}) {
  const ip = cleanIp(getClientIp(req));
  const geo = await getGeoFromIp(ip);

  return `VISITOR INFO
==============================
IP: ${ip || "Not captured"}
City: ${geo.city}
Region: ${geo.region}
Country: ${geo.country}
Timezone: ${geo.timezone}
Network / ISP: ${geo.org}
Page: ${visitor?.page || visitor?.url || "Not captured"}
Referrer: ${visitor?.referrer || "Not captured"}
Device / Browser: ${visitor?.userAgent || req.headers["user-agent"] || "Not captured"}
Language: ${visitor?.language || req.headers["accept-language"] || "Not captured"}
Screen: ${visitor?.screen || "Not captured"}
Event: ${visitor?.event || "Not captured"}
Server Timestamp: ${new Date().toISOString()}
Client Timestamp: ${visitor?.timestamp || "Not captured"}`;
}

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function buildRawEmail({ from, to, subject, text }) {
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`;
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    text
  ].join("\r\n");

  return base64UrlEncode(message);
}

async function getGoogleAccessToken() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_REFRESH_TOKEN");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    })
  });

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    throw new Error(`Google token error ${response.status}: ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

async function sendResendEmail({ subject, text }) {
  const fromEmail = process.env.GMAIL_FROM || "sales@northlinepro.com";
  const fromName = process.env.GMAIL_FROM_NAME || "Northline";
  const from = `${fromName} <${fromEmail}>`;
  const to = process.env.TRANSCRIPT_TO || "sales@northlinepro.com";

  const accessToken = await getGoogleAccessToken();

  const raw = buildRawEmail({
    from,
    to,
    subject,
    text
  });

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ raw })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Gmail API send error ${response.status}: ${JSON.stringify(data)}`);
  }

  console.log("Gmail API email sent:", subject, data.id || "");
  return data;
}


async function extractRfqStructured(conversation = []) {
  const text = conversation
    .filter(m => m && typeof m.content === "string")
    .map(m => `${m.role === "assistant" ? "Alex" : "Cliente"}: ${m.content}`)
    .join("\n");

  try {
    const r = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Extract clean RFQ data from this industrial sales chat. Return only JSON with:
{"has_rfq":boolean,"name":"","email":"","phone":"","company":"","products":[{"name":"","quantity":""}],"notes":""}
Rules: capture all products; use Alex summary if available; normalize HMI5070B to HMI 5070B; preserve part numbers; if quantity missing use "1 pieza"; notes must be one short Spanish sentence; do not include transcript.`
        },
        { role: "user", content: text }
      ]
    });
    const p = JSON.parse(r.choices?.[0]?.message?.content || "{}");
    return {
      has_rfq: !!p.has_rfq,
      name: typeof p.name === "string" ? p.name.trim() : "",
      email: typeof p.email === "string" ? p.email.trim() : "",
      phone: typeof p.phone === "string" ? p.phone.trim() : "",
      company: typeof p.company === "string" ? p.company.trim() : "",
      products: Array.isArray(p.products) ? p.products.filter(x => x && x.name).map(x => ({
        name: String(x.name).trim(),
        quantity: x.quantity ? String(x.quantity).trim() : "1 pieza"
      })) : [],
      notes: typeof p.notes === "string" ? p.notes.trim() : ""
    };
  } catch (e) {
    console.warn("RFQ AI extraction failed:", e.message);
    return fallbackRfqExtraction(conversation);
  }
}

function fallbackRfqExtraction(conversation = []) {
  const text = conversation
    .filter(m => m && typeof m.content === "string")
    .map(m => m.content)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  const email = (text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [""])[0];
  const phone = ((text.match(/(?:\+?\d[\d\s().-]{7,}\d)/) || [""])[0] || "").trim();

  let name = "";
  const nm = text.match(/(?:mi nombre es|nombre es|soy|me llamo)\s+([a-záéíóúüñ]+(?:\s+[a-záéíóúüñ]+){0,3})/i);
  if (nm) name = nm[1].replace(/\s+(mi|correo|email|empresa|telefono|teléfono|requiero|necesito).*$/i, "").trim();

  let company = "";
  const cm = text.match(/(?:mi empresa es|empresa es|company is)\s+([a-z0-9&.\- ]{1,40})/i);
  if (cm) company = cm[1].replace(/\s+(mi|correo|email|telefono|teléfono|requiero|necesito).*$/i, "").trim();

  const products = [];
  const add = (name, qty="1 pieza") => {
    name = String(name || "").replace(/\s+/g, " ").trim();
    if (name && !products.some(p => p.name.toLowerCase() === name.toLowerCase())) products.push({ name, quantity: qty });
  };

  const hmi = text.match(/(\d+)?\s*(?:pza|pzas|pieza|piezas|pc|pcs)?\s*(?:pantalla\s+)?(?:hmi\s*[- ]?\s*5070b|hmi5070b)/i);
  if (hmi) add("HMI 5070B", `${hmi[1] || "1"} pieza${(hmi[1] || "1") === "1" ? "" : "s"}`);

  for (const m of text.matchAll(/(\d+)?\s*(?:pza|pzas|pieza|piezas|pc|pcs)?\s*(?:PLC\s+)?Allen[\s-]?Bradley\s+([A-Z0-9\-\/]+)/ig)) {
    add(`PLC Allen-Bradley ${m[2]}`, `${m[1] || "1"} pieza${(m[1] || "1") === "1" ? "" : "s"}`);
  }

  if (/motor\s+dayton|dayton\s+motor/i.test(text)) add("Motor Dayton", "1 pieza");

  return {
    has_rfq: !!(email || phone || products.length),
    name, email, phone, company, products,
    notes: products.length ? `Cliente solicita cotización de ${products.map(p => `${p.name} (${p.quantity})`).join(", ")}.` : "Cliente solicita cotización."
  };
}

app.post("/api/send-transcript", async (req, res) => {
  try {
    const body = parseRequestBody(req.body || {});
    const conversation = Array.isArray(body.conversation) ? body.conversation : [];

    if (conversation.length === 0) {
      console.log("send-transcript skipped: empty conversation");
      return res.json({ success: true, skipped: true, reason: "empty_conversation" });
    }

    const emailId = buildReadableId("NL");
    const lead = extractLeadInfo(conversation);
    const rfq = await extractRfqStructured(conversation);
    const transcript = formatTranscript(conversation);
    const visitorInfo = await buildVisitorInfo(req, body.visitor || body.visitorInfo || {});

    await sendResendEmail({
      subject: `${emailId} | TRANSCRIPT`,
      text: `${visitorInfo}

==============================
LEAD INFO
==============================
ID: ${emailId}
Nombre: ${rfq.name || lead.name || "No capturado"}
Telefono: ${rfq.phone || lead.phone || "No capturado"}
Correo: ${rfq.email || lead.email || "No capturado"}
Necesidad: ${lead.need || "No capturada"}

==============================
TRANSCRIPT COMPLETO
==============================

${transcript}`
    });

    let leadSent = false;
    if (rfq.has_rfq || hasLeadIntent(conversation, lead)) {
      const products = Array.isArray(rfq.products) ? rfq.products : [];
      const productLines = products.length
        ? products.map(p => `- ${p.name}${p.quantity ? ` (${p.quantity})` : ""}`).join("\n")
        : "- No capturado";

      const notes = rfq.notes || "Cliente solicita cotización.";
      const visitorLines = visitorInfo.split("\n");
      const ipLine = visitorLines.find(line => line.startsWith("IP:")) || "IP: Not captured";
      const cityLine = visitorLines.find(line => line.startsWith("City:")) || "City: Not captured";

      await sendResendEmail({
        subject: `${emailId} | RFQ${products.length ? " | " + products[0].name : ""}`,
        text: `NORTHLINE RFQ REQUEST
==============================

ID: ${emailId}
Nombre: ${rfq.name || lead.name || "No capturado"}
Correo: ${rfq.email || lead.email || "No capturado"}
Teléfono: ${rfq.phone || lead.phone || "No capturado"}
Empresa: ${rfq.company || "No capturado"}
Producto(s):
${productLines}

------------------------------

Notas:
${notes}

------------------------------

VISITOR INFO
==============================
${ipLine}
${cityLine}`
      });
      leadSent = true;
    }

    return res.json({ success: true, transcriptSent: true, leadSent, id: emailId });
  } catch (error) {
    console.error("send-transcript error:", error);
    return res.status(500).json({ success: false, error: "send_failed", detail: error.message });
  }
});




app.get("/api/google-debug", (req, res) => {
  res.json({
    ok: true,
    googleConfigVisible: {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "present" : "missing",
      GOOGLE_CLIENT_SECRET: Boolean(process.env.GOOGLE_CLIENT_SECRET),
      GOOGLE_REFRESH_TOKEN: Boolean(process.env.GOOGLE_REFRESH_TOKEN),
      GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || "missing",
      GMAIL_FROM: process.env.GMAIL_FROM || "missing",
      GMAIL_FROM_NAME: process.env.GMAIL_FROM_NAME || "Northline",
      TRANSCRIPT_TO: process.env.TRANSCRIPT_TO || "missing"
    },
    timestamp: new Date().toISOString()
  });
});

app.get("/api/google-auth-url", (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return res.status(500).json({
      success: false,
      error: "missing_google_oauth_config",
      required: ["GOOGLE_CLIENT_ID", "GOOGLE_REDIRECT_URI"]
    });
  }

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "https://www.googleapis.com/auth/gmail.send");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");

  res.json({ success: true, authUrl: url.toString() });
});

app.get("/api/google-callback", async (req, res) => {
  try {
    const code = req.query.code;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!code) {
      return res.status(400).send("Missing code");
    }

    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(500).send("Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_REDIRECT_URI");
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: String(code),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return res.status(500).send(`<pre>Google token error:\n${JSON.stringify(tokenData, null, 2)}</pre>`);
    }

    const refreshToken = tokenData.refresh_token || "";

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(`<!doctype html>
<html>
<head><title>Northline Google Token</title></head>
<body style="font-family:Arial;padding:24px;line-height:1.5">
<h2>Google authorization completed</h2>
<p>Copy this value into Railway as <b>GOOGLE_REFRESH_TOKEN</b>:</p>
<textarea style="width:100%;height:120px;font-family:monospace">${refreshToken}</textarea>
<p>If the box is empty, open <code>/api/google-auth-url</code> again and authorize with prompt=consent.</p>
</body>
</html>`);
  } catch (error) {
    console.error("google-callback error:", error);
    res.status(500).send(`<pre>${error.message}</pre>`);
  }
});

app.get("/api/email-test", async (req, res) => {
  try {
    const id = buildReadableId("TEST");
    await sendResendEmail({
      subject: `${id} | GMAIL API TEST`,
      text: `NORTHLINE GMAIL API TEST
==============================

ID: ${id}
Transport: Gmail API HTTPS
Timestamp: ${new Date().toISOString()}`
    });
    res.json({ success: true, emailSent: true, id });
  } catch (error) {
    console.error("email-test error:", error);
    res.status(500).json({ success: false, error: "email_test_failed", detail: error.message });
  }
});


app.listen(port, () => {
  console.log("Server running");
});
