import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const ELEVEN_KEY = process.env.ELEVEN_KEY;
const ELEVEN_VOICE_ID = "Yko7PKHZNXotIFUBG7I9"; // можешь заменить на другой
const ELEVEN_MODEL = "eleven_multilingual_v2";

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", async (wsClient) => {
  let textBuffer = "";

  wsClient.on("message", async (message) => {
    try {
      const parsed = JSON.parse(message.toString());
      if (!parsed.text) return;

      const wsEleven = new WebSocket(`wss://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE_ID}/stream`, {
        headers: {
          "xi-api-key": ELEVEN_KEY,
          "Content-Type": "application/json",
        },
      });

      wsEleven.on("open", () => {
        wsEleven.send(
          JSON.stringify({
            text: parsed.text,
            model_id: ELEVEN_MODEL,
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          })
        );
      });

      wsEleven.on("message", (data) => {
        wsClient.send(data);
      });

      wsEleven.on("error", (err) => {
        console.error("WebSocket error (ElevenLabs):", err);
        wsClient.send(JSON.stringify({ error: "ElevenLabs error" }));
      });

      wsEleven.on("close", () => {
        wsClient.close();
      });
    } catch (err) {
      console.error("Proxy error:", err);
      wsClient.send(JSON.stringify({ error: "Server error" }));
    }
  });
});

app.get("/", (req, res) => {
  res.send("✅ ElevenLabs WebSocket Proxy is running");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Proxy listening on port ${PORT}`);
});
