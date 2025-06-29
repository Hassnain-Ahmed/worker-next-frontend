// hooks/useWebSocket.ts
import { useCallback, useEffect, useRef, useState } from "react";

// Define the shape of a WebSocket message that can be sent or received
interface WebSocketMessage {
  type: string;
  [key: string]: any; // Allow any other properties
}

const useWebSocket = (
  url: string,
  onMessageCallback?: (message: WebSocketMessage) => void
) => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<Event | Error | null>(null);
  const retryCount = useRef<number>(0);
  const maxRetries = 5;
  const retryInterval = 3000; // 3 seconds

  const connect = useCallback(() => {
    if (
      ws.current &&
      (ws.current.readyState === WebSocket.OPEN ||
        ws.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      console.log("WebSocket Connected");
      setIsConnected(true);
      setError(null);
      retryCount.current = 0; // Reset retry count on successful connection

      // Send a dashboard_connect message if it's a dashboard client
      if (ws.current) {
        ws.current.send(
          JSON.stringify({
            type: "dashboard_connect",
            clientType: "dashboard",
            subscriptions: ["locations", "stats", "media"], // Subscribe to relevant updates
          } as WebSocketMessage)
        );
      }
    };

    ws.current.onmessage = (event: MessageEvent) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        setLastMessage(message);
        if (onMessageCallback) {
          onMessageCallback(message);
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message:", e, event.data);
      }
    };

    ws.current.onerror = (event: Event) => {
      console.error("WebSocket Error:", event);
      setError(event);
      setIsConnected(false);
    };

    ws.current.onclose = (event: CloseEvent) => {
      console.log("WebSocket Disconnected:", event.code, event.reason);
      setIsConnected(false);
      if (event.code !== 1000 && retryCount.current < maxRetries) {
        // 1000 is normal closure
        retryCount.current++;
        console.log(
          `Attempting to reconnect (${retryCount.current}/${maxRetries})...`
        );
        setTimeout(connect, retryInterval);
      } else if (retryCount.current >= maxRetries) {
        console.error("Max retries reached. Could not reconnect to WebSocket.");
        setError(
          new Error("Max retries reached. Could not reconnect to WebSocket.")
        );
      }
    };
  }, [url, onMessageCallback]);

  useEffect(() => {
    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket not open. Message not sent:", message);
    }
  }, []);

  return { ws: ws.current, isConnected, lastMessage, error, sendMessage };
};

export default useWebSocket;
