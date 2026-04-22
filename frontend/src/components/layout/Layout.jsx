import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import NotificationPanel from "../notifications/NotificationPanel";
import ToastContainer from "../notifications/ToastContainer";

const navItems = [
  { path: "/dashboard", label: "Tableau de bord", icon: "⊞", roles: ["USER", "TECHNICIEN", "ADMIN"] },
  { path: "/tickets", label: "Tous les tickets", icon: "🎫", roles: ["USER", "TECHNICIEN", "ADMIN"] },
  { path: "/tickets/new", label: "Nouveau ticket", icon: "+", roles: ["USER", "TECHNICIEN", "ADMIN"] },
  { path: "/my-tickets", label: "Mes tickets assignés", icon: "⚙", roles: ["TECHNICIEN"] },
  { path: "/users", label: "Gestion utilisateurs", icon: "👥", roles: ["ADMIN"] },
  { path: "/statistics", label: "Statistiques", icon: "📊", roles: ["ADMIN"] },
];

export default function Layout() {
  const { user, logout, hasRole } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);

  const visibleItems = navItems.filter((item) => item.roles.some((r) => hasRole([r])));

  const roleColor = { ADMIN: "#e74c3c", TECHNICIEN: "#3498db", USER: "#27ae60" };
  const roleLabel = { ADMIN: "Administrateur", TECHNICIEN: "Technicien", USER: "Utilisateur" };

  return (
    <div className="layout-root">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <div className="logo-mark">HD</div>
          {sidebarOpen && <span className="logo-text">Helpdesk <strong>FS Monastir</strong></span>}
        </div>

        <nav className="sidebar-nav">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              title={item.label}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {sidebarOpen && (
            <NavLink to="/profile" className="user-card">
              {user?.avatar ? (
                <img src={user.avatar} className="avatar" alt="Avatar" style={{ objectFit: "cover" }} />
              ) : (
                <div className="avatar" style={{ background: roleColor[user?.role] }}>
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
              )}
              <div className="user-info">
                <div className="user-name">{user?.firstName} {user?.lastName}</div>
                <div className="user-role" style={{ color: roleColor[user?.role] }}>{roleLabel[user?.role]}</div>
              </div>
            </NavLink>
          )}
          <button className="btn-logout" onClick={logout} title="Déconnexion">⏻</button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-wrapper">
        <header className="topbar">
          <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? "◀" : "▶"}
          </button>
          <div className="topbar-title">
            <span>Helpdesk Intelligent — Priorisation Automatique</span>
          </div>
          <div className="topbar-actions">
            <button className="notif-btn" onClick={() => setNotifOpen(!notifOpen)}>
              🔔
              {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </button>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>

      {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
      <ToastContainer />

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --sidebar-w: 240px;
          --sidebar-closed: 60px;
          --topbar-h: 56px;
          --bg: #0f1117;
          --surface: #1a1d27;
          --surface2: #222637;
          --border: rgba(255,255,255,0.07);
          --accent: #4f8ef7;
          --accent2: #7c5cbf;
          --text: #e8eaf0;
          --text-muted: #6e7491;
          --danger: #e74c3c;
          --warning: #f39c12;
          --success: #27ae60;
          --info: #3498db;
          --radius: 10px;
          --shadow: 0 4px 24px rgba(0,0,0,0.4);
        }
        body { background: var(--bg); color: var(--text); font-family: 'Segoe UI', system-ui, sans-serif; }
        .layout-root { display: flex; height: 100vh; overflow: hidden; }
        
        .sidebar {
          width: var(--sidebar-w); flex-shrink: 0; background: var(--surface);
          border-right: 1px solid var(--border); display: flex; flex-direction: column;
          transition: width 0.25s ease; overflow: hidden;
        }
        .sidebar.closed { width: var(--sidebar-closed); }
        
        .sidebar-header {
          display: flex; align-items: center; gap: 10px; padding: 16px 14px;
          border-bottom: 1px solid var(--border);
        }
        .logo-mark {
          min-width: 32px; height: 32px; background: linear-gradient(135deg,var(--accent),var(--accent2));
          border-radius: 8px; display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 13px; color: #fff;
        }
        .logo-text { font-size: 13px; white-space: nowrap; color: var(--text-muted); }
        .logo-text strong { color: var(--text); }
        
        .sidebar-nav { flex: 1; padding: 12px 8px; display: flex; flex-direction: column; gap: 2px; }
        .nav-item {
          display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 8px;
          color: var(--text-muted); text-decoration: none; font-size: 13.5px; transition: all 0.15s;
          white-space: nowrap;
        }
        .nav-item:hover { background: var(--surface2); color: var(--text); }
        .nav-item.active { background: rgba(79,142,247,0.15); color: var(--accent); }
        .nav-icon { font-size: 16px; min-width: 20px; text-align: center; }
        
        .sidebar-footer {
          padding: 12px 8px; border-top: 1px solid var(--border);
          display: flex; align-items: center; gap: 8px;
        }
        .user-card {
          flex: 1; display: flex; align-items: center; gap: 10px; text-decoration: none;
          padding: 6px 8px; border-radius: 8px; overflow: hidden; transition: background 0.15s;
        }
        .user-card:hover { background: var(--surface2); }
        .avatar {
          width: 32px; height: 32px; border-radius: 50%; display: flex;
          align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #fff;
          object-fit: cover;
        }
        .user-name { font-size: 12.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .user-role { font-size: 11px; font-weight: 500; }
        .btn-logout {
          background: none; border: none; cursor: pointer; font-size: 18px; color: var(--text-muted);
          padding: 6px; border-radius: 6px; transition: color 0.15s;
        }
        .btn-logout:hover { color: var(--danger); }
        
        .main-wrapper { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .topbar {
          height: var(--topbar-h); background: var(--surface); border-bottom: 1px solid var(--border);
          display: flex; align-items: center; padding: 0 20px; gap: 16px; flex-shrink: 0;
        }
        .toggle-btn {
          background: none; border: none; cursor: pointer; color: var(--text-muted);
          font-size: 14px; padding: 6px; border-radius: 6px;
        }
        .toggle-btn:hover { background: var(--surface2); color: var(--text); }
        .topbar-title { flex: 1; font-size: 13px; color: var(--text-muted); }
        .topbar-actions { display: flex; gap: 8px; }
        .notif-btn {
          position: relative; background: none; border: none; cursor: pointer; font-size: 18px;
          padding: 6px; border-radius: 8px; color: var(--text);
        }
        .notif-btn:hover { background: var(--surface2); }
        .badge {
          position: absolute; top: 2px; right: 2px; background: var(--danger);
          color: #fff; font-size: 9px; font-weight: 700; border-radius: 8px; padding: 1px 4px; min-width: 16px; text-align: center;
        }
        .page-content { flex: 1; overflow-y: auto; padding: 28px 32px; }
        
        a { color: inherit; }
        button { font-family: inherit; cursor: pointer; }
        input, select, textarea { font-family: inherit; }
      `}</style>
    </div>
  );
}
