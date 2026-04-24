// server.js (SMTP fixed)
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import OpenAI from 'openai';

const app = express();
app.use(cors());
app.use(express.json());

// ENV
const {
  OPENAI_API_KEY,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  TRANSCRIPT_TO
} = process.env;

// OpenAI
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// SMTP (FORCED CONFIG)
const transporter = nodemailer.createTransport({
  host: SMTP_HOST || 'smtp.gmail.com',
  port: Number(SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});

// CHAT ENDPOINT
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversation = [] } = req.body;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        ...conversation,
        { role: 'user', content: message }
      ]
    });

    const reply = completion.choices[0].message.content;

    res.json({ reply });
  } catch (err) {
    console.error('chat error:', err);
    res.status(500).json({ error: 'chat failed' });
  }
});

// TRANSCRIPT ENDPOINT
app.post('/api/send-transcript', async (req, res) => {
  try {
    const { conversation = [] } = req.body;

    const text = conversation
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');

    await transporter.sendMail({
      from: SMTP_FROM,
      to: TRANSCRIPT_TO,
      subject: 'Chat Transcript - Northline',
      text
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('send-transcript error:', err);
    res.status(500).json({ error: 'email failed' });
  }
});

app.listen(3000, () => {
  console.log('Server running');
});
