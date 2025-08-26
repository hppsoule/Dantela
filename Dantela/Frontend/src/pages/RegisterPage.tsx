import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Eye, EyeOff, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';

const RegisterPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [, forceUpdate] = useState({});
  const [formData, setFormData] = useState({
    accountType: 'chef_chantier',
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    nomChantier: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register } = useAuth();
  const navigate = useNavigate();

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
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsLoading(true);

    try {
      // Appel à l'API d'inscription
      await register(formData);
      
      // Redirection vers la page de connexion avec un message de succès
      navigate('/login', { 
        state: { 
          message: 'Compte créé avec succès ! Votre compte est en attente de validation par le directeur.' 
        }
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur lors de la création du compte');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          
          {/* Sélecteur de langue */}
          <div className="flex justify-center mb-4">
            <LanguageSelector />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {language === 'fr' ? 'Créer un compte' : 
             language === 'en' ? 'Create account' : 
             'Hesap oluştur'}
          </h2>
          <p className="text-gray-600">
            {language === 'fr' ? 'Rejoignez l\'équipe Dantela' : 
             language === 'en' ? 'Join the Dantela team' : 
             'Dantela ekibine katıl'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type de compte */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {language === 'fr' ? 'Type de compte' : 
               language === 'en' ? 'Account type' : 
               'Hesap türü'}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, accountType: 'magazinier' })}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  formData.accountType === 'magazinier'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {language === 'fr' ? 'Magazinier' : 
                       language === 'en' ? 'Warehouse Manager' : 
                       'Depo Sorumlusu'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {language === 'fr' ? 'Gestion des stocks' : 
                       language === 'en' ? 'Stock management' : 
                       'Stok yönetimi'}
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, accountType: 'chef_chantier' })}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  formData.accountType === 'chef_chantier'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {language === 'fr' ? 'Chef de chantier' : 
                       language === 'en' ? 'Site Manager' : 
                       'Şantiye Şefi'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {language === 'fr' ? 'Gestion des chantiers' : 
                       language === 'en' ? 'Site management' : 
                       'Şantiye yönetimi'}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Informations personnelles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'fr' ? 'Nom' : 
                 language === 'en' ? 'Last Name' : 
                 'Soyadı'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={language === 'fr' ? 'Votre nom' : 
                             language === 'en' ? 'Your last name' : 
                             'Soyadınız'}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'fr' ? 'Prénom' : 
                 language === 'en' ? 'First Name' : 
                 'Adı'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="prenom"
                value={formData.prenom}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={language === 'fr' ? 'Votre prénom' : 
                             language === 'en' ? 'Your first name' : 
                             'Adınız'}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'fr' ? 'Email' : 
               language === 'en' ? 'Email' : 
               'E-posta'} <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={language === 'fr' ? 'votre@email.com' : 
                           language === 'en' ? 'your@email.com' : 
                           'eposta@adresiniz.com'}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'fr' ? 'Téléphone' : 
               language === 'en' ? 'Phone' : 
               'Telefon'}
            </label>
            <input
              type="tel"
              name="telephone"
              value={formData.telephone}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={language === 'fr' ? '+237 6XX XXX XXX' : 
                           language === 'en' ? '+237 6XX XXX XXX' : 
                           '+90 5XX XXX XX XX'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'fr' ? 'Adresse' : 
               language === 'en' ? 'Address' : 
               'Adres'}
            </label>
            <textarea
              name="adresse"
              value={formData.adresse}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={language === 'fr' ? 'Votre adresse complète' : 
                           language === 'en' ? 'Your complete address' : 
                           'Tam adresiniz'}
            />
          </div>

          {formData.accountType === 'chef_chantier' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'fr' ? 'Nom du chantier' : 
                 language === 'en' ? 'Site name' : 
                 'Şantiye adı'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nomChantier"
                value={formData.nomChantier}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={language === 'fr' ? 'Nom du chantier' : 
                             language === 'en' ? 'Site name' : 
                             'Şantiye adı'}
                required
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'fr' ? 'Mot de passe' : 
                 language === 'en' ? 'Password' : 
                 'Şifre'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={language === 'fr' ? 'Mot de passe' : 
                               language === 'en' ? 'Password' : 
                               'Şifre'}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'fr' ? 'Confirmer le mot de passe' : 
                 language === 'en' ? 'Confirm password' : 
                 'Şifreyi onayla'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={language === 'fr' ? 'Confirmer le mot de passe' : 
                               language === 'en' ? 'Confirm password' : 
                               'Şifreyi onayla'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-green-500 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-600 transition-all duration-200 disabled:opacity-50"
          >
            {isLoading ? 
              (language === 'fr' ? 'Création en cours...' : 
               language === 'en' ? 'Creating...' : 
               'Oluşturuluyor...') : 
              (language === 'fr' ? 'Créer mon compte' : 
               language === 'en' ? 'Create my account' : 
               'Hesabımı oluştur')
            }
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {language === 'fr' ? 'Déjà un compte ?' : 
             language === 'en' ? 'Already have an account?' : 
             'Zaten hesabınız var mı?'}{' '}
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {language === 'fr' ? 'Se connecter ici' : 
               language === 'en' ? 'Sign in here' : 
               'Buradan giriş yapın'}
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link
            to="/"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {language === 'fr' ? '← Retour à l\'accueil' : 
             language === 'en' ? '← Back to home' : 
             '← Ana sayfaya dön'}
          </Link>
        </div>

        <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-800">
            <strong>
              {language === 'fr' ? 'Important:' : 
               language === 'en' ? 'Important:' : 
               'Önemli:'}
            </strong>{' '}
            {language === 'fr' ? 'Votre compte sera en attente de validation par le directeur avant que vous puissiez vous connecter.' : 
             language === 'en' ? 'Your account will be pending validation by the director before you can log in.' : 
             'Hesabınız giriş yapabilmeniz için müdür tarafından onaylanmayı bekleyecektir.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;