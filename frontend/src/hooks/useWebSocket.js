import { useRef, useState, useEffect } from "react";

/**
 * Creates (and returns) a single, app‐global WebSocket connection.
 * The first time you call createWebSocket(url), it opens and caches it.
 * Subsequent calls with the same url return the same socket.
 */
const socketCache = {};

export function createWebSocket(url) {
  if (!url) return null;
  if (socketCache[url]) return socketCache[url];

  const ws = new WebSocket(url);
  const state = { lastMessage: null, readyState: ws.readyState };

  ws.addEventListener("open", () => {
    state.readyState = WebSocket.OPEN;
  });
  ws.addEventListener("close", () => {
    state.readyState = WebSocket.CLOSED;
  });
  ws.addEventListener("message", (e) => {
    try {
      state.lastMessage = JSON.parse(e.data);
    } catch {
      console.warn("Invalid WS message", e.data);
    }
  });

  socketCache[url] = { ws, state };
  return socketCache[url];
}

export function useWebSocketState(url) {
  const [readyState, setReadyState] = useState(WebSocket.CLOSED);
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!url) return;
    const { ws, state } = createWebSocket(url);
    wsRef.current = ws;

    // sync initial
    setReadyState(state.readyState);
    setLastMessage(state.lastMessage);

    const onOpen = () => setReadyState(WebSocket.OPEN);
    const onClose = () => setReadyState(WebSocket.CLOSED);
    const onMessage = () => setLastMessage(state.lastMessage);

    ws.addEventListener("open", onOpen);
    ws.addEventListener("close", onClose);
    ws.addEventListener("message", onMessage);

    return () => {
      ws.removeEventListener("open", onOpen);
      ws.removeEventListener("close", onClose);
      ws.removeEventListener("message", onMessage);
      // we do NOT close() here—keep it alive globally
    };
  }, [url]);

  const sendMessage = (msg) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  };

  return { readyState, lastMessage, sendMessage };
}