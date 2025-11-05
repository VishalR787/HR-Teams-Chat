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
