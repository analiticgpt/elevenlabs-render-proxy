import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const ELEVEN_KEY = process.env.ELEVEN_KEY;
const ELEVEN_VOICE_ID = "Yko7PKHZNXotIFUBG7I9";
const ELEVEN_MODEL = "eleven_monolingual_v1";

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (wsClient) => {
  wsClient.on("message", (message) => {
    const parsed = JSON.parse(message.toString());
    if (!parsed.text) {
      console.warn("⛔ Текст не получен от клиента");
      wsClient.send(JSON.stringify({ error: "No text provided" }));
      return;
    }

    console.log("📥 Получен текст от клиента:", parsed.text);

    const url = `wss://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE_ID}/stream-input?model_id=${ELEVEN_MODEL}`;
    const wsEleven = new WebSocket(url, {
      headers: {
        "xi-api-key": ELEVEN_KEY,
        "Content-Type": "application/json"
      }
    });

    wsEleven.on("open", () => {
      console.log("🔌 Подключено к ElevenLabs WebSocket");
      wsEleven.send(JSON.stringify({
        text: parsed.text,
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        flush: true
      }));
    });

    wsEleven.on("message", (data, isBinary) => {
      if (isBinary) {
        console.log("🎤 ElevenLabs отдал аудио-фрейм:", data.length);
        wsClient.send(data);
      } else {
        const msg = data.toString();
        console.warn("📨 ElevenLabs ответ:", msg);
        if (msg.includes("error")) {
          wsClient.send(JSON.stringify({ error: msg }));
        }
      }
    });

    wsEleven.on("error", (err) => {
      console.error("❌ Ошибка ElevenLabs WebSocket:", err);
      wsClient.send(JSON.stringify({ error: "ElevenLabs error" }));
    });

    wsEleven.on("close", () => {
      console.log("🔚 ElevenLabs WebSocket закрыт");
      wsClient.close();
    });
  });
});

app.get("/", (req, res) => res.send("WebSocket Proxy running"));

server.listen(process.env.PORT || 3000, () => console.log("✅ Proxy listening on port", process.env.PORT || 3000));
