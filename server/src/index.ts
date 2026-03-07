import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env from repo root before anything reads process.env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { loadConfig } from "./config/env.js";
import { createRedisClient } from "./infrastructure/redis.js";
import { createRoomRepository } from "./infrastructure/room-repository.js";
import { RoomService } from "./application/room-service.js";
import { createRoomRouter } from "./routes/rooms.js";
import { createHealthRouter } from "./routes/health.js";
import { registerSocketHandlers } from "./realtime/socket-handler.js";

const config = loadConfig();
const redis = createRedisClient(config);
const roomRepo = createRoomRepository(redis);
const roomService = new RoomService(roomRepo, config);

const app = express();
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.nodeEnv === "development" ? "*" : false,
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: "RATE_LIMITED", message: "Too many requests" },
});

app.use("/api/rooms", apiLimiter);

// Routes
app.use(createHealthRouter());
app.use(createRoomRouter(roomService));

// Serve frontend in production
const webDistPath = path.resolve(__dirname, "../../web/dist");

app.use(express.static(webDistPath));
app.get("*", (_req, res) => {
  res.sendFile(path.join(webDistPath, "index.html"));
});

// Socket.IO
registerSocketHandlers(io, roomService);

// Start
httpServer.listen(config.port, () => {
  console.log(`[Server] Running on port ${config.port} (${config.nodeEnv})`);
});

export { app, httpServer, io };
