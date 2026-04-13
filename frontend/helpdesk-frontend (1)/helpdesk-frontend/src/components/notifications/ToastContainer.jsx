import React from "react";
import { useNotifications } from "../../context/NotificationContext";

const TYPE_CONFIG = {
  success: { color: "#27ae60", bg: "rgba(39,174,96,0.15)", border: "rgba(39,174,96,0.3)", icon: "✅" },
  error:   { color: "#e74c3c", bg: "rgba(231,76,60,0.15)",  border: "rgba(231,76,60,0.3)",  icon: "❌" },
  info:    { color: "#3498db", bg: "rgba(52,152,219,0.15)", border: "rgba(52,152,219,0.3)", icon: "ℹ️" },
  warning: { color: "#f39c12", bg: "rgba(243,156,18,0.15)", border: "rgba(243,156,18,0.3)", icon: "⚠️" },
};

export default function ToastContainer() {
  const { notifications } = useNotifications();
  const toasts = notifications.filter((n) => n.toast);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 200,
      display: "flex", flexDirection: "column", gap: 10, pointerEvents: "none"
    }}>
      {toasts.map((t) => {
        const cfg = TYPE_CONFIG[t.type] || TYPE_CONFIG.info;
        return (
          <div key={t.id} style={{
            background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 10,
            padding: "12px 18px", display: "flex", alignItems: "center", gap: 10,
            minWidth: 280, maxWidth: 380, boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            animation: "slideIn 0.25s ease", pointerEvents: "auto"
          }}>
            <span style={{ fontSize: 16 }}>{cfg.icon}</span>
            <span style={{ color: cfg.color, fontSize: 13.5, fontWeight: 500 }}>{t.message}</span>
          </div>
        );
      })}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(40px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
