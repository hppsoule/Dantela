import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Building2, Eye, EyeOff, User, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';

const LoginPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [, forceUpdate] = useState({});
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Message de succès depuis l'inscription
  const successMessage = location.state?.message;

  // Écouter les changements de langue
  useEffect(() => {
    const handleLanguageChange = () => {
      forceUpdate({});
    };
    
    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Left Panel - Login Form */}
          <div className="lg:w-1/2 p-8 lg:p-12">
            <div className="max-w-md mx-auto">
              {/* Logo */}
<div className="flex items-center justify-center mb-8">
  <div className="p-0">
    <img
      src="/dantela.png"            // ← placé dans Dantela/Frontend/public
      alt="Logo DANTELA"
      className="h-10 w-auto"
      loading="eager"
      decoding="async"
    />
  </div>
  <div className="ml-3">
    <h1 className="text-2xl font-bold text-gray-900">DANTELA</h1>
    <p className="text-sm text-gray-600">
      {language === 'fr' ? '"La Marque de la Construction"' :
       language === 'en' ? '"The Construction Brand"' :
       '"İnşaat Markası"'}
    </p>
  </div>
</div>


              {/* Sélecteur de langue */}
              <div className="flex justify-center mb-6">
                <LanguageSelector />
              </div>

              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {language === 'fr' ? 'Bienvenue' : 
                   language === 'en' ? 'Welcome back' : 
                   'Tekrar hoş geldiniz'}
                </h2>
                <p className="text-gray-600">
                  {language === 'fr' ? 'Veuillez entrer vos informations de connexion' : 
                   language === 'en' ? 'Please enter your login information' : 
                   'Lütfen giriş bilgilerinizi girin'}
                </p>
              </div>

              {successMessage && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-600 text-sm">{successMessage}</p>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'fr' ? 'Email' : 
                     language === 'en' ? 'Email' : 
                     'E-posta'} :
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={language === 'fr' ? 'Votre email' : 
                                   language === 'en' ? 'Your email' : 
                                   'E-posta adresiniz'}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'fr' ? 'Mot de passe' : 
                     language === 'en' ? 'Password' : 
                     'Şifre'} :
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={language === 'fr' ? 'Votre mot de passe' : 
                                   language === 'en' ? 'Your password' : 
                                   'Şifreniz'}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      {language === 'fr' ? 'Se souvenir pendant 30 jours' : 
                       language === 'en' ? 'Remember for 30 days' : 
                       '30 gün hatırla'}
                    </span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {language === 'fr' ? 'Mot de passe oublié' : 
                     language === 'en' ? 'Forgot password' : 
                     'Şifremi unuttum'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-green-500 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-600 transition-all duration-200 disabled:opacity-50"
                >
                  {isLoading ? 
                    (language === 'fr' ? 'Connexion...' : 
                     language === 'en' ? 'Signing in...' : 
                     'Giriş yapılıyor...') : 
                    (language === 'fr' ? 'Se connecter' : 
                     language === 'en' ? 'Sign in' : 
                     'Giriş yap')
                  }
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  {language === 'fr' ? "Vous n'avez pas de compte ?" : 
                   language === 'en' ? "Don't have an account?" : 
                   'Hesabınız yok mu?'}{' '}
                  <Link
                    to="/register"
                    className="text-green-600 hover:text-green-800 font-medium"
                  >
                    {language === 'fr' ? 'Créer un compte' : 
                     language === 'en' ? 'Create account' : 
                     'Hesap oluştur'}
                  </Link>
                </p>
              </div>

              <div className="mt-6 text-center">
                <Link
                  to="/"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  {language === 'fr' ? '← Retour à l\'accueil' : 
                   language === 'en' ? '← Back to home' : 
                   '← Ana sayfaya dön'}
                </Link>
              </div>
            </div>
          </div>

          {/* Right Panel - Image */}
          <div className="lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-8 lg:p-12 flex items-center justify-center">
          <div className="text-center text-white">
            <img
              src="/1657650552451Dantela.jpg" // Image dans le dossier public
              alt="Construction moderne"
              className="w-full max-w-md rounded-xl shadow-2xl mb-8"
            />
            <h3 className="text-3xl font-bold mb-4">DANTELA</h3>
            <p className="text-blue-100 text-lg">
              Système de gestion des dépôts et matériaux de construction
            </p>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;