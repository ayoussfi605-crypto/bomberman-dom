import os

# Define the contents of each README file
readmes = {
    "README1_Architecture_Setup.md": """# README 1: Architecture, Project Setup & Custom Framework Integration

## Overview
This phase covers setting up the core repository structure, initializing the Go backend server, integrating your custom lightweight JavaScript mini-framework (with its virtual DOM, hyperscript `h` functions, and reactive state management), and establishing the base UI layout.

---

## Step-by-Step Tasks

### Phase 1.1: Repository & Workspace Setup
1. Initialize a monorepo structure with distinct `backend/` (Go) and `frontend/` (Vanilla JS / Mini-Framework) directories.
2. Set up a root `Makefile` or `docker-compose.yml` to spin up both the Go server and the frontend development server simultaneously.
3. Configure `.gitignore` for Go binaries, node modules, build artifacts, and IDE configurations.

### Phase 1.2: Go Backend Foundation
1. Initialize a Go module (`go mod init bomberman-dom`).
2. Set up the basic HTTP server using Go's standard library (`net/http.ServeMux`).
3. Configure static file serving for the frontend build assets.
4. Set up basic logging and middleware for request handling.

### Phase 1.3: Mini-Framework Integration & Styling
1. Import or link your custom mini-framework into the `frontend/src/framework/` directory.
2. Verify core framework modules:
   * Hyperscript rendering function (`h`).
   * Virtual DOM differ and patch engine.
   * Event listener attachment and reactive state bindings.
3. Establish global CSS styling (retro arcade theme, dark mode, CSS grid layouts for the game board and chat UI).

---

## Folder Structures

### Frontend Folder Structure (`frontend/`)
```text
frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── framework/          # Your custom mini-framework
│   │   ├── vdom.js
│   │   ├── hyperscript.js
│   │   └── router.js
│   ├── components/         # Reusable UI components
│   │   ├── Button.js
│   │   └── Modal.js
│   ├── views/              # Page views (Home, Lobby, Game, Results)
│   │   ├── HomeView.js
│   │   ├── LobbyView.js
│   │   └── GameView.js
│   ├── state/              # Global state & store
│   │   └── store.js
│   ├── styles/             # CSS / SCSS stylesheets
│   │   └── main.css
│   └── app.js              # Application entry point
├── package.json
└── README.md
```

### Backend Folder Structure (`backend/`)
```text
backend/
├── cmd/
│   └── server/
│       └── main.go         # Application entry point
├── internal/
│   ├── server/             # HTTP router & server setup
│   │   └── router.go
│   ├── lobby/              # Player matchmaking & room state
│   │   └── room.go
│   └── ws/                 # WebSocket hub & client connections
│       ├── client.go
│       └── hub.go
├── go.mod
├── go.sum
└── README.md
```
""",
    "README2_Lobby_WebSocket_Chat.md": """# README 2: Lobby, WebSocket Chat & Multiplayer Synchronization

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
""",
    "README3_Game_Engine_Performance.md": """# README 3: Game Engine, DOM Rendering (No Canvas) & Performance (60 FPS)

## Overview
This phase builds the core game engine using **pure DOM manipulation** (strictly no Canvas, WebGL, or heavy external frameworks). It implements the fixed grid map, player movement mechanics, collision detection, bomb placement, explosion physics, and strict 60 FPS performance optimization using `requestAnimationFrame`.

---

## Step-by-Step Tasks

### Phase 3.1: Map Generation & Grid DOM Rendering
1. Design a fixed grid map (e.g., 13x13 or 15x13) containing:
   * **Walls:** Indestructible perimeter and interior pillars placed at fixed coordinates.
   * **Blocks:** Destructible barriers generated randomly across open grid cells, leaving guaranteed safe zones at the 4 corner starting positions.
2. Render the map efficiently using DOM elements managed by your custom mini-framework. Minimize reflows by updating CSS transforms or element classes rather than recreating DOM trees every frame.

### Phase 3.2: Player Movement & Corner Spawning
1. Position the 2–4 players in the 4 distinct corners of the map.
2. Implement smooth keyboard event handling (`keydown`, `keyup`) for movement (Arrow keys or WASD).
3. Implement grid-based collision detection preventing players from walking through walls and destructible blocks.

### Phase 3.3: Bomb Placement & Explosion Engine
1. Implement bomb placement mechanics linked to player inventory limits.
2. Create explosion expansion logic radiating outwards in 4 directions (Up, Down, Left, Right) up to the flame range limit.
3. Handle raycasting collision: explosions stop when hitting indestructible walls or destroying blocks.
4. Implement player life deduction (3 lives total) when caught in an explosion.

### Phase 3.4: Performance & 60 FPS Optimization
1. Implement the game loop utilizing `requestAnimationFrame`.
2. Build an FPS counter and performance measurement utility to ensure the game consistently runs at 60 FPS without frame drops.
3. Optimize DOM updates by batching style changes and avoiding expensive layout recalculations during active gameplay.

---

## Folder Structures

### Frontend Folder Structure (`frontend/`)
```text
frontend/
└── src/
    ├── engine/
    │   ├── gameLoop.js     # requestAnimationFrame main loop & FPS monitor
    │   ├── renderer.js     # DOM-based grid & sprite/element rendering
    │   ├── physics.js      # Collision detection & grid boundaries
    │   └── input.js        # Keyboard listeners & state tracker
    ├── entities/
    │   ├── Player.js       # Player movement, lives, state
    │   ├── Bomb.js         # Bomb timer & explosion calculation
    │   └── Block.js        # Destructible vs indestructible blocks
    └── views/
        └── GameArena.js    # Main game board container
```

### Backend Folder Structure (`backend/`)
```text
backend/
└── internal/
    ├── game/
    │   ├── engine.go       # Server-side authoritative state validation
    │   ├── map.go          # Map generation & random block seed
    │   ├── collision.go    # Server collision validation
    │   └── state.go        # Player positions, bombs, and health sync
    └── ws/
        └── gamestream.go   # Game state synchronization handlers
```
""",
    "README4_Mechanics_Powerups_Bonus.md": """# README 4: Game Mechanics, Power-ups, Scoring & Bonus Features

## Overview
This final phase integrates destructible block rewards (power-ups), the life and elimination system, victory conditions, and advanced bonus features such as AI bots, team modes, bomb push/pass mechanics, and ghost interactions after death.

---

## Step-by-Step Tasks

### Phase 4.1: Power-Up System
1. Implement block destruction loot tables: when a destructible block is destroyed by a bomb explosion, randomly spawn one of the core power-ups:
   * **Bombs:** Increases maximum active bomb capacity by +1.
   * **Flames:** Increases explosion blast radius by +1 block in all four directions.
   * **Speed:** Increases player movement speed on the grid.
2. Implement collision detection between players and power-ups to collect them.

### Phase 4.2: Elimination, Lives & Victory Condition
1. Track player health (each player starts with 3 lives).
2. When a player's lives reach 0, eliminate them from the match.
3. Monitor remaining active players: declare the last player standing as the victorious winner and display the end-game summary modal.

### Phase 4.3: Bonus Features Integration (Optional / Advanced)
1. **Solo + Co-Op AI Mode:** Implement automated AI bot behavior that navigates the grid and places bombs to challenge human players.
2. **Advanced Power-ups:** Implement Bomb Push, Bomb Pass, Block Pass, Detonator (remote trigger), and 1-Up.
3. **Ghost Mode:** Allow eliminated players to roam the map as ghosts who can revive teammates upon contact or be permanently eliminated if caught in a blast.
4. **Team Mode:** Configure 2v2 match grouping and shared team health/victory conditions.

---

## Folder Structures

### Frontend Folder Structure (`frontend/`)
```text
frontend/
└── src/
    ├── entities/
    │   └── PowerUp.js      # Power-up types (Bombs, Flames, Speed, etc.)
    ├── ui/
    │   ├── Scoreboard.js   # Live player lives, inventory, & timer HUD
    │   └── GameOverModal.js# Winner announcement & restart workflow
    └── ai/
        └── bot.js          # Client/Server AI pathfinding & decision tree
```

### Backend Folder Structure (`backend/`)
```text
backend/
└── internal/
    ├── game/
    │   ├── powerup.go      # Random loot drop calculation & application
    │   └── match.go        # Win condition checker & score tracker
    └── models/
        └── constants.go    # Game config, grid dimensions, tick rates
```
"""
}

def setup_project():
    print("Creating 4 README files...")
    for filename, content in readmes.items():
        with open(filename, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  [+] Created {filename}")

    print("\nCreating Frontend and Backend directory structure...")
    frontend_dirs = [
        "frontend/public",
        "frontend/src/framework",
        "frontend/src/components",
        "frontend/src/views",
        "frontend/src/state",
        "frontend/src/styles",
        "frontend/src/services",
        "frontend/src/engine",
        "frontend/src/entities",
        "frontend/src/ui",
        "frontend/src/ai",
    ]
    
    backend_dirs = [
        "backend/cmd/server",
        "backend/internal/server",
        "backend/internal/lobby",
        "backend/internal/ws",
        "backend/internal/game",
        "backend/internal/models",
    ]

    for d in frontend_dirs + backend_dirs:
        os.makedirs(d, exist_ok=True)
        gitkeep_path = os.path.join(d, ".gitkeep")
        if not os.path.exists(gitkeep_path):
            with open(gitkeep_path, "w") as f:
                pass
        print(f"  [+] Directory ready: {d}")

    print("\n[SUCCESS] Project setup complete!")

if __name__ == "__main__":
    setup_project()