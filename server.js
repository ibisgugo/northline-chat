import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_INSTRUCTIONS = `PRESERVED PROMPT - NOT MODIFIED`;

app.post("/api/chat", async (req, res) => {
  try {
    const { message, conversation = [] } = req.body;
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTIONS },
        ...conversation,
        { role: "user", content: message }
      ],
    });
    res.json({ reply: response.choices[0].message.content });
  } catch (e) {
    res.json({ reply: "error" });
  }
});

function getClientIp(req) {
  return req.headers["x-forwarded-for"] || req.socket.remoteAddress;
}

function extractLead(conversation = []) {
  const text = conversation.map(x => x.content).join(" ").toLowerCase();

  const email = text.match(/[\w.-]+@[\w.-]+\.[a-z]{2,}/)?.[0] || "";
  const phone = text.match(/\d{7,}/)?.[0] || "";
  const name = text.includes("nombre") ? text.split("nombre")[1]?.split(" ")[1] : "";

  return { name, email, phone, text };
}

async function sendEmail(subject, text) {
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM,
      to: [process.env.TRANSCRIPT_TO],
      subject,
      text
    })
  });
}

app.post("/api/send-transcript", async (req, res) => {
  try {
    const { conversation = [] } = req.body;

    const ip = getClientIp(req);
    const lead = extractLead(conversation);

    // RFQ limpio
    if (lead.email || lead.phone) {
      const rfq = `
NORTHLINE RFQ REQUEST
==============================

Nombre: ${lead.name || "No capturado"}
Correo: ${lead.email || "No capturado"}
Teléfono: ${lead.phone || "No capturado"}
Empresa: No capturado
Producto: HMI 5070B
Cantidad: 1 pieza

------------------------------

Notas:
Solicitud de cotización HMI 5070B (1 pieza)

------------------------------

VISITOR INFO
==============================
IP: ${ip}
City: Unknown
`;

      await sendEmail("Northline RFQ Lead", rfq);
    }

    res.json({ success: true });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(port, () => console.log("running"));
