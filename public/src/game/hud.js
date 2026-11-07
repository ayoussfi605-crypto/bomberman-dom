import { h } from "../framework/index.js";

let _cache = null;
let _cacheKey = "";

function buildKey(players, me) {
  const base = players
    .map(p => `${p.slot}:${p.nickname}:${p.lives}:${p.alive}`)
    .join("|");
  const myStats = me ? `${me.maxBombs}:${me.range}:${me.speedLevel}` : "null";
  return `${base}|${myStats}`;
}

function hearts(n) {
  return "\u2665".repeat(Math.max(0, n));
}

function playerRow(p, isMe) {
  const children = [
    h("span", { class: `nick p${p.slot}` }, p.nickname ?? `P${p.slot + 1}`),
    h("span", { class: "lives" }, p.alive ? hearts(p.lives) : "eliminated"),
  ];

  if (isMe && p.alive) {
    children.push(
      h("span", { class: "stats" },
        `B:${p.maxBombs}  F:${p.range}  S:${p.speedLevel}`
      )
    );
  }

  return h("div", { class: `hud-player${isMe ? " hud-me" : ""}` }, ...children);
}

export function hudVNode(frame, mySlot) {
  const players = frame.players.filter(p => p.present !== false);
  const me = players.find(p => p.slot === mySlot);
  const key = buildKey(players, me);

  if (key === _cacheKey && _cache !== null) return _cache;

  const rows = players.map(p => playerRow(p, p.slot === mySlot));
  const banner = me && !me.alive
    ? h("div", { class: "spectating" }, "You are out \u2014 spectating")
    : null;

  _cache = h("div", { class: "hud" }, ...rows, banner);
  _cacheKey = key;
  return _cache;
}
