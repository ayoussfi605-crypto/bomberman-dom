import crypto from "node:crypto";

export const players = new Map();
export const tokens = new Map();

export function validateNickname(nickname) {
  if (typeof nickname !== "string") return null;

  const name = nickname.trim();

  if (name.length < 3 || name.length > 16) {
    return null;
  }

  return name;
}

export function isNicknameTaken(nickname) {
  for (const player of players.values()) {
    if (player.name.toLowerCase() === nickname.toLowerCase()) {
      return true;
    }
  }

  return false;
}

function idPlayerIdTaken(playerId) {
  for (const player of players.values()) {
    if (player.playerId.toLowerCase() === playerId.toLowerCase()) {
      return true;
    }
  }

  return false;
}

export function registerPlayer(socket, nickname, playerId) {
  const name = validateNickname(nickname);

  if (!name) {
    return {
      success: false,
      message: "Invalid nickname",
    };
  }

  if (isNicknameTaken(name) || idPlayerIdTaken(playerId)) {
    return {
      success: false,
      message: "Nickname already taken",
    };
  }

  const playerToken = crypto.randomBytes(32).toString("hex");

  const player = {
    playerId,
    name,
    socketId: socket.id,
    connected: true,
    lives: 3,
  };

  players.set(playerId, player);
  tokens.set(playerToken, playerId);

  return {
    success: true,
    response: {
      player,
      playerToken,
    },
  };
}

// Find player by socket ID and mark disconnected
export function removePlayer(socketId) {
  for (const player of players.values()) {
    if (player.socketId === socketId) {
      player.connected = false;
      player.socketId = null;

      return true;
    }
  }
  return false;
}

export function getPlayers() {
  return Array.from(players.values()).map((player) => ({
    playerId: player.playerId,
    name: player.name,
    lives: player.lives,
    connected: player.connected,
  }));
}

export function StartCounterDown() {
  const connectedPlayers = Array.from(players.values()).filter(
    (player) => player.connected,
  );

  if (connectedPlayers.length >= 2) {
    return {
      success: true,
      counter: 10,
    };
  }

  return {
    success: false,
  };
}
