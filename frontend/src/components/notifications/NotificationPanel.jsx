// NotificationPanel.jsx
import React from "react";
import { useNotifications } from "../../context/NotificationContext";

export default function NotificationPanel({ onClose }) {
  const { notifications, markAllRead } = useNotifications();
  const nonToast = notifications.filter((n) => !n.toast);

  return (
    <div style={{
      position: "fixed", top: 56, right: 0, width: 360, height: "calc(100vh - 56px)",
      background: "#1a1d27", borderLeft: "1px solid rgba(255,255,255,0.07)",
      zIndex: 50, display: "flex", flexDirection: "column", boxShadow: "-8px 0 24px rgba(0,0,0,0.3)"
    }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 15, fontWeight: 600 }}>Notifications</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={markAllRead} style={{ background: "none", border: "none", color: "#4f8ef7", fontSize: 12.5, cursor: "pointer" }}>Tout lire</button>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6e7491", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 0" }}>
        {nonToast.length === 0 ? (
          <div style={{ textAlign: "center", color: "#6e7491", padding: "40px 20px", fontSize: 13.5 }}>Aucune notification.</div>
        ) : nonToast.map((n) => (
          <div key={n.id || n.timestamp} style={{
            padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)",
            background: n.read ? "transparent" : "rgba(79,142,247,0.05)"
          }}>
            <div style={{ fontSize: 13.5, color: "#e8eaf0", marginBottom: 4 }}>{n.message || n.type}</div>
            <div style={{ fontSize: 11.5, color: "#6e7491" }}>{n.timestamp ? new Date(n.timestamp).toLocaleString("fr-FR") : ""}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
