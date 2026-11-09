import { ERR, S2C } from "../../shared/constants.js";
import { createSession } from "./session.js";
import { errorMessage, parseMessage } from "./validate.js";

const MAX_BAD_MESSAGES = 10;
const WS_OPEN = 1;
const WS_CONNECTING = 0;

function closeSocket(ws, code, reason) {
  try {
    if (ws.readyState === WS_OPEN || ws.readyState === WS_CONNECTING)
      ws.close(code, reason);
  } catch {
    // Already gone.
  }
}

export function attachTransport({ wss, room, logger = console, now } = {}) {
  function badMessage(session, code) {
    session.badMessages += 1;
    session.send(S2C.ERROR, { code, message: errorMessage(code) });
    if (session.badMessages >= MAX_BAD_MESSAGES) {
      closeSocket(session.ws, 1008, "Too many bad messages");
    }
  }

  function handleMessage(session, raw) {
    if (session.closed) return;

    if (!session.limiter.take()) {
      session.send(S2C.ERROR, {
        code: ERR.RATE_LIMITED,
        message: errorMessage(ERR.RATE_LIMITED),
      });
      return;
    }

    const parsed = parseMessage(raw);
    if (!parsed.ok) {
      badMessage(session, parsed.code);
      return;
    }

    try {
      room.handle(session, parsed.type, parsed.data);
    } catch (error) {
      logger.error?.("[transport] handler failed:", error);
    }
  }

  function onConnection(ws, request) {
    try {
      request?.socket?.setNoDelay?.(true);
    } catch {
      // Optional tuning only.
    }

    const session = createSession(ws, { now });
    console.log(
      `[transport] new session ${session.id} from ${request?.socket?.remoteAddress}`,
      session,
    );

    ws.on("error", (error) => {
      logger.error?.("[transport] socket error:", error?.message ?? error);
    });

    ws.on("message", (raw, isBinary) => {
      try {
        if (isBinary) {
          closeSocket(ws, 1003, "Text messages only");
          return;
        }
        handleMessage(session, raw);
      } catch (error) {
        logger.error?.("[transport] message failed:", error);
      }
    });

    ws.on("close", () => {
      if (session.closed) return;
      session.closed = true;
      try {
        room.handleDisconnect(session);
      } catch (error) {
        logger.error?.("[transport] disconnect failed:", error);
      }
    });

    try {
      room.handleConnect(session);
    } catch (error) {
      logger.error?.("[transport] connect failed:", error);
    }
  }

  wss.on("connection", onConnection);
}
