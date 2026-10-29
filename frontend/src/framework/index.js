import h from "./dom/h.js";
import render from "./dom/render.js";
import { createRouter } from "./router/index.js";
import { PlayerCounter } from "../services/PlayerCounter.js";
import { NicknamePage } from "../views/NicknameView.js";
import {
  NotificationHost,
  setNotificationRefresh,
} from "../components/Notification.js";
import { initWebSocketNotifications } from "../services/websocketNotifications.js";
import { connect } from "../services/websocket.js";
const container = document.getElementById("app");
let currentPage = null;

function AppLayout() {
  return h("div", { class: "app-layout" }, [
    NotificationHost(),
    h("main", { id: "page-content" }, [currentPage()]),
  ]);
}

function renderPage(page) {
  currentPage = page;
  render(AppLayout(), container);
}

// Configure notifications to refresh the application.
setNotificationRefresh(() => {
  if (currentPage) {
    render(AppLayout(), container);
  }
});

export const router = createRouter({
  "/": () => renderPage(NicknamePage),
  "/lobby": () => renderPage(PlayerCounter),
});

router.start();

// Subscribe before connecting.
initWebSocketNotifications();
connect();
