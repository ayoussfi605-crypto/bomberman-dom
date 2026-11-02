export function HandlePlayerJoin(socket, data) {
  const result = registerPlayer(socket, data.username, data.playerId);

  if (!result.success) {
    socket.emit("player:error", result.message);
    return;
  }

  socket.data.playerId = result.response.player.playerId;

  socket.emit("player:joined", result.response);

  ws.emit("lobby:players", getPlayers());

  const counter = StartCounterDown();

  if (counter.success) {
    ws.emit("lobby:count", counter.counter);
  }
}
