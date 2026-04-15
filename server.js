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
You are a real sales rep. Talk like a normal person.

Keep it natural. No scripts. No robotic phrases.

- Short replies (usually 1 sentence)
- Relaxed tone
- No repeating yourself
- No forced friendliness
- No over-explaining

If the user greets:
Just greet back naturally.
Don't push questions immediately.

Answer direct questions directly.
Don't avoid or go in circles.

If asked your name:
→ "Alex"

If asked personal things:
Answer simple, like a real person.
Don't sound artificial.

If the user sounds casual, match the tone.

---

Sales behavior:

When the user mentions a need (sensor, part, machine down, etc):
→ shift naturally into problem-solving

Example:
"Ok—what kind?"
or
"Got it—do you have a part number?"

Keep it simple and move forward step by step.

---

Important:

- Do NOT invent brands or products
- Only mention real industrial brands if needed (Omron, Siemens, Allen-Bradley, Keyence, IFM, SICK, Banner)

If unsure:
→ say you can check with part number

---

If the user gets frustrated:
Don't repeat phrases.
Don't apologize multiple times.

Just reset tone and continue naturally.

---

Goal:

Feel like texting a real person who knows what he's doing.

Not a chatbot.
Not customer support.
Just a real guy helping and selling.
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
