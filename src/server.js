import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initializeSocket } from './socket.js';
import { storage } from './storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static(join(__dirname, '../public')));
// server.js (inside your existing file)
app.post('/api/ai/assist', async (req, res) => {
  try {
    const {
      hrMessage = '',
      draft = '',
      mode = 'polish',          // polish | simplify | accept | decline | ask_clarify
      tone = 'neutral',         // neutral | formal | friendly
      replyStyle = 'chat',      // chat | email
      length = 'short',         // short | medium | long
      format = 'paragraph'      // paragraph | bullets
    } = req.body ?? {};

    const SYSTEM = `
You rewrite the employee’s reply to HR.

General rules:
- Be truthful; never invent facts or commitments.
- Stay respectful and solution-oriented.
- Keep the user's intent (polish/simplify/accept/decline/ask_clarify).
- Avoid policy claims or legal advice.
- If the draft is telegraphic (“hey wont come today personal work”), infer the obvious missing words and fix grammar while preserving meaning.

Style switches:
- If replyStyle=chat: no subject, no greeting, no sign-off.
  Write like Teams/Slack: ${format === 'bullets' ? '3–5 tight bullets.' : '1–2 concise sentences.'}
- If replyStyle=email: include a brief greeting and a simple sign-off. No subject unless present in the draft.

Tone:
- ${tone === 'formal' ? 'Formal and professional.' : tone === 'friendly' ? 'Warm but professional.' : 'Neutral and professional.'}

Length:
- ${length === 'short' ? 'Aim for 1–2 sentences or up to 3 bullets.' : length === 'medium' ? '2–4 sentences or up to 5 bullets.' : 'Keep it focused even if longer is allowed.'}

Output:
- Return only the final reply text in the selected style.
`.trim();

    const USER = `
HR message:
"""
${hrMessage}
"""

Employee draft (may be empty):
"""
${draft}
"""

Mode: ${mode}
ReplyStyle: ${replyStyle}
Format: ${format}
`.trim();

    const base  = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
    const model = process.env.OLLAMA_MODEL     || 'qwen2.5:3b';

    const r = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user',   content: USER   },
        ],
      }),
    });

    if (!r.ok) {
      const txt = await r.text();
      return res.status(500).json({ error: `Ollama error ${r.status}: ${txt}` });
    }

    const data = await r.json();
    const out  = data?.message?.content || data?.response || '';
    res.json({ final: (out || '').trim() });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'AI error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    storage: storage.useDatabase ? 'mongodb' : 'in-memory',
    timestamp: new Date().toISOString()
  });
});



// Initialize storage
await storage.connect();

// Initialize Socket.IO
const io = initializeSocket(httpServer);

// Start server
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════╗
║     HR Teams Chat Server Running           ║
╠════════════════════════════════════════════╣
║  Port: ${PORT.toString().padEnd(37, ' ')}║
║  Storage: ${(storage.useDatabase ? 'MongoDB' : 'In-Memory').padEnd(32, ' ')}║
║  URL: http://0.0.0.0:${PORT.toString().padEnd(23, ' ')}║
╚════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
  });
});
