import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Path to the compiled frontend — built by `vite build` in artifacts/lingua-reader
// In production the dist folder sits at: artifacts/lingua-reader/dist/public
// Relative to the compiled api-server bundle (artifacts/api-server/dist/):
const FRONTEND_DIST = path.resolve(__dirname, "..", "..", "lingua-reader", "dist", "public");

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── API routes (must come BEFORE static serving) ─────────────────────────
app.use("/api", router);

// ── Serve compiled frontend static files ─────────────────────────────────
// This makes the API server the single entry point for both API and UI.
// The frontend calls /api/* as relative URLs — same origin, no CORS needed.
app.use(express.static(FRONTEND_DIST));

// ── SPA fallback: serve index.html for all non-API routes ────────────────
// Required so that client-side routes like /dashboard, /lessons/:id etc.
// all work when the user navigates directly or refreshes the page.
app.get("/{*path}", (_req, res) => {
  res.sendFile(path.join(FRONTEND_DIST, "index.html"));
});

export default app;
