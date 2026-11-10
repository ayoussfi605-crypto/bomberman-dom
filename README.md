# 💣 Bomberman DOM

A multiplayer Bomberman-inspired game built with a custom JavaScript DOM framework, developed as part of the Zone01 curriculum.

The goal is simple: join a lobby, compete against other players, place bombs, destroy blocks, collect power-ups, and be the last player standing!

## 🎮 Overview

Bomberman DOM is a real-time multiplayer game supporting **2 to 4 players** in a shared arena.

Each player starts in a different corner of the map with 3 lives. Players must strategically place bombs, avoid explosions, destroy obstacles, and eliminate their opponents to win the match.

The project focuses on game development, real-time communication, DOM manipulation, and browser performance optimization.

## ✨ Features

- **Multiplayer:** Play with 2–4 players in real time.
- **Lobby System:** Join a game using a unique nickname.
- **Player Counter:** See how many players have joined the lobby.
- **Countdown System:** Automatic match countdown based on the number of players.
- **Dynamic Map:** Fixed arena with randomly generated destructible blocks.
- **Bomb Mechanics:** Place bombs and eliminate opponents with explosions.
- **Lives System:** Each player starts with 3 lives.
- **Power-ups:** Collect upgrades to improve your abilities.
- **Real-time Chat:** Communicate with other players using WebSockets.
- **Performance Optimization:** Uses `requestAnimationFrame` and FPS monitoring to maintain smooth gameplay.
- **Custom Framework:** Built using a custom JavaScript DOM framework instead of React, Vue, Angular, or Canvas.

## 🕹️ Game Mechanics

### Players

- Minimum players: 2.
- Maximum players: 4.
- Each player starts with 3 lives.
- Players spawn in different corners of the map.
- A player is eliminated when they lose all their lives.
- The last surviving player wins.

### Map

The arena contains two types of obstacles:

| Object | Description |
|---|---|
| Walls | Permanent obstacles that cannot be destroyed. |
| Blocks | Randomly generated obstacles that can be destroyed using bombs. |

The map is shared between all players to ensure everyone plays in the same arena.

Starting positions are designed to give players enough space to escape their own bombs.

### 💥 Bombs

Players can place bombs to destroy blocks and eliminate opponents.

Explosions spread in four directions:

- Up
- Down
- Left
- Right

Walls stop explosions, while destructible blocks can be destroyed.

### ⚡ Power-ups

Destroying blocks may randomly reveal power-ups.

| Power-up | Effect |
|---|---|
| 💣 Bomb | Increases the maximum number of bombs a player can place simultaneously. |
| 🔥 Flame | Increases bomb explosion range by one tile. |
| 👟 Speed | Increases player movement speed. |

## ⏳ Lobby & Matchmaking

When a player opens the game:

1. They enter a nickname.
2. They join the waiting lobby.
3. The lobby displays the current number of players (up to 4).
4. If 4 players join before the initial 20-second waiting period ends, a 10-second countdown begins.
5. If more than 2 players join but fewer than 4 are present after 20 seconds, a 10-second countdown begins.
6. The match starts when the countdown finishes.

## 🛠️ Technologies

- **JavaScript (Vanilla):** Core game logic and frontend development.
- **Custom DOM Framework:** Rendering and updating the user interface.
- **Node.js:** Backend runtime.
- **WebSockets:** Real-time multiplayer communication and chat.
- **HTML5:** Game structure.
- **CSS3:** Styling and animations.
- **requestAnimationFrame:** Game rendering loop and animation scheduling.

> No Canvas, WebGL, React, Vue, Angular, or other frontend frameworks are used. The game is rendered using the custom DOM framework developed for the Zone01 mini-framework project.

## 📁 Project Structure

```text
bomberman-dom/
├── backend/
│   ├── src/
│   │   ├── lobby/
│   │   ├── net/
│   │   ├── tools/
│   │   └── ...
│   └── index.js
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── framework/
│       ├── net/
│       ├── state/
│       ├── views/
│       └── ...
│
├── shared/
│   └── constants.js
│
└── README.md
```

*The structure above represents the main architectural areas and may differ depending on the current implementation.*

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- Git

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/yelhaoua/bomberman-dom.git
```

**2. Navigate to the project**

```bash
cd bomberman-dom
```

**3. Install dependencies**

Install the backend and frontend dependencies according to their respective `package.json` files.

```bash
npm install
```

**4. Start the project**

```bash
npm run start
```



Open the project URL displayed in your terminal and join the game with other players.

## 🎯 Performance Requirements

Performance is a fundamental part of this project.

The game aims to:

- Maintain a target of 60 FPS.
- Avoid unnecessary DOM updates.
- Use `requestAnimationFrame` for the game loop.
- Minimize expensive calculations during each frame.
- Measure FPS and monitor rendering performance.
- Keep multiplayer state synchronized between players.

## 📚 Learning Objectives

This project explores:

- DOM manipulation and custom framework development.
- JavaScript event loop.
- `requestAnimationFrame`.
- FPS and frame-time measurement.
- Browser rendering performance.
- WebSocket communication.
- Real-time multiplayer synchronization.
- Game state management.
- Event-driven architecture.

## 🔮 Possible Improvements

Future features and enhancements:

- **Solo Mode:** Play against AI-controlled opponents.
- **Co-op Mode:** Team up against AI.
- **Team Mode:** 2v2 multiplayer battles.
- **Bomb Push:** Push or throw placed bombs.
- **Bomb Pass:** Walk through bombs.
- **Block Pass:** Walk through destructible blocks.
- **Detonator:** Manually trigger bombs.
- **Extra Life:** Gain an additional life.
- **Power-up Drops:** Players drop power-ups when eliminated.
- **Ghost Mode:** Allow eliminated players to return under special conditions.

## 👨‍💻 Author

**Yaakoub Elhaouari**

**Mohamed Ben bouaza**

**Hichame Ait benalla**

**Ayoub Elyoussefi**

- GitHub: https://learn.zone01oujda.ma/git/mbenboua/bomberman-dom.git

Developed as part of the **Zone01 Oujda** curriculum.

---

⭐ If you like this project, feel free to explore the repository and give it a star!