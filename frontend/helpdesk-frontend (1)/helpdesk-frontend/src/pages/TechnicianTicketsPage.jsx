// TechnicianTicketsPage.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ticketAPI } from "../utils/api";

const P_COLOR = { CRITIQUE: "#e74c3c", ELEVEE: "#e67e22", MOYENNE: "#f39c12", FAIBLE: "#27ae60" };
const P_BG = { CRITIQUE: "rgba(231,76,60,0.15)", ELEVEE: "rgba(230,126,34,0.13)", MOYENNE: "rgba(243,156,18,0.13)", FAIBLE: "rgba(39,174,96,0.13)" };
const S_COLOR = { OUVERT: "#3498db", EN_COURS: "#f39c12", RESOLU: "#27ae60", FERME: "#6e7491" };

export default function TechnicianTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ticketAPI.getAssigned()
      .then((r) => setTickets(r.data?.content || r.data || []))
      .catch(() => setTickets(DEMO))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Tickets assignés</h1>
      {loading ? <p style={{ color: "#6e7491" }}>Chargement…</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tickets.map((t) => (
            <Link key={t.id} to={`/tickets/${t.id}`} style={{
              background: "#1a1d27", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10,
              padding: "16px 20px", display: "flex", alignItems: "center", gap: 16,
              color: "#e8eaf0", textDecoration: "none", transition: "background 0.15s"
            }}>
              <span style={{ color: "#6e7491", fontSize: 12, minWidth: 36 }}>#{t.id}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{t.title}</div>
                <div style={{ fontSize: 12.5, color: "#6e7491" }}>Créé le {new Date(t.createdAt).toLocaleDateString("fr-FR")}</div>
              </div>
              <span style={{ background: P_BG[t.priority], color: P_COLOR[t.priority], fontSize: 11.5, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>{t.priority}</span>
              <span style={{ color: S_COLOR[t.status], fontSize: 13, fontWeight: 500 }}>{t.status?.replace("_", " ")}</span>
            </Link>
          ))}
          {tickets.length === 0 && <p style={{ color: "#6e7491", textAlign: "center", padding: 40 }}>Aucun ticket assigné.</p>}
        </div>
      )}
    </div>
  );
}

const DEMO = [
  { id: 3, title: "Imprimante HS bloc admin", priority: "ELEVEE", status: "OUVERT", createdAt: new Date().toISOString() },
  { id: 5, title: "Virus détecté poste #41", priority: "CRITIQUE", status: "EN_COURS", createdAt: new Date().toISOString() },
];
