import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  Calendar,
  User,
  Building2,
  Plus,
  Eye,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  Activity,
  Star,
  Award,
  Target,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

// Base API universelle :
// - Dev (Vite): '/api' -> proxy vers http://localhost:5000
// - Prod (Vercel): '/api' -> réécrit vers https://dantela.onrender.com/api (vercel.json)
// - Optionnel: VITE_API_BASE_URL pour forcer une autre base (ex: https://dantela.onrender.com/api)
const API = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');

interface Demande {
  id: string;
  numero_demande: string;
  statut: string;
  priorite: string;
  date_demande: string;
  date_livraison_souhaitee: string;
  commentaire_demandeur: string;
  commentaire_magazinier: string;
  valideur_nom: string;
  date_validation: string;
  depot_nom: string;
  nombre_items: number;
  total_quantite_demandee: number;
  total_quantite_accordee: number;
}

const ChefChantierDashboard: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [, forceUpdate] = useState({});

  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Écouter les changements de langue
  useEffect(() => {
    const handleLanguageChange = () => {
      forceUpdate({});
    };
    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);

  useEffect(() => {
    fetchDemandes();
  }, []);

  const authHeaders = (): HeadersInit => {
    const token = localStorage.getItem('token');
    return {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    };
  };

  const fetchDemandes = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Session expirée');
        setLoading(false);
        return;
      }

      const res = await fetch(`${API}/demandes`, { headers: authHeaders() });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Erreur HTTP: ${res.status} ${txt}`);
      }

      const data = await res.json();
      setDemandes(data.demandes || []);
    } catch (err) {
      console.error('Erreur:', err);
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'en_attente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approuvee': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejetee': return 'bg-red-100 text-red-800 border-red-200';
      case 'en_preparation': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'livree': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'en_attente': return <Clock className="w-4 h-4" />;
      case 'approuvee': return <CheckCircle className="w-4 h-4" />;
      case 'rejetee': return <XCircle className="w-4 h-4" />;
      case 'en_preparation': return <Package className="w-4 h-4" />;
      case 'livree': return <Truck className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (statut: string) => {
    switch (statut) {
      case 'en_attente':
        return language === 'fr' ? 'En attente' : language === 'en' ? 'Pending' : 'Beklemede';
      case 'approuvee':
        return language === 'fr' ? 'Approuvée' : language === 'en' ? 'Approved' : 'Onaylandı';
      case 'rejetee':
        return language === 'fr' ? 'Rejetée' : language === 'en' ? 'Rejected' : 'Reddedildi';
      case 'en_preparation':
        return language === 'fr' ? 'En préparation' : language === 'en' ? 'In preparation' : 'Hazırlanıyor';
      case 'livree':
        return language === 'fr' ? 'Livrée' : language === 'en' ? 'Delivered' : 'Teslim edildi';
      default: return statut;
    }
  };

  const getPriorityColor = (priorite: string) => {
    switch (priorite) {
      case 'urgente': return 'bg-red-500';
      case 'haute': return 'bg-orange-500';
      case 'normale': return 'bg-blue-500';
      case 'basse': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  // Statistiques calculées
  const stats = {
    total: demandes.length,
    en_attente: demandes.filter(d => d.statut === 'en_attente').length,
    approuvees: demandes.filter(d => d.statut === 'approuvee' || d.statut === 'en_preparation').length,
    livrees: demandes.filter(d => d.statut === 'livree').length,
    rejetees: demandes.filter(d => d.statut === 'rejetee').length,
    taux_approbation:
      demandes.length > 0
        ? Math.round(((demandes.filter(d => d.statut !== 'en_attente' && d.statut !== 'rejetee').length) / demandes.length) * 100)
        : 0,
  };

  const quickActions = [
    {
      title: language === 'fr' ? 'Nouvelle Demande' : language === 'en' ? 'New Request' : 'Yeni Talep',
      description: language === 'fr' ? 'Créer une demande de matériaux' : language === 'en' ? 'Create material request' : 'Malzeme talebi oluştur',
      icon: Plus,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      action: () => navigate('/catalogue'),
    },
    {
      title: language === 'fr' ? 'Catalogue' : language === 'en' ? 'Catalog' : 'Katalog',
      description: language === 'fr' ? 'Parcourir les matériaux' : language === 'en' ? 'Browse materials' : 'Malzemelere göz at',
      icon: Package,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      action: () => navigate('/catalogue'),
    },
    {
      title: language === 'fr' ? 'Mes Demandes' : language === 'en' ? 'My Requests' : 'Taleplerim',
      description: language === 'fr' ? 'Voir toutes mes demandes' : language === 'en' ? 'View all my requests' : 'Tüm taleplerimi gör',
      icon: ClipboardList,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      action: () => navigate('/mes-demandes'),
    },
    {
      title: language === 'fr' ? 'Mon Profil' : language === 'en' ? 'My Profile' : 'Profilim',
      description: language === 'fr' ? 'Gérer mon profil' : language === 'en' ? 'Manage my profile' : 'Profilimi yönet',
      icon: User,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      action: () => navigate('/profile'),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="hidden sm:block absolute top-0 right-0 w-32 sm:w-48 lg:w-64 h-32 sm:h-48 lg:h-64 bg-white/10 rounded-full -translate-y-16 sm:-translate-y-24 lg:-translate-y-32 translate-x-16 sm:translate-x-24 lg:translate-x-32" />
        <div className="hidden sm:block absolute bottom-0 left-0 w-24 sm:w-36 lg:w-48 h-24 sm:h-36 lg:h-48 bg-white/5 rounded-full translate-y-12 sm:translate-y-18 lg:translate-y-24 -translate-x-12 sm:-translate-x-18 lg:-translate-x-24" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3">
                {language === 'fr' ? 'Tableau de Bord' : language === 'en' ? 'Dashboard' : 'Kontrol Paneli'}
              </h1>
              <p className="text-lg sm:text-xl text-teal-100 mb-2">
                {language === 'fr' ? 'Chef de Chantier' : language === 'en' ? 'Site Manager' : 'Şantiye Şefi'}
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 text-sm sm:text-base text-teal-200">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="truncate">{user?.prenom} {user?.nom}</span>
                </div>
                {user?.nom_chantier && (
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="truncate">{user.nom_chantier}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-white/20 p-3 sm:p-4 rounded-xl sm:rounded-2xl backdrop-blur-sm">
              <Activity className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12" />
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <div className="bg-white/20 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center backdrop-blur-sm">
              <Target className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2" />
              <p className="text-lg sm:text-2xl font-bold">{stats.taux_approbation}%</p>
              <p className="text-xs sm:text-sm text-teal-100">{language === 'fr' ? 'Taux Succès' : language === 'en' ? 'Success Rate' : 'Başarı Oranı'}</p>
            </div>
            <div className="bg-white/20 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center backdrop-blur-sm">
              <ClipboardList className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2" />
              <p className="text-lg sm:text-2xl font-bold">{stats.total}</p>
              <p className="text-xs sm:text-sm text-teal-100">{language === 'fr' ? 'Total Demandes' : language === 'en' ? 'Total Requests' : 'Toplam Talep'}</p>
            </div>
            <div className="bg-white/20 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center backdrop-blur-sm">
              <Truck className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2" />
              <p className="text-lg sm:text-2xl font-bold">{stats.livrees}</p>
              <p className="text-xs sm:text-sm text-teal-100">{language === 'fr' ? 'Livrées' : language === 'en' ? 'Delivered' : 'Teslim Edildi'}</p>
            </div>
            <div className="bg-white/20 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center backdrop-blur-sm">
              <Award className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2" />
              <p className="text-lg sm:text-2xl font-bold">{stats.approuvees}</p>
              <p className="text-xs sm:text-sm text-teal-100">{language === 'fr' ? 'Approuvées' : language === 'en' ? 'Approved' : 'Onaylandı'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          {
            title: language === 'fr' ? 'Total Demandes' : language === 'en' ? 'Total Requests' : 'Toplam Talep',
            value: stats.total.toString(),
            change: language === 'fr' ? 'Toutes vos demandes' : language === 'en' ? 'All your requests' : 'Tüm talepleriniz',
            icon: ClipboardList,
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-50',
          },
          {
            title: language === 'fr' ? 'En Attente' : language === 'en' ? 'Pending' : 'Beklemede',
            value: stats.en_attente.toString(),
            change: language === 'fr' ? 'À valider' : language === 'en' ? 'To validate' : 'Onaylanacak',
            icon: Clock,
            color: 'from-yellow-500 to-yellow-600',
            bgColor: 'bg-yellow-50',
          },
          {
            title: language === 'fr' ? 'Approuvées' : language === 'en' ? 'Approved' : 'Onaylandı',
            value: stats.approuvees.toString(),
            change: language === 'fr' ? 'En cours/prêtes' : language === 'en' ? 'In progress/ready' : 'Devam eden/hazır',
            icon: CheckCircle,
            color: 'from-green-500 to-green-600',
            bgColor: 'bg-green-50',
          },
          {
            title: language === 'fr' ? 'Livrées' : language === 'en' ? 'Delivered' : 'Teslim Edildi',
            value: stats.livrees.toString(),
            change: language === 'fr' ? 'Terminées' : language === 'en' ? 'Completed' : 'Tamamlandı',
            icon: Truck,
            color: 'from-purple-500 to-purple-600',
            bgColor: 'bg-purple-50',
          },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-100 hover:scale-[1.02]"
          >
            <div className={`bg-gradient-to-r ${stat.color} p-4 sm:p-6 text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">{stat.value}</p>
                  <p className="text-white/90 font-medium text-sm sm:text-base">{stat.title}</p>
                </div>
                <div className="bg-white/20 p-2 sm:p-3 rounded-lg sm:rounded-xl">
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

      {/* Actions rapides */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
          <div className="mb-4 sm:mb-0">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1 sm:mb-2">
              {language === 'fr' ? 'Actions Rapides' : language === 'en' ? 'Quick Actions' : 'Hızlı İşlemler'}
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              {language === 'fr'
                ? 'Accès direct aux fonctionnalités principales'
                : language === 'en'
                ? 'Direct access to main features'
                : 'Ana özelliklere doğrudan erişim'}
            </p>
          </div>
          <div className="bg-orange-100 p-2 sm:p-3 rounded-lg sm:rounded-xl">
            <Star className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={action.action}
              className="group relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 hover:from-white hover:to-slate-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200 hover:border-slate-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-left"
            >
              <div
                className={`absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br ${action.color} opacity-10 rounded-full -translate-y-8 sm:-translate-y-10 translate-x-8 sm:translate-x-10 group-hover:scale-110 transition-transform duration-300`}
              />
              <div className="relative z-10">
                <div className={`bg-gradient-to-r ${action.color} p-2 sm:p-3 rounded-lg sm:rounded-xl w-fit mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <action.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1 sm:mb-2 group-hover:text-slate-800 text-sm sm:text-base">
                  {action.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 group-hover:text-slate-700 leading-relaxed">
                  {action.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Historique des commandes */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-100">
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-teal-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1 sm:mb-2">
                {language === 'fr' ? 'Historique de mes Commandes' : language === 'en' ? 'My Orders History' : 'Sipariş Geçmişim'}
              </h2>
              <p className="text-sm sm:text-base text-slate-600">
                {language === 'fr'
                  ? "Suivez l'état de toutes vos demandes de matériaux"
                  : language === 'en'
                  ? 'Track the status of all your material requests'
                  : 'Tüm malzeme taleplerinizin durumunu takip edin'}
              </p>
            </div>
            <div className="bg-blue-100 p-2 sm:p-3 rounded-lg sm:rounded-xl">
              <ClipboardList className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {error && (
            <div className="mb-4 sm:mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {demandes.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <ClipboardList className="w-12 h-12 sm:w-16 sm:h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-medium text-slate-900 mb-2">
                {language === 'fr' ? 'Aucune demande trouvée' : language === 'en' ? 'No requests found' : 'Talep bulunamadı'}
              </h3>
              <p className="text-sm sm:text-base text-slate-600 mb-4">
                {language === 'fr'
                  ? "Vous n'avez pas encore fait de demande de matériaux"
                  : language === 'en'
                  ? "You haven't made any material requests yet"
                  : 'Henüz malzeme talebi yapmadınız'}
              </p>
              <button
                onClick={() => navigate('/catalogue')}
                className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                {language === 'fr' ? 'Faire ma première demande' : language === 'en' ? 'Make my first request' : 'İlk talebimi yap'}
              </button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {demandes.map((demande) => (
                <div
                  key={demande.id}
                  className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-3 sm:mb-4">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-0">
                          {demande.numero_demande}
                        </h3>
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium border flex items-center space-x-1 ${getStatusColor(demande.statut)}`}>
                            {getStatusIcon(demande.statut)}
                            <span>{getStatusText(demande.statut)}</span>
                          </span>
                          <div className={`w-3 h-3 rounded-full ${getPriorityColor(demande.priorite)}`} title={demande.priorite} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm sm:text-base text-slate-600 mb-3 sm:mb-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <span>
                            {language === 'fr' ? 'Demandé le:' : language === 'en' ? 'Requested:' : 'Talep tarihi:'}{' '}
                            {new Date(demande.date_demande).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Truck className="w-4 h-4 text-slate-500" />
                          <span>
                            {language === 'fr' ? 'Livraison:' : language === 'en' ? 'Delivery:' : 'Teslimat:'}{' '}
                            {new Date(demande.date_livraison_souhaitee).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Package className="w-4 h-4 text-slate-500" />
                          <span>
                            {demande.nombre_items}{' '}
                            {language === 'fr' ? 'matériau(x)' : language === 'en' ? 'material(s)' : 'malzeme'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-2 sm:space-y-0 text-sm sm:text-base mb-3 sm:mb-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-600">
                            {language === 'fr' ? 'Demandé:' : language === 'en' ? 'Requested:' : 'İstenen:'}
                          </span>
                          <span className="font-bold text-blue-600">{demande.total_quantite_demandee}</span>
                        </div>
                        {demande.statut !== 'en_attente' && demande.statut !== 'rejetee' && (
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-600">
                              {language === 'fr' ? 'Accordé:' : language === 'en' ? 'Granted:' : 'Verilen:'}
                            </span>
                            <span className="font-bold text-green-600">{demande.total_quantite_accordee || 0}</span>
                          </div>
                        )}
                      </div>

                      {demande.commentaire_demandeur && (
                        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <MessageSquare className="w-4 h-4 text-blue-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-blue-700">
                                {language === 'fr' ? 'Mon commentaire:' : language === 'en' ? 'My comment:' : 'Yorumum:'}
                              </p>
                              <p className="text-sm text-blue-600">{demande.commentaire_demandeur}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {demande.commentaire_magazinier && (
                        <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                {language === 'fr'
                                  ? 'Réponse du magazinier:'
                                  : language === 'en'
                                  ? 'Warehouse response:'
                                  : 'Depo yanıtı:'}
                              </p>
                              <p className="text-sm text-gray-600">{demande.commentaire_magazinier}</p>
                              {demande.valideur_nom && demande.date_validation && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {language === 'fr' ? 'Par' : language === 'en' ? 'By' : 'Tarafından'} {demande.valideur_nom} -{' '}
                                  {new Date(demande.date_validation).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row lg:flex-col space-y-2 sm:space-y-0 sm:space-x-2 lg:space-x-0 lg:space-y-2">
                      <button
                        onClick={() => {
                          setSelectedDemande(demande);
                          setShowDetailsModal(true);
                        }}
                        className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1 sm:space-x-2 text-sm sm:text-base"
                      >
                        <Eye className="w-4 h-4" />
                        <span>{language === 'fr' ? 'Détails' : language === 'en' ? 'Details' : 'Detaylar'}</span>
                      </button>

                      {demande.statut === 'en_attente' && (
                        <div className="text-center">
                          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                            <Clock className="w-3 h-3" />
                            <span>{language === 'fr' ? 'En attente' : language === 'en' ? 'Pending' : 'Beklemede'}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                      <div className="text-xs sm:text-sm text-slate-500">
                        {language === 'fr' ? 'Créé le' : language === 'en' ? 'Created on' : 'Oluşturulma'}{' '}
                        {new Date(demande.date_demande).toLocaleDateString()}{' '}
                        {language === 'fr' ? 'à' : 'at'} {new Date(demande.date_demande).toLocaleTimeString()}
                      </div>

                      {demande.statut === 'livree' && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs sm:text-sm font-medium">
                            {language === 'fr' ? 'Commande terminée' : language === 'en' ? 'Order completed' : 'Sipariş tamamlandı'}
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
      </div>

      {stats.total > 0 && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <div className="flex items-center space-x-2 mb-2">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300" />
                <h3 className="text-lg sm:text-xl font-bold">
                  {stats.taux_approbation >= 80
                    ? language === 'fr'
                      ? 'Excellent Travail !'
                      : language === 'en'
                      ? 'Excellent Work!'
                      : 'Mükemmel İş!'
                    : language === 'fr'
                    ? 'Continuez vos efforts !'
                    : language === 'en'
                    ? 'Keep up the good work!'
                    : 'İyi çalışmaya devam edin!'}
                </h3>
              </div>
              <p className="text-sm sm:text-base text-emerald-100 leading-relaxed">
                {language === 'fr'
                  ? `Vous avez un taux d'approbation de ${stats.taux_approbation}% avec ${stats.total} demandes créées.`
                  : language === 'en'
                  ? `You have a ${stats.taux_approbation}% approval rate with ${stats.total} requests created.`
                  : `${stats.total} talep ile %${stats.taux_approbation} onay oranınız var.`}
              </p>
            </div>
            <div className="bg-white/20 p-3 sm:p-4 rounded-xl backdrop-blur-sm">
              <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
          </div>
        </div>
      )}

      {/* Modal détails */}
      {showDetailsModal && selectedDemande && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-xs sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-teal-50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  {language === 'fr' ? 'Détails de la Demande' : language === 'en' ? 'Request Details' : 'Talep Detayları'} - {selectedDemande.numero_demande}
                </h2>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedDemande(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
              <div className="mb-4 sm:mb-6 p-4 bg-gray-50 rounded-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm sm:text-base">
                  <div>
                    <strong>{language === 'fr' ? 'Statut:' : language === 'en' ? 'Status:' : 'Durum:'}</strong>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedDemande.statut)}`}>
                      {getStatusText(selectedDemande.statut)}
                    </span>
                  </div>
                  <div>
                    <strong>{language === 'fr' ? 'Priorité:' : language === 'en' ? 'Priority:' : 'Öncelik:'}</strong>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium text-white ${getPriorityColor(selectedDemande.priorite)}`}>
                      {selectedDemande.priorite.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <strong>{language === 'fr' ? 'Date de demande:' : language === 'en' ? 'Request date:' : 'Talep tarihi:'}</strong>{' '}
                    {new Date(selectedDemande.date_demande).toLocaleDateString()}
                  </div>
                  <div>
                    <strong>{language === 'fr' ? 'Livraison souhaitée:' : language === 'en' ? 'Desired delivery:' : 'İstenen teslimat:'}</strong>{' '}
                    {new Date(selectedDemande.date_livraison_souhaitee).toLocaleDateString()}
                  </div>
                  {selectedDemande.valideur_nom && (
                    <div className="sm:col-span-2">
                      <strong>{language === 'fr' ? 'Validé par:' : language === 'en' ? 'Validated by:' : 'Onaylayan:'}</strong>{' '}
                      {selectedDemande.valideur_nom} - {new Date(selectedDemande.date_validation).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              {selectedDemande.commentaire_demandeur && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <MessageSquare className="w-4 h-4 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-700">
                        {language === 'fr' ? 'Mon commentaire:' : language === 'en' ? 'My comment:' : 'Yorumum:'}
                      </p>
                      <p className="text-sm text-blue-600">{selectedDemande.commentaire_demandeur}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedDemande.commentaire_magazinier && (
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {language === 'fr' ? 'Réponse du magazinier:' : language === 'en' ? 'Warehouse response:' : 'Depo yanıtı:'}
                      </p>
                      <p className="text-sm text-gray-600">{selectedDemande.commentaire_magazinier}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-200 bg-slate-50">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedDemande(null);
                }}
                className="w-full bg-gray-100 text-gray-700 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:bg-gray-200 transition-colors text-sm sm:text-base"
              >
                {language === 'fr' ? 'Fermer' : language === 'en' ? 'Close' : 'Kapat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChefChantierDashboard;
