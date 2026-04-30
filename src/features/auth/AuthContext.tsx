import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  type AuthUser,
  loginRequest,
  logoutRequest,
  meRequest,
} from "@/services/authApi";
import {
  clearAuthStorage,
  getAccessToken,
  getStoredUser,
  setAccessToken,
  setRememberSession,
  setStoredUser,
} from "@/services/authStorage";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const decodeJwtExp = (token: string) => {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return typeof decoded.exp === "number" ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [token, setTokenState] = useState<string | null>(getAccessToken());
  const [loading, setLoading] = useState(true);

  const setToken = (value: string | null, persist = true) => {
    setTokenState(value);
    setAccessToken(value, persist);
  };

  const login = async (username: string, password: string, remember = true) => {
    const response = await loginRequest(username, password);
    setRememberSession(remember);
    setToken(response.token, remember);
    setUser(response.user);
    setStoredUser(response.user, remember);
  };

  const logout = async () => {
    try {
      await logoutRequest();
    } finally {
      setToken(null);
      setUser(null);
      clearAuthStorage();
    }
  };

  const refreshUser = async () => {
    const response = await meRequest();
    setUser(response.user);
    setStoredUser(response.user, Boolean(getAccessToken() && localStorage.getItem("iskio_auth_token")));
  };

  useEffect(() => {
    const init = async () => {
      const currentToken = getAccessToken();
      if (!currentToken) {
        setLoading(false);
        setUser(null);
        setToken(null);
        return;
      }

      const exp = decodeJwtExp(currentToken);
      if (exp && Date.now() > exp) {
        clearAuthStorage();
        setToken(null);
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        await refreshUser();
      } catch {
        clearAuthStorage();
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      logout,
      refreshUser,
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
