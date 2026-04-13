import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ticketAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";

const PRIORITIES = ["CRITIQUE", "ELEVEE", "MOYENNE", "FAIBLE"];
const STATUSES = ["OUVERT", "EN_COURS", "RESOLU", "FERME"];

const P_COLOR = { CRITIQUE: "#e74c3c", ELEVEE: "#e67e22", MOYENNE: "#f39c12", FAIBLE: "#27ae60" };
const P_BG = { CRITIQUE: "rgba(231,76,60,0.15)", ELEVEE: "rgba(230,126,34,0.13)", MOYENNE: "rgba(243,156,18,0.13)", FAIBLE: "rgba(39,174,96,0.13)" };
const S_COLOR = { OUVERT: "#3498db", EN_COURS: "#f39c12", RESOLU: "#27ae60", FERME: "#6e7491" };

export default function TicketsPage() {
  const { hasRole } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", priority: "", status: "", page: 0 });
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: filters.page, size: 15 };
      if (filters.search) params.search = filters.search;
      if (filters.priority) params.priority = filters.priority;
      if (filters.status) params.status = filters.status;
      const res = await ticketAPI.getAll(params);
      const data = res.data;
      setTickets(data.content || data || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      setTickets(DEMO_TICKETS);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce ticket ?")) return;
    try {
      await ticketAPI.delete(id);
      setTickets((prev) => prev.filter((t) => t.id !== id));
    } catch (e) { alert("Erreur lors de la suppression."); }
  };

  return (
    <div className="tickets-page">
      <div className="page-header">
        <h1>Tickets de support</h1>
        <Link to="/tickets/new" className="btn-primary">+ Nouveau ticket</Link>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <input
          className="search-input" placeholder="🔍 Rechercher un ticket…"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 0 })}
        />
        <select className="filter-select" value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value, page: 0 })}>
          <option value="">Toutes priorités</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="filter-select" value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 0 })}>
          <option value="">Tous statuts</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn-refresh" onClick={load} title="Rafraîchir">↻</button>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {loading ? (
          <div className="loading-row">Chargement…</div>
        ) : tickets.length === 0 ? (
          <div className="empty-row">Aucun ticket trouvé.</div>
        ) : (
          <table className="tickets-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Titre</th>
                <th>Catégorie</th>
                <th>Priorité</th>
                <th>Statut</th>
                <th>Demandeur</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td className="col-id">{t.id}</td>
                  <td className="col-title">
                    <Link to={`/tickets/${t.id}`} className="ticket-link">{t.title}</Link>
                  </td>
                  <td><span className="cat-badge">{t.category?.name || t.category || "—"}</span></td>
                  <td>
                    <span className="priority-badge" style={{ background: P_BG[t.priority], color: P_COLOR[t.priority] }}>
                      {t.priority}
                    </span>
                  </td>
                  <td>
                    <span className="status-dot" style={{ background: S_COLOR[t.status] }} />
                    <span style={{ color: S_COLOR[t.status], fontSize: 13 }}>{t.status?.replace("_", " ")}</span>
                  </td>
                  <td className="col-user">{t.createdBy?.firstName || t.createdBy || "—"}</td>
                  <td className="col-date">{new Date(t.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td className="col-actions">
                    <Link to={`/tickets/${t.id}`} className="action-btn view">👁</Link>
                    <button className="action-btn delete" onClick={() => handleDelete(t.id)}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} className={`page-btn ${filters.page === i ? "active" : ""}`}
              onClick={() => setFilters({ ...filters, page: i })}>
              {i + 1}
            </button>
          ))}
        </div>
      )}

      <style>{`
        .tickets-page { max-width: 1200px; }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .page-header h1 { font-size: 24px; font-weight: 700; }
        .btn-primary {
          background: linear-gradient(135deg,#4f8ef7,#7c5cbf); border: none; border-radius: 10px;
          color: #fff; padding: 10px 20px; font-size: 14px; font-weight: 600; text-decoration: none;
        }
        .filters-bar { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
        .search-input, .filter-select {
          background: #1a1d27; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
          color: #e8eaf0; padding: 9px 14px; font-size: 13.5px; outline: none;
        }
        .search-input { flex: 1; min-width: 220px; }
        .search-input:focus, .filter-select:focus { border-color: #4f8ef7; }
        .btn-refresh {
          background: #1a1d27; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
          color: #6e7491; padding: 9px 14px; font-size: 16px; transition: color 0.15s;
        }
        .btn-refresh:hover { color: #e8eaf0; }
        .table-wrapper { background: #1a1d27; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; overflow: hidden; }
        .tickets-table { width: 100%; border-collapse: collapse; }
        .tickets-table th {
          padding: 12px 14px; text-align: left; font-size: 11.5px; text-transform: uppercase;
          letter-spacing: 0.06em; color: #6e7491; border-bottom: 1px solid rgba(255,255,255,0.07);
          white-space: nowrap;
        }
        .tickets-table td { padding: 12px 14px; font-size: 13.5px; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .tickets-table tr:last-child td { border-bottom: none; }
        .tickets-table tbody tr:hover { background: rgba(255,255,255,0.02); }
        .col-id { color: #6e7491; font-size: 12px; width: 40px; }
        .col-title { max-width: 260px; }
        .ticket-link { color: #e8eaf0; text-decoration: none; font-weight: 500; }
        .ticket-link:hover { color: #4f8ef7; }
        .cat-badge { background: rgba(255,255,255,0.07); color: #a0a3b1; font-size: 11.5px; padding: 3px 9px; border-radius: 6px; }
        .priority-badge { font-size: 11.5px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
        .status-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 6px; }
        .col-user { color: #a0a3b1; font-size: 13px; }
        .col-date { color: #6e7491; font-size: 12px; white-space: nowrap; }
        .col-actions { display: flex; gap: 6px; }
        .action-btn { background: rgba(255,255,255,0.05); border: none; border-radius: 6px; padding: 5px 8px; font-size: 14px; cursor: pointer; text-decoration: none; transition: background 0.15s; }
        .action-btn:hover { background: rgba(255,255,255,0.1); }
        .loading-row, .empty-row { text-align: center; color: #6e7491; padding: 40px; }
        .pagination { display: flex; gap: 6px; justify-content: center; margin-top: 20px; }
        .page-btn { background: #1a1d27; border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; color: #e8eaf0; padding: 6px 12px; font-size: 13px; cursor: pointer; }
        .page-btn.active { background: #4f8ef7; border-color: #4f8ef7; }
      `}</style>
    </div>
  );
}

const DEMO_TICKETS = [
  { id: 1, title: "Panne réseau salle B12", category: { name: "Réseau" }, priority: "CRITIQUE", status: "OUVERT", createdBy: { firstName: "Ali" }, createdAt: new Date().toISOString() },
  { id: 2, title: "Mise à jour MATLAB nécessaire", category: { name: "Logiciel" }, priority: "MOYENNE", status: "EN_COURS", createdBy: { firstName: "Sana" }, createdAt: new Date().toISOString() },
  { id: 3, title: "Imprimante HS bloc admin", category: { name: "Matériel" }, priority: "ELEVEE", status: "OUVERT", createdBy: { firstName: "Omar" }, createdAt: new Date().toISOString() },
  { id: 4, title: "Compte VPN étudiant bloqué", category: { name: "Réseau" }, priority: "FAIBLE", status: "RESOLU", createdBy: { firstName: "Leila" }, createdAt: new Date().toISOString() },
  { id: 5, title: "Virus détecté poste #41", category: { name: "Sécurité" }, priority: "CRITIQUE", status: "EN_COURS", createdBy: { firstName: "Karim" }, createdAt: new Date().toISOString() },
];
