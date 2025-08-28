// src/components/Navbar.tsx
import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Building2, Menu, X, Phone, Mail } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from './LanguageSelector';

const Navbar: React.FC = () => {
  const { t } = useLanguage();
  const [, forceUpdate] = useState({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  useEffect(() => {
    const handleLanguageChange = () => forceUpdate({});
    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);

  // Ferme le menu puis navigue (fiable sur mobile)
  const go = (to: string) => {
    setIsMenuOpen(false);
    navigate(to);
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      {/* Top bar with contact info */}
      <div className="bg-slate-800 text-white py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>+237 669 790 437</span>
              </div>

              {/* ⬇️ Masqué : e-mail de contact */}
              {/*
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>contact@dantela.cm</span>
              </div>
              */}
            </div>

            {/* ⬇️ Masqué : bloc "Utilisateurs Actifs" */}
            {/*
            <div className="hidden md:block text-right">
              <div>Utilisateurs Actifs</div>
              <div>3 comptes validés et opérationnels</div>
            </div>
            */}

            {/* ⬇️ Masqué : adresse */}
            {/*
            <div className="hidden md:block">
              <span>203 Bd de l&apos;OCAM, Mvog Mbi - Yaoundé</span>
            </div>
            */}
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">DANTELA</h1>
              <p className="text-xs text-blue-600">&quot;La Marque de la Construction&quot;</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink
              to="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Accueil
            </NavLink>
            <NavLink
              to="/services"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/services') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Services
            </NavLink>
            <NavLink
              to="/about"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/about') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              À propos
            </NavLink>
            <NavLink
              to="/contact"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/contact') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Contact
            </NavLink>

            <div className="flex items-center space-x-3 ml-6">
              <LanguageSelector />
              <NavLink
                to="/login"
                className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Connexion
              </NavLink>
              <NavLink
                to="/register"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                S&apos;inscrire
              </NavLink>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(prev => !prev)}
              className="text-gray-700 hover:text-blue-600 p-2"
              aria-label="Ouvrir le menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation + Overlay */}
        {/* Overlay derrière le panneau : clique pour fermer */}
        <div
          className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden fixed inset-0 bg-black/40 z-40`}
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />

        {/* Panneau mobile au-dessus de l’overlay */}
        <div
          className={`${isMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0 pointer-events-none'}
                      md:hidden fixed left-0 right-0 top-[64px] z-50
                      bg-white border-t border-gray-200 transition-all duration-200`}
          onClick={(e) => e.stopPropagation()}  // empêche le clic d'atteindre l’overlay
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            <button
              type="button"
              className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                isActive('/') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
              onClick={() => go('/')}
            >
              Accueil
            </button>
            <button
              type="button"
              className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                isActive('/services') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
              onClick={() => go('/services')}
            >
              Services
            </button>
            <button
              type="button"
              className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                isActive('/about') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
              onClick={() => go('/about')}
            >
              À propos
            </button>
            <button
              type="button"
              className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                isActive('/contact') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
              onClick={() => go('/contact')}
            >
              Contact
            </button>

            <div className="pt-4 border-t border-gray-200">
              <button
                type="button"
                className="block w-full text-left px-3 py-2 text-blue-600 font-medium"
                onClick={() => go('/login')}
              >
                Connexion
              </button>
              <button
                type="button"
                className="block w-full text-center px-3 py-2 bg-blue-600 text-white rounded-md mt-2"
                onClick={() => go('/register')}
              >
                S&apos;inscrire
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
