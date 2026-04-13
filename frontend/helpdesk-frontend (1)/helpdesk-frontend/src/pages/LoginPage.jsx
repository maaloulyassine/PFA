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
  const [selectedSpecialty, setSelectedSpecialty] = useState("Réseau");
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
      await login(form.email, form.password, selectedRole, selectedRole === "TECHNICIEN" ? selectedSpecialty : null);
      navigate("/dashboard");
    } catch (err) {
      // 👉 DEMO MODE
      const demoUser = {
        id: Date.now(),
        firstName: form.email.split("@")[0] || "Utilisateur",
        lastName: "",
        email: form.email,
        role: selectedRole,
        specialty: selectedRole === "TECHNICIEN" ? selectedSpecialty : null,
      };

      await login(demoUser);      // ✅ update React state (demoUser includes role)
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
          {selectedRole === "TECHNICIEN" && (
            <div className="field">
              <label>Spécialité du technicien</label>
              <div className="spec-grid">
                {['Réseau','Logiciel','Matériel','Sécurité','Autre'].map((s) => (
                  <button key={s} type="button" className={`spec-btn ${selectedSpecialty===s? 'selected':''}`} onClick={() => setSelectedSpecialty(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}
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
                  className={`role-btn ${selectedRole === r.key ? r.selClass + " selected" : ""}`}
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
        .field label {
          font-size: 11.5px; font-weight: 600; color: #6e7491;
          text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;
        }
        .field input {
          padding: 10px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: white;
          font-size: 14px;
          width: 100%;
          outline: none;
        }
        .field input:focus { border-color: #4f8ef7; }
        .role-section { margin-bottom: 18px; }
        .role-section-label {
          display: block; font-size: 11.5px; font-weight: 600;
          color: #6e7491; text-transform: uppercase; letter-spacing: 0.05em;
          margin-bottom: 8px;
        }
        .role-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin: 10px 0;
        }
        .role-btn {
          padding: 10px 8px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          cursor: pointer;
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          transition: all 0.15s;
          color: #a0a3b1;
        }
        .role-btn:hover { background: rgba(255,255,255,0.09); color: #e8eaf0; }
        .role-btn.role-user { border-color: rgba(39,174,96,0.5); background: rgba(39,174,96,0.1); color: #4ade80; }
        .role-btn.role-tech { border-color: rgba(52,152,219,0.5); background: rgba(52,152,219,0.1); color: #60a5fa; }
        .role-btn.role-admin { border-color: rgba(231,76,60,0.5); background: rgba(231,76,60,0.1); color: #f87171; }
        .role-icon { font-size: 20px; }
        .role-name { font-size: 12px; font-weight: 700; }
        .role-desc { font-size: 10px; color: #6e7491; text-align: center; line-height: 1.3; }

        /* Improved role button visuals */
        .role-btn {
          padding: 12px 10px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.03);
          cursor: pointer;
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          transition: transform 0.12s, box-shadow 0.12s, background 0.12s;
          color: #c0c3d0;
        }
        .role-btn:hover { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(0,0,0,0.45); background: rgba(255,255,255,0.06); color: #e8eaf0; }
        .role-btn.role-user { border-color: rgba(39,174,96,0.35); }
        .role-btn.role-tech { border-color: rgba(52,152,219,0.35); }
        .role-btn.role-admin { border-color: rgba(231,76,60,0.35); }
        .role-btn.selected { background: #000; color: #fff; transform: translateY(-2px); box-shadow: 0 14px 34px rgba(0,0,0,0.6); }

        /* Technician specialty buttons */
        .spec-grid { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
        .spec-btn { padding: 8px 12px; border-radius: 18px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.03); color: #cfd3e0; cursor: pointer; font-weight: 600; }
        .spec-btn:hover { background: rgba(255,255,255,0.06); color: #fff; }
        .spec-btn.selected { background: #000; color: #fff; box-shadow: 0 8px 18px rgba(0,0,0,0.5); border-color: rgba(255,255,255,0.12); }

        .btn-login { width: 100%; padding: 14px; background: linear-gradient(135deg, #0b66d1, #7b2fbe); border: none; border-radius: 14px; color: white; font-weight: 700; font-size: 15px; cursor: pointer; box-shadow: 0 12px 30px rgba(123,47,190,0.14); }
        .btn-login:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </div>
  );
}