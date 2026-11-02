import { test } from "node:test";
import assert from "node:assert/strict";
import { request } from "node:http";
import { once } from "node:events";
import { createAppServer } from "../server/index.js";

test("starter serves public/shared files and rejects traversal", async t => {
  const server = createAppServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise(resolve => server.close(resolve)));
  const get = (path, method = "GET") => new Promise((resolve, reject) => {
    const req = request({ host: "127.0.0.1", port: server.address().port, path, method }, response => {
      const chunks = [];
      response.on("data", chunk => chunks.push(chunk));
      response.on("end", () => resolve({ status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks).toString() }));
    });
    req.on("error", reject);
    req.end();
  });
  const page = await get("/");
  assert.equal(page.status, 200);
  assert.match(page.body, /id="app"/);
  assert.match(page.headers["content-type"], /text\/html/);
  assert.equal(page.headers["cache-control"], "no-store");
  const constants = await get("/shared/constants.js");
  assert.equal(constants.status, 200);
  assert.match(constants.headers["content-type"], /javascript/);
  assert.match(constants.body, /SAFE_ZONE_ARM = 3/);
  assert.equal((await get("/src/framework/index.js")).status, 200);
  assert.equal((await get("/dev/framework-check.html")).status, 200);
  assert.equal((await get("/../package.json")).status, 403);
  assert.equal((await get("/%2e%2e/package.json")).status, 403);
  assert.equal((await get("/shared/../../package.json")).status, 403);
  assert.equal((await get("/.git/config")).status, 404);
  assert.equal((await get("/mini-framework/README.md")).status, 404);
  assert.equal((await get("/missing.js")).status, 404);
  assert.equal((await get("/%zz")).status, 400);
  assert.equal((await get("/", "POST")).status, 405);
  assert.equal((await get("/", "HEAD")).body, "");
});
