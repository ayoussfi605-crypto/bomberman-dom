# Task 04 — Frontend UI, Integration & Testing

**Owner:** Developer 4  
**Technology:** JavaScript, HTML, CSS, custom DOM framework, Socket.IO client

## Mission
Build the user-facing screens and integrate the lobby, game engine, combat
system, and Socket.IO communication.

## Step 1 — Nickname page
- Show a nickname input and Join button.
- Validate empty and overlong nicknames in the UI.
- Display server-side validation errors.
- Enter the lobby only after server acceptance.

## Step 2 — Waiting room
- Display the player's nickname and current count (up to four).
- Show connected players.
- Display server countdown updates.
- Include lobby chat and message input.
- Show errors when a room is full or cannot start.

## Step 3 — Game screen
- Render the fixed grid map with DOM elements.
- Display players and their positions.
- Show lives, bomb capacity, flame range, and speed upgrades.
- Display bombs, explosions, blocks, and power-ups.
- Show winner or draw when the match ends.

## Step 4 — Socket.IO integration
Use `socket.io-client`.
- Listen for lobby updates and countdown events.
- Send nickname and chat requests.
- Send movement and bomb-placement requests.
- Render authoritative state updates from the server.
- Handle connection loss, reconnection, and rejected actions.
- Remove listeners when views are destroyed.
- Avoid duplicate event handlers after navigation.

## Step 5 — Integration and testing
- Test with two, three, and four browser sessions.
- Test duplicate nicknames and invalid inputs.
- Test countdown cancellation and disconnects.
- Test chat and game-state synchronization.
- Test bombs, lives, power-ups, and victory conditions.
- Check console errors, keyboard controls, and performance.

## Suggested files
- `frontend/src/views/NicknamePage.js`
- `frontend/src/views/WaitingRoom.js`
- `frontend/src/views/GamePage.js`
- `frontend/src/views/GameOverPage.js`
- `frontend/src/components/Chat.js`
- `frontend/src/components/PlayerHUD.js`
- `frontend/src/services/SocketClient.js`
- `frontend/src/main.js`
- `frontend/src/styles/`

## Deliverables
Nickname screen, waiting room/chat, game UI, game-over screen, integration,
and a multiplayer test report.

## Acceptance checklist
- [ ] All screens use the custom DOM framework.
- [ ] UI reflects server-confirmed state.
- [ ] Lobby and game events work in multiple browsers.
- [ ] Errors and disconnects are handled.
- [ ] No duplicate Socket.IO listeners after navigation.
- [ ] No Canvas, WebGL, or prohibited UI frameworks.
- [ ] Tests cover the required mechanics.
