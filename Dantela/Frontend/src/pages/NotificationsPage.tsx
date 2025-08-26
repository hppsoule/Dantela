import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  MessageSquare, 
  Activity, 
  Search, 
  User,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  AlertTriangle,
  FileText,
  Eye,
  Trash2,
  Check,
  X,
  Volume2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotifications } from '../contexts/NotificationContext';
import Layout from '../components/Layout';

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearNotifications, 
    playNotificationSound 
  } = useNotifications();
  
  const [activeTab, setActiveTab] = useState<'notifications' | 'comments' | 'activity'>('notifications');
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Données simulées pour les commentaires et activités
  const [comments] = useState([
    {
      id: '1',
      demande_numero: 'DEM-2025-001',
      from_user: 'Jean Dupont',
      from_role: 'chef_chantier',
      message: 'Pouvez-vous livrer en priorité le ciment ? Nous avons un retard sur le chantier.',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // Il y a 2h
      is_read: false
    },
    {
      id: '2',
      demande_numero: 'DEM-2025-002',
      from_user: 'Marie Martin',
      from_role: 'magazinier',
      message: 'Commande validée. Le fer à béton sera livré demain matin.',
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // Il y a 4h
      is_read: true
    },
    {
      id: '3',
      demande_numero: 'DEM-2025-003',
      from_user: 'Paul Mballa',
      from_role: 'chef_chantier',
      message: 'Merci pour la livraison rapide ! Tout était conforme.',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 1j
      is_read: true
    }
  ]);

  const [activities] = useState([
    {
      id: '1',
      type: 'demande_created',
      user: 'Jean Dupont',
      action: 'a créé une demande',
      details: 'DEM-2025-001 - 50 sacs de ciment + 10m³ de sable',
      created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      type: 'demande_validated',
      user: 'Marie Martin',
      action: 'a validé une demande',
      details: 'DEM-2025-001 - Quantités ajustées',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      type: 'bon_created',
      user: 'Marie Martin',
      action: 'a généré un bon de livraison',
      details: 'BL-2025-001 pour Chantier Bastos',
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '4',
      type: 'stock_movement',
      user: 'Marie Martin',
      action: 'a mis à jour le stock',
      details: 'Ciment Portland: -50 sacs (Stock: 100)',
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '5',
      type: 'user_created',
      user: 'Directeur Dantela',
      action: 'a validé un nouveau compte',
      details: 'Nouveau magazinier: Pierre Nkomo',
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    }
  ]);

  // Filtrer les notifications
  const filteredNotifications = notifications.filter(notif => {
    const matchSearch = notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       notif.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       notif.related_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchFilter = filter === 'all' || 
                       (filter === 'unread' && !notif.is_read) ||
                       (filter === 'urgent' && notif.priority === 'urgent');
    
    return matchSearch && matchFilter;
  });

  // Filtrer les commentaires
  const filteredComments = comments.filter(comment => {
    const matchSearch = comment.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       comment.demande_numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       comment.from_user.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchFilter = filter === 'all' || 
                       (filter === 'unread' && !comment.is_read);
    
    return matchSearch && matchFilter;
  });

  // Filtrer les activités
  const filteredActivities = activities.filter(activity => {
    const matchSearch = activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       activity.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       activity.user.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchSearch;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'demande_created':
        return <Package className="w-5 h-5 text-blue-600" />;
      case 'demande_validated':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'demande_rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'bon_created':
        return <FileText className="w-5 h-5 text-purple-600" />;
      case 'system':
        return <Bell className="w-5 h-5 text-orange-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'demande_created':
        return <Package className="w-4 h-4 text-blue-500" />;
      case 'demande_validated':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'bon_created':
        return <FileText className="w-4 h-4 text-purple-500" />;
      case 'stock_movement':
        return <Activity className="w-4 h-4 text-orange-500" />;
      case 'user_created':
        return <User className="w-4 h-4 text-indigo-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'directeur': return 'bg-purple-100 text-purple-800';
      case 'magazinier': return 'bg-blue-100 text-blue-800';
      case 'chef_chantier': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'directeur': 
        return language === 'fr' ? 'Directeur' : language === 'en' ? 'Director' : 'Müdür';
      case 'magazinier': 
        return language === 'fr' ? 'Magazinier' : language === 'en' ? 'Warehouse Manager' : 'Depo Sorumlusu';
      case 'chef_chantier': 
        return language === 'fr' ? 'Chef de Chantier' : language === 'en' ? 'Site Manager' : 'Şantiye Şefi';
      default: return role;
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

  const unreadComments = comments.filter(c => !c.is_read).length;
  const urgentNotifications = notifications.filter(n => n.priority === 'urgent').length;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header avec dégradé */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {language === 'fr' ? 'Centre de Notifications' : 
                 language === 'en' ? 'Notification Center' : 
                 'Bildirim Merkezi'}
              </h1>
              <p className="text-teal-100">
                {language === 'fr' ? 'Messages et notifications de commandes en temps réel' : 
                 language === 'en' ? 'Real-time order messages and notifications' : 
                 'Gerçek zamanlı sipariş mesajları ve bildirimleri'}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 sm:p-4 rounded-xl sm:rounded-2xl backdrop-blur-sm">
              <Bell className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  {language === 'fr' ? 'Notifications' : language === 'en' ? 'Notifications' : 'Bildirimler'}
                </p>
                <p className="text-2xl font-bold text-slate-900">{notifications.length}</p>
                <p className="text-sm text-blue-600">
                  {unreadCount} {language === 'fr' ? 'non lues' : language === 'en' ? 'unread' : 'okunmamış'}
                </p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <Bell className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  {language === 'fr' ? 'Commentaires' : language === 'en' ? 'Comments' : 'Yorumlar'}
                </p>
                <p className="text-2xl font-bold text-slate-900">{comments.length}</p>
                <p className="text-sm text-green-600">
                  {unreadComments} {language === 'fr' ? 'nouveaux' : language === 'en' ? 'new' : 'yeni'}
                </p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  {language === 'fr' ? 'Activités' : language === 'en' ? 'Activities' : 'Faaliyetler'}
                </p>
                <p className="text-2xl font-bold text-slate-900">{activities.length}</p>
                <p className="text-sm text-purple-600">
                  {language === 'fr' ? 'Aujourd\'hui' : language === 'en' ? 'Today' : 'Bugün'}
                </p>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  {language === 'fr' ? 'Urgentes' : language === 'en' ? 'Urgent' : 'Acil'}
                </p>
                <p className="text-2xl font-bold text-slate-900">{urgentNotifications}</p>
                <p className="text-sm text-red-600">
                  {language === 'fr' ? 'Action requise' : language === 'en' ? 'Action required' : 'Eylem gerekli'}
                </p>
              </div>
              <div className="bg-red-500 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8 px-6">
              {[
                { 
                  key: 'notifications', 
                  label: language === 'fr' ? 'Notifications' : language === 'en' ? 'Notifications' : 'Bildirimler',
                  icon: Bell, 
                  count: unreadCount 
                },
                { 
                  key: 'comments', 
                  label: language === 'fr' ? 'Commentaires' : language === 'en' ? 'Comments' : 'Yorumlar',
                  icon: MessageSquare, 
                  count: unreadComments 
                },
                { 
                  key: 'activity', 
                  label: language === 'fr' ? 'Journal d\'Activité' : language === 'en' ? 'Activity Log' : 'Faaliyet Günlüğü',
                  icon: Activity, 
                  count: 0 
                }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.key
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Filtres et actions */}
          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={language === 'fr' ? 'Rechercher...' : 
                                 language === 'en' ? 'Search...' : 
                                 'Ara...'}
                    className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                  />
                </div>

                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                >
                  <option value="all">
                    {language === 'fr' ? 'Tous' : language === 'en' ? 'All' : 'Tümü'}
                  </option>
                  <option value="unread">
                    {language === 'fr' ? 'Non lus' : language === 'en' ? 'Unread' : 'Okunmamış'}
                  </option>
                  {activeTab === 'notifications' && (
                    <option value="urgent">
                      {language === 'fr' ? 'Urgents' : language === 'en' ? 'Urgent' : 'Acil'}
                    </option>
                  )}
                </select>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={playNotificationSound}
                  className="bg-slate-600 text-white px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors text-sm flex items-center space-x-1"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>
                    {language === 'fr' ? 'Test Son' : language === 'en' ? 'Test Sound' : 'Ses Testi'}
                  </span>
                </button>
                
                {(activeTab === 'notifications' && unreadCount > 0) || (activeTab === 'comments' && unreadComments > 0) ? (
                  <button
                    onClick={markAllAsRead}
                    className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors text-sm flex items-center space-x-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {language === 'fr' ? 'Tout marquer lu' : 
                       language === 'en' ? 'Mark all read' : 
                       'Tümünü okundu işaretle'}
                    </span>
                  </button>
                ) : null}
                
                <button
                  onClick={clearNotifications}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center space-x-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>
                    {language === 'fr' ? 'Effacer' : language === 'en' ? 'Clear' : 'Temizle'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Contenu des onglets */}
          <div className="p-6">
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">
                      {language === 'fr' ? 'Aucune notification' : 
                       language === 'en' ? 'No notifications' : 
                       'Bildirim yok'}
                    </h3>
                    <p className="text-slate-600">
                      {language === 'fr' ? 'Les notifications de commandes apparaîtront ici' : 
                       language === 'en' ? 'Order notifications will appear here' : 
                       'Sipariş bildirimleri burada görünecek'}
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`border-l-4 rounded-lg p-6 cursor-pointer transition-all duration-200 hover:shadow-md ${
                        getPriorityColor(notification.priority)
                      } ${
                        !notification.is_read ? 'ring-2 ring-teal-200' : ''
                      }`}
                      onClick={() => {
                        markAsRead(notification.id);
                        setSelectedNotification(notification);
                        // Si c'est une notification de demande, rediriger vers la gestion des commandes
                        if (notification.type === 'demande_created' && user?.role === 'magazinier') {
                          window.location.href = '/gestion-commandes';
                        } else {
                          setShowDetailsModal(true);
                        }
                      }}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-lg font-semibold text-slate-900">
                              {notification.title}
                            </h4>
                            <div className="flex items-center space-x-2">
                              {notification.priority === 'urgent' && (
                                <span className="inline-flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>URGENT</span>
                                </span>
                              )}
                              {!notification.is_read && (
                                <div className="w-3 h-3 bg-teal-500 rounded-full animate-pulse"></div>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-slate-700 mb-3 leading-relaxed">
                            {notification.content}
                          </p>
                          
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-slate-500" />
                                <span className="text-slate-600">{notification.from_user_name}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(notification.from_user_role)}`}>
                                  {getRoleText(notification.from_user_role)}
                                </span>
                              </div>
                              
                              {notification.related_id && (
                                <div className="flex items-center space-x-2">
                                  <FileText className="w-4 h-4 text-slate-500" />
                                  <span className="text-slate-600 font-medium">{notification.related_id}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2 text-slate-500">
                              <Clock className="w-4 h-4" />
                              <span>{formatTimeAgo(notification.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="space-y-4">
                {filteredComments.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">
                      {language === 'fr' ? 'Aucun commentaire' : 
                       language === 'en' ? 'No comments' : 
                       'Yorum yok'}
                    </h3>
                    <p className="text-slate-600">
                      {language === 'fr' ? 'Les commentaires sur les commandes apparaîtront ici' : 
                       language === 'en' ? 'Comments on orders will appear here' : 
                       'Siparişlerdeki yorumlar burada görünecek'}
                    </p>
                  </div>
                ) : (
                  filteredComments.map(comment => (
                    <div
                      key={comment.id}
                      className={`bg-white border border-slate-200 rounded-lg p-6 ${
                        !comment.is_read ? 'ring-2 ring-green-200 bg-green-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {comment.from_user.split(' ').map(n => n.charAt(0)).join('')}
                          </span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold text-slate-900">{comment.from_user}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(comment.from_role)}`}>
                              {getRoleText(comment.from_role)}
                            </span>
                            <span className="text-sm text-slate-500">
                              {language === 'fr' ? 'sur' : language === 'en' ? 'on' : 'üzerinde'} {comment.demande_numero}
                            </span>
                          </div>
                          
                          <div className="bg-slate-100 rounded-lg p-3 mb-3">
                            <p className="text-slate-700">{comment.message}</p>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm text-slate-500">
                            <span>{formatTimeAgo(comment.created_at)}</span>
                            <button className="text-teal-600 hover:text-teal-800 font-medium">
                              {language === 'fr' ? 'Répondre' : language === 'en' ? 'Reply' : 'Yanıtla'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                {filteredActivities.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">
                      {language === 'fr' ? 'Aucune activité' : 
                       language === 'en' ? 'No activity' : 
                       'Faaliyet yok'}
                    </h3>
                    <p className="text-slate-600">
                      {language === 'fr' ? 'L\'historique des activités apparaîtra ici' : 
                       language === 'en' ? 'Activity history will appear here' : 
                       'Faaliyet geçmişi burada görünecek'}
                    </p>
                  </div>
                ) : (
                  filteredActivities.map(activity => (
                    <div key={activity.id} className="bg-white border border-slate-200 rounded-lg p-4">
                      <div className="flex items-start space-x-4">
                        <div className="bg-slate-100 p-2 rounded-lg mt-1">
                          {getActivityIcon(activity.type)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-slate-900">{activity.user}</span>
                            <span className="text-slate-600">{activity.action}</span>
                          </div>
                          
                          <p className="text-sm text-slate-600 mb-2">{activity.details}</p>
                          
                          <div className="flex items-center space-x-2 text-xs text-slate-500">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimeAgo(activity.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de détails */}
      {showDetailsModal && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">
                  {language === 'fr' ? 'Détails de la Notification' : 
                   language === 'en' ? 'Notification Details' : 
                   'Bildirim Detayları'}
                </h2>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedNotification(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  {getNotificationIcon(selectedNotification.type)}
                  <h3 className="text-lg font-semibold text-slate-900">
                    {selectedNotification.title}
                  </h3>
                </div>
                
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-slate-700 leading-relaxed">
                    {selectedNotification.content}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      {language === 'fr' ? 'De' : language === 'en' ? 'From' : 'Gönderen'}
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-900">{selectedNotification.from_user_name}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(selectedNotification.from_user_role)}`}>
                        {getRoleText(selectedNotification.from_user_role)}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      {language === 'fr' ? 'Référence' : language === 'en' ? 'Reference' : 'Referans'}
                    </label>
                    <span className="text-slate-900 font-medium">{selectedNotification.related_id}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedNotification(null);
                  }}
                  className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-100"
                >
                  {language === 'fr' ? 'Fermer' : language === 'en' ? 'Close' : 'Kapat'}
                </button>
                
                {selectedNotification.type === 'demande_created' && user?.role === 'magazinier' && (
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      window.location.href = '/gestion-commandes';
                    }}
                    className="flex-1 bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 flex items-center justify-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>
                      {language === 'fr' ? 'Voir la Commande' : 
                       language === 'en' ? 'View Order' : 
                       'Siparişi Gör'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default NotificationsPage;