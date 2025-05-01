import React, { createContext, useContext, useState, useEffect } from "react";
import { checkAuthStatus, login, logout } from "../api/api";
import { AuthContextType } from "../api/types";

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: true,
  login,
  logout,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { isAuthenticated: authStatus, user: userData } =
          await checkAuthStatus();
        setIsAuthenticated(authStatus);
        setUser(userData || null);
      } catch (error) {
        console.error("Failed to check authentication status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
