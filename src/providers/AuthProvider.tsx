"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  getAuthToken,
  getStoredUser,
  loginApi,
  logoutApi,
  type StoredUser,
} from "@/lib/api";

interface AuthContextType {
  user: StoredUser | null;
  token: string | null;
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<StoredUser>;
  logout: () => Promise<void>;
  hasRole: (requiredRole: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {
    throw new Error("AuthProvider not mounted");
  },
  logout: async () => {},
  hasRole: () => false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = getAuthToken();
      const storedUser = getStoredUser();
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<StoredUser> => {
    setIsLoading(true);
    try {
      const auth = await loginApi(username, password);
      const authenticatedUser: StoredUser = {
        username: auth.username,
        role: auth.role,
      };
      setToken(auth.token);
      setUser(authenticatedUser);
      return authenticatedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutApi();
    } finally {
      setToken(null);
      setUser(null);
      setIsLoading(false);
    }
  };

  const hasRole = (requiredRole: string): boolean => {
    if (!user?.role) return false;
    return user.role === requiredRole || user.role === `ROLE_${requiredRole}`;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role ?? null,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
