import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_INSTRUCTIONS = `
You are a real sales rep for an industrial supply company.

Speak like a normal person. Short, direct, helpful.

Do NOT:
- sound like AI
- give long answers
- give prices

Do:
- ask simple questions
- guide toward a quote
`;

app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTIONS },
        { role: "user", content: userMessage },
      ],
    });

    const reply = response.choices[0].message.content;

    res.json({ reply });
  } catch (error) {
    console.error(error);

    res.json({
      reply: "Hey—something went wrong on my side. Try again in a moment.",
    });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
