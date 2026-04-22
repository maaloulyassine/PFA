import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ 
    firstName: "", 
    lastName: "", 
    email: "", 
    password: "" 
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        if (!form.email || !form.password) {
          setError("Veuillez remplir l'email et le mot de passe.");
          setLoading(false);
          return;
        }
        await login(form.email, form.password);
      } else {
        if (!form.firstName || !form.lastName || !form.email || !form.password) {
          setError("Veuillez remplir tous les champs.");
          setLoading(false);
          return;
        }
        if (form.password.length < 8) {
          setError("Le mot de passe doit contenir au moins 8 caractères.");
          setLoading(false);
          return;
        }
        await register({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password
        });
      }
      navigate("/dashboard");
    } catch (err) {
      setError(
         err.response?.data?.message || 
         (isLogin ? "Identifiants incorrects. Veuillez réessayer." : "Erreur lors de l'inscription.")
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setForm({ firstName: "", lastName: "", email: "", password: "" });
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
          {isLogin 
            ? "Connectez-vous à l'espace de gestion technique avec votre E-mail de fonction."
            : "Créez votre compte pour accéder à l'espace de gestion technique."}
        </p>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="name-fields">
              <div className="field">
                <label>Prénom</label>
                <input
                  type="text"
                  placeholder="ex: Jean"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required={!isLogin}
                />
              </div>
              <div className="field">
                <label>Nom</label>
                <input
                  type="text"
                  placeholder="ex: Dupont"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div className="field">
            <label>Adresse email</label>
            <input
              type="email"
              placeholder="ex: jean.dupont@helpdesk.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="field">
            <label>Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading 
              ? (isLogin ? "Connexion en cours…" : "Inscription en cours…") 
              : (isLogin ? "Se connecter" : "S'inscrire")}
          </button>
        </form>

        <div className="toggle-mode">
          {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
          <button type="button" onClick={toggleMode} className="btn-toggle">
            {isLogin ? "S'inscrire" : "Se connecter"}
          </button>
        </div>
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
          border-radius: 18px; padding: 40px 36px; width: 100%; max-width: 420px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.5);
        }
        .logo-row { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
        .logo-sq {
          width: 48px; height: 48px; border-radius: 12px;
          background: linear-gradient(135deg, #1E4DA1, #7B2FBE);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; font-weight: 700; color: #fff;
        }
        .login-title { font-size: 19px; font-weight: 700; color: #e8eaf0; }
        .login-org { font-size: 13px; color: #6e7491; margin-top: 2px; }
        .login-hint { font-size: 14px; color: #a0a3b1; margin-bottom: 24px; line-height: 1.5; }
        .alert-error {
          background: rgba(231,76,60,0.14);
          border: 1px solid rgba(231,76,60,0.3);
          color: #f87171;
          border-radius: 10px;
          padding: 12px;
          margin-bottom: 20px;
          font-size: 13.5px;
          text-align: center;
        }
        .name-fields { display: flex; gap: 12px; }
        .name-fields .field { flex: 1; }
        .field { margin-bottom: 20px; }
        .field label {
          display: block; font-size: 12px; font-weight: 600; color: #6e7491;
          text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;
        }
        .field input {
          width: 100%; padding: 14px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: white; font-size: 15px; outline: none;
          transition: all 0.2s;
        }
        .field input:focus { border-color: #4f8ef7; background: rgba(255,255,255,0.07); box-shadow: 0 0 0 3px rgba(79,142,247,0.15); }
        .btn-login { 
          width: 100%; padding: 16px; margin-top: 10px;
          background: linear-gradient(135deg, #1E4DA1, #7B2FBE); 
          border: none; border-radius: 12px; color: white; 
          font-weight: 700; font-size: 16px; cursor: pointer; 
          box-shadow: 0 12px 24px rgba(123,47,190,0.25);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-login:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 16px 32px rgba(123,47,190,0.35); }
        .btn-login:disabled { opacity: 0.6; cursor: not-allowed; }
        .toggle-mode {
          margin-top: 24px; text-align: center; font-size: 14px; color: #a0a3b1;
        }
        .btn-toggle {
          background: none; border: none; color: #4f8ef7; font-weight: 600;
          font-size: 14px; cursor: pointer; margin-left: 6px;
        }
        .btn-toggle:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}
