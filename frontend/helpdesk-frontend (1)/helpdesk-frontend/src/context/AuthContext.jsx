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

  const login = async (emailOrUser, password) => {
    // 👉 DEMO MODE
    if (typeof emailOrUser === "object") {
      setUser(emailOrUser);
      localStorage.setItem("user", JSON.stringify(emailOrUser));
      localStorage.setItem("jwt_token", "demo-token");
      return;
    }

    // 👉 REAL API (fake for now)
    const fakeUser = {
      id: 1,
      firstName: emailOrUser.split("@")[0],
      email: emailOrUser,
      role: "USER",
    };

    setUser(fakeUser);
    localStorage.setItem("user", JSON.stringify(fakeUser));
    localStorage.setItem("jwt_token", "real-token");
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("jwt_token");
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);