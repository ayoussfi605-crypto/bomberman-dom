import { createSocket } from "./net/socket.js";
import { initUI } from "./ui/index.js";
import { initGame } from "./game/index.js";
import { store } from "./state/store.js";
import { chatPanel } from "./ui/components/chatPanel.js";

const socket = createSocket();

socket.onStatus((connection) => store.setState({ connection }));
initUI({ socket, store });
initGame({ socket, store, chatPanel });
socket.connect();
