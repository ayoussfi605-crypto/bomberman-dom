// Optional real-browser checks; Chrome/Chromium must be installed separately.
import { execFile } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { createAppServer } from "../server/index.js";

const server = createAppServer();
const profile = await mkdtemp(join(tmpdir(), "bomberman-chrome-"));
try {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const url = `http://127.0.0.1:${server.address().port}/dev/framework-check.html`;
  const { stdout } = await promisify(execFile)(process.env.CHROME_BIN ?? "google-chrome", [
    "--headless=new", "--no-sandbox", "--no-first-run", "--no-default-browser-check",
    "--disable-background-networking", `--user-data-dir=${profile}`,
    "--virtual-time-budget=2000", "--dump-dom", url,
  ], { timeout: 20000, maxBuffer: 2 * 1024 * 1024 });
  const report = stdout.match(/<pre id="out">([\s\S]*?)<\/pre>/)?.[1];
  if (!/<html[^>]*data-status="passed"/.test(stdout)) {
    throw new Error(report ?? "Browser checks did not complete; inspect /dev/framework-check.html");
  }
  console.log(report);
} catch (error) {
  console.error(error.code === "ENOENT"
    ? "Chrome was not found. Set CHROME_BIN to your Chrome/Chromium executable, or open the check page manually."
    : error.message);
  process.exitCode = 1;
} finally {
  if (server.listening) await new Promise(resolve => server.close(resolve));
  await rm(profile, { recursive: true, force: true });
}
