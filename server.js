"use strict";

/**
 * SlimBuddy server bootstrap (drop-in)
 * - Public:  /spec/*  (OpenAPI files for GPT import), /api/ping
 * - Protected by middleware: /api/*
 */

const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();

// ───────────────────────────────────────────────────────────────────────────
// Core middleware
// ───────────────────────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: "*", // If you want to lock this down, set your Netlify/Frontend origin here.
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-Connect-Key", "Authorization"],
  })
);

// ───────────────────────────────────────────────────────────────────────────
/**
 * Public OpenAPI specs for GPT import
 * Set Railway env SPEC_PUBLIC=1 to serve /spec publicly (recommended).
 * If SPEC_PUBLIC is not "1", we still serve /spec publicly (to simplify),
 * but you can change the default below if you want private-by-default.
 */
const SPEC_PUBLIC = process.env.SPEC_PUBLIC === "1" || true;

// Public spec (no auth). Ensure files exist at /spec/api-spec.yaml and /spec/import.yaml
if (SPEC_PUBLIC) {
  app.use("/spec", express.static(path.join(__dirname, "spec"), { maxAge: "300s" }));
}

// ───────────────────────────────────────────────────────────────────────────
// Public health check
// ───────────────────────────────────────────────────────────────────────────
app.get("/api/ping", (_req, res) => {
  res.json({ ok: true, message: "pong" });
});

// ───────────────────────────────────────────────────────────────────────────
// Route mounts
// Each route file should implement its own auth via authMiddleware
// (i.e., protected endpoints import and use the middleware internally).
// ───────────────────────────────────────────────────────────────────────────

// Connectivity / auth diagnostics
safeMount("/api/auth_echo", "./api/auth_echo");

// Core logging endpoints
safeMount("/api/log_weight", "./api/log_weight");
safeMount("/api/log_meal", "./api/log_meal");
safeMount("/api/log_exercise", "./api/log_exercise");
safeMount("/api/log_measurements", "./api/log_measurements");

// Settings, goals, food values
safeMount("/api/user_goals", "./api/user_goals");
safeMount("/api/update_user_settings", "./api/update_user_settings");
safeMount("/api/update_food_value", "./api/update_food_value");

// Retrieval
safeMount("/api/weight_graph", "./api/weight_graph");
safeMount("/api/user_profile", "./api/user_profile");

// Connect (issue/verify) if you have these grouped under /api/connect
safeMount("/api/connect", "./api/connect");

// Reset (only if you've added api/reset.js as per our earlier steps)
safeMount("/api/reset", "./api/reset");

// ───────────────────────────────────────────────────────────────────────────
// Fallbacks & error handling
// ───────────────────────────────────────────────────────────────────────────
app.use((_req, res, _next) => {
  res.status(404).json({ ok: false, error: "Not found" });
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ ok: false, error: "Server error" });
});

// ───────────────────────────────────────────────────────────────────────────
// Boot
// ───────────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SlimBuddy server listening on ${PORT}`);
});

// ───────────────────────────────────────────────────────────────────────────
// Helper: safeMount avoids crashing if a route file is temporarily missing
// ───────────────────────────────────────────────────────────────────────────
function safeMount(routePath, modulePath) {
  try {
    // Require route modules lazily to give clearer errors if they fail
    const router = require(modulePath);
    app.use(routePath, router);
    console.log(`Mounted: ${routePath} -> ${modulePath}`);
  } catch (e) {
    console.warn(`Skipping mount for ${routePath} (${modulePath}): ${e.message}`);
  }
}
