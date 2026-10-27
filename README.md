# 💣 Bomberman-DOM — 4-Developer Project Architecture & Fair Task Breakdown

A real-time multiplayer Bomberman arcade game built with a **Go WebSocket backend** and a **custom pure-DOM mini-framework frontend** (strictly **no Canvas**, **no WebGL**, and **no third-party UI libraries**), running at a verified **60 FPS**.

---

## 📑 Quick Navigation to Developer Tasks

| Developer | Role & Title | Assigned Files & Specs |
|---|---|---|
| **Dev 1** | **Multiplayer Networking, Lobby & Real-Time Chat** | [DEV_1_NETWORKING_LOBBY_CHAT.md](./DEV_1_NETWORKING_LOBBY_CHAT.md) / [Task_Lobby_WebSocket_Chat.md](./Task_Lobby_WebSocket_Chat.md) |
| **Dev 2** | **Map Generation, Mini-Framework DOM Renderer & 60 FPS Performance** | [DEV_2_DOM_ENGINE_MAP_60FPS.md](./DEV_2_DOM_ENGINE_MAP_60FPS.md) / [Task_Game_Engine_Performance.md](./Task_Game_Engine_Performance.md) |
| **Dev 3** | **Player Physics, Controls, Movement & Collision Engine** | [DEV_3_PLAYER_MOVEMENT_COLLISION.md](./DEV_3_PLAYER_MOVEMENT_COLLISION.md) / [Task_Architecture_Setup.md](./Task_Architecture_Setup.md) |
| **Dev 4** | **Bomb Mechanics, Explosion Raycasting, Power-Ups & Combat Rules** | [DEV_4_BOMBS_EXPLOSIONS_POWERUPS.md](./DEV_4_BOMBS_EXPLOSIONS_POWERUPS.md) / [Task_Mechanics_Powerups_Bonus.md](./Task_Mechanics_Powerups_Bonus.md) |

---

## ⚖️ Fairness & Workload Distribution Matrix

To guarantee **100% equity** across all 4 developers, the workload is distributed so that each developer owns approximately **25% of the total architecture**, solves distinct algorithmic problems, and has independent deliverables with zero deadlocks:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BOMBERMAN-DOM ARCHITECTURE                      │
├────────────────────┬────────────────────┬──────────────────────────────┤
│    DEVELOPER 1     │    DEVELOPER 2     │   DEVELOPER 3  &  DEV 4      │
│  Networking & Chat │   DOM Render & Map │     Physics   &    Combat      │
├────────────────────┼────────────────────┼──────────────────────────────┤
│ • Go WebSocket Hub │ • Mini-Framework   │ • Keyboard      • Bomb Fuse  │
│ • Matchmaking &    │   DOM Pipeline     │   Listeners     • 4-Way Ray- │
│   20s/10s Timers   │ • 60 FPS Game Loop │ • Sub-tile AABB   casting    │
│ • Real-time Chat   │ • Map Generator &  │   Collisions    • Power-Ups  │
│ • State Sync Bus   │   Corner Safezones │ • Corner Slide  • 3-Lives    │
│                    │ • Live FPS HUD     │ • Interpolation • Victory    │
└────────────────────┴────────────────────┴──────────────────────────────┘
```

| Developer | Core Domain | Algorithmic / Technical Challenge | Estimated Effort |
|---|---|---|:---:|
| **Dev 1** (Yaacoub) | Go Server, WebSockets, Matchmaking & Chat | Concurrent Go goroutines, thread-safe message hub, timer state machine (20s / 10s rules for 2–4 players), message serialization protocol. | **25%** |
| **Dev 2** | Mini-Framework DOM Renderer, 60 FPS Loop & Map | Rendering high-speed game entities using DOM virtual-nodes & CSS transforms without canvas/WebGL; 60 FPS performance profiling HUD; procedural map generator with corner safe zones. | **25%** |
| **Dev 3** | Player Entities, Input, Movement & Collision | Multi-key event loop tracking without OS lag; continuous sub-tile 2D coordinates; AABB collision detection against walls/blocks/bombs; bomb exit pass-through; corner-sliding math. | **25%** |
| **Dev 4** | Bombs, Raycasting Explosions, Power-Ups & Combat | 4-direction raycasting with obstacle stopping rules; recursive bomb chain reactions; block loot table (Bombs, Flames, Speed); player hit detection, invulnerability frames, 3 lives & win condition. | **25%** |

---

## 🎮 Subject Requirements & Compliance Checklist

### 1. Multiplayer & Gameplay Rules
- [x] **2 to 4 Players:** Support 2, 3, or 4 players connected simultaneously.
- [x] **3 Lives per Player:** Each player starts with 3 lives. When lives hit 0, the player is eliminated.
- [x] **Last Man Standing:** The match continues until only 1 player remains victorious.
- [x] **Corner Starting Positions:** The 4 players spawn in the 4 corners:
  - Player 1: Top-Left `(1, 1)`
  - Player 2: Top-Right `(mapWidth - 2, 1)`
  - Player 3: Bottom-Left `(1, mapHeight - 2)`
  - Player 4: Bottom-Right `(mapWidth - 2, mapHeight - 2)`
- [x] **Safe Spawn Zones:** At each corner, the spawn tile and its two adjacent movement tiles are guaranteed empty so players can drop a bomb and dodge the blast safely.

### 2. Strict 60 FPS Performance Policy (CRITICAL)
- [x] **Strictly NO Canvas & NO WebGL:** The entire game is rendered using DOM elements via the team's custom `mini-framework`.
- [x] **Rock-Solid 60 FPS:** Game runs at >= 60 FPS at all times with zero frame drops.
- [x] **Proper use of `requestAnimationFrame`:** Animation and physics loops run on rAF.
- [x] **Performance Measurement HUD:** Real-time on-screen FPS counter and frame-time monitor.
- [x] **DevTools Profiling:** Code verified using Chrome and Firefox Performance Profilers.

### 3. Matchmaking & Lobby Flow
- [x] **Nickname Entry Screen:** Welcome screen prompting the user for a nickname.
- [x] **Waiting Room:** Live counter displaying joined players (1 to 4).
- [x] **Timer Rule 1 (>= 2 players waiting):** If 2 or 3 players join and 4 players are not reached before 20s, a 10s countdown timer starts, then the game launches.
- [x] **Timer Rule 2 (4 players reached):** If 4 players join before 20s, the 10s countdown timer immediately triggers, then the game launches.

### 4. Real-Time Chat System
- [x] Built over WebSockets ("Hello World" of multiplayer).
- [x] Allows players to chat in the waiting lobby and during the active match.

### 5. Power-Up System
- [x] Destroying a destructible block has an RNG chance to drop:
  - **Bombs (+1):** Increases the maximum number of bombs a player can drop at a time.
  - **Flames (+1):** Increases the explosion range in all 4 directions by 1 block.
  - **Speed (+1):** Increases the player's movement speed.

> **Note on Scope:** Built strictly for the core mandatory subject requirements (**without bonus features**).

---

## 📡 Shared WebSocket Protocol (`type` + `payload`)

```json
{
  "type": "MESSAGE_TYPE",
  "payload": { ... }
}
```

```
Client                                                  Server
  │                                                       │
  ├─── JOIN_LOBBY {"nickname": "Alice"} ─────────────────►│
  │◄── LOBBY_UPDATE {"players": [...], "count": 2} ───────┤
  │                                                       │
  │    (Timer reaches countdown or 4 players join)        │
  │◄── COUNTDOWN_TICK {"seconds": 10} ────────────────────┤
  │◄── GAME_START {"seed": 101, "players": [...]} ────────┤
  │                                                       │
  ├─── PLAYER_MOVE {"id": "p1", "x": 1.5, "y": 1.0} ──────►│
  │◄── PLAYER_MOVE (Broadcast to all clients) ────────────┤
  │                                                       │
  ├─── BOMB_PLACED {"x": 1, "y": 1, "flameRange": 2} ────►│
  │◄── BOMB_PLACED (Broadcast to all clients) ────────────┤
  │                                                       │
  │◄── BOMB_EXPLODED {"bombId": "...", "flames": [...]} ──┤
  │◄── PLAYER_HIT {"id": "p2", "remainingLives": 2} ──────┤
  │◄── GAME_OVER {"winnerId": "p1", "name": "Alice"} ─────┤
```

---

## 🚀 Running the Project

### 1. Start the Go Backend Server
```bash
cd backend
go run ./cmd/server
# WebSocket server listens on http://localhost:8080 (and ws://localhost:8080/ws)
```

### 2. Open the Game in Browsers
Open `http://localhost:8080` in 2 to 4 separate browser windows or tabs:
1. Enter unique nicknames in each tab (e.g. `Bomber1`, `Bomber2`).
2. Observe the lobby counter update in real-time.
3. Test the real-time chat box.
4. Watch the 20s / 10s countdown timer trigger the game start.
5. Play the game at 60 FPS using Arrow Keys / WASD and Spacebar!
