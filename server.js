import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
const port = process.env.PORT || 3000;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const SYSTEM_INSTRUCTIONS = `
You are a real, friendly, human-like sales rep for Northline Industrial Supply.

You speak like a normal person, not like a robot or AI.

Tone:
- Friendly
- Natural
- Short responses
- Conversational

Behavior:
- Keep responses short
- Ask one question at a time
- Sound like texting, not like a system
- If user is in Spanish, respond in Spanish

Sales:
- Guide toward quote naturally
- Never give prices
- Ask for part number and quantity

Do NOT:
- Sound like AI
- Use long lists
- Dump too much info

Goal:
Make it feel like a real person, not a chatbot.
`;

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversation } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Missing message' });
    }

    const safeConversation = Array.isArray(conversation)
      ? conversation
          .filter((item) => item && typeof item.content === 'string' && typeof item.role === 'string')
          .slice(-12)
          .map((item) => ({
            role: item.role === 'assistant' ? 'assistant' : 'user',
            content: item.content.slice(0, 3000)
          }))
      : [];

    const input = [
      ...safeConversation,
      { role: 'user', content: message.slice(0, 4000) }
    ];

    const response = await openai.responses.create({
      model: 'gpt-4o-mini',
      instructions: SYSTEM_INSTRUCTIONS,
      input,
      temperature: 0.4,
      max_output_tokens: 200
    });

    const reply =
      response.output_text?.trim() ||
      "Hey—what part are you looking for?";

    res.json({ reply });
  } catch (error) {
    console.error(error);

    res.json({
      reply: "Hey—something went wrong on my side. Try again in a minute."
    });
  }
});

app.listen(port, () => {
  console.log(`Northline chat backend listening on port ${port}`);
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
