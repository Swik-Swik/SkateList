import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import compression from "compression";
import helmet from "helmet";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment configuration
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || "development";
const isProduction = NODE_ENV === "production";

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:", "https:"],
        frameSrc: ["https://www.youtube.com"],
        connectSrc: ["'self'"],
      },
    },
  })
);

// Compression middleware for better performance
app.use(compression());

// Static file serving with proper caching
const staticOptions = {
  maxAge: isProduction ? "1y" : "0",
  etag: true,
  lastModified: true,
};

app.use(express.static(__dirname, staticOptions));
app.use(express.static(path.join(__dirname, "public"), staticOptions));

// API endpoints for JSON data with proper headers
app.get("/json/:file", (req, res) => {
  const filename = req.params.file;

  // Security: only allow specific JSON files
  const allowedFiles = ["videos.json", "todo.json"];
  if (!allowedFiles.includes(filename)) {
    return res.status(404).json({ error: "File not found" });
  }

  res.setHeader("Content-Type", "application/json");
  res.setHeader(
    "Cache-Control",
    isProduction ? "public, max-age=3600" : "no-cache"
  );

  const filePath = path.join(__dirname, "json", filename);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error serving JSON file:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
});

// Main route
app.get("/", (req, res) => {
  res.setHeader(
    "Cache-Control",
    isProduction ? "public, max-age=3600" : "no-cache"
  );
  res.sendFile(path.join(__dirname, "index.html"));
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Page not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: isProduction ? "Internal server error" : err.message,
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SkateList application started and listening on port ${PORT}`);
  console.log(`📦 Environment: ${NODE_ENV}`);
  console.log(`🌍 Access at: http://localhost:${PORT}`);
});

export default app;
