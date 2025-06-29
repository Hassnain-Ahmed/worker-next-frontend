"use client";

import { useCallback, useEffect, useState } from "react";
import useWebSocket from "./useWebSocket";

interface StatsData {
  devices: {
    total: number;
    active: number;
    online: number;
    websocketConnected: number;
  };
  locations: {
    recentUpdates: number;
  };
  media: {
    totalFiles: number;
    totalSize: number;
    todayUploads: number;
  };
}

interface LocationUpdate {
  deviceId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  provider: string;
  activity: string;
}

interface MediaUpload {
  deviceId: string;
  filename: string;
  resourceType: string;
  size: number;
  timestamp: string;
}

interface DeviceStatusChange {
  deviceId: string;
  status: "connected" | "disconnected";
  isOnline: boolean;
  websocketConnected: boolean;
  lastSeen: string;
  deviceInfo?: any;
}

export function useRealtimeStats() {
  const [stats, setStats] = useState<StatsData>({
    devices: { total: 0, active: 0, online: 0, websocketConnected: 0 },
    locations: { recentUpdates: 0 },
    media: { totalFiles: 0, totalSize: 0, todayUploads: 0 },
  });

  const [recentLocations, setRecentLocations] = useState<LocationUpdate[]>([]);
  const [recentMedia, setRecentMedia] = useState<MediaUpload[]>([]);
  const [deviceStatusChanges, setDeviceStatusChanges] = useState<
    DeviceStatusChange[]
  >([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const handleWebSocketMessage = useCallback((message: any) => {
    console.log("📨 Received message:", message.type);

    switch (message.type) {
      case "stats_update":
        setStats((prevStats) => ({
          ...prevStats,
          ...message.data,
        }));
        setLastUpdate(new Date());
        break;

      case "location_update":
        setRecentLocations((prev) => {
          const newLocation = message.data;
          const updated = [newLocation, ...prev.slice(0, 9)]; // Keep last 10
          return updated;
        });
        setLastUpdate(new Date());
        break;

      case "media_upload":
        setRecentMedia((prev) => {
          const newMedia = message.data;
          const updated = [newMedia, ...prev.slice(0, 9)]; // Keep last 10
          return updated;
        });
        setLastUpdate(new Date());
        break;

      case "device_status_change":
        setDeviceStatusChanges((prev) => {
          const statusChange = message.data;
          const updated = [statusChange, ...prev.slice(0, 19)]; // Keep last 20
          return updated;
        });
        setLastUpdate(new Date());
        break;

      case "dashboard_connected":
        console.log("✅ Dashboard connected successfully");
        break;

      case "subscription_ack":
        console.log("📡 Subscribed to:", message.subscriptions);
        break;

      case "welcome":
        console.log("👋 Welcome message received");
        break;

      case "error":
        console.error("❌ WebSocket error:", message.error);
        break;

      default:
        console.log("❓ Unhandled message type:", message.type);
    }
  }, []);

  // WebSocket connection
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3000/ws";
  const { isConnected, error, sendMessage } = useWebSocket(
    wsUrl,
    handleWebSocketMessage
  );

  // Initial data fetch via HTTP
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/stats`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setStats(data.data);
            setLastUpdate(new Date());
          }
        }
      } catch (error) {
        console.error("Failed to fetch initial stats:", error);
      }
    };

    fetchInitialData();
  }, []);

  // Subscribe to updates when connected
  useEffect(() => {
    if (isConnected) {
      sendMessage({
        type: "subscribe_stats",
        subscriptions: ["stats", "locations", "media", "devices"],
        timestamp: Date.now(),
      });
    }
  }, [isConnected, sendMessage]);

  return {
    stats,
    recentLocations,
    recentMedia,
    deviceStatusChanges,
    lastUpdate,
    isConnected,
    connectionStatus: isConnected
      ? "connected"
      : error
      ? "error"
      : "disconnected",
    sendMessage,
  };
}
