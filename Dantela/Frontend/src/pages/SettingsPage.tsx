import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Building2, 
  Bell, 
  Shield, 
  Monitor, 
  Palette,
  Save,
  Upload,
  Download,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  X,
  Camera,
  Globe,
  Clock,
  DollarSign,
  Database,
  Server,
  Activity,
  HardDrive,
  Cpu,
  Wifi,
  Lock,
  Eye,
  EyeOff,
  Phone,
  Mail,
  MapPin,
  User,
  Calendar,
  Smartphone,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Zap,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Layout from '../components/Layout';

interface Settings {
  company: {
    name: string;
    tagline: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    logo_url: string | null;
  };
  notifications: {
    email_enabled: boolean;
    sms_enabled: boolean;
    push_enabled: boolean;
    sound_enabled: boolean;
    auto_approve_orders: boolean;
    low_stock_alerts: boolean;
    urgent_priority_sound: boolean;
  };
  security: {
    session_timeout: number;
    password_min_length: number;
    require_2fa: boolean;
    auto_logout_inactive: boolean;
    login_attempts_max: number;
    account_lockout_duration: number;
  };
  system: {
    language_default: string;
    timezone: string;
    date_format: string;
    currency: string;
    backup_frequency: string;
    maintenance_mode: boolean;
    debug_mode: boolean;
  };
  appearance: {
    theme: string;
    primary_color: string;
    secondary_color: string;
    logo_position: string;
    compact_mode: boolean;
    animations_enabled: boolean;
  };
}

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [, forceUpdate] = useState({});
  
  const [activeTab, setActiveTab] = useState('company');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Modals
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSystemInfoModal, setShowSystemInfoModal] = useState(false);
  const [systemInfo, setSystemInfo] = useState<any>(null);

  // Écouter les changements de langue
  useEffect(() => {
    const handleLanguageChange = () => {
      forceUpdate({});
    };
    
    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      } else {
        setError('Erreur lors du chargement des paramètres');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        setSuccessMessage('Paramètres sauvegardés avec succès !');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur de connexion');
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/settings/backup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Sauvegarde créée : ${data.backup.filename} (${data.backup.size})`);
        setShowBackupModal(false);
      } else {
        const errorData = await response.json();
        alert(errorData.message);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleImport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/settings/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Import réussi : ${data.imported.users} utilisateurs, ${data.imported.materiaux} matériaux`);
        setShowImportModal(false);
        fetchSettings(); // Recharger
      } else {
        const errorData = await response.json();
        alert(errorData.message);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'import');
    }
  };

  const handleReset = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/settings/reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('Paramètres remis à zéro avec succès !');
        setShowResetModal(false);
        fetchSettings(); // Recharger
      } else {
        const errorData = await response.json();
        alert(errorData.message);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du reset');
    }
  };

  const fetchSystemInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/settings/system-info', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSystemInfo(data.system_info);
        setShowSystemInfoModal(true);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const updateSettings = (section: keyof Settings, field: string, value: any) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value
      }
    });
  };

  const tabs = [
    {
      id: 'company',
      label: language === 'fr' ? 'Entreprise' : language === 'en' ? 'Company' : 'Şirket',
      icon: Building2,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'notifications',
      label: language === 'fr' ? 'Notifications' : language === 'en' ? 'Notifications' : 'Bildirimler',
      icon: Bell,
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'security',
      label: language === 'fr' ? 'Sécurité' : language === 'en' ? 'Security' : 'Güvenlik',
      icon: Shield,
      color: 'from-red-500 to-red-600'
    },
    {
      id: 'system',
      label: language === 'fr' ? 'Système' : language === 'en' ? 'System' : 'Sistem',
      icon: Monitor,
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'appearance',
      label: language === 'fr' ? 'Apparence' : language === 'en' ? 'Appearance' : 'Görünüm',
      icon: Palette,
      color: 'from-orange-500 to-orange-600'
    }
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!settings) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header avec dégradé professionnel */}
        <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 rounded-2xl p-8 text-white relative overflow-hidden">
          {/* Formes décoratives */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white bg-opacity-10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white bg-opacity-5 rounded-full translate-y-24 -translate-x-24"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-3">
                  {language === 'fr' ? 'Paramètres Système' : 
                   language === 'en' ? 'System Settings' : 
                   'Sistem Ayarları'}
                </h1>
                <p className="text-xl text-slate-200 mb-4">
                  {language === 'fr' ? 'Configuration et administration du système Dantela' : 
                   language === 'en' ? 'Dantela system configuration and administration' : 
                   'Dantela sistem yapılandırması ve yönetimi'}
                </p>
                <div className="flex items-center space-x-4 text-slate-300">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>{user?.prenom} {user?.nom}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>Administrateur Système</span>
                  </div>
                </div>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-2xl backdrop-blur-sm">
                <Settings className="w-12 h-12" />
              </div>
            </div>
          </div>
        </div>

        {/* Messages de feedback */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-600 flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Onglets */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="border-b border-slate-200">
            <nav className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-3 px-6 py-4 font-medium text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Contenu des onglets */}
          <div className="p-8">
            {/* Onglet Entreprise */}
            {activeTab === 'company' && (
              <div className="space-y-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {language === 'fr' ? 'Informations de l\'Entreprise' : 
                       language === 'en' ? 'Company Information' : 
                       'Şirket Bilgileri'}
                    </h2>
                    <p className="text-slate-600">
                      {language === 'fr' ? 'Configurez les informations de base de votre entreprise' : 
                       language === 'en' ? 'Configure your company\'s basic information' : 
                       'Şirketinizin temel bilgilerini yapılandırın'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Informations générales */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {language === 'fr' ? 'Nom de l\'entreprise' : language === 'en' ? 'Company name' : 'Şirket adı'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={settings.company.name}
                        onChange={(e) => updateSettings('company', 'name', e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="DANTELA"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {language === 'fr' ? 'Slogan' : language === 'en' ? 'Tagline' : 'Slogan'}
                      </label>
                      <input
                        type="text"
                        value={settings.company.tagline}
                        onChange={(e) => updateSettings('company', 'tagline', e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder='"La Marque de la Construction"'
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {language === 'fr' ? 'Adresse complète' : language === 'en' ? 'Complete address' : 'Tam adres'} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <textarea
                          value={settings.company.address}
                          onChange={(e) => updateSettings('company', 'address', e.target.value)}
                          className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                          placeholder="203 Boulevard de l'OCAM, Mvog Mbi - Yaoundé"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contacts */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {language === 'fr' ? 'Téléphone' : language === 'en' ? 'Phone' : 'Telefon'}
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="tel"
                          value={settings.company.phone}
                          onChange={(e) => updateSettings('company', 'phone', e.target.value)}
                          className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="+237 669 790 437"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {language === 'fr' ? 'Email' : language === 'en' ? 'Email' : 'E-posta'}
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="email"
                          value={settings.company.email}
                          onChange={(e) => updateSettings('company', 'email', e.target.value)}
                          className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="contact@dantela.cm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {language === 'fr' ? 'Site web' : language === 'en' ? 'Website' : 'Web sitesi'}
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="url"
                          value={settings.company.website}
                          onChange={(e) => updateSettings('company', 'website', e.target.value)}
                          className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="www.dantela.cm"
                        />
                      </div>
                    </div>

                    {/* Upload Logo */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {language === 'fr' ? 'Logo de l\'entreprise' : language === 'en' ? 'Company logo' : 'Şirket logosu'}
                      </label>
                      <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                        <Camera className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-600 mb-2">
                          {language === 'fr' ? 'Cliquez pour télécharger un logo' : 
                           language === 'en' ? 'Click to upload a logo' : 
                           'Logo yüklemek için tıklayın'}
                        </p>
                        <p className="text-sm text-slate-500">PNG, JPG jusqu'à 2MB</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Onglet Notifications */}
            {activeTab === 'notifications' && (
              <div className="space-y-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-xl">
                    <Bell className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {language === 'fr' ? 'Paramètres de Notifications' : 
                       language === 'en' ? 'Notification Settings' : 
                       'Bildirim Ayarları'}
                    </h2>
                    <p className="text-slate-600">
                      {language === 'fr' ? 'Configurez comment et quand recevoir les notifications' : 
                       language === 'en' ? 'Configure how and when to receive notifications' : 
                       'Bildirimleri nasıl ve ne zaman alacağınızı yapılandırın'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Canaux de notification */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                      {language === 'fr' ? 'Canaux de Notification' : 
                       language === 'en' ? 'Notification Channels' : 
                       'Bildirim Kanalları'}
                    </h3>

                    {[
                      { key: 'email_enabled', label: 'Email', icon: Mail, desc: 'Notifications par email' },
                      { key: 'sms_enabled', label: 'SMS', icon: Smartphone, desc: 'Notifications par SMS' },
                      { key: 'push_enabled', label: 'Push', icon: Bell, desc: 'Notifications push navigateur' },
                      { key: 'sound_enabled', label: 'Sons', icon: Volume2, desc: 'Sons de notification' }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className="bg-green-100 p-2 rounded-lg">
                            <item.icon className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{item.label}</p>
                            <p className="text-sm text-slate-600">{item.desc}</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications[item.key as keyof typeof settings.notifications] as boolean}
                            onChange={(e) => updateSettings('notifications', item.key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                      </div>
                    ))}
                  </div>

                  {/* Paramètres avancés */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                      {language === 'fr' ? 'Paramètres Avancés' : 
                       language === 'en' ? 'Advanced Settings' : 
                       'Gelişmiş Ayarlar'}
                    </h3>

                    {[
                      { key: 'auto_approve_orders', label: 'Auto-approbation', icon: CheckCircle, desc: 'Approuver automatiquement les commandes' },
                      { key: 'low_stock_alerts', label: 'Alertes stock', icon: AlertTriangle, desc: 'Alertes pour stock faible' },
                      { key: 'urgent_priority_sound', label: 'Son urgence', icon: VolumeX, desc: 'Son spécial pour priorité urgente' }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <item.icon className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{item.label}</p>
                            <p className="text-sm text-slate-600">{item.desc}</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications[item.key as keyof typeof settings.notifications] as boolean}
                            onChange={(e) => updateSettings('notifications', item.key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Onglet Sécurité */}
            {activeTab === 'security' && (
              <div className="space-y-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-gradient-to-r from-red-500 to-red-600 p-3 rounded-xl">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {language === 'fr' ? 'Paramètres de Sécurité' : 
                       language === 'en' ? 'Security Settings' : 
                       'Güvenlik Ayarları'}
                    </h2>
                    <p className="text-slate-600">
                      {language === 'fr' ? 'Configurez la sécurité et l\'authentification' : 
                       language === 'en' ? 'Configure security and authentication' : 
                       'Güvenlik ve kimlik doğrulamayı yapılandırın'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Sessions */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                      {language === 'fr' ? 'Gestion des Sessions' : 
                       language === 'en' ? 'Session Management' : 
                       'Oturum Yönetimi'}
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {language === 'fr' ? 'Durée de session (minutes)' : 
                         language === 'en' ? 'Session duration (minutes)' : 
                         'Oturum süresi (dakika)'}
                      </label>
                      <input
                        type="number"
                        min="30"
                        max="1440"
                        value={settings.security.session_timeout}
                        onChange={(e) => updateSettings('security', 'session_timeout', parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="bg-red-100 p-2 rounded-lg">
                          <Clock className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {language === 'fr' ? 'Déconnexion automatique' : 
                             language === 'en' ? 'Auto logout' : 
                             'Otomatik çıkış'}
                          </p>
                          <p className="text-sm text-slate-600">
                            {language === 'fr' ? 'Déconnecter les utilisateurs inactifs' : 
                             language === 'en' ? 'Logout inactive users' : 
                             'Pasif kullanıcıları çıkart'}
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.security.auto_logout_inactive}
                          onChange={(e) => updateSettings('security', 'auto_logout_inactive', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                      </label>
                    </div>
                  </div>

                  {/* Mots de passe */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                      {language === 'fr' ? 'Politique des Mots de Passe' : 
                       language === 'en' ? 'Password Policy' : 
                       'Şifre Politikası'}
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {language === 'fr' ? 'Longueur minimale' : 
                         language === 'en' ? 'Minimum length' : 
                         'Minimum uzunluk'}
                      </label>
                      <input
                        type="number"
                        min="6"
                        max="20"
                        value={settings.security.password_min_length}
                        onChange={(e) => updateSettings('security', 'password_min_length', parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {language === 'fr' ? 'Tentatives de connexion max' : 
                         language === 'en' ? 'Max login attempts' : 
                         'Maksimum giriş denemesi'}
                      </label>
                      <input
                        type="number"
                        min="3"
                        max="10"
                        value={settings.security.login_attempts_max}
                        onChange={(e) => updateSettings('security', 'login_attempts_max', parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="bg-red-100 p-2 rounded-lg">
                          <Lock className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {language === 'fr' ? 'Authentification 2FA' : 
                             language === 'en' ? '2FA Authentication' : 
                             '2FA Kimlik Doğrulama'}
                          </p>
                          <p className="text-sm text-slate-600">
                            {language === 'fr' ? 'Exiger une double authentification' : 
                             language === 'en' ? 'Require two-factor authentication' : 
                             'İki faktörlü kimlik doğrulama gerektir'}
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.security.require_2fa}
                          onChange={(e) => updateSettings('security', 'require_2fa', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                      </label>
                    </div>
                  </div>

                  {/* Verrouillage de compte */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                      {language === 'fr' ? 'Verrouillage de Compte' : 
                       language === 'en' ? 'Account Lockout' : 
                       'Hesap Kilitleme'}
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {language === 'fr' ? 'Durée de verrouillage (minutes)' : 
                         language === 'en' ? 'Lockout duration (minutes)' : 
                         'Kilitleme süresi (dakika)'}
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="120"
                        value={settings.security.account_lockout_duration}
                        onChange={(e) => updateSettings('security', 'account_lockout_duration', parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-700 mb-1">
                            {language === 'fr' ? 'Sécurité Renforcée' : 
                             language === 'en' ? 'Enhanced Security' : 
                             'Gelişmiş Güvenlik'}
                          </p>
                          <p className="text-sm text-red-600">
                            {language === 'fr' ? 'Ces paramètres affectent tous les utilisateurs du système.' : 
                             language === 'en' ? 'These settings affect all system users.' : 
                             'Bu ayarlar tüm sistem kullanıcılarını etkiler.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Onglet Système */}
            {activeTab === 'system' && (
              <div className="space-y-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-3 rounded-xl">
                    <Monitor className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {language === 'fr' ? 'Configuration Système' : 
                       language === 'en' ? 'System Configuration' : 
                       'Sistem Yapılandırması'}
                    </h2>
                    <p className="text-slate-600">
                      {language === 'fr' ? 'Paramètres globaux du système et maintenance' : 
                       language === 'en' ? 'Global system settings and maintenance' : 
                       'Küresel sistem ayarları ve bakım'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Localisation */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                      {language === 'fr' ? 'Localisation' : 
                       language === 'en' ? 'Localization' : 
                       'Yerelleştirme'}
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {language === 'fr' ? 'Langue par défaut' : 
                         language === 'en' ? 'Default language' : 
                         'Varsayılan dil'}
                      </label>
                      <select
                        value={settings.system.language_default}
                        onChange={(e) => updateSettings('system', 'language_default', e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="fr">🇫🇷 Français</option>
                        <option value="en">🇺🇸 English</option>
                        <option value="tr">🇹🇷 Türkçe</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {language === 'fr' ? 'Fuseau horaire' : 
                         language === 'en' ? 'Timezone' : 
                         'Saat dilimi'}
                      </label>
                      <select
                        value={settings.system.timezone}
                        onChange={(e) => updateSettings('system', 'timezone', e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="Africa/Douala">🇨🇲 Cameroun (WAT)</option>
                        <option value="Europe/Paris">🇫🇷 Paris (CET)</option>
                        <option value="Europe/Istanbul">🇹🇷 Istanbul (TRT)</option>
                        <option value="UTC">🌍 UTC</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {language === 'fr' ? 'Format de date' : 
                         language === 'en' ? 'Date format' : 
                         'Tarih formatı'}
                      </label>
                      <select
                        value={settings.system.date_format}
                        onChange={(e) => updateSettings('system', 'date_format', e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY (Européen)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (Américain)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {language === 'fr' ? 'Devise' : 
                         language === 'en' ? 'Currency' : 
                         'Para birimi'}
                      </label>
                      <select
                        value={settings.system.currency}
                        onChange={(e) => updateSettings('system', 'currency', e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="FCFA">FCFA (Franc CFA)</option>
                        <option value="EUR">EUR (Euro)</option>
                        <option value="USD">USD (Dollar)</option>
                        <option value="TRY">TRY (Lire Turque)</option>
                      </select>
                    </div>
                  </div>

                  {/* Maintenance */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                      {language === 'fr' ? 'Maintenance et Sauvegarde' : 
                       language === 'en' ? 'Maintenance and Backup' : 
                       'Bakım ve Yedekleme'}
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {language === 'fr' ? 'Fréquence de sauvegarde' : 
                         language === 'en' ? 'Backup frequency' : 
                         'Yedekleme sıklığı'}
                      </label>
                      <select
                        value={settings.system.backup_frequency}
                        onChange={(e) => updateSettings('system', 'backup_frequency', e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="hourly">Toutes les heures</option>
                        <option value="daily">Quotidienne</option>
                        <option value="weekly">Hebdomadaire</option>
                        <option value="monthly">Mensuelle</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="bg-purple-100 p-2 rounded-lg">
                          <Zap className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {language === 'fr' ? 'Mode maintenance' : 
                             language === 'en' ? 'Maintenance mode' : 
                             'Bakım modu'}
                          </p>
                          <p className="text-sm text-slate-600">
                            {language === 'fr' ? 'Bloquer l\'accès aux utilisateurs' : 
                             language === 'en' ? 'Block user access' : 
                             'Kullanıcı erişimini engelle'}
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.system.maintenance_mode}
                          onChange={(e) => updateSettings('system', 'maintenance_mode', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="bg-purple-100 p-2 rounded-lg">
                          <Activity className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {language === 'fr' ? 'Mode debug' : 
                             language === 'en' ? 'Debug mode' : 
                             'Hata ayıklama modu'}
                          </p>
                          <p className="text-sm text-slate-600">
                            {language === 'fr' ? 'Logs détaillés pour développement' : 
                             language === 'en' ? 'Detailed logs for development' : 
                             'Geliştirme için detaylı günlükler'}
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.system.debug_mode}
                          onChange={(e) => updateSettings('system', 'debug_mode', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                      </label>
                    </div>

                    {/* Actions système */}
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowBackupModal(true)}
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2"
                      >
                        <Download className="w-5 h-5" />
                        <span>
                          {language === 'fr' ? 'Créer Sauvegarde' : 
                           language === 'en' ? 'Create Backup' : 
                           'Yedek Oluştur'}
                        </span>
                      </button>

                      <button
                        onClick={() => setShowImportModal(true)}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center space-x-2"
                      >
                        <Upload className="w-5 h-5" />
                        <span>
                          {language === 'fr' ? 'Importer Données' : 
                           language === 'en' ? 'Import Data' : 
                           'Veri İçe Aktar'}
                        </span>
                      </button>

                      <button
                        onClick={fetchSystemInfo}
                        className="w-full bg-gradient-to-r from-slate-500 to-slate-600 text-white py-3 px-4 rounded-xl hover:from-slate-600 hover:to-slate-700 transition-all duration-200 flex items-center justify-center space-x-2"
                      >
                        <Server className="w-5 h-5" />
                        <span>
                          {language === 'fr' ? 'Infos Système' : 
                           language === 'en' ? 'System Info' : 
                           'Sistem Bilgisi'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Onglet Apparence */}
            {activeTab === 'appearance' && (
              <div className="space-y-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 rounded-xl">
                    <Palette className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {language === 'fr' ? 'Personnalisation de l\'Interface' : 
                       language === 'en' ? 'Interface Customization' : 
                       'Arayüz Özelleştirme'}
                    </h2>
                    <p className="text-slate-600">
                      {language === 'fr' ? 'Personnalisez l\'apparence et le comportement de l\'interface' : 
                       language === 'en' ? 'Customize the appearance and behavior of the interface' : 
                       'Arayüzün görünümünü ve davranışını özelleştirin'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Thème */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                      {language === 'fr' ? 'Thème et Couleurs' : 
                       language === 'en' ? 'Theme and Colors' : 
                       'Tema ve Renkler'}
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        {language === 'fr' ? 'Thème de l\'interface' : 
                         language === 'en' ? 'Interface theme' : 
                         'Arayüz teması'}
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: 'light', label: 'Clair', icon: Sun },
                          { value: 'dark', label: 'Sombre', icon: Moon },
                          { value: 'auto', label: 'Auto', icon: Monitor }
                        ].map((theme) => (
                          <button
                            key={theme.value}
                            onClick={() => updateSettings('appearance', 'theme', theme.value)}
                            className={`p-4 border-2 rounded-xl text-center transition-all ${
                              settings.appearance.theme === theme.value
                                ? 'border-orange-500 bg-orange-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <theme.icon className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                            <p className="text-sm font-medium text-slate-900">{theme.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {language === 'fr' ? 'Couleur primaire' : 
                         language === 'en' ? 'Primary color' : 
                         'Birincil renk'}
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={settings.appearance.primary_color}
                          onChange={(e) => updateSettings('appearance', 'primary_color', e.target.value)}
                          className="w-12 h-12 border border-slate-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.appearance.primary_color}
                          onChange={(e) => updateSettings('appearance', 'primary_color', e.target.value)}
                          className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono"
                          placeholder="#0891b2"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {language === 'fr' ? 'Couleur secondaire' : 
                         language === 'en' ? 'Secondary color' : 
                         'İkincil renk'}
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={settings.appearance.secondary_color}
                          onChange={(e) => updateSettings('appearance', 'secondary_color', e.target.value)}
                          className="w-12 h-12 border border-slate-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.appearance.secondary_color}
                          onChange={(e) => updateSettings('appearance', 'secondary_color', e.target.value)}
                          className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono"
                          placeholder="#059669"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Interface */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                      {language === 'fr' ? 'Comportement Interface' : 
                       language === 'en' ? 'Interface Behavior' : 
                       'Arayüz Davranışı'}
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        {language === 'fr' ? 'Position du logo' : 
                         language === 'en' ? 'Logo position' : 
                         'Logo konumu'}
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'left', label: 'Gauche' },
                          { value: 'center', label: 'Centre' }
                        ].map((position) => (
                          <button
                            key={position.value}
                            onClick={() => updateSettings('appearance', 'logo_position', position.value)}
                            className={`p-3 border-2 rounded-xl text-center transition-all ${
                              settings.appearance.logo_position === position.value
                                ? 'border-orange-500 bg-orange-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <p className="text-sm font-medium text-slate-900">{position.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="bg-orange-100 p-2 rounded-lg">
                          <Monitor className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {language === 'fr' ? 'Mode compact' : 
                             language === 'en' ? 'Compact mode' : 
                             'Kompakt mod'}
                          </p>
                          <p className="text-sm text-slate-600">
                            {language === 'fr' ? 'Interface plus dense' : 
                             language === 'en' ? 'Denser interface' : 
                             'Daha yoğun arayüz'}
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.appearance.compact_mode}
                          onChange={(e) => updateSettings('appearance', 'compact_mode', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="bg-orange-100 p-2 rounded-lg">
                          <Zap className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {language === 'fr' ? 'Animations' : 
                             language === 'en' ? 'Animations' : 
                             'Animasyonlar'}
                          </p>
                          <p className="text-sm text-slate-600">
                            {language === 'fr' ? 'Transitions et effets visuels' : 
                             language === 'en' ? 'Transitions and visual effects' : 
                             'Geçişler ve görsel efektler'}
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.appearance.animations_enabled}
                          onChange={(e) => updateSettings('appearance', 'animations_enabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                    </div>

                    {/* Zone dangereuse */}
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                        <h4 className="text-lg font-semibold text-red-700">
                          {language === 'fr' ? 'Zone Dangereuse' : 
                           language === 'en' ? 'Danger Zone' : 
                           'Tehlike Bölgesi'}
                        </h4>
                      </div>
                      <p className="text-sm text-red-600 mb-4">
                        {language === 'fr' ? 'Ces actions sont irréversibles et peuvent affecter tout le système.' : 
                         language === 'en' ? 'These actions are irreversible and may affect the entire system.' : 
                         'Bu işlemler geri alınamaz ve tüm sistemi etkileyebilir.'}
                      </p>
                      <button
                        onClick={() => setShowResetModal(true)}
                        className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>
                          {language === 'fr' ? 'Reset Système' : 
                           language === 'en' ? 'System Reset' : 
                           'Sistem Sıfırlama'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer avec bouton de sauvegarde */}
          <div className="border-t border-slate-200 bg-slate-50 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">
                {language === 'fr' ? 'Dernière modification:' : 
                 language === 'en' ? 'Last modified:' : 
                 'Son değişiklik:'} {new Date().toLocaleString()}
              </div>
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2 shadow-lg"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>
                      {language === 'fr' ? 'Sauvegarde...' : 
                       language === 'en' ? 'Saving...' : 
                       'Kaydediliyor...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>
                      {language === 'fr' ? 'Sauvegarder les Paramètres' : 
                       language === 'en' ? 'Save Settings' : 
                       'Ayarları Kaydet'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Sauvegarde */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                {language === 'fr' ? 'Créer une Sauvegarde' : 
                 language === 'en' ? 'Create Backup' : 
                 'Yedek Oluştur'}
              </h2>
            </div>
            <div className="p-6">
              <div className="flex items-start space-x-3 mb-4">
                <Database className="w-6 h-6 text-blue-500 mt-1" />
                <div>
                  <p className="text-slate-900 font-medium mb-2">
                    {language === 'fr' ? 'Sauvegarde complète de la base de données' : 
                     language === 'en' ? 'Complete database backup' : 
                     'Tam veritabanı yedeği'}
                  </p>
                  <p className="text-sm text-slate-600">
                    {language === 'fr' ? 'Inclut tous les utilisateurs, dépôts, matériaux et historique.' : 
                     language === 'en' ? 'Includes all users, depots, materials and history.' : 
                     'Tüm kullanıcıları, depoları, malzemeleri ve geçmişi içerir.'}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowBackupModal(false)}
                  className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-xl hover:bg-slate-100"
                >
                  {language === 'fr' ? 'Annuler' : language === 'en' ? 'Cancel' : 'İptal'}
                </button>
                <button
                  onClick={handleBackup}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700"
                >
                  {language === 'fr' ? 'Créer Sauvegarde' : language === 'en' ? 'Create Backup' : 'Yedek Oluştur'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                {language === 'fr' ? 'Importer des Données' : 
                 language === 'en' ? 'Import Data' : 
                 'Veri İçe Aktar'}
              </h2>
            </div>
            <div className="p-6">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-2">
                  {language === 'fr' ? 'Sélectionnez un fichier de sauvegarde' : 
                   language === 'en' ? 'Select a backup file' : 
                   'Yedek dosyası seçin'}
                </p>
                <p className="text-sm text-slate-500">Fichiers .sql uniquement</p>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-xl hover:bg-slate-100"
                >
                  {language === 'fr' ? 'Annuler' : language === 'en' ? 'Cancel' : 'İptal'}
                </button>
                <button
                  onClick={handleImport}
                  className="flex-1 bg-green-600 text-white py-2 rounded-xl hover:bg-green-700"
                >
                  {language === 'fr' ? 'Importer' : language === 'en' ? 'Import' : 'İçe Aktar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reset */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                {language === 'fr' ? 'Reset Système' : 
                 language === 'en' ? 'System Reset' : 
                 'Sistem Sıfırlama'}
              </h2>
            </div>
            <div className="p-6">
              <div className="flex items-start space-x-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500 mt-1" />
                <div>
                  <p className="text-slate-900 font-medium mb-2">
                    {language === 'fr' ? 'Êtes-vous sûr de vouloir remettre à zéro tous les paramètres ?' : 
                     language === 'en' ? 'Are you sure you want to reset all settings?' : 
                     'Tüm ayarları sıfırlamak istediğinizden emin misiniz?'}
                  </p>
                  <p className="text-sm text-red-600">
                    {language === 'fr' ? 'Cette action est irréversible et restaurera tous les paramètres par défaut.' : 
                     language === 'en' ? 'This action is irreversible and will restore all default settings.' : 
                     'Bu işlem geri alınamaz ve tüm varsayılan ayarları geri yükler.'}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-xl hover:bg-slate-100"
                >
                  {language === 'fr' ? 'Annuler' : language === 'en' ? 'Cancel' : 'İptal'}
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 bg-red-600 text-white py-2 rounded-xl hover:bg-red-700"
                >
                  {language === 'fr' ? 'Reset' : language === 'en' ? 'Reset' : 'Sıfırla'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Infos Système */}
      {showSystemInfoModal && systemInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">
                  {language === 'fr' ? 'Informations Système' : 
                   language === 'en' ? 'System Information' : 
                   'Sistem Bilgileri'}
                </h2>
                <button
                  onClick={() => setShowSystemInfoModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Version et Base */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Version</h3>
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Version:</span>
                      <span className="font-medium">{systemInfo.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Node.js:</span>
                      <span className="font-medium">{systemInfo.server.node_version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Plateforme:</span>
                      <span className="font-medium">{systemInfo.server.platform}</span>
                    </div>
                  </div>
                </div>

                {/* Base de données */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Base de Données</h3>
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Nom:</span>
                      <span className="font-medium">{systemInfo.database.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Host:</span>
                      <span className="font-medium">{systemInfo.database.host}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Port:</span>
                      <span className="font-medium">{systemInfo.database.port}</span>
                    </div>
                  </div>
                </div>

                {/* Statistiques */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Statistiques</h3>
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Utilisateurs:</span>
                      <span className="font-medium">{systemInfo.statistics.total_users}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Dépôts:</span>
                      <span className="font-medium">{systemInfo.statistics.total_depots}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Matériaux:</span>
                      <span className="font-medium">{systemInfo.statistics.total_materiaux}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Demandes:</span>
                      <span className="font-medium">{systemInfo.statistics.total_demandes}</span>
                    </div>
                  </div>
                </div>

                {/* Performance */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Performance</h3>
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Uptime:</span>
                      <span className="font-medium">{Math.floor(systemInfo.server.uptime / 3600)}h {Math.floor((systemInfo.server.uptime % 3600) / 60)}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Mémoire:</span>
                      <span className="font-medium">{Math.round(systemInfo.server.memory_usage.heapUsed / 1024 / 1024)}MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Dernière sauvegarde:</span>
                      <span className="font-medium">{systemInfo.last_backup}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default SettingsPage;