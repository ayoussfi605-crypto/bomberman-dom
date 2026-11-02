export function HandleCounterEnd(socket) {
  //send map and player start position

  if (players.size < 2) {
    socket.emit("game:error", {
      message: "not enough players",
    });
    return;
  }
  socket.emit("game:start", {
    message: "all is good",
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1],
    ],
  });
}
