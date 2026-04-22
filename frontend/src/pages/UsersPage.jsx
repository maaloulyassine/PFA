import React, { useEffect, useState } from "react";
import { userAPI } from "../utils/api";
import { useNotifications } from "../context/NotificationContext";

const ROLES = ["USER", "TECHNICIEN", "ADMIN"];
const SPECIALTIES = [
  { value: "RESEAU", label: "Réseau" },
  { value: "LOGICIEL", label: "Logiciel" },
  { value: "MATERIEL", label: "Matériel" },
  { value: "IMPRIMANTE", label: "Imprimante" }
];
const ROLE_COLOR = { ADMIN: "#e74c3c", TECHNICIEN: "#3498db", USER: "#27ae60" };

function getSpecialtyLabel(value) {
  const match = SPECIALTIES.find(s => s.value === value);
  return match ? match.label : value;
}

export default function UsersPage() {
  const { addToast } = useNotifications();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", role: "USER", specialty: "", password: "" });
  const [search, setSearch] = useState("");

  useEffect(() => {
    userAPI.getAll().then((r) => setUsers(r.data?.content || r.data || []))
      .catch(() => setUsers(DEMO_USERS))
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditUser(null);
    setForm({ firstName: "", lastName: "", email: "", role: "USER", specialty: "", password: "" });
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, role: u.role, specialty: u.specialty || "", password: "" });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        role: form.role,
        specialty: form.role === "TECHNICIEN" ? (form.specialty || null) : null,
      };
      
      if (!editUser) {
        payload.email = form.email;
        payload.password = form.password;
      }

      if (editUser) {
        const res = await userAPI.update(editUser.id, payload);
        setUsers((prev) => prev.map((u) => u.id === editUser.id ? res.data : u));
        addToast("Utilisateur mis à jour.", "success");
      } else {
        const res = await userAPI.create(payload);
        setUsers((prev) => [...prev, res.data]);
        addToast("Utilisateur créé.", "success");
      }
    } catch (err) {
      console.error("API Update Error:", err.response?.data || err.message);
      // demo fallback
      if (!editUser) setUsers((prev) => [...prev, { id: Date.now(), ...form }]);
      else setUsers((prev) => prev.map((u) => u.id === editUser.id ? { ...u, ...form } : u));
      addToast(editUser ? "Mis à jour (démo)." : "Créé (démo).", "info");
    }
    setShowModal(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cet utilisateur ?")) return;
    try { await userAPI.delete(id); } catch {}
    setUsers((prev) => prev.filter((u) => u.id !== id));
    addToast("Utilisateur supprimé.", "success");
  };

  const filtered = users.filter((u) =>
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="users-page">
      <div className="page-header">
        <h1>Gestion des utilisateurs</h1>
        <button className="btn-primary" onClick={openCreate}>+ Nouvel utilisateur</button>
      </div>

      <div className="filters-bar">
        <input className="search-input" placeholder="🔍 Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="table-wrapper">
        {loading ? <div className="loading-row">Chargement…</div> : (
          <table className="users-table">
            <thead><tr>
              <th>Nom complet</th><th>Email</th><th>Rôle</th><th>Spécialité</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="user-cell">
                      <div className="avatar-sm" style={{ background: ROLE_COLOR[u.role] || "#555" }}>
                        {u.firstName?.[0]}{u.lastName?.[0]}
                      </div>
                      <span>{u.firstName} {u.lastName}</span>
                    </div>
                  </td>
                  <td className="email-cell">{u.email}</td>
                  <td>
                    <span className="role-badge" style={{ background: `${ROLE_COLOR[u.role]}22`, color: ROLE_COLOR[u.role] }}>{u.role}</span>
                  </td>
                  <td className="specialty-cell">{u.specialty ? getSpecialtyLabel(u.specialty) : <span className="na">—</span>}</td>
                  <td className="actions-cell">
                    <button className="action-btn" onClick={() => openEdit(u)}>✏️</button>
                    <button className="action-btn delete" onClick={() => handleDelete(u.id)}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="modal-row">
                <ModalField label="Prénom"><input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></ModalField>
                <ModalField label="Nom"><input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></ModalField>
              </div>
              <ModalField label="Email"><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></ModalField>
              {!editUser && <ModalField label="Mot de passe"><input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></ModalField>}
              <div className="modal-row">
                <ModalField label="Rôle">
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </ModalField>
                {form.role === "TECHNICIEN" && (
                  <ModalField label="Spécialité">
                    <select value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })}>
                      <option value="">— Choisir —</option>
                      {SPECIALTIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </ModalField>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn-primary">{editUser ? "Enregistrer" : "Créer"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .users-page { max-width: 1100px; }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .page-header h1 { font-size: 24px; font-weight: 700; }
        .btn-primary { background: linear-gradient(135deg,#4f8ef7,#7c5cbf); border: none; border-radius: 10px; color: #fff; padding: 10px 20px; font-size: 14px; font-weight: 600; cursor: pointer; }
        .filters-bar { margin-bottom: 16px; }
        .search-input { background: #1a1d27; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #e8eaf0; padding: 9px 14px; font-size: 13.5px; outline: none; width: 100%; max-width: 320px; }
        .table-wrapper { background: #1a1d27; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; overflow: hidden; }
        table { width: 100%; border-collapse: collapse; }
        th { padding: 12px 16px; text-align: left; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.06em; color: #6e7491; border-bottom: 1px solid rgba(255,255,255,0.07); }
        td { padding: 12px 16px; font-size: 13.5px; border-bottom: 1px solid rgba(255,255,255,0.04); }
        tr:last-child td { border-bottom: none; }
        tbody tr:hover { background: rgba(255,255,255,0.02); }
        .user-cell { display: flex; align-items: center; gap: 10px; }
        .avatar-sm { width: 30px; height: 30px; border-radius: 50%; font-size: 11px; font-weight: 700; color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .email-cell { color: #a0a3b1; font-size: 13px; }
        .role-badge { font-size: 11.5px; font-weight: 700; padding: 4px 10px; border-radius: 20px; }
        .specialty-cell { color: #a0a3b1; font-size: 13px; }
        .na { color: #6e7491; }
        .actions-cell { display: flex; gap: 6px; }
        .action-btn { background: rgba(255,255,255,0.05); border: none; border-radius: 6px; padding: 5px 8px; font-size: 14px; cursor: pointer; }
        .action-btn:hover { background: rgba(255,255,255,0.1); }
        .loading-row { text-align: center; color: #6e7491; padding: 40px; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 100; display: flex; align-items: center; justify-content: center; }
        .modal { background: #1a1d27; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 28px; width: 480px; max-width: 95vw; }
        .modal h2 { font-size: 18px; font-weight: 700; margin-bottom: 22px; }
        .modal-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
        .btn-cancel { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #a0a3b1; padding: 9px 18px; font-size: 13.5px; cursor: pointer; }
        input, select { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #e8eaf0; padding: 9px 12px; font-size: 13.5px; outline: none; width: 100%; }
        input:focus, select:focus { border-color: #4f8ef7; }
      `}</style>
    </div>
  );
}

function ModalField({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
      <label style={{ fontSize: "11.5px", fontWeight: 600, color: "#6e7491", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
      {children}
    </div>
  );
}

const DEMO_USERS = [
  { id: 1, firstName: "Mohamed", lastName: "Trabelsi", email: "m.trabelsi@fsm.rnu.tn", role: "TECHNICIEN", specialty: "RESEAU" },
  { id: 2, firstName: "Sana", lastName: "Belhaj", email: "s.belhaj@fsm.rnu.tn", role: "TECHNICIEN", specialty: "LOGICIEL" },
  { id: 3, firstName: "Karim", lastName: "Mansour", email: "k.mansour@fsm.rnu.tn", role: "ADMIN", specialty: null },
  { id: 4, firstName: "Ali", lastName: "Ben Salah", email: "a.bensalah@fsm.rnu.tn", role: "USER", specialty: null },
  { id: 5, firstName: "Leila", lastName: "Hammami", email: "l.hammami@fsm.rnu.tn", role: "USER", specialty: null },
];
