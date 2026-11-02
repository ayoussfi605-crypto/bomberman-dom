# Task 04 — Frontend Rendering, UI & Integration
**Owner:** Developer 4  
**Technology:** JavaScript, HTML, CSS, Custom DOM Framework, Socket.IO Client
## Mission
Build the complete Frontend interface of the Bomberman game.

Implement DOM-based map and player rendering, visual animations, game screens, HUD, and Frontend/Backend integration.

The Frontend is responsible for displaying the game and handling user input. All game rules, game-state validation, movement logic, collision detection, bombs, explosions, combat, and power-up mechanics are handled by the Backend developers.
## Step 1 — Nickname Page
- Show a nickname input and Join button.
- Validate empty and overlong nicknames in the UI.
- Send the nickname to the Backend.
- Display server-side validation errors.
- Enter the lobby only after server acceptance.
## Step 2 — Waiting Room
- Display the player's nickname and current player count (up to four).
- Show connected players.
- Display server countdown updates.
- Include lobby chat and message input.
- Show errors when a room is full or cannot start.
## Step 3 — DOM Map Rendering
- Render the game map using DOM elements.
- Display the grid, indestructible walls, and destructible blocks.
- Convert grid coordinates into screen positions.
- Update the map when new game-state updates arrive.
- Update only the elements that have changed.
- Avoid recreating the entire map on every update.
## Step 4 — Player Rendering & Animations
- Display all players on the map.
- Display player positions received from the Backend.
- Convert player grid coordinates into screen positions.
- Implement visual movement animations.
- Display player lives and upgrades.
- Display bomb capacity, flame range, and speed received from the Backend.
## Step 5 — Frontend Game Loop
- Use `requestAnimationFrame()` for smooth visual updates.
- Manage player and game-element animations.
- Keep visual updates synchronized with the latest game state.
- Separate visual rendering from Backend game logic.
## Step 6 — Game Entities Rendering
- Display bombs received from the Backend.
- Display explosions and their visual effects.
- Display power-ups on the map.
- Update or remove visual elements when the Backend sends new state updates.
**Important:** This step handles visual representation only. Bomb timers, explosion propagation, player damage, and power-up effects are not Developer 4's responsibility.
## Step 7 — Game Interface & HUD
- Build the main game screen.
- Create the Player HUD.
- Display player statistics and match information.
- Display lives, upgrades, and scores.
- Show winner or draw when the match ends.
- Handle eliminated players in the interface.
## Step 8 — Socket.IO Integration
Use `socket.io-client`.
- Listen for lobby updates and countdown events.
- Send nickname and chat requests.
- Receive authoritative game-state updates.
- Display player positions received from the server.
- Send player movement inputs to the Backend.
- Handle connection loss and reconnection.
- Handle rejected actions and errors.
- Remove listeners when views are destroyed.
- Avoid duplicate Socket.IO listeners after navigation.
## Step 9 — DOM Performance
- Avoid unnecessary DOM updates.
- Update only elements that have changed.
- Avoid recreating the entire game map.
- Keep animations smooth during gameplay.
- Optimize rendering when multiple players and game entities are present.
## Step 10 — Integration and Testing
- Test with two, three, and four browser sessions.
- Test duplicate nicknames and invalid inputs.
- Test countdown cancellation and disconnects.
- Test chat and game-state synchronization.
- Test visual player movement.
- Test the display of bombs, explosions, lives, and power-ups.
- Check console errors and keyboard controls.
- Verify that the interface remains responsive.
## Suggested Files
`frontend/src/views/`
```text
├── NicknamePage.js
├── WaitingRoom.js
├── GamePage.js
└── GameOverPage.js
```
`frontend/src/components/`
```text
├── Chat.js
├── PlayerHUD.js
├── GameBoard.js
├── GridView.js
├── PlayerView.js
├── BombView.js
├── ExplosionView.js
└── PowerUpView.js
```
`frontend/src/game/`
```text
├── GameRenderer.js
├── MapRenderer.js
└── GameLoop.js
```
`frontend/src/services/`
```text
└── SocketClient.js
```
`frontend/src/styles/`
```text
├── game.css
├── lobby.css
└── components.css
```
## Deliverables
- Nickname screen.
- Waiting room and chat interface.
- DOM-based map rendering.
- Grid and wall visualization.
- Player visual representation and animations.
- Bomb, explosion, and power-up visualization.
- Frontend game loop.
- Game HUD.
- Game-over screen.
- Frontend/Backend integration.
- Multiplayer testing report.
## Acceptance Checklist
- [ ] All screens use the custom DOM framework.
- [ ] No Canvas or WebGL.
- [ ] Map is rendered using DOM elements.
- [ ] Grid, walls, and blocks are displayed correctly.
- [ ] Players are displayed at their correct positions.
- [ ] Player movement is visually updated.
- [ ] Bombs, explosions, and power-ups are displayed.
- [ ] Frontend uses `requestAnimationFrame()` for visual updates.
- [ ] UI reflects server-confirmed game state.
- [ ] DOM updates are optimized.
- [ ] No duplicate Socket.IO listeners after navigation.
- [ ] Errors and disconnects are handled.
- [ ] Tests cover the required mechanics.
## Responsibilities Boundary
**Developer 4 is responsible for:**
- Frontend DOM rendering.
- Map and grid visualization.
- Player rendering and animations.
- Frontend Game Loop.
- Bomb, explosion, and power-up visualization.
- HUD and UI screens.
- Socket.IO Client integration.
- DOM performance and Frontend testing.
**Developer 4 is NOT responsible for:**
- Map generation logic.
- Player movement validation.
- Collision detection logic.
- Backend Game State Management.
- Bomb placement and timers.
- Explosion propagation and mechanics.
- Player damage and lives management logic.
- Power-up logic and effects.
- Game rules and Backend game logic.

All game logic and validation remain the responsibility of the corresponding Backend developers.