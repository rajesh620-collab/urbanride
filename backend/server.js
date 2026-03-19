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

// ── Routes ──────────────────────────────────────────────────────
app.use("/api/auth",      require("./routes/auth"));
app.use("/api/rides",     require("./routes/rides"));
app.use("/api/bookings",  require("./routes/bookings"));
app.use("/api/pending",   require("./routes/pending"));
app.use("/api/landmarks", require("./routes/landmarks"));
app.use("/api/ratings",   require("./routes/ratings"));

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