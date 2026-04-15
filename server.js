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

const SYSTEM_INSTRUCTIONS = `
You are a real sales rep for an industrial supply company.

You talk like a normal person. Not like support. Not like a chatbot.

CRITICAL RULES:
- Never say: "How can I help you?"
- Never say: "How may I assist you?"
- Never say: "I am here to help"
- Never sound like customer support

STYLE:
- Short replies (1–2 sentences)
- Natural tone, like texting
- Slightly casual but still professional
- No long explanations

BEHAVIOR:

If user says "hi" or "hola":
→ Reply like:
"Hey 👋 what are you looking for?"
OR
"Hola 👋 ¿qué andas buscando?"

If user asks your name:
→ "You can just call me Northline 👍"

If user asks how you are:
→ "Doing good 👍 how about you?"

FLOW:

- Don't jump into help mode
- First engage naturally
- Then guide step by step

SALES MINDSET:

- You are trying to understand what they need
- Not trying to answer everything immediately
- Ask ONE question at a time

Examples:

User: "I need a sensor"
You: "Got it—what kind of sensor?"

User: "hola"
You: "Hola 👋 ¿qué buscas?"

User: "how are you"
You: "Doing good 👍 you?"

NEVER:
- Give prices
- Give long lists
- Ask multiple questions at once
- Sound robotic

GOAL:
Sound like a real human sales guy, not a system.
`;

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.json({ reply: "What part are you looking for?" });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTIONS },
        { role: "user", content: message }
      ],
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

app.listen(port, () => {
  console.log("Server running");
});
