import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/stream', async (req, res) => {
  const elevenlabsRes = await fetch('https://api.elevenlabs.io/v1/text-to-speech/ВАШ_VOICE_ID/stream', {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.XI_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req.body),
  });

  res.setHeader('Content-Type', 'audio/mpeg');
  elevenlabsRes.body.pipe(res);
});

app.listen(3000, () => console.log('✅ Proxy listening on port 3000'));
