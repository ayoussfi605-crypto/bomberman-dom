#!/usr/bin/env node
// server/tools/bot.js
// Scripted WebSocket bots for timer/lobby and load tests.
//
//   node server/tools/bot.js --count 4 --prefix Bot [--url ws://localhost:8080]
//
// Bots join, log lobby/timers, send random input changes + bombs while playing,
// log gameover, and join again for the next game.

import path from "node:path";
import { pathToFileURL } from "node:url";
import { WebSocket } from "ws";

import { C2S, S2C } from "../../shared/constants.js";

const DIRECTIONS = ["up", "down", "left", "right", null];

function parseArgs(argv) {
  const options = { count: 2, prefix: "Bot", url: "ws://localhost:8080", help: false };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--count") options.count = Number(argv[++i]);
    else if (arg === "--prefix") options.prefix = argv[++i];
    else if (arg === "--url") options.url = argv[++i];
  }

  if (!Number.isInteger(options.count) || options.count < 1) options.count = 1;
  return options;
}

class Bot {
  constructor(nickname, url, logger = console) {
    this.nickname = nickname;
    this.url = url;
    this.logger = logger;
    this.ws = null;
    this.playing = false;
    this.timers = new Set();
  }

  log(...args) {
    this.logger.log(`[${this.nickname}]`, ...args);
  }

  start() {
    const ws = new WebSocket(this.url);
    this.ws = ws;

    ws.on("open", () => this.log("connected"));
    ws.on("error", (error) => this.log("socket error:", error.message));
    ws.on("close", () => {
      this.stopTimers();
      this.playing = false;
      this.log("disconnected");
    });
    ws.on("message", (raw, isBinary) => {
      if (isBinary) return;
      let message;
      try {
        message = JSON.parse(raw.toString());
      } catch {
        return;
      }
      if (!message || typeof message.type !== "string") return;
      this.onMessage(message.type, message.data);
    });
  }

  send(type, data) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    try {
      this.ws.send(JSON.stringify({ type, data }));
    } catch (error) {
      this.log("send failed:", error.message);
    }
  }

  every(ms, fn) {
    const id = setInterval(fn, ms);
    this.timers.add(id);
    return id;
  }

  stopTimers() {
    for (const id of this.timers) clearInterval(id);
    this.timers.clear();
  }

  onMessage(type, data) {
    switch (type) {
      case S2C.HELLO:
        this.log(`hello: phase=${data.phase} count=${data.count}/${data.max}`);
        // Also the replay path: after gameover everyone is un-joined.
        if (data.phase === "lobby") this.send(C2S.JOIN, { nickname: this.nickname });
        break;

      case S2C.JOINED:
        this.log(`joined as ${data.nickname}`);
        break;

      case S2C.LOBBY:
        this.log(
          `lobby ${data.count}/${data.max}` +
            (data.timer ? ` ${data.timer.kind} ${data.timer.secondsLeft}s` : ""),
        );
        break;

      case S2C.ERROR:
        this.log(`error: ${data.code} (${data.message})`);
        break;

      case S2C.CHAT:
        if (data.from) this.log(`chat <${data.from}> ${data.text}`);
        break;

      case S2C.START:
        this.log(`start: slot ${data.you} of ${data.players.length} players`);
        this.startPlaying();
        break;

      case S2C.GAMEOVER:
        this.log(
          `gameover: winner=${data.winner} ` +
            data.players.map((player) => `${player.nickname}:${player.lives}`).join(" "),
        );
        this.stopPlaying();
        break;

      default:
        break;
    }
  }

  startPlaying() {
    if (this.playing) return;
    this.playing = true;

    this.every(300, () => {
      const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
      this.send(C2S.INPUT, { dir });
    });
    this.every(2500, () => this.send(C2S.BOMB, {}));
  }

  stopPlaying() {
    this.stopTimers();
    this.playing = false;
  }

  stop() {
    this.stopTimers();
    try {
      this.ws?.close();
    } catch {
      // Already closed.
    }
  }
}

const isMain =
  process.argv[1] !== undefined &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    console.log(
      "Usage: node server/tools/bot.js --count 4 --prefix Bot [--url ws://localhost:8080]",
    );
  } else {
    const bots = Array.from(
      { length: options.count },
      (_, index) => new Bot(`${options.prefix}${index + 1}`, options.url),
    );

    console.log(`[bot] ${bots.length} bots connecting to ${options.url}`);
    for (const bot of bots) bot.start();

    process.once("SIGINT", () => {
      for (const bot of bots) bot.stop();
      setTimeout(() => process.exit(0), 100);
    });
  }
}

export { Bot, parseArgs };
