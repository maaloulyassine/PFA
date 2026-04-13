import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import api from "../utils/api";

const ROLE_COLOR = { ADMIN: "#e74c3c", TECHNICIEN: "#3498db", USER: "#27ae60" };
const ROLE_LABEL = { ADMIN: "Administrateur", TECHNICIEN: "Technicien", USER: "Utilisateur" };

export default function ProfilePage() {
  const { user } = useAuth();
  const { addToast } = useNotifications();
  const { login } = useAuth();
  const [form, setForm] = useState({ firstName: user?.firstName || "", lastName: user?.lastName || "", email: user?.email || "" });
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      // attempt API update, fallback to localStorage demo update
      await api.put("/users/me", { ...form, avatar });
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        const nu = { ...u, ...form, avatar };
        localStorage.setItem("user", JSON.stringify(nu));
        // update auth context so UI reflects changes immediately
        await login(nu);
      }
      addToast("Profil mis à jour.", "success");
    } catch {
      addToast("Profil mis à jour (démo).", "info");
    }
  };

  const handleAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      addToast("Les mots de passe ne correspondent pas.", "error");
      return;
    }
    try {
      await api.put("/users/me/password", pwForm);
      addToast("Mot de passe mis à jour.", "success");
    } catch {
      addToast("Erreur lors du changement de mot de passe.", "error");
    }
    setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 28 }}>Mon profil</h1>
      <div style={{ background: "#1a1d27", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "28px 28px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: avatar ? 'transparent' : ROLE_COLOR[user?.role], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#fff", overflow: 'hidden' }}>
              {avatar ? <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <>{user?.firstName?.[0]}{user?.lastName?.[0]}</>}
            </div>
            <div>
              <input type="file" accept="image/*" onChange={handleAvatar} style={{ display: 'block', marginBottom: 6 }} />
              <div style={{ fontSize: 12, color: '#6e7491' }}>PNG/JPG — max 2MB</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{user?.firstName} {user?.lastName}</div>
            <div style={{ color: ROLE_COLOR[user?.role], fontSize: 13, fontWeight: 600 }}>{ROLE_LABEL[user?.role]}</div>
          </div>
        </div>
        <form onSubmit={handleUpdate} style={{ padding: "22px 0", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6e7491", marginBottom: 18 }}>Informations personnelles</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[["Prénom", "firstName"], ["Nom", "lastName"]].map(([label, key]) => (
              <div key={key}>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#6e7491", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{label}</label>
                <input style={inputStyle} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#6e7491", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Email</label>
            <input style={inputStyle} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <button type="submit" style={btnStyle}>Enregistrer</button>
        </form>
        <form onSubmit={handlePassword} style={{ padding: "22px 0" }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6e7491", marginBottom: 18 }}>Changer le mot de passe</h3>
          {[["Mot de passe actuel", "currentPassword"], ["Nouveau mot de passe", "newPassword"], ["Confirmer", "confirmPassword"]].map(([label, key]) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#6e7491", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{label}</label>
              <input style={inputStyle} type="password" value={pwForm[key]} onChange={(e) => setPwForm({ ...pwForm, [key]: e.target.value })} />
            </div>
          ))}
          <button type="submit" style={btnStyle}>Changer le mot de passe</button>
        </form>
      </div>
    </div>
  );
}

const inputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#e8eaf0", padding: "10px 14px", fontSize: 14, outline: "none", width: "100%" };
const btnStyle = { marginTop: 16, background: "linear-gradient(135deg,#4f8ef7,#7c5cbf)", border: "none", borderRadius: 10, color: "#fff", padding: "10px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer" };
