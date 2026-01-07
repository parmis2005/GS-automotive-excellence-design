import express from "express";
import cors from "cors";
import { vehiclesRouter } from "./routes/vehicles.js";

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - allow all origins in production (or specific Vercel domains)
app.use(cors({
  origin: true, // Allow all origins (you can restrict this to specific domains if needed)
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Middleware
app.use(express.json());

// API Routes
app.use("/api/vehicles", vehiclesRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api/vehicles`);
});
