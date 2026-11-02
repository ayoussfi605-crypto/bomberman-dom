# Task 01 — Lobby, WebSockets, Matchmaking & Chat  => YAAKOUB

**Owner:** Developer 1  
**Technology:** Node.js, Socket.IO, JavaScript

## Mission
Build the multiplayer server, manage player connections, implement the waiting
room and countdown, and provide real-time chat.

## Step 1 — Server setup
- Create `backend/src/server.js`.
- Initialize an HTTP server and attach Socket.IO.
- Configure connection and disconnection handlers.
- Keep server configuration separate from game logic.

## Step 2 — Player identity
- Accept a nickname from the client.
- Reject empty or whitespace-only nicknames.
- Limit nicknames to 16 characters.
- Prevent duplicate active nicknames using case-insensitive comparison.
- Assign each connection a unique server-side player ID.
- Do not trust identity fields sent by clients after joining.

## Step 3 — Lobby state machine
Use `WAITING`, `COUNTDOWN`, `PLAYING`, and `FINISHED` states.
- Allow 2–4 players per match.
- Broadcast the current player count.
- Reject joins when full or when a match has started.
- Start a 20-second initial waiting period.
- If the lobby reaches four players before that period expires, begin a
  10-second countdown immediately.
- If the initial waiting period expires with at least two players, begin the
  10-second countdown.
- If fewer than two players remain, keep waiting for enough players.
- Cancel/reset timers safely when the lobby becomes invalid.
- Broadcast countdown updates and match start.

## Step 4 — Real-time chat
- Implement lobby chat with Socket.IO.
- Validate message type and length.
- Broadcast nickname, message, and server-generated timestamp.
- Reject messages from users not in the lobby.
- Safely render message text in the frontend.

## Step 5 — Disconnect handling
- Remove disconnected players from the lobby.
- Broadcast updated player counts.
- Clear nickname reservations and timers.
- Handle disconnects during countdown and gameplay.
- Notify the game module so it can handle forfeits and victory.

## Suggested files
- `backend/src/server.js`
- `backend/src/socket/registerSocketHandlers.js`
- `backend/src/lobby/LobbyManager.js`
- `backend/src/lobby/Matchmaking.js`
- `backend/src/chat/ChatService.js`

## Deliverables
- Working Socket.IO server, nickname validation, lobby/countdown, chat,
  disconnect handling, and basic tests.

## Acceptance checklist
- [ ] Two to four players can join.
- [ ] Duplicate nicknames are rejected.
- [ ] Lobby count is synchronized.
- [ ] Countdown rules work correctly.
- [ ] Chat messages reach lobby members.
- [ ] Disconnects do not leave stale players or timers.
- [ ] Server validates important client requests.

## Coordination
Read `docs/SOCKET_PROTOCOL.md` before defining event names or payloads.
Coordinate with Developer 3 on game-start and game-end events.
