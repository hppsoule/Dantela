import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<any>;
  logout: () => void;
  loading: boolean;
}

/**
 * Base API universelle :
 * - En DEV (Vite): '/api' → passe par le proxy Vite vers http://localhost:5000
 * - En PROD (Vercel): '/api' → réécrit via vercel.json vers https://dantela.onrender.com/api
 * - Optionnel: tu peux définir VITE_API_BASE_URL pour forcer une autre base (ex: https://dantela.onrender.com/api)
 */
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Utilitaire: parse JSON en sécurité (réponses vides/HTML)
async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // 1) Normaliser les identifiants
    const body = {
      email: String(email || '').trim().toLowerCase(),
      password: String(password || '')
    };

    // 2) Timeout (ex: 15s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let res: Response;
    try {
      res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });
    } catch {
      clearTimeout(timeoutId);
      throw new Error("Impossible de joindre le serveur d'authentification");
    } finally {
      clearTimeout(timeoutId);
    }

    const payload = await safeJson(res);

    // 3) Erreurs HTTP → remonter le vrai message serveur
    if (!res.ok) {
      const serverMsg =
        payload?.message ||
        (res.status === 401
          ? 'Identifiants incorrects'
          : res.status === 403
          ? 'Rôle non autorisé'
          : `HTTP ${res.status} ${res.statusText}`);
      throw new Error(serverMsg);
    }

    // 4) Accepter différents formats de payload
    const token = payload?.token ?? payload?.data?.token;
    const userObj = payload?.user ?? payload?.data?.user;

    if (!token || !userObj) {
      throw new Error("Réponse d'authentification invalide");
    }

    // 5) Persistance + state
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userObj));
    setUser(userObj as User);
  };

  const register = async (userData: any) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let res: Response;
    try {
      res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        signal: controller.signal
      });
    } catch {
      clearTimeout(timeoutId);
      throw new Error("Impossible de joindre le serveur d'inscription");
    } finally {
      clearTimeout(timeoutId);
    }

    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(data?.message || "Erreur lors de l'inscription");
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
