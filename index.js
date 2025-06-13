import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const ELEVEN_KEY = process.env.ELEVEN_KEY;
const VOICE_ID = "Yko7PKHZNXotIFUBG7I9"; // можешь заменить
const MODEL_ID = "eleven_multilingual_v2"; // или другой, если хочешь

app.post("/stream", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).send("No text provided");

  const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVEN_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!elevenRes.ok) {
    const err = await elevenRes.text();
    console.error("ElevenLabs error:", err);
    return res.status(500).send("TTS error");
  }

  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Transfer-Encoding", "chunked");

  elevenRes.body.pipe(res);
});

app.get("/", (req, res) => {
  res.send("✅ ElevenLabs HTTP Stream Proxy is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
