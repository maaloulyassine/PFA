import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ticketAPI, categoryAPI } from "../utils/api";
import { useNotifications } from "../context/NotificationContext";
import Layout from "../components/layout/Layout";

const CATEGORIES = ["Réseau", "Logiciel", "Matériel", "Sécurité", "Autre"];

const CATEGORY_KEYWORDS = {
  "Réseau": ["wifi", "réseau", "reseau", "network", "internet", "connexion", "ip", "dns", "vpn", "switch", "routeur", "ethernet", "débit", "ping", "câble"],
  "Logiciel": ["logiciel", "software", "application", "app", "windows", "linux", "matlab", "installer", "installation", "mise à jour", "update", "licence", "crash", "bug", "erreur"],
  "Matériel": ["matériel", "hardware", "ordinateur", "pc", "ecran", "écran", "clavier", "souris", "imprimante", "scanner", "disque", "ram", "processeur", "chauffe", "panne"],
  "Sécurité": ["sécurité", "securite", "virus", "malware", "hack", "attaque", "ransomware", "phishing", "mot de passe", "password", "accès", "chiffrement", "intrusion"],
};

function detectCategoryFromDesc(description) {
  const desc = (description || "").toLowerCase();
  let bestCat = null;
  let bestScore = 0;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.filter(kw => desc.includes(kw)).length;
    if (score > bestScore) { bestScore = score; bestCat = cat; }
  }
  return bestScore > 0 ? bestCat : null;
}

const P_COLOR = { CRITICAL: "#e74c3c", HIGH: "#e67e22", MEDIUM: "#f39c12", LOW: "#27ae60" };
const P_BG = { CRITICAL: "rgba(231,76,60,0.12)", HIGH: "rgba(230,126,34,0.12)", MEDIUM: "rgba(243,156,18,0.12)", LOW: "rgba(39,174,96,0.12)" };
const P_LABEL = { CRITICAL: "Critique", HIGH: "Élevée", MEDIUM: "Moyenne", LOW: "Faible" };

export default function NewTicketPage() {
  const navigate = useNavigate();
  const { addToast } = useNotifications();
  const [categories, setCategories] = useState(CATEGORIES.map((n, i) => ({ id: i + 1, name: n })));
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", categoryId: null, priority: "LOW" });
  const [previewPriority, setPreviewPriority] = useState("LOW");
  const [aiCategory, setAiCategory] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    categoryAPI.getAll().then((r) => {
      if (Array.isArray(r.data) && r.data.length > 0) {
        setCategories(r.data);
        try { localStorage.setItem('demo_categories', JSON.stringify(r.data)); } catch(e) {}
      }
    }).catch(() => {
      try { localStorage.setItem('demo_categories', JSON.stringify(categories)); } catch(e) {}
    });
  }, []);

  useEffect(() => {
    // We no longer auto-assign the first category. The backend now allows null categories.
  }, [categories]);

  useEffect(() => {
    const desc = (form.description || "").toLowerCase();
    if (desc.includes("panne") || desc.includes("virus") || desc.includes("sécurité") ||
        desc.includes("securite") || desc.includes("chiffr") || desc.includes("hack") || desc.includes("attaque")) {
      setPreviewPriority("CRITICAL");
    } else if (desc.includes("bloquant") || desc.includes("urgent") || desc.includes("urgente") ||
               desc.includes("réseau") || desc.includes("reseau") || desc.includes("network") || desc.includes("impossible")) {
      setPreviewPriority("HIGH");
    } else if (desc.includes("erreur") || desc.includes("error") || desc.includes("fail") ||
               desc.includes("bug") || desc.includes("problème") || desc.includes("probleme")) {
      setPreviewPriority("MEDIUM");
    } else {
      setPreviewPriority("LOW");
    }
  }, [form.description]);

  // Sync suggestion with select if user hasn't explicitly changed it
  useEffect(() => {
    if (form.description.trim().length > 0) {
      setForm(f => ({ ...f, priority: previewPriority }));
    }
  }, [previewPriority]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!form.description.trim()) { setAiCategory(null); return; }
    debounceRef.current = setTimeout(() => {
      const detected = detectCategoryFromDesc(form.description);
      setAiCategory(detected);
      if (detected) {
        const cat = categories.find(c => (c.name || "").toLowerCase().includes(detected.toLowerCase()) || (c.name || "").toLowerCase() === detected.toLowerCase());
        if (cat && cat.id !== form.categoryId) {
          setForm(f => ({ ...f, categoryId: cat.id }));
        }
      }
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [form.description, categories]);

  const applyAiCategory = () => {
    if (!aiCategory) return;
    const cat = categories.find(c => c.name === aiCategory);
    if (cat) { setForm(f => ({ ...f, categoryId: cat.id })); setAiCategory(null); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      addToast("Veuillez remplir tous les champs obligatoires.", "error");
      return;
    }
    setLoading(true);
    try {
      const dataToCreate = { 
        title: form.title, 
        description: form.description, 
        categoryId: form.categoryId,
        priority: form.priority || "LOW"
      };
      console.log("[NewTicketPage] creating ticket payload:", dataToCreate);
      const res = await ticketAPI.create(dataToCreate);
      addToast("Ticket créé avec succès !", "success");
      navigate(`/tickets/${res.data.id}`);
    } catch (err) {
      console.error("Erreur création ticket:", err);
      addToast(err.response?.data?.message || "Erreur lors de la création.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="new-ticket-page">
        <div className="page-header">
          <button className="btn-back" onClick={() => navigate(-1)}>← Retour</button>
          <h1>Nouveau ticket</h1>
        </div>

        <form onSubmit={handleSubmit} className="ticket-form">
          <div className="form-group">
            <label>Titre *</label>
            <input type="text" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Résumé court du problème" />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea rows={5} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Décrivez le problème en détail..." />
          </div>

          {aiCategory && aiCategory !== (categories.find(c => c.id === form.categoryId)?.name) && (
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 16px", borderRadius:10, background:"rgba(79,142,247,0.1)", border:"1px solid rgba(79,142,247,0.3)" }}>
              <span style={{ fontSize:13, color:"#9da3c8" }}>🤖 Catégorie suggérée :</span>
              <span style={{ fontWeight:700, color:"#4f8ef7", fontSize:13 }}>{aiCategory}</span>
              <button type="button" onClick={applyAiCategory} style={{ marginLeft:"auto", background:"#4f8ef7", border:"none", borderRadius:7, color:"#fff", fontSize:12, fontWeight:600, padding:"4px 12px", cursor:"pointer" }}>Appliquer</button>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {form.description.trim().length > 0 && (
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 16px", borderRadius:10, background:P_BG[previewPriority], border:`1px solid ${P_COLOR[previewPriority]}33` }}>
              <span style={{ fontSize:13, color:"#9da3c8" }}>🤖 Priorité suggérée :</span>
              <span style={{ fontWeight:700, color:P_COLOR[previewPriority], fontSize:13 }}>{P_LABEL[previewPriority]}</span>
            </div>
            )}

            <div style={{ fontSize:13, color: '#9da3c8' }}>
              Catégorie : <span style={{ fontWeight:700, color:'#e8eaf0' }}>{(categories.find(c => c.id === form.categoryId)?.name) || '—'}</span>
            </div>
          </div>

       

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Création..." : "Créer le ticket"}
          </button>
        </form>

        <style>{`
          .new-ticket-page { max-width: 680px; margin: 0 auto; }
          .page-header { display: flex; align-items: center; gap: 14px; margin-bottom: 28px; }
          .page-header h1 { font-size: 24px; font-weight: 700; }
          .btn-back { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #a0a3b1; padding: 7px 14px; font-size: 13px; cursor: pointer; }
          .btn-back:hover { background: rgba(255,255,255,0.09); color: #e8eaf0; }
          .ticket-form { background: #1a1d27; border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 28px; display: flex; flex-direction: column; gap: 18px; }
          .form-group { display: flex; flex-direction: column; gap: 7px; }
          .form-group label { font-size: 11.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6e7491; }
          .form-group input, .form-group select, .form-group textarea { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #e8eaf0; padding: 10px 14px; font-size: 14px; outline: none; font-family: inherit; }
          .form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #4f8ef7; }
          .form-group select option { background: #1a1d27; }
          .form-group textarea { resize: vertical; }
          .btn-primary { background: linear-gradient(135deg,#4f8ef7,#7c5cbf); border: none; border-radius: 10px; color: #fff; padding: 12px 24px; font-size: 14px; font-weight: 600; cursor: pointer; align-self: flex-start; transition: opacity 0.15s; }
          .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
          .btn-primary:hover:not(:disabled) { opacity: 0.9; }
        `}</style>
      </div>
    </>
  );
}
