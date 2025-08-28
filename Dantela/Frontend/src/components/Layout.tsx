import React, { useState, useEffect } from 'react';
import { useLocation, NavLink, useNavigate } from 'react-router-dom';
import {
  Building2,
  LogOut,
  Menu,
  X,
  Home,
  Package,
  Users,
  FileText,
  Settings,
  Truck,
  ClipboardList,
  Search,
  Sun,
  Bell,
  User,
  ShoppingCart,
  List,
  Monitor,
  History,
  Activity,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotifications } from '../contexts/NotificationContext';
import LanguageSelector from './LanguageSelector';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();
  const { unreadCount } = useNotifications();
  const [, forceUpdate] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleLanguageChange = () => {
      forceUpdate({});
    };
    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);

  const getMenuItems = () => {
    const baseItems = [
      {
        icon: Home,
        label:
          language === 'fr' ? "Vue d'ensemble" : language === 'en' ? 'Overview' : 'Genel Bakış',
        path: '/dashboard',
      },
    ];

    switch (user?.role) {
      case 'directeur':
        return [
          ...baseItems,
          {
            icon: Package,
            label: language === 'fr' ? 'Catalogue' : language === 'en' ? 'Catalog' : 'Katalog',
            path: '/catalogue',
          },
          {
            icon: Users,
            label:
              language === 'fr'
                ? 'Gestion Utilisateurs'
                : language === 'en'
                ? 'User Management'
                : 'Kullanıcı Yönetimi',
            path: '/users',
          },
          {
            icon: Building2,
            label:
              language === 'fr'
                ? 'Gestion des dépôts'
                : language === 'en'
                ? 'Depot Management'
                : 'Depo Yönetimi',
            path: '/depots',
          },
          {
            icon: FileText,
            label:
              language === 'fr' ? 'Rapports' : language === 'en' ? 'Reports' : 'Raporlar',
            path: '/reports',
          },
          {
            icon: Settings,
            label:
              language === 'fr' ? 'Paramètres' : language === 'en' ? 'Settings' : 'Ayarlar',
            path: '/settings',
          },
        ];
      case 'magazinier':
        return [
          {
            icon: Monitor,
            label:
              language === 'fr' ? "Vue d'ensemble" : language === 'en' ? 'Overview' : 'Genel Bakış',
            path: '/dashboard',
          },
          {
            icon: List,
            label: language === 'fr' ? 'Catalogue' : language === 'en' ? 'Catalog' : 'Katalog',
            path: '/catalogue',
          },
          {
            icon: ClipboardList,
            label:
              language === 'fr'
                ? 'Gestion Commandes'
                : language === 'en'
                ? 'Order Management'
                : 'Sipariş Yönetimi',
            path: '/gestion-commandes',
          },
          {
            icon: Truck,
            label:
              language === 'fr'
                ? 'Distribution Directe'
                : language === 'en'
                ? 'Direct Distribution'
                : 'Doğrudan Dağıtım',
            path: '/distribution-directe',
          },
          {
            icon: ShoppingCart,
            label:
              language === 'fr'
                ? 'Mouvements Stock'
                : language === 'en'
                ? 'Stock Movements'
                : 'Stok Hareketleri',
            path: '/stocks',
          },
          {
            icon: History,
            label:
              language === 'fr' ? 'Historique' : language === 'en' ? 'History' : 'Geçmiş',
            path: '/historique',
          },
        ];
      case 'chef_chantier':
        return [
          ...baseItems,
          {
            icon: Package,
            label:
              language === 'fr'
                ? 'Catalogue matériaux'
                : language === 'en'
                ? 'Materials Catalog'
                : 'Malzeme Kataloğu',
            path: '/catalogue',
          },
          {
            icon: ClipboardList,
            label:
              language === 'fr'
                ? 'Mes Demandes'
                : language === 'en'
                ? 'My Requests'
                : 'Taleplerim',
            path: '/mes-demandes',
          },
          {
            icon: User,
            label:
              language === 'fr' ? 'Mon Profil' : language === 'en' ? 'My Profile' : 'Profilim',
            path: '/profile',
          },
        ];
      default:
        return baseItems;
    }
  };

  const menuItems = getMenuItems();
  const isActivePath = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-64 bg-gradient-to-b from-teal-800 to-teal-900 transform
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static
        z-50`} // ⬅️ z-50 (plus haut que l'overlay)
        onClick={(e) => e.stopPropagation()} // ⬅️ important (évite de fermer en cliquant dedans)
      >
        {/* Logo section */}
        <div className="flex items-center justify-center h-20 px-4 bg-teal-900 border-b border-teal-700">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded-lg">
              <Building2 className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">DANTELA</h1>
            </div>
          </div>
        </div>

        {/* Menu title for magazinier */}
        {user?.role === 'magazinier' && (
          <div className="px-4 py-3 bg-teal-800 border-b border-teal-700">
            <p className="text-sm font-medium text-white">
              MENU {language === 'fr' ? 'MAGAZINIER' : language === 'en' ? 'WAREHOUSE MANAGER' : 'DEPO SORUMLUSU'}
            </p>
          </div>
        )}

        {/* Navigation menu */}
        <nav className="mt-4">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)} // ⬅️ fermer après clic
              className={({ isActive }) =>
                `flex items-center px-6 py-3 transition-colors duration-200 relative
                ${isActive || isActivePath(item.path)
                  ? 'bg-white/20 text-white font-medium'
                  : 'text-gray-200 hover:bg-white/10 hover:text-white'}`
              }
            >
              {(isActivePath(item.path)) && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white" />
              )}
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User profile section at bottom */}
        <div className="absolute bottom-0 w-full p-4">
          <div className="bg-teal-800 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-teal-600 text-sm font-semibold">
                  {user?.prenom?.charAt(0)}
                  {user?.nom?.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">
                  {user?.prenom} {user?.nom}
                </p>
                <p className="text-gray-400 text-xs capitalize">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center w-full px-3 py-2 text-gray-300 hover:text-white hover:bg-teal-700 rounded-md transition-colors duration-200"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {language === 'fr' ? 'Déconnexion' : language === 'en' ? 'Logout' : 'Çıkış'}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 shadow-sm h-16 flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="lg:hidden text-white hover:text-gray-200"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={
                  language === 'fr' ? 'Rechercher...' : language === 'en' ? 'Search...' : 'Ara...'
                }
                className="w-full pl-10 pr-4 py-2 bg-white rounded-lg border-0 focus:ring-2 focus:ring-white focus:ring-opacity-50"
              />
            </div>
          </div>

          {/* Right side icons */}
          <div className="flex items-center space-x-4">
            <button className="text-white hover:text-gray-200">
              <Sun className="w-6 h-6" />
            </button>

            <button
              onClick={() => navigate('/notifications')}
              className="text-white hover:text-gray-200 relative transition-transform hover:scale-110"
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse shadow-lg">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            <LanguageSelector />
            <div className="text-right">
              <p className="text-sm font-medium text-white">
                {user?.prenom} {user?.nom}
              </p>
              <p className="text-xs text-gray-200 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-teal-600 text-sm font-semibold">
                {user?.prenom?.charAt(0)}
                {user?.nom?.charAt(0)}
              </span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6 bg-gray-100 min-h-screen">{children}</main>

        {/* Footer */}
        <footer className="lg:ml-0 bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>203 Boulevard de l'OCAM, Mvog Mbi - Yaoundé</span>
            <span>669790437</span>
            <a href="http://dantela.cm/" className="text-teal-600 hover:text-teal-800">
              http://dantela.cm/
            </a>
          </div>
        </footer>
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
