// src/contexts/NotificationContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

// ✅ Base API: /api en dev (proxy Vite), VITE_API_BASE_URL en prod (Vercel)
const API = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');

export interface Notification {
  id: string;
  type: 'demande_created' | 'demande_validated' | 'demande_rejected' | 'bon_created' | 'system';
  title: string;
  content: string;
  from_user_name: string;
  from_user_role: string;
  related_type: string;
  related_id: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_read: boolean;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  addNotification: (notification: Partial<Notification>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  playNotificationSound: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  // Compter les notifications non lues
  const unreadCount = notifications.filter(notif => !notif.is_read).length;

  // Son de notification
  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Son de notification non disponible:', error);
    }
  }, []);

  // Récupérer les notifications depuis l'API backend
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // ✅ Liste
      const response = await fetch(`${API}/messages`, { headers });

      if (response.ok) {
        const data = await response.json();
        const apiNotifications: Notification[] = (data.messages || []).map((msg: any) => ({
          id: msg.id,
          type: msg.type,
          title: msg.title,
          content: msg.content,
          from_user_name: msg.from_user_name || 'Système',
          from_user_role: msg.from_user_role || 'system',
          related_type: msg.related_type || '',
          related_id: msg.related_id || '',
          priority: msg.priority || 'medium',
          is_read: msg.is_read,
          created_at: msg.created_at,
        }));

        // Détecter nouvelles non lues pour jouer un son
        const previousUnreadCount = notifications.filter(n => !n.is_read).length;
        const newUnreadCount = apiNotifications.filter(n => !n.is_read).length;
        if (newUnreadCount > previousUnreadCount && notifications.length > 0) {
          playNotificationSound();
        }

        setNotifications(apiNotifications);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user, notifications, playNotificationSound]);

  // Ajouter une notification locale (simulation)
  const addNotification = useCallback((notification: Partial<Notification>) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      type: notification.type || 'system',
      title: notification.title || 'Nouvelle notification',
      content: notification.content || '',
      from_user_name: notification.from_user_name || 'Système',
      from_user_role: notification.from_user_role || 'system',
      related_type: notification.related_type || '',
      related_id: notification.related_id || '',
      priority: notification.priority || 'medium',
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setNotifications(prev => [newNotification, ...prev]);
    playNotificationSound();
  }, [playNotificationSound]);

  // Marquer une notification comme lue
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // ✅ Marquer lue
      await fetch(`${API}/messages/${notificationId}/read`, {
        method: 'PUT',
        headers,
      });

      setNotifications(prev =>
        prev.map(notif => (notif.id === notificationId ? { ...notif, is_read: true } : notif))
      );
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  }, []);

  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // ✅ Tout marquer lu
      await fetch(`${API}/messages/mark-all-read`, {
        method: 'PUT',
        headers,
      });

      setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
    } catch (error) {
      console.error('Erreur lors du marquage global:', error);
    }
  }, []);

  // Effacer toutes les notifications (local)
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Chargement initial + polling
  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    playNotificationSound,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
