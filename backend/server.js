require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");

const connectDB = require("./config/db");
const { setupWebSocket } = require("./services/websocketService");

// Initialize re-notification cron (side-effect: registers cron job)
require("./services/reNotificationEngine");

const app = express();
const server = http.createServer(app);

// ── CORS ────────────────────────────────────────────────────────
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
}));

// ── Body parsers ────────────────────────────────────────────────
app.use(express.json());

// ── Database ────────────────────────────────────────────────────
connectDB();

// ── Health check ────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "UrbanRide API is running",
    timestamp: new Date().toISOString()
  });
});

// ── Routes (with error handling) ─────────────────────────────────
const routeStatus = {};
const safeRoute = (path, modulePath) => {
  try {
    const mod = require(modulePath);
    app.use(path, mod);
    routeStatus[path] = 'loaded';
    console.log(`  ✅ ${path}`);
  } catch (err) {
    routeStatus[path] = `FAILED: ${err.message}`;
    console.error(`  ❌ ${path} → ${err.message}`);
  }
};

console.log('\n  Loading routes:');
safeRoute("/api/auth",      "./routes/auth");
safeRoute("/api/rides",     "./routes/rides");
safeRoute("/api/bookings",  "./routes/bookings");
safeRoute("/api/pending",   "./routes/pending");
safeRoute("/api/landmarks", "./routes/landmarks");
safeRoute("/api/ratings",   "./routes/ratings");
safeRoute("/api/fare",      "./routes/fare");
safeRoute("/api/maps",      "./routes/maps");

// Debug endpoint to check route status
app.get("/api/debug/routes", (req, res) => {
  res.json({ success: true, routes: routeStatus });
});

// ── 404 handler ─────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// ── Global error handler ────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error("[Server Error]", err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

// ── WebSocket ───────────────────────────────────────────────────
setupWebSocket(server);

// ── Start ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║  UrbanRide API · port ${PORT}           ║
  ║  Health: http://localhost:${PORT}/api/health  ║
  ╚═══════════════════════════════════════╝
  `);
});