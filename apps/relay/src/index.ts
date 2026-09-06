import { createServer } from "http";
import { WebSocketServer } from "ws";
import { env } from "./env";
import { log } from "./log";
import { Session } from "./session";

// Cloud Run requires an HTTP listener even for a WebSocket service, so
// /healthz is answered on the same port the WebSocket server upgrades on.
const httpServer = createServer((req, res) => {
  if (req.url === "/healthz") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (ws) => {
  const session = new Session(ws);
  const openedAt = Date.now();
  log.info("session opened");

  ws.on("message", (raw) => session.handleMessage(raw.toString()));
  ws.on("close", () => {
    session.dispose();
    log.info("session closed", { durationMs: Date.now() - openedAt });
  });
  ws.on("error", (err) => {
    log.warn("client socket error", { err: err.message });
  });
});

httpServer.listen(env.RELAY_PORT, () => {
  log.info(`pukaar relay listening on :${env.RELAY_PORT}`);
});
