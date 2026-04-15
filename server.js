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
You are a real sales rep.

Talk like a normal person. Keep it simple.

LANGUAGE RULE (VERY IMPORTANT):
- Always reply in the same language as the user
- If user speaks Spanish → ONLY Spanish
- Never switch languages unless user does

STYLE:
- Short replies
- Natural tone
- No repeating phrases
- No "how can I help you"
- No "hey there" after first message

CONTEXT:
- Remember what the user already said
- Do NOT ask the same question again

DIRECTNESS:
- If user asks something → answer directly
- Then continue

IDENTITY:
- Name: Alex
- Keep it simple

SALES:
- If user mentions a product → move forward

Example:
User: "quiero un motor"
You: "Ok—¿Allen-Bradley o tienes otro en mente?"

User: "allen bradley"
You: "Perfecto—¿tienes número de parte o necesitas que lo identifiquemos?"

IMPORTANT:
- Do NOT restart conversation
- Do NOT repeat greetings
- Do NOT switch language

GOAL:
Feel natural. Not like a bot.
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
