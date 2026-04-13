import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ticketAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";

const S_CONFIG = {
  OUVERT: { color: "#3498db", label: "Ouvert" },
  EN_COURS: { color: "#f39c12", label: "En cours" },
  RESOLU: { color: "#27ae60", label: "Résolu" },
  FERME: { color: "#6e7491", label: "Fermé" },
};
const P_CONFIG = {
  CRITIQUE: { color: "#e74c3c", bg: "rgba(231,76,60,0.13)", label: "Critique" },
  ELEVEE: { color: "#e67e22", bg: "rgba(230,126,34,0.12)", label: "Élevée" },
  MOYENNE: { color: "#f39c12", bg: "rgba(243,156,18,0.12)", label: "Moyenne" },
  FAIBLE: { color: "#27ae60", bg: "rgba(39,174,96,0.12)", label: "Faible" },
};

export default function TicketDetailPage() {
  const { id } = useParams();
  const { user, hasRole } = useAuth();
  const { addToast } = useNotifications();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    ticketAPI.getById(id).then((r) => setTicket(r.data))
      .catch(() => setTicket(DEMO_TICKET))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      await ticketAPI.updateStatus(id, newStatus);
      setTicket((prev) => ({ ...prev, status: newStatus }));
      addToast(`Statut mis à jour : ${newStatus}`, "success");
    } catch {
      addToast("Erreur lors de la mise à jour du statut.", "error");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await ticketAPI.addComment(id, comment);
      setTicket((prev) => ({ ...prev, comments: [...(prev.comments || []), res.data] }));
      setComment("");
      addToast("Commentaire ajouté.", "success");
    } catch {
      // demo fallback
      const demo = { id: Date.now(), content: comment, author: { firstName: user?.firstName, lastName: user?.lastName }, createdAt: new Date().toISOString() };
      setTicket((prev) => ({ ...prev, comments: [...(prev.comments || []), demo] }));
      setComment("");
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) return <div className="loading-state">Chargement…</div>;
  if (!ticket) return <div className="loading-state">Ticket introuvable.</div>;

  const canChangeStatus = hasRole(["TECHNICIEN", "ADMIN"]);
  const pc = P_CONFIG[ticket.priority] || P_CONFIG.FAIBLE;
  const sc = S_CONFIG[ticket.status] || S_CONFIG.OUVERT;

  return (
    <div className="ticket-detail">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate(-1)}>← Retour</button>
        <h1>Ticket #{ticket.id}</h1>
        <span className="priority-badge" style={{ background: pc.bg, color: pc.color }}>{pc.label}</span>
      </div>

      <div className="detail-layout">
        {/* Main */}
        <div className="main-col">
          <div className="card">
            <h2 className="ticket-title">{ticket.title}</h2>
            <div className="ticket-meta">
              <span>Créé le {new Date(ticket.createdAt).toLocaleDateString("fr-FR")}</span>
              <span>par {ticket.createdBy?.firstName} {ticket.createdBy?.lastName}</span>
            </div>
            <p className="ticket-desc">{ticket.description}</p>
          </div>

          {/* Comments */}
          <div className="card">
            <h3 className="section-title">Commentaires ({ticket.comments?.length || 0})</h3>
            <div className="comments-list">
              {(ticket.comments || []).map((c) => (
                <div key={c.id} className="comment">
                  <div className="comment-header">
                    <span className="comment-author">{c.author?.firstName} {c.author?.lastName}</span>
                    <span className="comment-date">{new Date(c.createdAt).toLocaleString("fr-FR")}</span>
                  </div>
                  <p className="comment-content">{c.content}</p>
                </div>
              ))}
              {(!ticket.comments || ticket.comments.length === 0) && (
                <p className="no-comments">Aucun commentaire pour le moment.</p>
              )}
            </div>
            <form onSubmit={handleAddComment} className="comment-form">
              <textarea rows={3} placeholder="Ajouter un commentaire…" value={comment}
                onChange={(e) => setComment(e.target.value)} />
              <button type="submit" disabled={submittingComment || !comment.trim()} className="btn-comment">
                Envoyer
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="detail-sidebar">
          <div className="card">
            <h3 className="section-title">Informations</h3>
            <InfoRow label="Statut">
              <span className="status-indicator" style={{ color: sc.color }}>
                <span className="status-dot" style={{ background: sc.color }} />{sc.label}
              </span>
            </InfoRow>
            <InfoRow label="Priorité">
              <span style={{ background: pc.bg, color: pc.color, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{pc.label}</span>
            </InfoRow>
            <InfoRow label="Catégorie">{ticket.category?.name || ticket.category || "—"}</InfoRow>
            <InfoRow label="Assigné à">
              {ticket.assignedTo ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}` : "Non assigné"}
            </InfoRow>
            <InfoRow label="Date création">{new Date(ticket.createdAt).toLocaleDateString("fr-FR")}</InfoRow>
          </div>

          {canChangeStatus && (
            <div className="card">
              <h3 className="section-title">Changer le statut</h3>
              <div className="status-buttons">
                {Object.entries(S_CONFIG).map(([key, { color, label }]) => (
                  <button key={key} className={`status-btn ${ticket.status === key ? "active" : ""}`}
                    style={{ "--sc": color }} onClick={() => handleStatusChange(key)}>
                    <span className="s-dot" style={{ background: color }} />{label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .ticket-detail { max-width: 1100px; }
        .page-header { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
        .page-header h1 { font-size: 24px; font-weight: 700; flex: 1; }
        .btn-back { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #a0a3b1; padding: 7px 14px; font-size: 13px; }
        .priority-badge { font-size: 13px; font-weight: 600; padding: 5px 14px; border-radius: 20px; }
        .detail-layout { display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: start; }
        @media (max-width: 800px) { .detail-layout { grid-template-columns: 1fr; } }
        .main-col { display: flex; flex-direction: column; gap: 20px; }
        .card { background: #1a1d27; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 22px; }
        .detail-sidebar { display: flex; flex-direction: column; gap: 16px; }
        .ticket-title { font-size: 19px; font-weight: 700; margin-bottom: 10px; }
        .ticket-meta { display: flex; gap: 12px; font-size: 12.5px; color: #6e7491; margin-bottom: 16px; }
        .ticket-desc { color: #a0a3b1; font-size: 14px; line-height: 1.65; white-space: pre-wrap; }
        .section-title { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #6e7491; margin-bottom: 16px; }
        .comments-list { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
        .comment { background: rgba(255,255,255,0.03); border-radius: 8px; padding: 13px; }
        .comment-header { display: flex; justify-content: space-between; margin-bottom: 7px; }
        .comment-author { font-size: 13px; font-weight: 600; color: #4f8ef7; }
        .comment-date { font-size: 11.5px; color: #6e7491; }
        .comment-content { font-size: 13.5px; color: #c0c3d0; line-height: 1.55; }
        .no-comments { color: #6e7491; font-size: 13px; text-align: center; padding: 16px 0; }
        .comment-form { display: flex; flex-direction: column; gap: 10px; }
        .comment-form textarea { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #e8eaf0; padding: 10px 14px; font-size: 13.5px; outline: none; resize: vertical; }
        .comment-form textarea:focus { border-color: #4f8ef7; }
        .btn-comment { align-self: flex-end; background: #4f8ef7; border: none; border-radius: 8px; color: #fff; padding: 9px 22px; font-size: 13.5px; font-weight: 600; }
        .btn-comment:disabled { opacity: 0.4; }
        .status-indicator { display: flex; align-items: center; gap: 7px; font-size: 13.5px; font-weight: 600; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
        .status-buttons { display: flex; flex-direction: column; gap: 8px; }
        .status-btn { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #a0a3b1; padding: 10px 14px; font-size: 13.5px; display: flex; align-items: center; gap: 8px; transition: all 0.15s; }
        .status-btn:hover { background: rgba(255,255,255,0.07); color: #e8eaf0; }
        .status-btn.active { border-color: var(--sc); background: color-mix(in srgb, var(--sc) 15%, transparent); color: var(--sc); }
        .s-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .loading-state { display: flex; align-items: center; justify-content: center; height: 60vh; color: #6e7491; font-size: 16px; }
      `}</style>
    </div>
  );
}

function InfoRow({ label, children }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "13.5px" }}>
      <span style={{ color: "#6e7491" }}>{label}</span>
      <span style={{ color: "#e8eaf0", fontWeight: 500 }}>{children}</span>
    </div>
  );
}

const DEMO_TICKET = {
  id: 1, title: "Panne réseau salle informatique B12", description: "La connexion internet est totalement coupée dans toute la salle B12. Les 30 postes sont affectés. La salle est utilisée pour les travaux pratiques de réseaux du groupe GL3.",
  priority: "CRITIQUE", status: "OUVERT", category: { name: "Réseau" },
  createdBy: { firstName: "Ali", lastName: "Ben Salah" }, assignedTo: { firstName: "Mohamed", lastName: "Trabelsi" },
  createdAt: new Date().toISOString(),
  comments: [{ id: 1, content: "J'ai vérifié le switch principal, il semble défectueux. Je vais commander un remplacement.", author: { firstName: "Mohamed", lastName: "Trabelsi" }, createdAt: new Date().toISOString() }]
};
