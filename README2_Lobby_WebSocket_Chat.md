# README 2: Lobby, WebSocket Chat & Multiplayer Synchronization => YAAKOUB

## Overview
This phase implements the player onboarding flow (nickname entry, waiting room timer mechanics), the WebSocket communication layer in Go, and the real-time chat feature serving as the multiplayer foundation.

---

## Step-by-Step Tasks

### Phase 2.1: Onboarding & Nickname Selection
1. Create the welcome view where users input their display nickname with client-side validation (non-empty, max length, unique check).
2. Store the nickname in the local application state and transition the user to the waiting room view upon submission.

### Phase 2.2: Waiting Room & Matchmaking Logic
1. Implement the waiting room player counter UI (tracking 1 to 4 players).
2. Set up server-side room management:
   * **Rule 1:** When 4 players join before 20 seconds, start a 10-second countdown leading directly into the game.
   * **Rule 2:** If between 2 and 3 players are connected when the 20-second timer expires, trigger a final 10-second countdown before launching the game with current players.
3. Synchronize timer states across all connected clients via WebSockets.

### Phase 2.3: WebSocket Hub & Real-Time Chat
1. Build the Go WebSocket `Hub` and `Client` goroutines to manage concurrent connections and message broadcasting.
2. Implement message serialization/deserialization protocols (JSON payloads with `type` fields like `JOIN`, `CHAT`, `START`, `MOVE`, `BOMB`).
3. Build the in-game / lobby chat UI component allowing players to exchange messages in real time.

---

## Folder Structures

### Frontend Folder Structure (`frontend/`)
```text
frontend/
└── src/
    ├── services/
    │   └── websocket.js    # WebSocket client connection & event emitter
    ├── components/
    │   ├── ChatBox.js      # Real-time chat UI component
    │   └── PlayerCounter.js# Waiting room counter & timer component
    └── views/
        ├── NicknameView.js # Enter nickname screen
        └── WaitingRoom.js  # Lobby waiting screen
```

### Backend Folder Structure (`backend/`)
```text
backend/
└── internal/
    ├── lobby/
    │   ├── matchmaker.go   # Timer logic (20s / 10s rules)
    │   └── player.go       # Player session model
    └── ws/
        ├── message.go      # JSON event payload definitions
        └── hub.go          # Broadcast & room management hub
```
