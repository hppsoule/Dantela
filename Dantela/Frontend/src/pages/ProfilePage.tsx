import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Calendar,
  Edit,
  Save,
  X,
  Camera,
  Shield,
  CheckCircle,
  Lock,
  Eye,
  EyeOff,
  TrendingUp,
  Package,
  Clock,
  Award,
  AlertTriangle,
  Activity,
  BarChart3,
  FileText,
  Truck,
  Star,
  Target,
  Users,
  ClipboardList,
  History,
  Download,
  Printer
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Layout from '../components/Layout';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Interfaces pour les données
interface ProfileStats {
  total_demandes_traitees?: number;
  demandes_approuvees?: number;
  demandes_rejetees?: number;
  total_bons_generes?: number;
  total_mouvements_stock?: number;
  materiaux_geres?: number;
  depot_nom?: string;
  depot_adresse?: string;
}

interface MouvementStock {
  id: string;
  type_mouvement: string;
  quantite: number;
  materiau_nom: string;
  utilisateur_nom: string;
  created_at: string;
  motif: string;
}

interface Demande {
  id: string;
  numero_demande: string;
  statut: string;
  demandeur_nom: string;
  date_demande: string;
  nombre_items: number;
}
const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const [, forceUpdate] = useState({});
  
  // États principaux
  const [profileData, setProfileData] = useState(user);
  const [profileStats, setProfileStats] = useState<ProfileStats>({});
  const [recentMovements, setRecentMovements] = useState<MouvementStock[]>([]);
  const [recentDemandes, setRecentDemandes] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // États d'édition
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Formulaires
  const [formData, setFormData] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    telephone: user?.telephone || '',
    adresse: user?.adresse || '',
    nom_chantier: user?.nom_chantier || ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Écouter les changements de langue
  useEffect(() => {
    const handleLanguageChange = () => {
      forceUpdate({});
    };
    
    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Session expirée');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Récupérer le profil
      const profileResponse = await fetch('http://localhost:5000/api/profile', { headers });
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfileData(profileData.user);
        setFormData({
          nom: profileData.user.nom || '',
          prenom: profileData.user.prenom || '',
          telephone: profileData.user.telephone || '',
          adresse: profileData.user.adresse || '',
          nom_chantier: profileData.user.nom_chantier || ''
        });
      }

      // Récupérer les statistiques du profil (pour magazinier)
      if (user?.role === 'magazinier') {
        const [statsResponse, movementsResponse, demandesResponse] = await Promise.all([
          fetch('http://localhost:5000/api/profile/stats', { headers }),
          fetch('http://localhost:5000/api/stock/movements?limit=5', { headers }),
          fetch('http://localhost:5000/api/demandes?limit=5', { headers })
        ]);

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setProfileStats(statsData.stats || {});
        }

        if (movementsResponse.ok) {
          const movementsData = await movementsResponse.json();
          setRecentMovements(movementsData.mouvements || []);
        }

        if (demandesResponse.ok) {
          const demandesData = await demandesResponse.json();
          setRecentDemandes(demandesData.demandes || []);
        }
      }

    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!formData.nom.trim() || !formData.prenom.trim()) {
      alert(language === 'fr' ? 'Le nom et le prénom sont obligatoires' : 
            language === 'en' ? 'First name and last name are required' : 
            'Ad ve soyad gereklidir');
      return;
    }

    if (user?.role === 'chef_chantier' && !formData.nom_chantier.trim()) {
      alert(language === 'fr' ? 'Le nom du chantier est obligatoire' : 
            language === 'en' ? 'Site name is required' : 
            'Şantiye adı gereklidir');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la mise à jour');
      }

      const data = await response.json();
      setProfileData(data.user);
      setIsEditing(false);
      
      alert(language === 'fr' ? 'Profil mis à jour avec succès !' : 
            language === 'en' ? 'Profile updated successfully!' : 
            'Profil başarıyla güncellendi!');

    } catch (error) {
      console.error('Erreur:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      alert(language === 'fr' ? 'Tous les champs sont obligatoires' : 
            language === 'en' ? 'All fields are required' : 
            'Tüm alanlar gereklidir');
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      alert(language === 'fr' ? 'Les nouveaux mots de passe ne correspondent pas' : 
            language === 'en' ? 'New passwords do not match' : 
            'Yeni şifreler eşleşmiyor');
      return;
    }

    if (passwordForm.new_password.length < 6) {
      alert(language === 'fr' ? 'Le mot de passe doit contenir au moins 6 caractères' : 
            language === 'en' ? 'Password must be at least 6 characters' : 
            'Şifre en az 6 karakter olmalıdır');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/profile/password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du changement de mot de passe');
      }

      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setIsChangingPassword(false);
      
      alert(language === 'fr' ? 'Mot de passe changé avec succès !' : 
            language === 'en' ? 'Password changed successfully!' : 
            'Şifre başarıyla değiştirildi!');

    } catch (error) {
      console.error('Erreur:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors du changement de mot de passe');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      nom: profileData?.nom || '',
      prenom: profileData?.prenom || '',
      telephone: profileData?.telephone || '',
      adresse: profileData?.adresse || '',
      nom_chantier: profileData?.nom_chantier || ''
    });
    setIsEditing(false);
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'directeur': return 'from-purple-500 to-purple-600';
      case 'magazinier': return 'from-blue-500 to-blue-600';
      case 'chef_chantier': return 'from-green-500 to-green-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'entree': return 'bg-green-100 text-green-800';
      case 'sortie': return 'bg-red-100 text-red-800';
      case 'ajustement': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMovementTypeIcon = (type: string) => {
    switch (type) {
      case 'entree': return <TrendingUp className="w-4 h-4" />;
      case 'sortie': return <Truck className="w-4 h-4" />;
      case 'ajustement': return <Activity className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'en_attente': return 'bg-yellow-100 text-yellow-800';
      case 'approuvee': return 'bg-green-100 text-green-800';
      case 'rejetee': return 'bg-red-100 text-red-800';
      case 'en_preparation': return 'bg-blue-100 text-blue-800';
      case 'livree': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

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

  // Données pour les graphiques (calculées depuis les vraies données)
  const getChartData = () => {
    const entrees = recentMovements.filter(m => m.type_mouvement === 'entree').length;
    const sorties = recentMovements.filter(m => m.type_mouvement === 'sortie').length;
    const ajustements = recentMovements.filter(m => m.type_mouvement === 'ajustement').length;

    return [
      { name: language === 'fr' ? 'Entrées' : language === 'en' ? 'Inbound' : 'Giriş', value: entrees, color: '#10b981' },
      { name: language === 'fr' ? 'Sorties' : language === 'en' ? 'Outbound' : 'Çıkış', value: sorties, color: '#ef4444' },
      { name: language === 'fr' ? 'Ajustements' : language === 'en' ? 'Adjustments' : 'Ayarlama', value: ajustements, color: '#3b82f6' }
    ];
  };
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!profileData) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-gray-600">Impossible de charger le profil</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header avec dégradé - Responsive */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white relative overflow-hidden">
          {/* Formes décoratives */}
          <div className="hidden sm:block absolute top-0 right-0 w-32 sm:w-48 lg:w-64 h-32 sm:h-48 lg:h-64 bg-white bg-opacity-10 rounded-full -translate-y-16 sm:-translate-y-24 lg:-translate-y-32 translate-x-16 sm:translate-x-24 lg:translate-x-32"></div>
          <div className="hidden sm:block absolute bottom-0 left-0 w-24 sm:w-36 lg:w-48 h-24 sm:h-36 lg:h-48 bg-white bg-opacity-5 rounded-full translate-y-12 sm:translate-y-18 lg:translate-y-24 -translate-x-12 sm:-translate-x-18 lg:-translate-x-24"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
                  {language === 'fr' ? 'Mon Profil' : 
                   language === 'en' ? 'My Profile' : 
                   'Profilim'}
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-blue-100">
                  {language === 'fr' ? 'Gérez vos informations personnelles et préférences' : 
                   language === 'en' ? 'Manage your personal information and preferences' : 
                   'Kişisel bilgilerinizi ve tercihlerinizi yönetin'}
                </p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 sm:p-4 rounded-xl sm:rounded-2xl backdrop-blur-sm">
                <User className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques Magazinier - Seulement pour les magaziniers */}
        {user?.role === 'magazinier' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                title: language === 'fr' ? 'Demandes Traitées' : language === 'en' ? 'Processed Requests' : 'İşlenen Talepler',
                value: (profileStats.total_demandes_traitees || 0).toString(),
                change: language === 'fr' ? 'Total validées' : language === 'en' ? 'Total validated' : 'Toplam onaylanan',
                icon: ClipboardList,
                color: 'from-blue-500 to-blue-600',
                bgColor: 'bg-blue-50'
              },
              {
                title: language === 'fr' ? 'Bons Générés' : language === 'en' ? 'Generated Notes' : 'Oluşturulan Fiş',
                value: (profileStats.total_bons_generes || 0).toString(),
                change: language === 'fr' ? 'Bons de livraison' : language === 'en' ? 'Delivery notes' : 'Teslimat fişleri',
                icon: FileText,
                color: 'from-green-500 to-green-600',
                bgColor: 'bg-green-50'
              },
              {
                title: language === 'fr' ? 'Mouvements Stock' : language === 'en' ? 'Stock Movements' : 'Stok Hareketleri',
                value: (profileStats.total_mouvements_stock || 0).toString(),
                change: language === 'fr' ? 'Entrées/Sorties' : language === 'en' ? 'In/Out' : 'Giriş/Çıkış',
                icon: Activity,
                color: 'from-purple-500 to-purple-600',
                bgColor: 'bg-purple-50'
              },
              {
                title: language === 'fr' ? 'Matériaux Gérés' : language === 'en' ? 'Managed Materials' : 'Yönetilen Malzeme',
                value: (profileStats.materiaux_geres || 0).toString(),
                change: language === 'fr' ? 'Produits différents' : language === 'en' ? 'Different products' : 'Farklı ürün',
                icon: Package,
                color: 'from-orange-500 to-orange-600',
                bgColor: 'bg-orange-50'
              }
            ].map((stat, index) => (
              <div key={index} className="bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-100 hover:scale-105">
                <div className={`bg-gradient-to-r ${stat.color} p-4 sm:p-6 text-white`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">{stat.value}</p>
                      <p className="text-white text-opacity-90 font-medium text-sm sm:text-base">{stat.title}</p>
                    </div>
                    <div className="bg-white bg-opacity-20 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                      <stat.icon className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                  </div>
                </div>
                <div className="p-3 sm:p-4">
                  <span className="text-xs sm:text-sm text-slate-600">{stat.change}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">
            {error}
          </div>
        )}

        {/* Carte de profil principale - Ultra Responsive */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-slate-100">
          {/* Header de la carte */}
          <div className={`bg-gradient-to-r ${getRoleColor(profileData.role)} p-4 sm:p-6 lg:p-8 text-white relative overflow-hidden`}>
            {/* Formes décoratives */}
            <div className="hidden sm:block absolute top-0 right-0 w-24 sm:w-32 lg:w-40 h-24 sm:h-32 lg:h-40 bg-white bg-opacity-10 rounded-full -translate-y-12 sm:-translate-y-16 lg:-translate-y-20 translate-x-12 sm:translate-x-16 lg:translate-x-20"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-4 sm:space-y-0">
                {/* Avatar */}
                <div className="relative mx-auto sm:mx-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl sm:text-3xl lg:text-4xl font-bold backdrop-blur-sm">
                    {profileData.prenom.charAt(0)}{profileData.nom.charAt(0)}
                  </div>
                  <button className="absolute bottom-0 right-0 bg-white text-gray-600 p-2 sm:p-3 rounded-full shadow-lg hover:bg-gray-50 transition-colors">
                    <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>

                {/* Informations principales */}
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">
                    {profileData.prenom} {profileData.nom}
                  </h2>
                  <div className="flex items-center justify-center sm:justify-start space-x-2 mb-2">
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-base sm:text-lg font-medium">{getRoleText(profileData.role)}</span>
                  </div>
                  {/* Informations dépôt pour magazinier */}
                  {user?.role === 'magazinier' && profileStats.depot_nom && (
                    <div className="flex items-center justify-center sm:justify-start space-x-2">
                      <Building2 className="w-4 h-4" />
                      <span className="text-white text-opacity-90 text-sm sm:text-base">{profileStats.depot_nom}</span>
                    </div>
                  )}
                  {profileData.nom_chantier && (
                    <div className="flex items-center justify-center sm:justify-start space-x-2">
                      <Building2 className="w-4 h-4" />
                      <span className="text-white text-opacity-90 text-sm sm:text-base">{profileData.nom_chantier}</span>
                    </div>
                  )}
                </div>

                {/* Boutons d'action */}
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  {!isEditing ? (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="bg-white bg-opacity-20 text-white px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:bg-opacity-30 transition-colors flex items-center justify-center space-x-2 backdrop-blur-sm text-sm sm:text-base"
                      >
                        <Edit className="w-4 h-4" />
                        <span>
                          {language === 'fr' ? 'Modifier' : language === 'en' ? 'Edit' : 'Düzenle'}
                        </span>
                      </button>
                      <button
                        onClick={() => setIsChangingPassword(true)}
                        className="bg-white bg-opacity-20 text-white px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:bg-opacity-30 transition-colors flex items-center justify-center space-x-2 backdrop-blur-sm text-sm sm:text-base"
                      >
                        <Lock className="w-4 h-4" />
                        <span>
                          {language === 'fr' ? 'Mot de passe' : language === 'en' ? 'Password' : 'Şifre'}
                        </span>
                      </button>
                    </>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleUpdateProfile}
                        disabled={saving}
                        className="bg-green-600 text-white px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 text-sm sm:text-base"
                      >
                        <Save className="w-4 h-4" />
                        <span>
                          {saving ? 
                            (language === 'fr' ? 'Sauvegarde...' : language === 'en' ? 'Saving...' : 'Kaydediliyor...') :
                            (language === 'fr' ? 'Sauvegarder' : language === 'en' ? 'Save' : 'Kaydet')
                          }
                        </span>
                      </button>
                      <button
                        onClick={handleCancel}
                        className="bg-red-600 text-white px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:bg-red-700 transition-colors flex items-center space-x-2 text-sm sm:text-base"
                      >
                        <X className="w-4 h-4" />
                        <span>
                          {language === 'fr' ? 'Annuler' : language === 'en' ? 'Cancel' : 'İptal'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contenu de la carte - Responsive */}
          <div className="p-4 sm:p-6 lg:p-8">
            <div className={`grid gap-6 sm:gap-8 ${user?.role === 'magazinier' ? 'grid-cols-1 xl:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'}`}>
              {/* Informations personnelles */}
              <div className="space-y-4 sm:space-y-6">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center space-x-2">
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  <span>
                    {language === 'fr' ? 'Informations Personnelles' : 
                     language === 'en' ? 'Personal Information' : 
                     'Kişisel Bilgiler'}
                  </span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {language === 'fr' ? 'Prénom' : language === 'en' ? 'First Name' : 'Ad'} <span className="text-red-500">*</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.prenom}
                        onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    ) : (
                      <p className="text-slate-900 font-medium bg-slate-50 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl">
                        {profileData.prenom}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {language === 'fr' ? 'Nom' : language === 'en' ? 'Last Name' : 'Soyad'} <span className="text-red-500">*</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.nom}
                        onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    ) : (
                      <p className="text-slate-900 font-medium bg-slate-50 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl">
                        {profileData.nom}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {language === 'fr' ? 'Email' : language === 'en' ? 'Email' : 'E-posta'}
                  </label>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-5 h-5 text-slate-400" />
                    <p className="text-slate-900 font-medium bg-slate-50 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl flex-1">
                      {profileData.email}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {language === 'fr' ? 'L\'email ne peut pas être modifié' : 
                     language === 'en' ? 'Email cannot be modified' : 
                     'E-posta değiştirilemez'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {language === 'fr' ? 'Téléphone' : language === 'en' ? 'Phone' : 'Telefon'}
                  </label>
                  {isEditing ? (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-5 h-5 text-slate-400" />
                      <input
                        type="tel"
                        value={formData.telephone}
                        onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                        className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+237 6XX XXX XXX"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-5 h-5 text-slate-400" />
                      <p className="text-slate-900 font-medium bg-slate-50 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl flex-1">
                        {profileData.telephone || (language === 'fr' ? 'Non renseigné' : language === 'en' ? 'Not provided' : 'Belirtilmemiş')}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {language === 'fr' ? 'Adresse' : language === 'en' ? 'Address' : 'Adres'}
                  </label>
                  {isEditing ? (
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-5 h-5 text-slate-400 mt-2 sm:mt-3" />
                      <textarea
                        value={formData.adresse}
                        onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                        className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder={language === 'fr' ? 'Votre adresse complète' : language === 'en' ? 'Your complete address' : 'Tam adresiniz'}
                      />
                    </div>
                  ) : (
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-5 h-5 text-slate-400 mt-2 sm:mt-3" />
                      <p className="text-slate-900 font-medium bg-slate-50 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl flex-1">
                        {profileData.adresse || (language === 'fr' ? 'Non renseignée' : language === 'en' ? 'Not provided' : 'Belirtilmemiş')}
                      </p>
                    </div>
                  )}
                </div>

                {profileData.role === 'chef_chantier' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {language === 'fr' ? 'Nom du Chantier' : language === 'en' ? 'Site Name' : 'Şantiye Adı'} <span className="text-red-500">*</span>
                    </label>
                    {isEditing ? (
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          value={formData.nom_chantier}
                          onChange={(e) => setFormData({ ...formData, nom_chantier: e.target.value })}
                          className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={language === 'fr' ? 'Nom de votre chantier' : language === 'en' ? 'Your site name' : 'Şantiye adınız'}
                          required
                        />
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-5 h-5 text-slate-400" />
                        <p className="text-slate-900 font-medium bg-slate-50 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl flex-1">
                          {profileData.nom_chantier || (language === 'fr' ? 'Non renseigné' : language === 'en' ? 'Not provided' : 'Belirtilmemiş')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Informations du compte */}
              <div className={`space-y-4 sm:space-y-6 ${user?.role === 'magazinier' ? 'xl:col-span-1' : ''}`}>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center space-x-2">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  <span>
                    {language === 'fr' ? 'Informations du Compte' : 
                     language === 'en' ? 'Account Information' : 
                     'Hesap Bilgileri'}
                  </span>
                </h3>

                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg sm:rounded-xl p-4 sm:p-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800 text-sm sm:text-base">
                        {language === 'fr' ? 'Compte Actif' : language === 'en' ? 'Active Account' : 'Aktif Hesap'}
                      </span>
                    </div>
                    <p className="text-sm text-green-700">
                      {language === 'fr' ? 'Votre compte est validé et opérationnel' : 
                       language === 'en' ? 'Your account is validated and operational' : 
                       'Hesabınız onaylanmış ve operasyonel'}
                    </p>
                  </div>

                  <div className="bg-blue-50 rounded-lg sm:rounded-xl p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-1">
                          {language === 'fr' ? 'Rôle' : language === 'en' ? 'Role' : 'Rol'}
                        </label>
                        <p className="text-blue-900 font-medium text-sm sm:text-base">{getRoleText(profileData.role)}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-1">
                          {language === 'fr' ? 'Membre depuis' : language === 'en' ? 'Member since' : 'Üyelik tarihi'}
                        </label>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <p className="text-blue-900 font-medium text-sm sm:text-base">
                            {new Date(profileData.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Permissions selon le rôle */}
                  <div className="bg-purple-50 rounded-lg sm:rounded-xl p-4 sm:p-6">
                    <h4 className="font-medium text-purple-800 mb-3 text-sm sm:text-base">
                      {language === 'fr' ? 'Permissions' : language === 'en' ? 'Permissions' : 'İzinler'}
                    </h4>
                    <div className="space-y-2">
                      {profileData.role === 'chef_chantier' && (
                        <>
                          <div className="flex items-center space-x-2 text-sm text-purple-700">
                            <CheckCircle className="w-4 h-4" />
                            <span>
                              {language === 'fr' ? 'Créer des demandes de matériaux' : 
                               language === 'en' ? 'Create material requests' : 
                               'Malzeme talepleri oluştur'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-purple-700">
                            <CheckCircle className="w-4 h-4" />
                            <span>
                              {language === 'fr' ? 'Consulter le catalogue' : 
                               language === 'en' ? 'Browse catalog' : 
                               'Kataloğa göz at'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-purple-700">
                            <CheckCircle className="w-4 h-4" />
                            <span>
                              {language === 'fr' ? 'Suivre ses demandes' : 
                               language === 'en' ? 'Track requests' : 
                               'Talepleri takip et'}
                            </span>
                          </div>
                        </>
                      )}
                      {profileData.role === 'magazinier' && (
                        <>
                          <div className="flex items-center space-x-2 text-sm text-purple-700">
                            <CheckCircle className="w-4 h-4" />
                            <span>
                              {language === 'fr' ? 'Valider les demandes' : 
                               language === 'en' ? 'Validate requests' : 
                               'Talepleri onayla'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-purple-700">
                            <CheckCircle className="w-4 h-4" />
                            <span>
                              {language === 'fr' ? 'Gérer les stocks' : 
                               language === 'en' ? 'Manage inventory' : 
                               'Stok yönet'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-purple-700">
                            <CheckCircle className="w-4 h-4" />
                            <span>
                              {language === 'fr' ? 'Distribution directe' : 
                               language === 'en' ? 'Direct distribution' : 
                               'Doğrudan dağıtım'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-purple-700">
                            <CheckCircle className="w-4 h-4" />
                            <span>
                              {language === 'fr' ? 'Générer bons de livraison' : 
                               language === 'en' ? 'Generate delivery notes' : 
                               'Teslimat fişi oluştur'}
                            </span>
                          </div>
                        </>
                      )}
                      {profileData.role === 'directeur' && (
                        <>
                          <div className="flex items-center space-x-2 text-sm text-purple-700">
                            <CheckCircle className="w-4 h-4" />
                            <span>
                              {language === 'fr' ? 'Gestion complète du système' : 
                               language === 'en' ? 'Full system management' : 
                               'Tam sistem yönetimi'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-purple-700">
                            <CheckCircle className="w-4 h-4" />
                            <span>
                              {language === 'fr' ? 'Validation des comptes' : 
                               language === 'en' ? 'Account validation' : 
                               'Hesap onayı'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-purple-700">
                            <CheckCircle className="w-4 h-4" />
                            <span>
                              {language === 'fr' ? 'Gestion des dépôts' : 
                               language === 'en' ? 'Depot management' : 
                               'Depo yönetimi'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section spéciale Magazinier - Activité récente */}
              {user?.role === 'magazinier' && (
                <div className="space-y-4 sm:space-y-6">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center space-x-2">
                    <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" />
                    <span>
                      {language === 'fr' ? 'Activité Récente' : 
                       language === 'en' ? 'Recent Activity' : 
                       'Son Faaliyetler'}
                    </span>
                  </h3>

                  {/* Graphique des mouvements */}
                  <div className="bg-slate-50 rounded-xl p-4 sm:p-6">
                    <h4 className="font-medium text-slate-800 mb-4 text-sm sm:text-base">
                      {language === 'fr' ? 'Répartition des Mouvements' : 
                       language === 'en' ? 'Movement Distribution' : 
                       'Hareket Dağılımı'}
                    </h4>
                    <div className="h-48 sm:h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getChartData()}
                            cx="50%"
                            cy="50%"
                            outerRadius={60}
                            fill="#8884d8"
                            dataKey="value"
                            label
                          >
                            {getChartData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Derniers mouvements */}
                  <div className="bg-slate-50 rounded-xl p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-slate-800 text-sm sm:text-base">
                        {language === 'fr' ? 'Derniers Mouvements' : 
                         language === 'en' ? 'Latest Movements' : 
                         'Son Hareketler'}
                      </h4>
                      <button
                        onClick={() => window.location.href = '/stocks'}
                        className="text-teal-600 hover:text-teal-800 text-sm font-medium"
                      >
                        {language === 'fr' ? 'Voir tout' : language === 'en' ? 'View all' : 'Tümünü gör'}
                      </button>
                    </div>
                    <div className="space-y-3">
                      {recentMovements.length === 0 ? (
                        <p className="text-slate-500 text-center py-4 text-sm">
                          {language === 'fr' ? 'Aucun mouvement récent' : 
                           language === 'en' ? 'No recent movements' : 
                           'Son hareket yok'}
                        </p>
                      ) : (
                        recentMovements.map(mouvement => (
                          <div key={mouvement.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg ${getMovementTypeColor(mouvement.type_mouvement)}`}>
                                {getMovementTypeIcon(mouvement.type_mouvement)}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900 text-sm">{mouvement.materiau_nom}</p>
                                <p className="text-xs text-slate-600">{mouvement.motif}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold text-sm ${
                                mouvement.type_mouvement === 'entree' ? 'text-green-600' :
                                mouvement.type_mouvement === 'sortie' ? 'text-red-600' : 'text-blue-600'
                              }`}>
                                {mouvement.type_mouvement === 'entree' ? '+' : 
                                 mouvement.type_mouvement === 'sortie' ? '-' : ''}{Math.abs(mouvement.quantite)}
                              </p>
                              <p className="text-xs text-slate-500">{formatTimeAgo(mouvement.created_at)}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Dernières demandes traitées */}
                  <div className="bg-slate-50 rounded-xl p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-slate-800 text-sm sm:text-base">
                        {language === 'fr' ? 'Demandes Récentes' : 
                         language === 'en' ? 'Recent Requests' : 
                         'Son Talepler'}
                      </h4>
                      <button
                        onClick={() => window.location.href = '/gestion-commandes'}
                        className="text-teal-600 hover:text-teal-800 text-sm font-medium"
                      >
                        {language === 'fr' ? 'Voir tout' : language === 'en' ? 'View all' : 'Tümünü gör'}
                      </button>
                    </div>
                    <div className="space-y-3">
                      {recentDemandes.length === 0 ? (
                        <p className="text-slate-500 text-center py-4 text-sm">
                          {language === 'fr' ? 'Aucune demande récente' : 
                           language === 'en' ? 'No recent requests' : 
                           'Son talep yok'}
                        </p>
                      ) : (
                        recentDemandes.map(demande => (
                          <div key={demande.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg ${getStatusColor(demande.statut)}`}>
                                <ClipboardList className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-900 text-sm">{demande.numero_demande}</p>
                                <p className="text-xs text-slate-600">{demande.demandeur_nom}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-slate-900">{demande.nombre_items} items</p>
                              <p className="text-xs text-slate-500">{formatTimeAgo(demande.date_demande)}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section Performance Magazinier - Seulement pour magaziniers */}
        {user?.role === 'magazinier' && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-slate-100">
            <div className="p-4 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-teal-50 to-blue-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                    {language === 'fr' ? 'Performance & Statistiques' : 
                     language === 'en' ? 'Performance & Statistics' : 
                     'Performans ve İstatistikler'}
                  </h2>
                  <p className="text-slate-600">
                    {language === 'fr' ? 'Votre activité en tant que magazinier' : 
                     language === 'en' ? 'Your activity as warehouse manager' : 
                     'Depo sorumlusu olarak faaliyetiniz'}
                  </p>
                </div>
                <div className="bg-teal-100 p-3 rounded-xl">
                  <BarChart3 className="w-8 h-8 text-teal-600" />
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Taux d'approbation */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-100 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">
                        {language === 'fr' ? 'Taux d\'Approbation' : 
                         language === 'en' ? 'Approval Rate' : 
                         'Onay Oranı'}
                      </h3>
                      <p className="text-4xl font-bold text-emerald-600">
                        {profileStats.total_demandes_traitees && profileStats.demandes_approuvees ? 
                          Math.round((profileStats.demandes_approuvees / profileStats.total_demandes_traitees) * 100) : 0}%
                      </p>
                    </div>
                    <div className="bg-emerald-500 p-3 rounded-xl">
                      <Target className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-emerald-700 font-medium">
                        {language === 'fr' ? 'Approuvées' : language === 'en' ? 'Approved' : 'Onaylanan'}
                      </p>
                      <p className="text-2xl font-bold text-emerald-600">{profileStats.demandes_approuvees || 0}</p>
                    </div>
                    <div>
                      <p className="text-red-700 font-medium">
                        {language === 'fr' ? 'Rejetées' : language === 'en' ? 'Rejected' : 'Reddedilen'}
                      </p>
                      <p className="text-2xl font-bold text-red-600">{profileStats.demandes_rejetees || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Efficacité */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">
                        {language === 'fr' ? 'Efficacité' : 
                         language === 'en' ? 'Efficiency' : 
                         'Verimlilik'}
                      </h3>
                      <p className="text-4xl font-bold text-blue-600">
                        {profileStats.total_bons_generes || 0}
                      </p>
                      <p className="text-sm text-blue-700">
                        {language === 'fr' ? 'Bons générés' : language === 'en' ? 'Notes generated' : 'Oluşturulan fiş'}
                      </p>
                    </div>
                    <div className="bg-blue-500 p-3 rounded-xl">
                      <Award className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="text-sm text-blue-700">
                    <p>
                      {language === 'fr' ? 'Matériaux gérés:' : language === 'en' ? 'Materials managed:' : 'Yönetilen malzeme:'} 
                      <span className="font-bold ml-1">{profileStats.materiaux_geres || 0}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions rapides pour magazinier */}
              <div className="mt-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span>
                    {language === 'fr' ? 'Actions Rapides' : 
                     language === 'en' ? 'Quick Actions' : 
                     'Hızlı İşlemler'}
                  </span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      title: language === 'fr' ? 'Gestion Commandes' : language === 'en' ? 'Order Management' : 'Sipariş Yönetimi',
                      icon: ClipboardList,
                      color: 'bg-blue-500',
                      href: '/gestion-commandes'
                    },
                    {
                      title: language === 'fr' ? 'Distribution Directe' : language === 'en' ? 'Direct Distribution' : 'Doğrudan Dağıtım',
                      icon: Truck,
                      color: 'bg-green-500',
                      href: '/distribution-directe'
                    },
                    {
                      title: language === 'fr' ? 'Mouvements Stock' : language === 'en' ? 'Stock Movements' : 'Stok Hareketleri',
                      icon: Activity,
                      color: 'bg-purple-500',
                      href: '/stocks'
                    },
                    {
                      title: language === 'fr' ? 'Catalogue' : language === 'en' ? 'Catalog' : 'Katalog',
                      icon: Package,
                      color: 'bg-orange-500',
                      href: '/catalogue'
                    }
                  ].map((action, index) => (
                    <button
                      key={index}
                      onClick={() => window.location.href = action.href}
                      className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-slate-200 hover:shadow-lg hover:scale-105 transition-all duration-300"
                    >
                      <div className={`${action.color} p-3 rounded-xl mb-3`}>
                        <action.icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-medium text-slate-900 text-center">{action.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Changement de Mot de Passe - Responsive */}
      {isChangingPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-xs sm:max-w-md lg:max-w-lg">
            <div className="p-4 sm:p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  {language === 'fr' ? 'Changer le Mot de Passe' : 
                   language === 'en' ? 'Change Password' : 
                   'Şifre Değiştir'}
                </h2>
                <button
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordForm({
                      current_password: '',
                      new_password: '',
                      confirm_password: ''
                    });
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {language === 'fr' ? 'Mot de passe actuel' : language === 'en' ? 'Current password' : 'Mevcut şifre'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 border border-slate-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={language === 'fr' ? 'Votre mot de passe actuel' : language === 'en' ? 'Your current password' : 'Mevcut şifreniz'}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {language === 'fr' ? 'Nouveau mot de passe' : language === 'en' ? 'New password' : 'Yeni şifre'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 border border-slate-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={language === 'fr' ? 'Nouveau mot de passe (min. 6 caractères)' : language === 'en' ? 'New password (min. 6 characters)' : 'Yeni şifre (min. 6 karakter)'}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {language === 'fr' ? 'Confirmer le nouveau mot de passe' : language === 'en' ? 'Confirm new password' : 'Yeni şifreyi onayla'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 border border-slate-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={language === 'fr' ? 'Confirmer le nouveau mot de passe' : language === 'en' ? 'Confirm new password' : 'Yeni şifreyi onayla'}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordForm({
                      current_password: '',
                      new_password: '',
                      confirm_password: ''
                    });
                  }}
                  className="flex-1 border border-slate-300 text-slate-700 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:bg-slate-100 transition-colors text-sm sm:text-base"
                >
                  {language === 'fr' ? 'Annuler' : language === 'en' ? 'Cancel' : 'İptal'}
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 sm:py-3 rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    {saving ? 
                      (language === 'fr' ? 'Changement...' : language === 'en' ? 'Changing...' : 'Değiştiriliyor...') :
                      (language === 'fr' ? 'Changer le Mot de Passe' : language === 'en' ? 'Change Password' : 'Şifreyi Değiştir')
                    }
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ProfilePage;