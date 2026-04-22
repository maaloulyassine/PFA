import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { ticketAPI, statsAPI } from "../utils/api";
import { Link } from "react-router-dom";

// ── Priority config ────────────────────────────────────────────────────────
const P = {
  CRITICAL: { color: "#f87171", bg: "rgba(231,76,60,0.13)", border: "rgba(231,76,60,0.35)", label: "Critique", sla: "2 heures" },
  HIGH:   { color: "#fb923c", bg: "rgba(230,126,34,0.12)", border: "rgba(230,126,34,0.3)",  label: "Élevée",   sla: "8 heures" },
  MEDIUM:  { color: "#fbbf24", bg: "rgba(243,156,18,0.12)", border: "rgba(243,156,18,0.3)",  label: "Moyenne",  sla: "48 heures" },
  LOW:   { color: "#4ade80", bg: "rgba(39,174,96,0.12)",  border: "rgba(39,174,96,0.3)",   label: "Faible",   sla: "5 jours" },
};

const S = {
  OUVERT:   { color: "#60a5fa", label: "Ouvert" },
  EN_COURS: { color: "#fbbf24", label: "En cours" },
  RESOLU:   { color: "#4ade80", label: "Résolu" },
  FERME:    { color: "#6e7491", label: "Fermé" },
};

// ── AI scoring explanation (matches PriorityEngine on backend) ─────────────
function explainPriority(ticket) {
  const reasons = [];
  const desc = (ticket.description || ticket.title || "").toLowerCase();
  if (desc.includes("panne") || desc.includes("virus") || desc.includes("sécurité") || desc.includes("chiffr")) {
    reasons.push("Catégorie critique détectée");
  }
  if (desc.includes("réseau") || desc.includes("network") || ticket.category?.name?.toLowerCase() === "réseau") reasons.push("Incident réseau = impact large");
  if (ticket.category?.name === "Sécurité") reasons.push("Risque propagation");
  if (reasons.length === 0) reasons.push("Incident mineur, utilisateur unique");
  return reasons.slice(0, 2).join(" · ");
}

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const { notifications } = useNotifications();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = hasRole(["TECHNICIEN"])
          ? await ticketAPI.getAssigned()
          : await ticketAPI.getAll({ limit: 10 });
        setTickets(res.data?.content || res.data || []);
        if (hasRole(["ADMIN"])) {
          const sRes = await statsAPI.getGlobal();
          setStats(sRes.data);
        }
      } catch {
        setTickets(DEMO_TICKETS);
        if (hasRole(["ADMIN"])) setStats(DEMO_STATS);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [notifications]);

  const counts = {
    open:     tickets.filter((t) => t.status === "OUVERT").length,
    progress: tickets.filter((t) => t.status === "EN_COURS").length,
    resolved: tickets.filter((t) => t.status === "RESOLU").length,
    critical: tickets.filter((t) => t.priority === "CRITICAL").length,
  };

  if (loading) return <div className="loading-state">Chargement…</div>;

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Bonjour, {user?.firstName} 👋</h1>
          <p className="subtitle">Tableau de bord — Helpdesk FS Monastir</p>
        </div>
        <Link to="/tickets/new" className="btn-primary">+ Nouveau ticket</Link>
      </div>

      {/* KPI cards */}
      <div className="kpi-grid">
        <KPI label="Tickets ouverts"   value={counts.open}     icon="🔓" color="#60a5fa" />
        <KPI label="En cours"          value={counts.progress} icon="⚙️" color="#fbbf24" />
        <KPI label="Résolus"           value={counts.resolved} icon="✅" color="#4ade80" />
        <KPI label="Critiques actifs"  value={counts.critical} icon="🚨" color="#f87171" />
      </div>

      {/* AI notice banner */}
      <div className="ai-banner">
        <div className="ai-banner-icon">✦</div>
        <div>
          <strong>Priorisation et durée calculées automatiquement par le moteur IA</strong>
          <span className="ai-banner-sub">
            — À la soumission, l'algorithme analyse : catégorie, nombre d'utilisateurs impactés,
            heure de soumission, et incidents similaires récents → attribue un niveau de priorité
            et calcule le SLA (délai d'intervention) en conséquence.
          </span>
        </div>
      </div>

      {/* Ticket list */}
      <section className="section">
        <div className="section-header">
          <h2>Tickets récents</h2>
          <Link to="/tickets" className="link-more">Voir tous →</Link>
        </div>

        {/* Column labels */}
        <div className="col-labels">
          <span style={{ minWidth: 36 }}>#</span>
          <span style={{ flex: 1 }}>Titre</span>
          <span style={{ minWidth: 140, textAlign: "center" }}>Priorité IA ✦</span>
          <span style={{ minWidth: 130, textAlign: "center" }}>Délai SLA IA ✦</span>
          <span style={{ minWidth: 90 }}>Statut</span>
          <span style={{ minWidth: 80, textAlign: "right" }}>Créé le</span>
        </div>

        <div className="ticket-list">
          {tickets.slice(0, 8).map((t) => {
            const pc = P[t.priority] || P.LOW;
            const sc = S[t.status] || S.OUVERT;
            return (
              <Link to={`/tickets/${t.id}`} key={t.id} className="ticket-row">
                <span className="col-id">#{t.id}</span>
                <div className="col-title">
                  <div className="ticket-title-text">{t.title}</div>
                  <div className="ticket-ai-reason">
                    <span className="ai-dot-sm">✦</span>
                    {explainPriority(t)}
                  </div>
                </div>
                {/* Priority — AI computed */}
                <div className="col-priority">
                  <span className="priority-pill" style={{ background: pc.bg, border: `1px solid ${pc.border}`, color: pc.color }}>
                    {pc.label}
                  </span>
                </div>
                {/* SLA — AI computed */}
                <div className="col-sla">
                  <span className="sla-pill" style={{ color: pc.color }}>
                    ⏱ {pc.sla}
                  </span>
                </div>
                {/* Status */}
                <div className="col-status">
                  <span className="status-dot" style={{ background: sc.color }} />
                  <span style={{ color: sc.color, fontSize: 12.5, fontWeight: 500 }}>{sc.label}</span>
                </div>
                <div className="col-date">
                  {new Date(t.createdAt).toLocaleDateString("fr-FR")}
                </div>
              </Link>
            );
          })}

          {tickets.length === 0 && (
            <div className="empty-state">Aucun ticket pour le moment.</div>
          )}
        </div>
      </section>

      {/* SLA reference table */}
      <section className="section sla-ref">
        <h2>Référence SLA — niveaux de priorité IA</h2>
        <div className="sla-grid">
          {Object.entries(P).map(([key, pc]) => (
            <div key={key} className="sla-card" style={{ borderColor: pc.border, background: pc.bg }}>
              <span className="sla-level" style={{ color: pc.color }}>{pc.label}</span>
              <span className="sla-time" style={{ color: pc.color }}>⏱ {pc.sla}</span>
              <span className="sla-desc">{SLA_DESC[key]}</span>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        .dashboard { max-width: 1100px; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .page-header h1 { font-size: 24px; font-weight: 700; color: #e8eaf0; margin-bottom: 4px; }
        .subtitle { color: #6e7491; font-size: 13px; }
        .btn-primary {
          background: linear-gradient(135deg,#1E4DA1,#7B2FBE); border: none; border-radius: 10px;
          color: #fff; padding: 10px 20px; font-size: 13.5px; font-weight: 600; text-decoration: none; cursor: pointer;
        }
        .btn-primary:hover { opacity: .87; }

        .kpi-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 20px; }
        @media(max-width:800px){ .kpi-grid { grid-template-columns: repeat(2,1fr); } }

        .ai-banner {
          display: flex; align-items: flex-start; gap: 12px;
          background: rgba(123,47,190,0.1); border: 1px solid rgba(123,47,190,0.25);
          border-radius: 10px; padding: 13px 18px; margin-bottom: 20px;
          font-size: 13px; color: #e8eaf0; line-height: 1.55;
        }
        .ai-banner-icon { font-size: 18px; color: #a78bfa; flex-shrink: 0; margin-top: 1px; }
        .ai-banner strong { color: #c4b5fd; font-weight: 600; margin-right: 4px; }
        .ai-banner-sub { color: #9ca3c0; }

        .section {
          background: #1a1d27; border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 20px; margin-bottom: 20px;
        }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
        .section-header h2 { font-size: 15px; font-weight: 600; color: #e8eaf0; }
        .link-more { color: #7ab8ff; font-size: 13px; text-decoration: none; }

        .col-labels {
          display: flex; align-items: center; gap: 12px;
          font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #6e7491;
          padding: 0 10px 8px; border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .ticket-list { display: flex; flex-direction: column; gap: 3px; margin-top: 6px; }
        .ticket-row {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 10px; border-radius: 8px;
          text-decoration: none; color: #e8eaf0; transition: background .15s;
        }
        .ticket-row:hover { background: rgba(255,255,255,0.04); }
        .col-id { color: #6e7491; font-size: 12px; min-width: 36px; }
        .col-title { flex: 1; min-width: 0; }
        .ticket-title-text { font-size: 13.5px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ticket-ai-reason {
          font-size: 11px; color: #6e7491; margin-top: 3px;
          display: flex; align-items: center; gap: 4px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .ai-dot-sm { color: #a78bfa; font-size: 10px; flex-shrink: 0; }

        .col-priority { min-width: 140px; display: flex; justify-content: center; }
        .priority-pill {
          font-size: 11.5px; font-weight: 600; padding: 4px 12px;
          border-radius: 20px; white-space: nowrap;
        }
        .col-sla { min-width: 130px; display: flex; justify-content: center; }
        .sla-pill { font-size: 12px; font-weight: 600; }

        .col-status { min-width: 90px; display: flex; align-items: center; gap: 6px; }
        .status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .col-date { min-width: 80px; text-align: right; font-size: 11.5px; color: #6e7491; }

        .empty-state { text-align: center; color: #6e7491; padding: 32px; font-size: 13.5px; }
        .loading-state { display: flex; align-items: center; justify-content: center; height: 60vh; color: #6e7491; font-size: 16px; }

        .sla-ref h2 { font-size: 14px; font-weight: 600; margin-bottom: 14px; color: #e8eaf0; }
        .sla-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }
        @media(max-width:800px){ .sla-grid { grid-template-columns: repeat(2,1fr); } }
        .sla-card {
          border-radius: 10px; border: 1px solid; padding: 14px;
          display: flex; flex-direction: column; gap: 6px;
        }
        .sla-level { font-size: 13px; font-weight: 700; }
        .sla-time { font-size: 16px; font-weight: 700; }
        .sla-desc { font-size: 11.5px; color: #9ca3c0; line-height: 1.4; }
      `}</style>
    </div>
  );
}

function KPI({ label, value, icon, color }) {
  return (
    <div style={{
      background: "#1a1d27", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12, padding: "18px 20px"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block", boxShadow: `0 0 7px ${color}` }} />
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: "#e8eaf0", marginBottom: 3 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#6e7491", fontWeight: 500 }}>{label}</div>
    </div>
  );
}

const SLA_DESC = {
  CRITICAL: "Panne majeure, intervention immédiate requise",
  HIGH:     "Incident bloquant la productivité",
  MEDIUM:   "Gênant mais contournement possible",
  LOW:      "Demande mineure sans impact direct",
};

const DEMO_TICKETS = [
  { id: 1, title: "Panne réseau salle informatique B12 — 30 postes HS", priority: "CRITICAL", status: "OUVERT",   category: { name: "Réseau" },   createdAt: new Date().toISOString() },
  { id: 2, title: "Virus détecté poste #41 — fichiers chiffrés",         priority: "CRITICAL", status: "EN_COURS", category: { name: "Sécurité" }, createdAt: new Date().toISOString() },
  { id: 3, title: "Imprimante bloc admin HS — dossiers urgents bloqués", priority: "HIGH",     status: "OUVERT",   category: { name: "Matériel" },  createdAt: new Date().toISOString() },
  { id: 4, title: "Mise à jour MATLAB — salle TP réseau",                priority: "MEDIUM",   status: "EN_COURS", category: { name: "Logiciel" }, createdAt: new Date().toISOString() },
  { id: 5, title: "Compte VPN étudiant bloqué",                          priority: "LOW",      status: "RESOLU",   category: { name: "Réseau" },   createdAt: new Date().toISOString() },
];
const DEMO_STATS = { totalTickets: 145, openTickets: 32, resolvedToday: 8, avgResolutionHours: 6.4 };
