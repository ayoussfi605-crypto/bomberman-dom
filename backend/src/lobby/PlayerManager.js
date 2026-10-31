const players = new Map();

function validateNickname(nickname) {
  if (typeof nickname !== "string") {
    return null;
  }

  const name = nickname.trim();

  if (name.length === 0 || name.length > 16) {
    return null;
  }

  return name;
}

function isNicknameTaken(nickname) {
  for (const player of players.values()) {
    if (player.nickname.toLowerCase() === nickname.toLowerCase()) {
      return true;
    }
  }

  return false;
}

function registerPlayer(socket, nickname) {
  const name = validateNickname(nickname);

  if (!name) {
    return {
      success: false,
      message: "Invalid nickname",
    };
  }

  if (isNicknameTaken(name)) {
    return {
      success: false,
      message: "Nickname already taken",
    };
  }

  const player = {
    id: socket.id,
    nickname: name,
    lives: 3,
  };

  players.set(socket.id, player);

  return {
    success: true,
    player,
  };
}

function removePlayer(socketId) {
  players.delete(socketId);
}

function getPlayers() {
  return Array.from(players.values());
}

module.exports = {
  registerPlayer,
  removePlayer,
  getPlayers,
};
