# README 1: Architecture, Project Setup & Custom Framework Integration

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
