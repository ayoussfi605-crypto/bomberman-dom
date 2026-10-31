# Bomberman DOM

Multiplayer Bomberman-style game built with a custom DOM framework,
Node.js, Socket.IO, HTML, CSS, and JavaScript.

## Requirements
- 2–4 players per match; three lives each.
- Fixed grid with destructible blocks and indestructible walls.
- Bombs, explosions, and power-ups.
- Real-time multiplayer synchronization and chat.
- Last player alive wins.
- Efficient DOM rendering targeting 60 FPS.
- No Canvas, WebGL, React, Vue, or Angular.

## Structure
- `backend/`: Node.js and Socket.IO server.
- `frontend/`: custom DOM framework, game engine, UI, and rendering.
- `docs/`: shared technical documentation.

## Backend setup
```bash
cd backend
npm init -y
npm install socket.io
npm install --save-dev nodemon
```

The frontend should use a browser-compatible development server and install
`socket.io-client`.

## Development order
1. Read `docs/SOCKET_PROTOCOL.md`.
2. Implement lobby and connection lifecycle.
3. Implement map and game engine.
4. Implement bombs, combat, and power-ups.
5. Integrate UI and test multiplayer gameplay.

See the four task files for developer responsibilities.
