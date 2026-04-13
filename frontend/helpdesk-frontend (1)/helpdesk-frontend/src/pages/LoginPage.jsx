import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const ROLES = [
  {
    key: "USER",
    label: "Utilisateur",
    icon: "👤",
    desc: "Soumettre et suivre ses tickets",
    selClass: "role-user",
  },
  {
    key: "TECHNICIEN",
    label: "Technicien",
    icon: "🔧",
    desc: "Traiter les tickets assignés",
    selClass: "role-tech",
  },
  {
    key: "ADMIN",
    label: "Administrateur",
    icon: "🛡",
    desc: "Gérer la plateforme et les stats",
    selClass: "role-admin",
  },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [selectedRole, setSelectedRole] = useState("USER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      setError("Veuillez remplir l'email et le mot de passe.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // 👉 Try real login (fake for now)
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      // 👉 DEMO MODE
      const demoUser = {
        id: Date.now(),
        firstName: form.email.split("@")[0] || "Utilisateur",
        lastName: "",
        email: form.email,
        role: selectedRole,
        specialty: selectedRole === "TECHNICIEN" ? "Réseau" : null,
      };

      await login(demoUser);      // ✅ update React state
      navigate("/dashboard");     // ✅ NO reload
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-bg" />

      <div className="login-card">
        <div className="logo-row">
          <div className="logo-sq">HD</div>
          <div>
            <div className="login-title">Helpdesk Intelligent</div>
            <div className="login-org">Faculté des Sciences de Monastir</div>
          </div>
        </div>

        <p className="login-hint">
          Entrez n'importe quel email et mot de passe, puis choisissez votre rôle d'accès.
        </p>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Adresse email</label>
            <input
              type="email"
              placeholder="nom@fsm.rnu.tn"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              required
            />
          </div>

          <div className="field">
            <label>Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              required
            />
          </div>

          <div className="role-section">
            <span className="role-section-label">
              Accéder en tant que
            </span>
            <div className="role-grid">
              {ROLES.map((r) => (
                <button
                  type="button"
                  key={r.key}
                  className={`role-btn ${
                    selectedRole === r.key ? r.selClass : ""
                  }`}
                  onClick={() => setSelectedRole(r.key)}
                >
                  <span className="role-icon">{r.icon}</span>
                  <span className="role-name">{r.label}</span>
                  <span className="role-desc">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="btn-login"
            disabled={loading}
          >
            {loading ? "Connexion en cours…" : "Se connecter"}
          </button>
        </form>
      </div>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0f1117; font-family: 'Segoe UI', system-ui, sans-serif; }
        .login-root {
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          background: #0f1117; position: relative; overflow: hidden; padding: 24px;
        }
        .login-bg {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 70% 60% at 50% 30%, rgba(79,142,247,0.08) 0%, transparent 70%);
        }
        .login-card {
          position: relative; z-index: 1;
          background: #1a1d27; border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px; padding: 36px 32px; width: 100%; max-width: 480px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.5);
        }
        .logo-row { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
        .logo-sq {
          width: 44px; height: 44px; border-radius: 12px;
          background: linear-gradient(135deg, #1E4DA1, #7B2FBE);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; font-weight: 700; color: #fff;
        }
        .login-title { font-size: 17px; font-weight: 700; color: #e8eaf0; }
        .login-org { font-size: 12px; color: #6e7491; margin-top: 1px; }
        .login-hint { font-size: 13px; color: #6e7491; margin-bottom: 20px; }
        .alert-error {
          background: rgba(231,76,60,0.14);
          border: 1px solid rgba(231,76,60,0.3);
          color: #f87171;
          border-radius: 8px;
          padding: 10px;
          margin-bottom: 16px;
        }
        .field { margin-bottom: 14px; display: flex; flex-direction: column; }
        .field input {
          padding: 10px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: white;
        }
        .role-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin: 10px 0;
        }
        .role-btn {
          padding: 10px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          cursor: pointer;
        }
        .btn-login {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #1E4DA1, #7B2FBE);
          border: none;
          border-radius: 10px;
          color: white;
          font-weight: bold;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}