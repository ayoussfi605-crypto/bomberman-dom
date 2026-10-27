# Developer 1 — Multiplayer Networking, Lobby System & Real-Time Chat <YAKOB>

**Assigned to:** Yaacoub (Developer 1)  
**Domain:** Backend (Go), WebSockets, Lobby Matchmaking State Machine, In-Game & Lobby Chat, Network Message Protocol

---

## 🎯 Mission

Build the Go WebSocket server and client networking layer, implement the player onboarding (nickname entry), the lobby waiting room with strict matchmaking timer rules (20s / 10s rules for 2–4 players), the real-time chat feature ("Hello World" of multiplayer), and the network message serialization protocol to synchronize gameplay events across all connected clients.

---

## ⚖️ Why This Workload is Fair & Balanced

Developer 1 owns the **entire networking backbone and lobby orchestration**:
1. **Concurrent Go Backend:** Goroutine-safe WebSocket Hub and Client connections handling concurrency with channels and mutexes.
2. **Deterministic Matchmaking Logic:** Strict multi-stage timer state machine (20s countdown, 10s countdown, 2–4 players threshold, disconnect handling).
3. **Real-Time Chat:** Bidirectional chat in the lobby and during the game over WebSockets.
4. **Multiplayer Protocol Architecture:** Establishing the JSON message contract used by Developers 2, 3, and 4 to synchronize player movement, bombs, block destruction, and player deaths.

---

## 📐 Public Contract & Network Protocols

### WebSocket JSON Message Specification (`backend/internal/ws/message.go` & `frontend/src/services/websocket.js`)

All messages between client and server follow a tagged JSON structure:

```json
{
  "type": "MESSAGE_TYPE",
  "payload": { ... }
}
```

#### Core Message Types:

| Message Type | Direction | Payload Structure | Description |
|---|---|---|---|
| `JOIN_LOBBY` | Client ➔ Server | `{ "nickname": "BomberKing" }` | Sent after user submits nickname |
| `LOBBY_UPDATE` | Server ➔ Client | `{ "players": [{"id":"p1","nickname":"Alice","corner":0}], "playerCount": 1, "maxPlayers": 4, "state": "WAITING", "timer": 20 }` | Broadcasted on player join/leave and timer tick |
| `CHAT_MESSAGE` | Bidirectional | `{ "id": "msg_123", "sender": "Alice", "text": "Good luck!", "timestamp": 1730030000 }` | Real-time chat in lobby and game |
| `GAME_START` | Server ➔ Client | `{ "seed": 42, "players": [...], "grid": [[...]] }` | Broadcasted when 10s countdown reaches 0 |
| `PLAYER_MOVE` | Bidirectional | `{ "id": "p1", "x": 1.25, "y": 1.0, "dir": "down" }` | Local player moves; server broadcasts to others |
| `BOMB_PLACED` | Bidirectional | `{ "bombId": "b_1", "playerId": "p1", "x": 1, "y": 1, "flameRange": 2 }` | Player drops bomb |
| `BOMB_EXPLODED` | Bidirectional | `{ "bombId": "b_1", "flameTiles": [{"x":1,"y":1}, {"x":1,"y":2}], "destroyedBlocks": [{"x":1,"y":3, "powerUp": "flame"}] }` | Explosion propagation & loot drops |
| `PLAYER_HIT` | Bidirectional | `{ "playerId": "p2", "remainingLives": 2 }` | Player caught in explosion |
| `GAME_OVER` | Server ➔ Client | `{ "winnerId": "p1", "winnerName": "Alice" }` | Match finished |

---

## 🛠️ Step-by-Step Tasks

### Phase 1: Go WebSocket Server & Connection Hub
- [ ] Implement Go HTTP server with static file serving in `backend/cmd/server/main.go` and `backend/internal/server/router.go`.
- [ ] Create `backend/internal/ws/client.go` with websocket upgrader (`gorilla/websocket` or Go standard `golang.org/x/net/websocket`).
- [ ] Implement concurrent `backend/internal/ws/hub.go` managing registered clients, unregistering on disconnect, and broadcasting packets safely.
- [ ] Add ping/pong heartbeat to detect closed client connections and avoid stale sockets.

### Phase 2: Player Onboarding & Nickname Validation
- [ ] Implement `frontend/src/views/NicknameView.js` using the team's mini-framework (`h()` and state store).
- [ ] Validate nickname client-side (non-empty, 2–15 characters, alphanumeric).
- [ ] Submit nickname, initialize WebSocket connection via `frontend/src/services/websocket.js`, and store player identity in global store.

### Phase 3: Waiting Lobby & Timer Matchmaking State Machine
- [ ] Build `frontend/src/views/WaitingRoom.js` and `frontend/src/components/PlayerCounter.js`.
- [ ] Display real-time player list and counter: **"Players: N / 4"**.
- [ ] Implement backend lobby room state machine in `backend/internal/lobby/matchmaker.go`:
  - **Counter Rule 1:** Counter increments by 1 as users join. Maximum is 4 players.
  - **Timer Rule A (>= 2 players waiting):** If 2 or 3 players join and 4 players are not reached before 20 seconds, start a **10-second countdown timer** to prepare players for the match.
  - **Timer Rule B (4 players reached):** If 4 players join before the 20-second timer finishes, immediately trigger the **10-second countdown timer**.
  - **Start Match:** Once the 10-second countdown timer reaches 0, broadcast `GAME_START` and transition all clients to the game screen.
  - **Disconnect Grace Period:** If a player leaves during the countdown and active players fall below 2, pause/cancel the countdown and wait for more players.

### Phase 4: Real-Time Chat System ("Hello World" of Multiplayer)
- [ ] Implement `frontend/src/components/ChatBox.js` using mini-framework components and events.
- [ ] Create message input with `onSubmit` / `onKeyDown` (Enter to send).
- [ ] Render scrollable message history with distinct timestamps, usernames, and system notifications ("Player Alice joined the room").
- [ ] Ensure the chat remains accessible during the live game match without stealing game movement controls.

### Phase 5: Multiplayer Synchronization Bridge
- [ ] Coordinate with Dev 2, Dev 3, and Dev 4 on message dispatching.
- [ ] Forward local player inputs/actions (`PLAYER_MOVE`, `BOMB_PLACED`) to the server.
- [ ] Handle incoming server broadcasts to update the reactive store so Dev 2 and Dev 3 can update the UI at 60 FPS without network lag.

---

## 📦 Deliverables & File Locations

- `backend/cmd/server/main.go` — Go server entry point.
- `backend/internal/ws/hub.go` & `client.go` — WebSocket hub and client handlers.
- `backend/internal/ws/message.go` — Message schemas and JSON serializers.
- `backend/internal/lobby/room.go` & `matchmaker.go` — Lobby matchmaking & timer state machine.
- `frontend/src/services/websocket.js` — Client WebSocket service with event emitter.
- `frontend/src/views/NicknameView.js` — Nickname entry screen.
- `frontend/src/views/WaitingRoom.js` — Waiting room screen with counter & countdown.
- `frontend/src/components/ChatBox.js` — Real-time chat box component.
- `frontend/src/components/PlayerCounter.js` — Player count badge and countdown timer widget.

---

## ✅ Definition of Done

- [ ] Go backend compiles and runs cleanly with `go run ./cmd/server`.
- [ ] Player can enter a nickname and transition into the waiting room.
- [ ] Up to 4 players can connect from different browser tabs/devices.
- [ ] Player counter accurately reflects joined players (1 to 4).
- [ ] 20-second wait timer and 10-second countdown timer trigger strictly according to subject rules.
- [ ] Real-time chat messages appear instantly across all connected player tabs.
- [ ] `GAME_START` event is broadcasted simultaneously to all clients when timer finishes.
