// Load environment variables from .env file (only in development)
import "dotenv/config";

import express from "express";
import cors from "cors";
import { vehiclesRouter } from "./routes/vehicles.js";
import { brandsRouter } from "./routes/brands.js";
import { modelsRouter } from "./routes/models.js";
import { purchaseInquiryRouter } from "./routes/purchaseInquiry.js";
import { statsRouter } from "./routes/stats.js";
import { initializeDatabase, closeDatabase } from "./db/database.js";
import { startSyncJob, stopSyncJob } from "./services/syncService.js";
import { isCargateApiConfigured } from "./services/cargateApi.js";

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
app.use("/api/brands", brandsRouter);
app.use("/api/models", modelsRouter);
app.use("/api/purchase-inquiry", purchaseInquiryRouter);
app.use("/api/stats", statsRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Server sofort starten, damit Vite-Proxy keine ECONNREFUSED bekommt; DB/Sync danach im Hintergrund
async function startServer() {
  if (!process.env.DATABASE_URL && !isCargateApiConfigured()) {
    console.error("❌ DATABASE_URL oder CarGate API (CARGATE_API_KEY + CARGATE_API_BASE_URL) nötig.");
    process.exit(1);
  }

  app.listen(PORT, async () => {
    console.log(`🚀 Server: http://localhost:${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api/vehicles`);
    try {
      if (process.env.DATABASE_URL) {
        await initializeDatabase();
        const syncIntervalMinutes = parseInt(process.env.SYNC_INTERVAL_MINUTES || "30", 10);
        startSyncJob(syncIntervalMinutes);
        console.log(`🔄 Sync (every ${syncIntervalMinutes} min)`);
      } else if (isCargateApiConfigured()) {
        console.log("📡 Nur CarGate API (kein DB-Fallback ohne DATABASE_URL)");
      }
    } catch (error) {
      console.error("❌ DB/Sync nach Start:", error);
    }
  });
}

// Graceful shutdown
async function shutdown() {
  if (process.env.DATABASE_URL) {
    stopSyncJob();
    await closeDatabase();
  }
  process.exit(0);
}

process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down...");
  void shutdown();
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down...");
  void shutdown();
});

// Start the server
startServer();
