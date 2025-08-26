import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  User, 
  Package,
  FileText,
  Trash2,
  Check,
  Eye
} from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
  const { language } = useLanguage();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = notifications.filter(notif => 
    filter === 'all' || (filter === 'unread' && !notif.is_read)
  );

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'demande_created':
        return <Package className="w-5 h-5 text-blue-500" />;
      case 'demande_validated':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'demande_rejected':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'demande_processed':
        return <FileText className="w-5 h-5 text-purple-500" />;
      case 'bon_created':
        return <FileText className="w-5 h-5 text-indigo-500" />;
      case 'system':
        return <Bell className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-blue-500 bg-blue-50';
      case 'low':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const notifDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - notifDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return language === 'fr' ? 'À l\'instant' : language === 'en' ? 'Just now' : 'Şimdi';
    } else if (diffInMinutes < 60) {
      return language === 'fr' ? `Il y a ${diffInMinutes} min` : 
             language === 'en' ? `${diffInMinutes} min ago` : 
             `${diffInMinutes} dk önce`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return language === 'fr' ? `Il y a ${hours}h` : 
             language === 'en' ? `${hours}h ago` : 
             `${hours}s önce`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return language === 'fr' ? `Il y a ${days}j` : 
             language === 'en' ? `${days}d ago` : 
             `${days}g önce`;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {language === 'fr' ? 'Notifications' : 
                   language === 'en' ? 'Notifications' : 
                   'Bildirimler'}
                </h2>
                <p className="text-teal-100 text-sm">
                  {unreadCount} {language === 'fr' ? 'non lue(s)' : 
                                 language === 'en' ? 'unread' : 
                                 'okunmamış'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Filtres */}
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-white text-teal-700' 
                  : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
              }`}
            >
              {language === 'fr' ? 'Toutes' : language === 'en' ? 'All' : 'Tümü'} ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === 'unread' 
                  ? 'bg-white text-teal-700' 
                  : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
              }`}
            >
              {language === 'fr' ? 'Non lues' : language === 'en' ? 'Unread' : 'Okunmamış'} ({unreadCount})
            </button>
          </div>
        </div>

        {/* Actions rapides */}
        {notifications.length > 0 && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1 text-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {language === 'fr' ? 'Tout marquer lu' : 
                     language === 'en' ? 'Mark all read' : 
                     'Tümünü okundu işaretle'}
                  </span>
                </button>
              )}
              <button
                onClick={clearNotifications}
                className="bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Liste des notifications */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Bell className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'unread' ? 
                  (language === 'fr' ? 'Aucune notification non lue' : 
                   language === 'en' ? 'No unread notifications' : 
                   'Okunmamış bildirim yok') :
                  (language === 'fr' ? 'Aucune notification' : 
                   language === 'en' ? 'No notifications' : 
                   'Bildirim yok')
                }
              </h3>
              <p className="text-gray-600 text-center">
                {language === 'fr' ? 'Vous êtes à jour !' : 
                 language === 'en' ? 'You\'re all caught up!' : 
                 'Hepsi tamam!'}
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`border-l-4 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    getPriorityColor(notification.priority)
                  } ${
                    !notification.is_read ? 'ring-2 ring-blue-200' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2"></div>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-2 leading-relaxed">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-2">
                          {notification.from_user_name && (
                            <div className="flex items-center space-x-1">
                              <User className="w-3 h-3" />
                              <span>{notification.from_user_name}</span>
                            </div>
                          )}
                          {notification.related_id && (
                            <div className="flex items-center space-x-1">
                              <FileText className="w-3 h-3" />
                              <span>{notification.related_id}</span>
                            </div>
                          )}
                        </div>
                        <span>{formatTimeAgo(notification.created_at)}</span>
                      </div>
                      
                      {notification.priority === 'urgent' && (
                        <div className="mt-2 inline-flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          <span>
                            {language === 'fr' ? 'URGENT' : 
                             language === 'en' ? 'URGENT' : 
                             'ACİL'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer avec actions */}
        {notifications.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="text-center">
              <button
                onClick={() => {
                  // TODO: Naviguer vers la page d'historique des notifications
                  onClose();
                }}
                className="text-teal-600 hover:text-teal-800 text-sm font-medium flex items-center justify-center space-x-1 mx-auto"
              >
                <Eye className="w-4 h-4" />
                <span>
                  {language === 'fr' ? 'Voir toutes les notifications' : 
                   language === 'en' ? 'View all notifications' : 
                   'Tüm bildirimleri gör'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationPanel;