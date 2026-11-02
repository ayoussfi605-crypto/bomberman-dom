// shared/constants.js
// Shared contract. Coordinate changes with consumers and docs/PROTOCOL.md.
// Server imports are relative to their module; browsers use /shared/constants.js.

// ---------------------------------------------------------------- Map
export const COLS = 15;
export const ROWS = 13;

// Tile codes. The server sends the map as a flat array of these ints, row-major:
// index = y * COLS + x.  Hidden power-ups under BLOCKs are NEVER sent (a BLOCK always looks like a BLOCK).
export const TILE = Object.freeze({
  FLOOR: 0,
  WALL: 1, // indestructible: border + pillars at (x even, y even)
  BLOCK: 2, // destructible
  BOMB: 3,
  FLAME: 4,
  POWERUP_BOMB: 5,
  POWERUP_FLAME: 6,
  POWERUP_SPEED: 7,
});

// Starting corner (cell coordinates) for each player slot.
// Slot order is chosen so that a 2-player game starts on opposite corners.
export const CORNER_BY_SLOT = Object.freeze([
  { x: 1, y: 1 }, //               slot 0: top-left
  { x: COLS - 2, y: ROWS - 2 }, // slot 1: bottom-right
  { x: COLS - 2, y: 1 }, //        slot 2: top-right
  { x: 1, y: ROWS - 2 }, //        slot 3: bottom-left
]);
// Safe zone = the corner cell + SAFE_ZONE_ARM cells along each edge. Never contains a BLOCK.
export const SAFE_ZONE_ARM = 3; // exceeds BASE_RANGE: reserve an escape beyond the first blast

// ---------------------------------------------------------------- Directions
export const DIR = Object.freeze({ UP: "up", DOWN: "down", LEFT: "left", RIGHT: "right" });

// ---------------------------------------------------------------- Lobby / players
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;
export const LOBBY_WAIT_MS = 20000; // starts when the 2nd player joins
export const LOBBY_COUNTDOWN_MS = 10000; // "get ready" countdown
export const NICK_MIN = 2;
export const NICK_MAX = 12;
export const NICK_REGEX = /^[A-Za-z0-9_-]+$/;
export const CHAT_MAX_LEN = 200;
export const CHAT_RATE_MAX = 5; // messages ...
export const CHAT_RATE_WINDOW_MS = 5000; // ... per window
export const MAX_MESSAGE_BYTES = 1024; // client -> server
export const MAX_MESSAGES_PER_SECOND = 60; // client -> server, per socket

// ---------------------------------------------------------------- Simulation
export const TICK_RATE = 30; // server simulation + snapshot rate (Hz)
export const TICK_MS = 1000 / TICK_RATE;
export const INTERP_DELAY_MS = 66;
export const SNAPSHOT_HISTORY_MS = 500;
export const SNAPSHOT_STALE_MS = 250;

export const LIVES = 3;
export const INVULN_MS = 2000; // after taking a hit (prevents losing 2+ lives to one explosion)
export const BOMB_FUSE_MS = 2000;
export const FLAME_MS = 500;

export const PLAYER_HITBOX_HALF = 0.35; // hitbox is 0.7 x 0.7 tiles
export const CORNER_ASSIST = 0.3; // max off-centre distance (tiles) that gets auto-nudged around corners
export const BASE_SPEED = 3.5; // tiles per second
export const SPEED_STEP = 0.6; // added per speed power-up
export const MAX_SPEED_LEVEL = 3;
export const BASE_BOMBS = 1;
export const MAX_BOMBS = 5;
export const BASE_RANGE = 2; // flame length in each direction, in tiles
export const MAX_RANGE = 6;

export const BLOCK_DENSITY = 0.7; // chance that an eligible floor cell becomes a BLOCK
export const POWERUP_CHANCE = 0.3; // share of blocks hiding a power-up
export const POWERUP_MIN_PER_TYPE = 2; // guaranteed minimum of each type (audit: "at least 3 types")

// ---------------------------------------------------------------- Protocol (see PROTOCOL.md)
export const C2S = Object.freeze({ JOIN: "join", CHAT: "chat", INPUT: "input", BOMB: "bomb" });
export const S2C = Object.freeze({
  HELLO: "hello",
  JOINED: "joined",
  ERROR: "error",
  LOBBY: "lobby",
  CHAT: "chat",
  START: "start",
  TILES: "tiles",
  SNAPSHOT: "snapshot",
  GAMEOVER: "gameover",
});
export const ERR = Object.freeze({
  BAD_MESSAGE: "BAD_MESSAGE",
  UNKNOWN_TYPE: "UNKNOWN_TYPE",
  NICK_INVALID: "NICK_INVALID",
  NICK_TAKEN: "NICK_TAKEN",
  ROOM_FULL: "ROOM_FULL",
  GAME_IN_PROGRESS: "GAME_IN_PROGRESS",
  ALREADY_JOINED: "ALREADY_JOINED",
  NOT_JOINED: "NOT_JOINED",
  RATE_LIMITED: "RATE_LIMITED",
});
