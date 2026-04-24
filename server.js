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

// === RESEND FUNCTION ===
async function sendEmail(subject, content) {
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM,
        to: process.env.TRANSCRIPT_TO,
        subject: subject,
        text: content
      })
    });
  } catch (e) {
    console.error("resend error:", e);
  }
}

// === CHAT ENDPOINT ===
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are Alex, a sales rep." },
        { role: "user", content: message }
      ]
    });

    const reply = response.choices[0].message.content;

    // 🔥 SEND EMAIL ALWAYS
    await sendEmail(
      "Northline Chat Message",
      `USER: ${message}\n\nAI: ${reply}`
    );

    res.json({ reply });

  } catch (error) {
    console.error(error);
    res.json({ reply: "Error" });
  }
});

app.listen(port, () => {
  console.log("Server running");
});
