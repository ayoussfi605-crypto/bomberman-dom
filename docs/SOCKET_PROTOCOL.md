# Socket.IO Protocol

Shared event contract for all developers. Keep event names and payload shapes
consistent across frontend and backend.

## General rules
- The server is authoritative for lobby and gameplay state.
- Clients send requests; the server validates them.
- Server events broadcast accepted state changes.
- Use consistent error formats and server-assigned player IDs.
- Never trust client-reported lives, positions, damage, or victory.

## Client → Server events

| Event | Purpose | Example payload |
|---|---|---|
| `player:join` | Request to join lobby | `{ "nickname": "Player1" }` |
| `chat:send` | Send chat message | `{ "message": "Hello" }` |
| `player:move` | Request movement | `{ "direction": "up", "sequence": 1 }` |
| `bomb:place` | Request bomb placement | `{ "x": 2, "y": 3 }` |

## Server → Client events

| Event | Purpose |
|---|---|
| `player:joined` | Join accepted |
| `player:error` | Join/action rejected |
| `lobby:update` | Players, count, capacity, state |
| `lobby:countdown` | Countdown value and state |
| `game:start` | Match started and initial state |
| `game:state` | Authoritative game-state update |
| `game:playerUpdated` | Player stats/status changed |
| `game:blockDestroyed` | Block destroyed and optional power-up |
| `game:explosion` | Explosion result |
| `game:playerEliminated` | Player eliminated |
| `game:over` | Winner or draw |
| `chat:message` | Chat message broadcast |
| `player:left` | Player disconnected or left |

## Example error payload

```json
{
  "code": "NICKNAME_TAKEN",
  "message": "That nickname is already in use."
}
```

## Example lobby update

```json
{
  "players": [{ "id": "server-player-id", "nickname": "Player1" }],
  "count": 1,
  "capacity": 4,
  "state": "WAITING"
}
```

## Example game state

```json
{
  "matchId": "server-match-id",
  "tick": 1,
  "players": [],
  "map": { "width": 15, "height": 13, "tiles": [] },
  "bombs": [],
  "powerUps": []
}
```

These are starter contracts. Agree on exact fields and validation before
implementation.

## Ownership
1. Developer 1: lobby lifecycle, chat transport, Socket.IO registration.
2. Developer 2: map representation and client rendering.
3. Developer 3: authoritative gameplay rules and match outcomes.
4. Developer 4: screens and frontend integration.

Communicate shared payload changes to all developers.
