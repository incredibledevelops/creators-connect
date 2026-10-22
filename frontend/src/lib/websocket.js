"use client";

export function createChatSocket(conversationId, token, handlers = {}) {
  const base = process.env.NEXT_PUBLIC_API_WS_URL;
  const url = `${base}/chat/ws/${conversationId}?token=${encodeURIComponent(token)}`;

  let ws = null;
  let closedByUs = false;
  let attempt = 0;

  const connect = () => {
    ws = new WebSocket(url);

    ws.onopen = () => {
      attempt = 0;
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "message" && handlers.onMessage) handlers.onMessage(payload.message);
        else if (payload.type === "typing" && handlers.onTyping) handlers.onTyping(payload);
        else if (handlers.onEvent) handlers.onEvent(payload);
      } catch (e) {
        console.error("[ws] bad payload", e);
      }
    };

    ws.onclose = () => {
      if (closedByUs) return;
      attempt += 1;
      const delay = Math.min(30000, 500 * 2 ** attempt);
      setTimeout(connect, delay);
    };

    ws.onerror = () => ws.close();
  };

  connect();

  return {
    send: (payload) => {
      if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
    },
    close: () => {
      closedByUs = true;
      try {
        ws?.close();
      } catch {}
    },
  };
}