# README 4: Game Mechanics, Power-ups, Scoring & Bonus Features

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
