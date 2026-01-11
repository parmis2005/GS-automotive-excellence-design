// Load environment variables from .env file (only in development)
import "dotenv/config";

import express from "express";
import cors from "cors";
import { vehiclesRouter } from "./routes/vehicles.js";
import { initializeDatabase, closeDatabase } from "./db/database.js";
import { startSyncJob, stopSyncJob } from "./services/syncService.js";

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

// Initialize database and start sync job
async function startServer() {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error("❌ DATABASE_URL environment variable is not set!");
      console.error("💡 Please set DATABASE_URL in your environment variables");
      process.exit(1);
    }

    // Initialize database (create tables if they don't exist)
    await initializeDatabase();

    // Start background sync job (default: 30 minutes)
    const syncIntervalMinutes = parseInt(process.env.SYNC_INTERVAL_MINUTES || "30", 10);
    startSyncJob(syncIntervalMinutes);

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}/api/vehicles`);
      console.log(`🔄 Background sync job running (every ${syncIntervalMinutes} minutes)`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🛑 SIGTERM received, shutting down gracefully...");
  stopSyncJob();
  await closeDatabase();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("🛑 SIGINT received, shutting down gracefully...");
  stopSyncJob();
  await closeDatabase();
  process.exit(0);
});

// Start the server
startServer();
