import h from "../framework/dom/h.js";

let notifications = [];
let refreshApp = null;
let nextId = 0;

export function NotificationHost() {
  return h(
    "div",
    {
      id: "notification-container",
      class: "notification-container",
      "aria-live": "polite",
    },
    notifications.map((item) =>
      h(
        "div",
        {
          key: item.id,
          class: `notification notification--${item.type}`,
          role: item.type === "error" ? "alert" : "status",
        },
        [
          h("span", {}, [item.message]),
          h(
            "button",
            {
              class: "notification__close",
              type: "button",
              "aria-label": "Dismiss notification",
              onClick: () => dismiss(item.id),
            },
            ["×"],
          ),
        ],
      ),
    ),
  );
}

export function setNotificationRefresh(callback) {
  refreshApp = callback;
}

function dismiss(id) {
  notifications = notifications.filter((item) => item.id !== id);

  refreshApp?.();
}

export function notify(message, type = "info", duration = 4000) {
  const id = ++nextId;

  notifications = [...notifications, { id, message, type }];

  refreshApp?.();

  if (duration > 0) {
    setTimeout(() => dismiss(id), duration);
  }
}
