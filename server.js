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

async function sendResendEmail({ subject, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }

  const from = process.env.RESEND_FROM || "Northline Chat <sales@northlinepro.com>";
  const to = process.env.TRANSCRIPT_TO || "sales@northlinepro.com";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text
    })
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`Resend API error ${response.status}: ${responseText}`);
  }

  console.log("Resend email sent:", subject);
  return responseText;
}

app.post("/api/send-transcript", async (req, res) => {
  try {
    const body = parseRequestBody(req.body || {});
    const conversation = Array.isArray(body.conversation) ? body.conversation : [];

    if (conversation.length === 0) {
      console.log("send-transcript skipped: empty conversation");
      return res.json({ success: true, skipped: true, reason: "empty_conversation" });
    }

    const lead = extractLeadInfo(conversation);
    const transcript = formatTranscript(conversation);
    const visitorInfo = await buildVisitorInfo(req, body.visitor || body.visitorInfo || {});
    const timestamp = new Date().toISOString();

    // EMAIL 1: Full transcript / audit copy. Always sent when there is a real conversation.
    await sendResendEmail({
      subject: `Northline Chat Transcript - ${timestamp}`,
      text: `${visitorInfo}

==============================
LEAD INFO
==============================
Nombre: ${lead.name || "No capturado"}
Telefono: ${lead.phone || "No capturado"}
Correo: ${lead.email || "No capturado"}
Necesidad: ${lead.need || "No capturada"}

==============================
TRANSCRIPT COMPLETO
==============================

${transcript}`
    });

    // EMAIL 2: Clean RFQ / lead copy. No transcript here.
    let leadSent = false;
    if (hasLeadIntent(conversation, lead)) {
      const userText = conversation
        .filter(msg => msg && msg.role === "user" && typeof msg.content === "string")
        .map(msg => msg.content)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      const assistantText = conversation
        .filter(msg => msg && msg.role === "assistant" && typeof msg.content === "string")
        .map(msg => msg.content)
        .join("\n")
        .replace(/\s+/g, " ")
        .trim();

      const combinedText = `${userText} ${assistantText}`.replace(/\s+/g, " ").trim();

      const emailMatch = combinedText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
      const phoneMatch = combinedText.match(/(?:\+?\d[\d\s().-]{7,}\d)/);

      function titleCaseName(value = "") {
        return value
          .trim()
          .replace(/\s+/g, " ")
          .split(" ")
          .filter(Boolean)
          .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(" ");
      }

      function cleanField(value = "") {
        return value
          .replace(/\s+(mi|my|correo|email|empresa|company|telefono|teléfono|phone|requiero|necesito|cantidad|qty|producto|productos|los productos).*$/i, "")
          .replace(/[.;,]+$/g, "")
          .trim();
      }

      let cleanName = lead.name || "";
      const namePatterns = [
        /(?:tu nombre|nombre)\s*[:\-]\s*([a-záéíóúüñ]+(?:\s+[a-záéíóúüñ]+){0,3})/i,
        /(?:mi nombre es|nombre es|soy|me llamo)\s+([a-záéíóúüñ]+(?:\s+[a-záéíóúüñ]+){0,3})/i,
        /(?:name is|my name is|i am)\s+([a-z]+(?:\s+[a-z]+){0,3})/i
      ];

      for (const pattern of namePatterns) {
        const match = combinedText.match(pattern);
        if (match && match[1]) {
          cleanName = cleanField(match[1]);
          break;
        }
      }

      cleanName = cleanName ? titleCaseName(cleanName) : "";

      let company = "";
      const companyPatterns = [
        /(?:empresa)\s*[:\-]\s*([a-z0-9&.\- ]{1,40})/i,
        /(?:mi empresa es|empresa es|compañ[ií]a es|company is)\s+([a-z0-9&.\- ]{1,40})/i,
        /(?:company)\s*[:\-]\s*([a-z0-9&.\- ]{1,40})/i
      ];

      for (const pattern of companyPatterns) {
        const match = combinedText.match(pattern);
        if (match && match[1]) {
          company = cleanField(match[1]);
          break;
        }
      }

      company = company
        ? company
            .split(/\s+/)
            .map(part => part.length <= 3 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join(" ")
        : "";

      function normalizeProductName(raw = "") {
        let value = raw
          .replace(/\s+/g, " ")
          .replace(/[.;]+$/g, "")
          .replace(/\by\b$/i, "")
          .trim();

        value = value
          .replace(/\bhmi\s*[- ]?\s*5070b\b/i, "HMI 5070B")
          .replace(/\bhmi5070b\b/i, "HMI 5070B")
          .replace(/\bplc\b/ig, "PLC")
          .replace(/\bhmi\b/ig, "HMI")
          .replace(/\ballen[\s-]?bradley\b/ig, "Allen-Bradley")
          .replace(/\bdayton\b/ig, "Dayton");

        return value.trim();
      }

      function normalizeQuantity(qty = "", unit = "") {
        const n = String(qty || "").trim();
        if (!n) return "";
        const u = String(unit || "").trim().toLowerCase();

        if (/pza|pzas|pieza|piezas|pc|pcs/.test(u)) {
          return `${n} pieza${n === "1" ? "" : "s"}`;
        }

        return `${n} pieza${n === "1" ? "" : "s"}`;
      }

      function addProduct(products, name, qty = "", unit = "") {
        const clean = normalizeProductName(name);
        if (!clean || clean.length < 2) return;

        const blocked = /^(mi|my|correo|email|empresa|company|telefono|teléfono|phone|nombre|name|requiero|necesito|cantidad|qty)$/i;
        if (blocked.test(clean)) return;

        const quantity = normalizeQuantity(qty, unit);
        const key = clean.toLowerCase();

        const existing = products.find(p => p.name.toLowerCase() === key);
        if (existing) {
          if (quantity) existing.quantity = quantity;
          return;
        }

        products.push({ name: clean, quantity });
      }

      function parseProductsFromText(text = "") {
        const products = [];
        const source = text.replace(/\s+/g, " ").trim();

        // Prefer Alex's structured summary when available:
        // "Los productos: pantalla HMI5070B, 2 PLC Allen-Bradley 45H434H y un motor Dayton."
        const summaryMatch =
          source.match(/(?:los productos|productos|producto)\s*[:\-]\s*([^.\n]+?)(?:\.|$)/i) ||
          source.match(/(?:producto|product)\s*[:\-]\s*([^.\n]+?)(?:\.|$)/i);

        const productSegment = summaryMatch && summaryMatch[1] ? summaryMatch[1] : source;

        const normalizedSegment = productSegment
          .replace(/\s+y\s+/gi, ", ")
          .replace(/\s+and\s+/gi, ", ");

        const parts = normalizedSegment
          .split(",")
          .map(x => x.trim())
          .filter(Boolean);

        for (const part of parts) {
          let m;

          m = part.match(/^(?:una|un|la|el)?\s*(pantalla\s+)?(hmi\s*[- ]?\s*5070b|hmi5070b)\b/i);
          if (m) {
            addProduct(products, "HMI 5070B", "1", "pieza");
            continue;
          }

          m = part.match(/^(\d+)\s*(pza|pzas|pieza|piezas|pc|pcs)?\s*(plc\s+allen[\s-]?bradley\s+[a-z0-9\-\/]+|plc\s+[a-z0-9\-\/ ]+|allen[\s-]?bradley\s+[a-z0-9\-\/]+)/i);
          if (m) {
            addProduct(products, m[3], m[1], m[2]);
            continue;
          }

          m = part.match(/^(?:un|una|el|la)?\s*(motor\s+dayton|dayton\s+motor|motor\s+[a-z0-9\-\/ ]+)/i);
          if (m) {
            addProduct(products, m[1], "1", "pieza");
            continue;
          }

          m = part.match(/^(\d+)\s*(pza|pzas|pieza|piezas|pc|pcs)?\s*([a-z0-9][a-z0-9\-\/ ]{2,60})/i);
          if (m) {
            addProduct(products, m[3], m[1], m[2]);
            continue;
          }
        }

        // Safety scan across full text for known patterns even if list parsing missed them.
        const full = source;
        const hmiMatches = full.match(/\b(?:pantalla\s+)?(?:hmi\s*[- ]?\s*5070b|hmi5070b)\b/ig) || [];
        if (hmiMatches.length) {
          const qtyNearHmi = full.match(/(?:requiero|necesito|cantidad)?\s*(\d+)\s*(pza|pzas|pieza|piezas|pc|pcs)?\s*(?:de\s+)?(?:pantalla\s+)?(?:hmi\s*[- ]?\s*5070b|hmi5070b)/i);
          addProduct(products, "HMI 5070B", qtyNearHmi ? qtyNearHmi[1] : "1", qtyNearHmi ? qtyNearHmi[2] : "pieza");
        }

        const plcMatches = [...full.matchAll(/\b(\d+)?\s*(pza|pzas|pieza|piezas|pc|pcs)?\s*(PLC\s+Allen[\s-]?Bradley\s+[A-Z0-9\-\/]+|PLC\s+[A-Z0-9\-\/]+|Allen[\s-]?Bradley\s+[A-Z0-9\-\/]+)/ig)];
        for (const m of plcMatches) {
          addProduct(products, m[3], m[1] || "1", m[2] || "pieza");
        }

        const motorMatches = [...full.matchAll(/\b(?:un|una|1)?\s*(motor\s+Dayton|Dayton\s+motor)\b/ig)];
        for (const m of motorMatches) {
          addProduct(products, m[1], "1", "pieza");
        }

        return products;
      }

      const products = parseProductsFromText(assistantText || userText);
      if (products.length === 0) {
        const fallbackProduct = lead.need ? lead.need : "";
        if (fallbackProduct) addProduct(products, fallbackProduct, "", "");
      }

      const productLines = products.length
        ? products.map(p => `- ${p.name}${p.quantity ? ` (${p.quantity})` : ""}`).join("\n")
        : "- No capturado";

      const notes = products.length
        ? `Cliente solicita cotización de ${products.map(p => `${p.name}${p.quantity ? ` (${p.quantity})` : ""}`).join(", ")}.`
        : "Cliente solicita cotización.";

      const cleanEmail = emailMatch ? emailMatch[0] : (lead.email || "");
      const cleanPhone = phoneMatch ? phoneMatch[0].trim() : (lead.phone || "");

      const visitorLines = visitorInfo.split("\n");
      const ipLine = visitorLines.find(line => line.startsWith("IP:")) || "IP: Not captured";
      const cityLine = visitorLines.find(line => line.startsWith("City:")) || "City: Not captured";

      await sendResendEmail({
        subject: `Northline RFQ Request${products.length ? " | " + products[0].name : ""}`,
        text: `NORTHLINE RFQ REQUEST
==============================

Nombre: ${cleanName || "No capturado"}
Correo: ${cleanEmail || "No capturado"}
Teléfono: ${cleanPhone || "No capturado"}
Empresa: ${company || "No capturado"}
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

    return res.json({ success: true, transcriptSent: true, leadSent });
  } catch (error) {
    console.error("send-transcript error:", error);
    return res.status(500).json({ success: false, error: "send_failed", detail: error.message });
  }
});



app.listen(port, () => {
  console.log("Server running");
});
