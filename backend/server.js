require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");

const connectDB = require("./config/db");
const { setupWebSocket } = require("./services/websocketService");

const app = express();
const server = http.createServer(app);

// CORS configuration
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"]
}));

// Middleware
app.use(express.json());

// Connect Database
connectDB();

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/rides", require("./routes/rides"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/pending", require("./routes/pending"));
app.use("/api/landmarks", require("./routes/landmarks"));

// WebSocket setup
setupWebSocket(server);

// Server start
const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});