import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Load user from localStorage on start
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (emailOrUser, password, role = "USER", specialty = null) => {
    // 👉 DEMO MODE (object passed)
    if (typeof emailOrUser === "object") {
      const u = { ...emailOrUser };
      if (!u.role) u.role = role;
      if (specialty && !u.specialty) u.specialty = specialty;
      setUser(u);
      localStorage.setItem("user", JSON.stringify(u));
      localStorage.setItem("jwt_token", "demo-token");
      return u;
    }

    // 👉 REAL API (fake for now)
    const fakeUser = {
      id: 1,
      firstName: emailOrUser.split("@")[0],
      email: emailOrUser,
      role: role || "USER",
      specialty: specialty || null,
    };

    setUser(fakeUser);
    localStorage.setItem("user", JSON.stringify(fakeUser));
    localStorage.setItem("jwt_token", "real-token");
    return fakeUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("jwt_token");
  };

  const isAuthenticated = !!user;

  // hasRole(["ADMIN", "TECHNICIEN"]) → true if user's role is in the array
  const hasRole = (roles) => {
    if (!user) return false;
    const ur = (user.role || "").toString().toUpperCase();
    return roles.map((r) => r.toString().toUpperCase()).includes(ur);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);