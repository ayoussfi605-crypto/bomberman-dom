# Task 04 — Frontend UI, DOM Rendering & Integration
**Owner:** Developer 4
**Technology:** JavaScript, HTML, CSS, custom DOM framework, Socket.IO client

## Mission
Build all user-facing screens, implement DOM-based game rendering, display game entities and integrate the frontend with the backend and game engine.

## Step 1 — Nickname page
- Show a nickname input and Join button.
- Validate empty and overlong nicknames in the UI.
- Display server-side validation errors.
- Enter the lobby only after server acceptance.
## Step 2 — Waiting room
- Display the player's nickname and current player count (up to four).
- Show connected players.
- Display server countdown updates.
- Include lobby chat and message input.
- Show errors when a room is full or cannot start.
## Step 3 — DOM game rendering
- Render the fixed grid map using DOM elements.
- Display indestructible walls and destructible blocks.
- Display players and their positions.
- Display bombs, explosions and power-ups.
- Update only the elements that have changed.
- Avoid recreating the entire map on every update.
## Step 4 — Player visual representation
- Convert grid coordinates into screen positions.
- Update player positions visually.
- Implement player movement animations.
- Display player lives and upgrades.
- Display bomb capacity, flame range and speed.
## Step 5 — Game interface
- Build the main game screen.
- Create the Player HUD.
- Display player statistics and match information.
- Show winner or draw when the match ends.
- Handle eliminated players in the interface.
## Step 6 — Socket.IO integration
Use socket.io-client.
- Listen for lobby updates and countdown events.
- Send nickname and chat requests.
- Receive authoritative game-state updates.
- Display player positions received from the server.
- Handle connection loss and reconnection.
- Handle rejected actions and errors.
- Remove listeners when views are destroyed.
- Avoid duplicate Socket.IO listeners after navigation.
## Step 7 — Integration and testing
- Test with two, three and four browser sessions.
- Test duplicate nicknames and invalid inputs.
- Test countdown cancellation and disconnects.
- Test chat and game-state synchronization.
- Test movement, bombs, lives and power-ups.
- Check console errors and keyboard controls.
- Verify that the interface remains responsive.

`Suggested files`
frontend/src/views/
├── NicknamePage.js
├── WaitingRoom.js
├── GamePage.js
└── GameOverPage.js

`frontend/src/components/`
├── Chat.js
├── PlayerHUD.js
├── GameBoard.js
├── PlayerView.js
├── BombView.js
└── PowerUpView.js

`frontend/src/services/`
 └── SocketClient.js

`frontend/src/styles/`

## Deliverables
- Nickname screen.
- Waiting room and chat interface.
- DOM-based game rendering.
- Player visual representation and animations.
- Game HUD.
- Game-over screen.
- Frontend/backend integration.
- Multiplayer testing report.

## Acceptance checklist
- [ ] All screens use the custom DOM framework.
- [ ] No Canvas or WebGL.
- [ ] Map is rendered using DOM elements.
- [ ] Players, bombs, explosions and power-ups are displayed.
- [ ] UI reflects server-confirmed game state.
- [ ] Player movement is visually updated.
- [ ] No duplicate Socket.IO listeners after navigation.
- [ ] Errors and disconnects are handled.
- [ ] Tests cover the required mechanics.