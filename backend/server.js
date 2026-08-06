const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const app = express();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting (basic, can be replaced with Redis store later)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Basic health check
app.get('/healthz', (req, res) => res.send('OK'));

// Placeholder for routes (will be added later)
// Example: const authRouter = require('./src/routes/auth');
// app.use('/api/auth', authRouter);

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Simple connection handler
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  // Here you can register further event listeners
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Backend server listening on http://localhost:${PORT}`);
});
