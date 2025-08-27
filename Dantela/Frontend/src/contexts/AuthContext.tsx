// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<any>;
  logout: () => void;
}

// 🔗 Base API : en dev => '/api' (proxy Vite) | en prod => VITE_API_BASE_URL (ex: https://dantela.onrender.com)
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper pour entêtes avec token
  const authHeaders = (token?: string) => {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  };

  // Charge le profil depuis le token (au montage)
  const loadProfileFromToken = async () => {
    const token = localStorage.getItem('token');
    const cachedUser = localStorage.getItem('user');

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      // On tente d'abord d'utiliser le cache pour éviter un flash
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
        } catch {
          localStorage.removeItem('user');
        }
      }

      // On rafraîchit avec l’API (source de vérité)
      const res = await fetch(`${API_BASE}/api/profile`, { headers: authHeaders(token) });
      if (!res.ok) {
        // token invalide/expiré
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } else {
        const data = await res.json();
        if (data?.user) {
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      }
    } catch {
      // en cas d’erreur réseau, on garde le cache si présent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileFromToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    // Appel à l’API login
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.success) {
      throw new Error(data?.message || 'Erreur de connexion');
    }

    // Stockage token + user
    const token: string = data.token;
    if (!token) throw new Error('Token manquant dans la réponse');

    localStorage.setItem('token', token);

    // Si l’API renvoie user, on le stocke ; sinon on recharge via /api/profile
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
    } else {
      await loadProfileFromToken();
    }
  };

  const register = async (userData: any) => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(userData),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.success) {
      throw new Error(data?.message || "Erreur lors de l'inscription");
    }

    // Selon ta logique, l’inscription ne connecte pas forcément l’utilisateur.
    // Si l’API renvoie token + user, tu peux faire comme pour login ici.
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
