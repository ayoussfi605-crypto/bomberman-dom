// M0 static starter. Yacobe adds the WebSocket transport and room here in M1.
import { createServer } from "node:http";
import { readFile, realpath, stat } from "node:fs/promises";
import { dirname, extname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = resolve(projectRoot, "public");
const sharedRoot = resolve(projectRoot, "shared");
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".ico": "image/x-icon", ".woff2": "font/woff2",
};

function inside(root, path) {
  const suffix = relative(root, path);
  return suffix !== ".." && !suffix.startsWith(`..${sep}`) && !isAbsolute(suffix);
}

export function createAppServer() {
  return createServer(async (request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD" }).end();
      return;
    }
    try {
      const pathname = decodeURIComponent(request.url.split("?")[0]);
      const isShared = pathname.startsWith("/shared/");
      const root = isShared ? sharedRoot : publicRoot;
      const route = isShared ? pathname.slice("/shared/".length) : pathname.slice(1);
      const candidate = resolve(root, route || "index.html");
      if (!inside(root, candidate)) {
        response.writeHead(403).end();
        return;
      }
      const path = await realpath(candidate);
      if (!inside(root, path)) {
        response.writeHead(403).end();
        return;
      }
      if (!(await stat(path)).isFile()) {
        response.writeHead(404).end();
        return;
      }
      const body = await readFile(path);
      response.writeHead(200, {
        "Content-Type": mimeTypes[extname(path)] ?? "application/octet-stream",
        "Content-Length": body.length,
      });
      response.end(request.method === "HEAD" ? undefined : body);
    } catch (error) {
      const status = error instanceof URIError ? 400
        : ["ENOENT", "ENOTDIR", "EISDIR"].includes(error.code) ? 404 : 500;
      response.writeHead(status).end();
      if (status === 500) console.error("Static request failed:", error);
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const server = createAppServer();
  server.on("error", error => {
    console.error("Server failed:", error.message);
    process.exitCode = 1;
  });
  server.listen(Number(process.env.PORT ?? 8080), () => {
    console.log(`Bomberman starter: http://localhost:${server.address().port}`);
  });
}
