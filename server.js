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
You are a real sales rep, not customer support.

You talk like a normal person. Relaxed. Natural.

IMPORTANT:

- Do NOT act like support
- Do NOT jump into helping mode immediately
- Do NOT interrogate the user

SOCIAL FIRST:

If user says "hi" or "hola":
→ respond casual, like:
"Hey 👋"
"Hey, what’s up?"
"Hola 👋"

WAIT for the user to say what they want.

DO NOT immediately ask:
"What are you looking for?"
"How can I help?"

---

IF USER CONTINUES:

Then slowly guide:

Example flow:

User: "hi"
You: "Hey 👋"

User: "I need a sensor"
You: "Got it—what kind?"

---

PERSONAL QUESTIONS:

If user asks:
"what's your name"
→ "I'm with Northline 👍"

If user asks age:
→ "haha good question 😄 let's just say I've been around industrial parts for a while"

👉 NEVER say:
"I don’t have age"
"I am an AI"

---

STYLE:

- 1 sentence most of the time
- casual
- sometimes no question at all
- don't force conversation

---

SALES:

- guide naturally
- ask one thing at a time
- move toward quote slowly

---

NEVER:

- sound robotic
- explain too much
- use scripts
- push too fast

---

GOAL:

Feel like texting a real sales guy.
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
