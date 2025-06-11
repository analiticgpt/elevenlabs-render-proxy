import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const ELEVEN_KEY = process.env.ELEVEN_KEY;

app.post("/stream", async (req, res) => {
  const { text, voice_id } = req.body;
  if (!ELEVEN_KEY) return res.status(500).send("No ELEVEN_KEY");
  if (!text || !voice_id) return res.status(400).send("No text or voice_id");

  const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}/stream`;

  const elevenRes = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVEN_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      output_format: "mp3_44100_128"
    })
  });

  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Transfer-Encoding", "chunked");
  elevenRes.body.pipe(res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("ElevenLabs stream proxy ready!");
});
