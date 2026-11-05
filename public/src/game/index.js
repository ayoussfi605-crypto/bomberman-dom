import * as gameView from "./gameView.js";
import * as loop from "./loop.js";
import * as input from "./input.js";

export function initGame({ socket, store, fpsMeter, chatPanel, perfOverlay }) {
  loop.init({ store, fpsMeter, chatPanel, perfOverlay });
  input.init({ socket, store });

  const onStart = function (d) {
    loop.stop();
    input.resetDir();
    gameView.reset(d);
    store.setState({
      phase: "playing",
      screen: "game",
      me: { nickname: store.getState().me?.nickname ?? "", slot: d.you },
      players: d.players,
      result: null,
    });
    loop.start();
  };

  const onTiles = function (d) {
    gameView.setTiles(d.tiles);
  };

  const onSnapshot = function (d) {
    gameView.pushSnapshot(d);
  };

  const onGameover = function (d) {
    loop.stop();
    input.resetDir();
    store.setState({ screen: "over", result: d });
  };

  const onStatus = function (status) {
    if (status === "closed" && store.getState().screen === "game") {
      loop.stop();
      input.resetDir();
      store.setState({
        screen: "nickname",
        error: { code: "DISCONNECTED", message: "Connection lost." },
      });
    }
  };

  const offStart    = socket.on("start",    onStart);
  const offTiles    = socket.on("tiles",    onTiles);
  const offSnapshot = socket.on("snapshot", onSnapshot);
  const offGameover = socket.on("gameover", onGameover);
  const offStatus   = socket.onStatus(onStatus);

  return function cleanup() {
    offStart();
    offTiles();
    offSnapshot();
    offGameover();
    offStatus();
    input.cleanup();
    loop.stop();
  };
}
