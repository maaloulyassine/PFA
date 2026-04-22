import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const stompClientRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/ws`),
      connectHeaders: {
        Authorization: `Bearer ${localStorage.getItem("jwt_token")}`,
      },
      onConnect: () => {
        client.subscribe(`/user/${user.email}/notifications`, (msg) => {
          const notif = JSON.parse(msg.body);
          setNotifications((prev) => [notif, ...prev]);
          setUnreadCount((c) => c + 1);
        });
        client.subscribe("/topic/tickets", (msg) => {
          const event = JSON.parse(msg.body);
          if (event.type === "TICKET_CREATED" && user.role !== "USER") {
            setNotifications((prev) => [event, ...prev]);
            setUnreadCount((c) => c + 1);
          }
        });
      },
      onDisconnect: () => {},
      reconnectDelay: 5000,
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [isAuthenticated, user]);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const addToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setNotifications((prev) => [{ id, message, type, timestamp: new Date().toISOString(), toast: true }, ...prev]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, addToast }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
