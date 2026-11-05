// server/index.js
// Static HTTP server (public/ at /, shared/ at /shared/) + WebSocket bootstrap.

import http from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { WebSocketServer } from "ws";

import { MAX_MESSAGE_BYTES } from "../shared/constants.js";
import { createRoom } from "./lobby/room.js";
import { attachTransport } from "./net/transport.js";

const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const PUBLIC_DIR = path.join(ROOT, "public");
const SHARED_DIR = path.join(ROOT, "shared");

const PORT = Number(process.env.PORT) || 8080;
const HEARTBEAT_MS = 30_000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".md": "text/markdown; charset=utf-8",
};

function mimeType(filePath) {
  return (
    MIME[path.extname(filePath).toLowerCase()] ?? "application/octet-stream"
  );
}

function sendText(res, status, text, method) {
  res.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(method === "HEAD" ? undefined : `${status} ${text}\n`);
}

/** Maps a request path to a file inside public/ or shared/, or returns a status. */
function resolveFile(rawPath) {
  let pathname;
  try {
    pathname = decodeURIComponent(rawPath);
  } catch {
    return { status: 400, text: "Bad Request" };
  }

  if (pathname.includes("\0")) return { status: 400, text: "Bad Request" };

  let root = PUBLIC_DIR;
  let relative = pathname;
  if (pathname === "/shared" || pathname.startsWith("/shared/")) {
    root = SHARED_DIR;
    relative = pathname.slice("/shared".length) || "/";
  }

  if (relative === "/") relative = "/index.html";

  // Resolve first, then verify the result is still inside the root.
  const filePath = path.resolve(root, `.${relative}`);
  if (filePath !== root && !filePath.startsWith(root + path.sep)) {
    return { status: 403, text: "Forbidden" };
  }

  return { filePath };
}

async function handleRequest(req, res) {
  const method = req.method ?? "GET";
  if (method !== "GET" && method !== "HEAD")
    return sendText(res, 405, "Method Not Allowed", method);

  const rawPath = (req.url ?? "/").split("?")[0].split("#")[0] || "/";
  const target = resolveFile(rawPath);
  if (target.status) return sendText(res, target.status, target.text, method);

  let info;
  try {
    info = await stat(target.filePath);
  } catch {
    return sendText(res, 404, "Not Found", method);
  }
  if (!info.isFile()) return sendText(res, 404, "Not Found", method);

  res.writeHead(200, {
    "Content-Type": mimeType(target.filePath),
    "Content-Length": info.size,
    "Cache-Control": "no-store",
  });

  if (method === "HEAD") {
    res.end();
    return;
  }

  const stream = createReadStream(target.filePath);
  stream.on("error", () => res.destroy());
  stream.pipe(res);
}

export function createAppServer({ logger = console, room: injectedRoom } = {}) {
  const server = http.createServer((req, res) => {
    handleRequest(req, res).catch((error) => {
      logger.error?.("[http] request failed:", error);
      if (!res.headersSent)
        sendText(res, 500, "Internal Server Error", req.method);
      else res.destroy();
    });
  });

  const wss = new WebSocketServer({
    server,
    perMessageDeflate: false,
    maxPayload: MAX_MESSAGE_BYTES,
  });

  const room = injectedRoom ?? createRoom({ logger });
  attachTransport({ wss, room, logger });

  // Heartbeat: ping every 30 s, terminate a socket that missed the previous ping.
  wss.on("connection", (ws) => {
    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });
  });

  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (ws.isAlive === false) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      try {
        ws.ping();
      } catch {
        ws.terminate();
      }
    }
  }, HEARTBEAT_MS);
  if (typeof heartbeat.unref === "function") heartbeat.unref();

  server.on("close", () => {
    clearInterval(heartbeat);
    room.stop?.();
    try {
      wss.close();
    } catch {
      // Already closing.
    }
  });

  server.on("error", (error) => logger.error?.("[http] server error:", error));
  wss.on("error", (error) => logger.error?.("[ws] server error:", error));

  return server;
}

/** Loads mohamed's engine when it exists, otherwise the temporary placeholder. */
async function loadGameFactory(logger) {
  try {
    const module = await import("./game/game.js");
    if (typeof module.createGame === "function") {
      logger.log?.("[room] using server/game/game.js");
      return module.createGame;
    }
  } catch {
    logger.log?.(
      "[room] engine not available yet (server/game/game.js is missing)",
    );
  }
  return undefined;
}

const isMain =
  process.argv[1] !== undefined &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
  const createGame = await loadGameFactory(console);
  const room = createRoom(createGame ? { createGame } : {});
  const server = createAppServer({ room });

  server.listen(PORT, () => {
    console.log(`Bomberman server listening on http://localhost:${PORT}`);
  });

  const shutdown = () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 500).unref();
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}
