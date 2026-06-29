import app from "./app";
import { logger } from "./lib/logger";
import { ensureSchema } from "@workspace/db/migrate";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

/**
 * Start listening on the port IMMEDIATELY so that:
 *   1. Replit's healthcheck (GET /api) can pass right away
 *   2. The deployment is not killed by "port was never opened"
 *
 * DB schema migration runs in the background after the server is up.
 * If it fails we log the error but keep the server alive — API routes
 * that need the DB will return 503 via their own error handling, but
 * the process stays running and Replit won't restart the deployment.
 */
app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");

  // Run DB schema initialisation in the background
  ensureSchema()
    .then(() => {
      logger.info("Database schema initialised");
    })
    .catch((schemaErr) => {
      logger.error(
        { err: schemaErr },
        "Failed to initialise database schema — check DATABASE_URL in Replit Secrets. " +
        "Server is still running but DB-dependent routes will fail.",
      );
      // Do NOT call process.exit() here — keep the server alive so
      // Replit healthchecks continue to pass and the deployment survives.
    });
});
