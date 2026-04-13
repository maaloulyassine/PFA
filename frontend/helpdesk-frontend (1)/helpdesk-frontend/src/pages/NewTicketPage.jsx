import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ticketAPI, categoryAPI } from "../utils/api";
import { useNotifications } from "../context/NotificationContext";

const CATEGORIES = ["Réseau", "Logiciel", "Matériel", "Sécurité", "Autre"];

export default function NewTicketPage() {
  const navigate = useNavigate();
  const { addToast } = useNotifications();
  const [categories, setCategories] = useState(CATEGORIES.map((n, i) => ({ id: i + 1, name: n })));
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", categoryId: "",
  });
  const [previewPriority, setPreviewPriority] = useState(null);

  useEffect(() => {
    categoryAPI.getAll().then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  // Simple client-side priority preview
  useEffect(() => {
    // Priority preview derived ONLY from description (AI simulation)
    const desc = (form.description || "").toLowerCase();
    if (desc.includes("panne") || desc.includes("virus") || desc.includes("sécurité") || desc.includes("chiffr")) {
      setPreviewPriority("CRITIQUE");
    } else if (desc.includes("bloquant") || desc.includes("urgente") || desc.includes("réseau") || desc.includes("network")) {
      setPreviewPriority("ELEVEE");
    } else if (desc.includes("erreur") || desc.includes("fail") || desc.includes("bug")) {
      setPreviewPriority("MOYENNE");
    } else {
      setPreviewPriority("FAIBLE");
    }
  }, [form.description]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.categoryId) {
      addToast("Veuillez remplir tous les champs obligatoires.", "error");
      return;
    }
    setLoading(true);
    try {
      // Ensure priority is set by AI (from description)
      const dataToCreate = { ...form, priority: previewPriority || "FAIBLE" };
      const res = await ticketAPI.create(dataToCreate);
      addToast("Ticket créé avec succès !", "success");
      navigate(`/tickets/${res.data.id}`);
    } catch (err) {
      // If backend is not available, fallback to a demo ticket so user flow continues
      if (!err?.response) {
        const demo = { id: Date.now(), title: form.title, priority: previewPriority || "FAIBLE", status: "OUVERT", category: { name: categories.find(c => c.id === parseInt(form.categoryId))?.name || "Autre" }, impactedUsers: parseInt(form.impactedUsers) || 1, createdAt: new Date().toISOString() };
        addToast("Ticket créé en mode démo.", "success");
        navigate(`/tickets/${demo.id}`);
      } else {
        addToast(err.response?.data?.message || "Erreur lors de la création.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const P_COLOR = { CRITIQUE: "#e74c3c", ELEVEE: "#e67e22", MOYENNE: "#f39c12", FAIBLE: "#27ae60" };
  const P_BG = { CRITIQUE: "rgba(231,76,60,0.12)", ELEVEE: "rgba(230,126,34,0.12)", MOYENNE: "rgba(243,156,18,0.12)", FAIBLE: "rgba(39,174,96,0.12)" };

  return (
    <div className="new-ticket-page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate(-1)}>← Retour</button>
        <h1>Créer un nouveau ticket</h1>
      </div>

      <div className="form-layout">
        <form onSubmit={handleSubmit} className="ticket-form">
          <div className="form-card">
            <h2 className="form-section-title">Informations du ticket</h2>
            <Field label="Titre *" required>
              <input type="text" placeholder="Décrivez brièvement le problème…" required
                value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field label="Description détaillée *" required>
              <textarea rows={5} placeholder="Décrivez le problème en détail, les étapes de reproduction, les équipements concernés…"
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <div className="field-row">
              <Field label="Catégorie *">
                  <select required value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  style={{ background: '#000', color: '#fff' }}>
                  <option value="">-- Sélectionner --</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              {/* impactedUsers removed: priority is computed by AI service based on title/category */}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate(-1)}>Annuler</button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "Envoi en cours…" : "Soumettre le ticket"}
            </button>
          </div>
        </form>

        {/* Priority Preview */}
        <div className="sidebar-info">
          <div className="info-card">
            <h3>Priorité estimée</h3>
            {previewPriority ? (
              <div className="priority-preview" style={{ background: P_BG[previewPriority], borderColor: P_COLOR[previewPriority] + "40" }}>
                <div className="priority-dot" style={{ background: P_COLOR[previewPriority], boxShadow: `0 0 10px ${P_COLOR[previewPriority]}` }} />
                <div>
                  <div className="priority-name" style={{ color: P_COLOR[previewPriority] }}>{previewPriority}</div>
                  <div className="priority-hint">{PRIORITY_HINTS[previewPriority]}</div>
                </div>
              </div>
            ) : (
              <p className="hint-text">Remplissez le titre pour voir la priorité estimée.</p>
            )}
          </div>

          <div className="info-card">
            <h3>Délais de traitement</h3>
            {[
              { p: "CRITIQUE", delay: "2 heures", color: "#e74c3c" },
              { p: "ELEVEE", delay: "8 heures", color: "#e67e22" },
              { p: "MOYENNE", delay: "48 heures", color: "#f39c12" },
              { p: "FAIBLE", delay: "5 jours", color: "#27ae60" },
            ].map(({ p, delay, color }) => (
              <div key={p} className="delay-row">
                <span className="delay-dot" style={{ background: color }} />
                <span className="delay-label">{p}</span>
                <span className="delay-value">{delay}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .new-ticket-page { max-width: 1100px; }
        .page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; }
        .page-header h1 { font-size: 24px; font-weight: 700; }
        .btn-back { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #a0a3b1; padding: 7px 14px; font-size: 13px; cursor: pointer; }
        .btn-back:hover { color: #e8eaf0; background: rgba(255,255,255,0.08); }
        .form-layout { display: grid; grid-template-columns: 1fr 280px; gap: 24px; align-items: start; }
        @media (max-width: 800px) { .form-layout { grid-template-columns: 1fr; } }
        .ticket-form { display: flex; flex-direction: column; gap: 20px; }
        .form-card { background: #1a1d27; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 24px; }
        .form-section-title { font-size: 15px; font-weight: 600; margin-bottom: 20px; color: #e8eaf0; }
        .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-actions { display: flex; gap: 12px; justify-content: flex-end; }
        .btn-cancel { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; color: #a0a3b1; padding: 11px 22px; font-size: 14px; }
        .btn-cancel:hover { color: #e8eaf0; }
        .btn-submit { background: linear-gradient(135deg,#4f8ef7,#7c5cbf); border: none; border-radius: 10px; color: #fff; padding: 11px 28px; font-size: 14px; font-weight: 600; }
        .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .sidebar-info { display: flex; flex-direction: column; gap: 16px; }
        .info-card { background: #1a1d27; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 20px; }
        .info-card h3 { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #6e7491; margin-bottom: 14px; }
        .priority-preview { border: 1px solid; border-radius: 10px; padding: 14px; display: flex; gap: 12px; align-items: center; }
        .priority-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
        .priority-name { font-weight: 700; font-size: 16px; }
        .priority-hint { font-size: 11.5px; color: #a0a3b1; margin-top: 2px; }
        .hint-text { color: #6e7491; font-size: 13px; }
        .delay-row { display: flex; align-items: center; gap: 8px; padding: 7px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .delay-row:last-child { border-bottom: none; }
        .delay-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .delay-label { flex: 1; font-size: 12.5px; color: #a0a3b1; }
        .delay-value { font-size: 12.5px; font-weight: 600; color: #e8eaf0; }
      `}</style>
    </div>
  );
}

function Field({ label, children, required }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
      <label style={{ fontSize: "12px", fontWeight: 600, color: "#6e7491", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      <style>{`
        input, select, textarea {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px; color: #e8eaf0; padding: 10px 14px; font-size: 14px;
          outline: none; transition: border-color 0.2s; width: 100%; resize: vertical;
        }
        input:focus, select:focus, textarea:focus { border-color: #4f8ef7; }
      `}</style>
      {children}
    </div>
  );
}

const PRIORITY_HINTS = {
  CRITIQUE: "Intervention immédiate requise",
  ELEVEE: "Traitement sous 8 heures",
  MOYENNE: "Traitement sous 48 heures",
  FAIBLE: "Traitement sous 5 jours",
};
