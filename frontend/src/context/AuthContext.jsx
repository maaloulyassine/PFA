import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../utils/api";
import api from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on start
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("jwt_token");
      if (token) {
        try {
          const res = await authAPI.me();
          setUser(res.data);
          localStorage.setItem("user", JSON.stringify(res.data));
        } catch (error) {
          console.error("Token expiré ou invalide", error);
          logout();
        }
      }
      setIsLoading(false);
    };
    fetchUser();
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, user: loggedInUser } = res.data;
    
    localStorage.setItem("jwt_token", token);
    localStorage.setItem("user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    
    return loggedInUser;
  };

  const register = async (userData) => {
    const res = await authAPI.register(userData);
    const { token, user: registeredUser } = res.data;
    
    localStorage.setItem("jwt_token", token);
    localStorage.setItem("user", JSON.stringify(registeredUser));
    setUser(registeredUser);
    
    return registeredUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("jwt_token");
    window.location.href = "/login";
  };

  const isAuthenticated = !!user;

  // hasRole(["ADMIN", "TECHNICIEN"]) -> true if user's role is in the array
  const hasRole = (roles) => {
    if (!user) return false;
    const ur = (user.role || "").toString().toUpperCase();
    return roles.map((r) => r.toString().toUpperCase()).includes(ur);
  };

  if (isLoading) {
    return <div style={{display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', color: '#fff'}}>Chargement...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, isAuthenticated, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
