const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
const db = require("./db/postgres");
const scheduler = require("./services/scheduler.service.omeo");

// dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );
  next();
});

// Health check
app.get("/health", async (req, res) => {
  try {
    await db.pool.query("SELECT 1");
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch (err) {
    res
      .status(503)
      .json({
        status: "error",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: err.message,
      });
  }
});

// Existing v1 routes (unchanged)
const weatherRoutesV1 = require("./routes/weather.routes.postgres");
app.use("/api/weather", weatherRoutesV1);

// New v2 routes
const weatherRoutesV2 = require("./routes/weather.routes.omeo");
app.use("/api/v2/weather", weatherRoutesV2);

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Initialize legacy schema (forecasts table)
    await db.initializeDatabase();

    // Initialize omeo schema (forecasts_omeo table)
    const omeoSchema = fs.readFileSync(
      path.join(__dirname, "../db/schema.omeo.sql"),
      "utf8",
    );
    await db.pool.query(omeoSchema);
    console.log("forecasts_omeo schema initialized");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
      scheduler.start();
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

process.on("SIGTERM", async () => {
  console.log("SIGTERM: closing server");
  await db.pool.end();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT: closing server");
  await db.pool.end();
  process.exit(0);
});

startServer();
