import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Calendar,
  MessageSquare,
  Truck,
  Eye,
  Plus,
  AlertTriangle,
  Filter,
  RefreshCw,
  User,
  Building2,
  Star,
  TrendingUp,
  Activity,
  X,
  ChevronDown,
  ChevronUp,
  Target,
  Award,
  Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Layout from '../components/Layout';
// URL de base de l'API : en dev => proxy Vite (/api), en prod => VITE_API_URL
const API_BASE = import.meta.env.VITE_API_URL ?? '/api';


interface DemandeItem {
  id: string;
  materiau_nom: string;
  code_produit: string;
  unite: string;
  quantite_demandee: number;
  quantite_accordee: number;
  categorie_nom: string;
  stock_actuel?: number; // rendu optionnel pour couvrir les deux cas
}

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
  demandeur_nom: string;
  demandeur_email: string;
  demandeur_telephone: string;
  demandeur_adresse: string;
  nom_chantier: string;
  nombre_items: number;
  total_quantite_demandee: number;
  total_quantite_accordee: number;
  items?: DemandeItem[];
}

const MyRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [, forceUpdate] = useState({});

  // États
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // ✅ corrige ReferenceError
  const [error, setError] = useState('');

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Détails
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Écouter les changements de langue
  useEffect(() => {
    const handleLanguageChange = () => {
      forceUpdate({});
    };
    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);

 const fetchDemandes = useCallback(async () => {
  try {
    setLoading(true);
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Session expirée');
      return;
    }

    const response = await fetch(`${API_BASE}/demandes`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des demandes');
    }

    const data = await response.json();

    if (data.success) {
      setDemandes(data.demandes || []);
    } else {
      throw new Error(data.message || 'Erreur lors de la récupération des demandes');
    }
  } catch (err) {
    console.error('Erreur lors du chargement des demandes:', err);
    setError(err instanceof Error ? err.message : 'Erreur de connexion');
  } finally {
    setLoading(false);
  }
}, []); // API_BASE est constant (défini au module)

// ...
useEffect(() => {
  fetchDemandes();
}, [fetchDemandes]);

const fetchDemandeDetails = async (demandeId: string) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Session expirée');
      return;
    }

    const response = await fetch(`${API_BASE}/demandes/${demandeId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des détails');
    }

    const data = await response.json();

    if (data.success) {
      setSelectedDemande(data.demande);
      setShowDetailsModal(true);
    } else {
      throw new Error(data.message || 'Erreur lors de la récupération des détails');
    }
  } catch (err) {
    console.error('Erreur lors du chargement des détails:', err);
    alert(err instanceof Error ? err.message : 'Erreur de connexion');
  }
};


  // Filtrer les demandes
  const demandesFiltrees = demandes.filter((demande) => {
    const matchesSearch =
      !searchTerm ||
      demande.numero_demande.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (demande.demandeur_nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (demande.nom_chantier || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || demande.statut === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || demande.priorite === selectedPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleRefresh = async () => {
    setRefreshing(true); // ✅ existe maintenant
    await fetchDemandes();
    setRefreshing(false);
  };

  const getStatusText = (statut: string) => {
    switch (statut) {
      case 'en_attente':
        return language === 'fr'
          ? 'En attente de validation'
          : language === 'en'
          ? 'Pending validation'
          : 'Onay bekliyor';
      case 'approuvee':
        return language === 'fr'
          ? 'Approuvée - En attente de traitement'
          : language === 'en'
          ? 'Approved - Awaiting processing'
          : 'Onaylandı - İşlem bekliyor';
      case 'rejetee':
        return language === 'fr' ? 'Rejetée' : language === 'en' ? 'Rejected' : 'Reddedildi';
      case 'en_preparation':
        return language === 'fr' ? 'En cours de préparation' : language === 'en' ? 'Being prepared' : 'Hazırlanıyor';
      case 'livree':
        return language === 'fr' ? 'Livrée' : language === 'en' ? 'Delivered' : 'Teslim edildi';
      default:
        return statut;
    }
  };

  const getPriorityText = (priorite: string) => {
    switch (priorite) {
      case 'urgente':
        return language === 'fr' ? 'URGENT' : language === 'en' ? 'URGENT' : 'ACİL';
      case 'haute':
        return language === 'fr' ? 'HAUTE' : language === 'en' ? 'HIGH' : 'YÜKSEK';
      case 'normale':
        return language === 'fr' ? 'NORMALE' : language === 'en' ? 'NORMAL' : 'NORMAL';
      case 'basse':
        return language === 'fr' ? 'BASSE' : language === 'en' ? 'LOW' : 'DÜŞÜK';
      default:
        return priorite.toUpperCase();
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return language === 'fr'
        ? `Il y a ${diffInMinutes} min`
        : language === 'en'
        ? `${diffInMinutes} min ago`
        : `${diffInMinutes} dk önce`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return language === 'fr' ? `Il y a ${hours}h` : language === 'en' ? `${hours}h ago` : `${hours}s önce`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return language === 'fr' ? `Il y a ${days}j` : language === 'en' ? `${days}d ago` : `${days}g önce`;
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'en_attente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approuvee':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejetee':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'en_preparation':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'livree':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'en_attente':
        return <Clock className="w-3 h-3" />;
      case 'approuvee':
        return <CheckCircle className="w-3 h-3" />;
      case 'rejetee':
        return <XCircle className="w-3 h-3" />;
      case 'en_preparation':
        return <Package className="w-3 h-3" />;
      case 'livree':
        return <Truck className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getPriorityColor = (priorite: string) => {
    switch (priorite) {
      case 'urgente':
        return 'bg-red-500';
      case 'haute':
        return 'bg-orange-500';
      case 'normale':
        return 'bg-blue-500';
      case 'basse':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityIcon = (priorite: string) => {
    switch (priorite) {
      case 'urgente':
        return <AlertTriangle className="w-3 h-3" />;
      case 'haute':
        return <TrendingUp className="w-3 h-3" />;
      case 'normale':
        return <Target className="w-3 h-3" />;
      case 'basse':
        return <Activity className="w-3 h-3" />;
      default:
        return <Target className="w-3 h-3" />;
    }
  };

  // Statistiques
  const stats = {
    total: demandes.length,
    en_attente: demandes.filter((d) => d.statut === 'en_attente').length,
    approuvees: demandes.filter((d) => d.statut === 'approuvee' || d.statut === 'en_preparation').length,
    livrees: demandes.filter((d) => d.statut === 'livree').length,
    rejetees: demandes.filter((d) => d.statut === 'rejetee').length,
    urgentes: demandes.filter((d) => d.priorite === 'urgente').length
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-3 sm:space-y-6 p-2 sm:p-4 lg:p-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white relative overflow-hidden">
          <div className="hidden sm:block absolute top-0 right-0 w-32 sm:w-48 lg:w-64 h-32 sm:h-48 lg:h-64 bg-white bg-opacity-10 rounded-full -translate-y-16 sm:-translate-y-24 lg:-translate-y-32 translate-x-16 sm:translate-x-24 lg:translate-x-32"></div>

          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
                  {language === 'fr' ? 'Mes Demandes' : language === 'en' ? 'My Requests' : 'Taleplerim'}
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-teal-100 mb-3 sm:mb-4">
                  {language === 'fr'
                    ? "Suivez l'état de vos demandes de matériaux"
                    : language === 'en'
                    ? 'Track the status of your material requests'
                    : 'Malzeme taleplerinizin durumunu takip edin'}
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-sm sm:text-base text-teal-200">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span className="truncate">
                      {user?.prenom} {user?.nom}
                    </span>
                  </div>
                  {user?.nom_chantier && (
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4" />
                      <span className="truncate">{user.nom_chantier}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="bg-white bg-opacity-20 text-white px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center space-x-2 backdrop-blur-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="text-sm sm:text-base">
                    {refreshing
                      ? language === 'fr'
                        ? 'Actualisation...'
                        : language === 'en'
                        ? 'Refreshing...'
                        : 'Yenileniyor...'
                      : language === 'fr'
                      ? 'Actualiser'
                      : language === 'en'
                      ? 'Refresh'
                      : 'Yenile'}
                  </span>
                </button>

                <button
                  onClick={() => navigate('/catalogue')}
                  className="bg-white bg-opacity-20 text-white px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center space-x-2 backdrop-blur-sm"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">
                    {language === 'fr' ? 'Nouvelle Demande' : language === 'en' ? 'New Request' : 'Yeni Talep'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              label: language === 'fr' ? 'Total' : language === 'en' ? 'Total' : 'Toplam',
              value: stats.total,
              color: 'from-blue-500 to-blue-600',
              icon: ClipboardList
            },
            {
              label: language === 'fr' ? 'En Attente' : language === 'en' ? 'Pending' : 'Beklemede',
              value: stats.en_attente,
              color: 'from-yellow-500 to-yellow-600',
              icon: Clock
            },
            {
              label: language === 'fr' ? 'Approuvées' : language === 'en' ? 'Approved' : 'Onaylandı',
              value: stats.approuvees,
              color: 'from-green-500 to-green-600',
              icon: CheckCircle
            },
            {
              label: language === 'fr' ? 'Livrées' : language === 'en' ? 'Delivered' : 'Teslim Edildi',
              value: stats.livrees,
              color: 'from-purple-500 to-purple-600',
              icon: Truck
            }
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-100 hover:scale-105"
            >
              <div className={`bg-gradient-to-r ${stat.color} p-3 sm:p-4 lg:p-6 text-white`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1">{stat.value}</p>
                    <p className="text-white text-opacity-90 font-medium text-xs sm:text-sm lg:text-base">{stat.label}</p>
                  </div>
                  <div className="bg-white bg-opacity-20 p-2 sm:p-3 rounded-lg">
                    <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-100">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="bg-white bg-opacity-20 text-white p-2 sm:p-3 rounded-lg sm:rounded-xl hover:bg-opacity-30 transition-all duration-200 backdrop-blur-sm disabled:opacity-50"
                  title="Rafraîchir"
                >
                  <RefreshCw className={`w-5 h-5 sm:w-6 sm:h-6 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                <Filter className="w-5 h-5 text-slate-600" />
                <span className="font-medium text-slate-900 text-sm sm:text-base">
                  {language === 'fr' ? 'Filtres' : language === 'en' ? 'Filters' : 'Filtreler'}
                </span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  {demandesFiltrees.length}
                </span>
              </div>
              <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden text-slate-600 hover:text-slate-800 p-1">
                {showFilters ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className={`${showFilters ? 'block' : 'hidden'} lg:block p-4 space-y-3 sm:space-y-4`}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  language === 'fr'
                    ? 'Rechercher par numéro ou chantier...'
                    : language === 'en'
                    ? 'Search by number or site...'
                    : 'Numara veya şantiyeye göre ara...'
                }
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-slate-50 focus:bg-white transition-all duration-200 text-sm sm:text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-slate-50 focus:bg-white transition-all duration-200 text-sm sm:text-base"
              >
                <option value="all">{language === 'fr' ? 'Tous les statuts' : language === 'en' ? 'All statuses' : 'Tüm durumlar'}</option>
                <option value="en_attente">{language === 'fr' ? 'En attente' : language === 'en' ? 'Pending' : 'Beklemede'}</option>
                <option value="approuvee">{language === 'fr' ? 'Approuvée' : language === 'en' ? 'Approved' : 'Onaylandı'}</option>
                <option value="en_preparation">{language === 'fr' ? 'En préparation' : language === 'en' ? 'In preparation' : 'Hazırlanıyor'}</option>
                <option value="livree">{language === 'fr' ? 'Livrée' : language === 'en' ? 'Delivered' : 'Teslim edildi'}</option>
                <option value="rejetee">{language === 'fr' ? 'Rejetée' : language === 'en' ? 'Rejected' : 'Reddedildi'}</option>
              </select>

              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-slate-50 focus:bg-white transition-all duration-200 text-sm sm:text-base"
              >
                <option value="all">{language === 'fr' ? 'Toutes priorités' : language === 'en' ? 'All priorities' : 'Tüm öncelikler'}</option>
                <option value="urgente">{language === 'fr' ? 'Urgente' : language === 'en' ? 'Urgent' : 'Acil'}</option>
                <option value="haute">{language === 'fr' ? 'Haute' : language === 'en' ? 'High' : 'Yüksek'}</option>
                <option value="normale">{language === 'fr' ? 'Normale' : language === 'en' ? 'Normal' : 'Normal'}</option>
                <option value="basse">{language === 'fr' ? 'Basse' : language === 'en' ? 'Low' : 'Düşük'}</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm sm:text-base">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Liste */}
        <div className="space-y-3 sm:space-y-4">
          {demandesFiltrees.map((demande) => (
            <div
              key={demande.id}
              className="bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden"
            >
              {demande.priorite === 'urgente' && (
                <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <Zap className="w-4 h-4 animate-pulse" />
                    <span className="font-bold text-sm sm:text-base">🚨 URGENT 🚨</span>
                    <Zap className="w-4 h-4 animate-pulse" />
                  </div>
                </div>
              )}

              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-2 sm:mb-3">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{demande.numero_demande}</h3>
                      <div className="flex items-center space-x-2 mt-1 sm:mt-0">
                        <span
                          className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border flex items-center space-x-1 ${getStatusColor(
                            demande.statut
                          )}`}
                        >
                          {getStatusIcon(demande.statut)}
                          <span className="hidden sm:inline">{getStatusText(demande.statut)}</span>
                          <span className="sm:hidden">
                            {demande.statut === 'en_attente'
                              ? 'Attente'
                              :
                              demande.statut === 'approuvee'
                              ? 'OK'
                              :
                              demande.statut === 'rejetee'
                              ? 'Rejetée'
                              :
                              demande.statut === 'en_preparation'
                              ? 'Prép.'
                              : 'Livrée'}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm text-slate-600 mb-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span>
                          {language === 'fr' ? 'Créé:' : language === 'en' ? 'Created:' : 'Oluşturulma:'}{' '}
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
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500">
                          {language === 'fr' ? 'Qté:' : language === 'en' ? 'Qty:' : 'Miktar:'}
                        </span>
                        <span className="font-bold text-blue-600">{demande.total_quantite_demandee}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <div
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold text-white ${getPriorityColor(
                        demande.priorite
                      )}`}
                    >
                      {getPriorityIcon(demande.priorite)}
                      <span className="ml-1">{getPriorityText(demande.priorite)}</span>
                    </div>
                    <span className="text-xs text-slate-500">{formatTimeAgo(demande.date_demande)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3 sm:mb-4 p-3 bg-slate-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-xs text-slate-600">
                      {language === 'fr' ? 'Demandé' : language === 'en' ? 'Requested' : 'İstenen'}
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-blue-600">{demande.total_quantite_demandee}</p>
                  </div>

                  {demande.statut !== 'en_attente' && demande.statut !== 'rejetee' && (
                    <>
                      <div className="w-8 h-0.5 bg-slate-300"></div>
                      <div className="text-center">
                        <p className="text-xs text-slate-600">
                          {language === 'fr' ? 'Accordé' : language === 'en' ? 'Granted' : 'Verilen'}
                        </p>
                        <p className="text-lg sm:text-xl font-bold text-green-600">
                          {demande.total_quantite_accordee || 0}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {demande.commentaire_demandeur && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <MessageSquare className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1">
                          {language === 'fr' ? 'Mon commentaire:' : language === 'en' ? 'My comment:' : 'Yorumum:'}
                        </p>
                        <p className="text-xs sm:text-sm text-blue-600 leading-relaxed">
                          {demande.commentaire_demandeur}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {demande.commentaire_magazinier && (
                  <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">
                          {language === 'fr' ? 'Réponse du magazinier:' : language === 'en' ? 'Warehouse response:' : 'Depo yanıtı:'}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                          {demande.commentaire_magazinier}
                        </p>
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

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={() => fetchDemandeDetails(demande.id)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg text-sm sm:text-base"
                  >
                    <Eye className="w-4 h-4" />
                    <span>{language === 'fr' ? 'Voir Détails' : language === 'en' ? 'View Details' : 'Detayları Gör'}</span>
                  </button>

                  <button
                    onClick={() => setExpandedCard(expandedCard === demande.id ? null : demande.id)}
                    className="sm:hidden bg-slate-600 text-white py-3 px-4 rounded-xl hover:bg-slate-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    {expandedCard === demande.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    <span className="text-sm">
                      {expandedCard === demande.id
                        ? language === 'fr'
                          ? 'Réduire'
                          : language === 'en'
                          ? 'Collapse'
                          : 'Daralt'
                        : language === 'fr'
                        ? 'Étendre'
                        : language === 'en'
                        ? 'Expand'
                        : 'Genişlet'}
                    </span>
                  </button>
                </div>

                {(expandedCard === demande.id || typeof window !== 'undefined' && window.innerWidth >= 640) && (
                  <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-600">
                          {language === 'fr' ? 'Demandeur:' : language === 'en' ? 'Requester:' : 'Talep eden:'}{' '}
                          <span className="font-medium text-slate-900 ml-1">{demande.demandeur_nom}</span>
                        </span>
                      </div>

                      {demande.depot_nom && (
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-600">
                            {language === 'fr' ? 'Dépôt:' : language === 'en' ? 'Depot:' : 'Depo:'}{' '}
                            <span className="font-medium text-slate-900 ml-1">{demande.depot_nom}</span>
                          </span>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-600">
                          {language === 'fr' ? 'Créé:' : language === 'en' ? 'Created:' : 'Oluşturulma:'}{' '}
                          <span className="font-medium text-slate-900 ml-1">{new Date(demande.date_demande).toLocaleDateString()}</span>
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Truck className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-600">
                          {language === 'fr' ? 'Livraison:' : language === 'en' ? 'Delivery:' : 'Teslimat:'}{' '}
                          <span className="font-medium text-slate-900 ml-1">
                            {new Date(demande.date_livraison_souhaitee).toLocaleDateString()}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          demande.statut === 'livree'
                            ? 'bg-green-500'
                            : demande.statut === 'en_preparation'
                            ? 'bg-blue-500'
                            : demande.statut === 'approuvee'
                            ? 'bg-yellow-500'
                            : demande.statut === 'rejetee'
                            ? 'bg-red-500'
                            : 'bg-gray-400'
                        }`}
                        style={{
                          width:
                            demande.statut === 'livree'
                              ? '100%'
                              : demande.statut === 'en_preparation'
                              ? '75%'
                              : demande.statut === 'approuvee'
                              ? '50%'
                              : demande.statut === 'rejetee'
                              ? '25%'
                              : '25%'
                        }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{language === 'fr' ? 'Progression' : language === 'en' ? 'Progress' : 'İlerleme'}</span>
                      <span>
                        {demande.statut === 'livree'
                          ? '100%'
                          : demande.statut === 'en_preparation'
                          ? '75%'
                          : demande.statut === 'approuvee'
                          ? '50%'
                          : '25%'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {demandesFiltrees.length === 0 && !loading && (
          <div className="text-center py-8 sm:py-12">
            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-slate-100">
              <ClipboardList className="w-12 h-12 sm:w-16 sm:h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-medium text-slate-900 mb-2">
                {language === 'fr' ? 'Aucune demande trouvée' : language === 'en' ? 'No requests found' : 'Talep bulunamadı'}
              </h3>
              <p className="text-sm sm:text-base text-slate-600 mb-4">
                {searchTerm || selectedStatus !== 'all' || selectedPriority !== 'all'
                  ? language === 'fr'
                    ? 'Aucune demande ne correspond à vos critères'
                    : language === 'en'
                    ? 'No requests match your criteria'
                    : 'Kriterlerinize uygun talep yok'
                  : language === 'fr'
                  ? "Vous n'avez pas encore fait de demande"
                  : language === 'en'
                  ? "You haven't made any requests yet"
                  : 'Henüz talep yapmadınız'}
              </p>
              {!searchTerm && selectedStatus === 'all' && selectedPriority === 'all' && (
                <button
                  onClick={() => navigate('/catalogue')}
                  className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-teal-700 transition-all duration-200 flex items-center justify-center space-x-2 mx-auto shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  <span>
                    {language === 'fr'
                      ? 'Faire ma première demande'
                      : language === 'en'
                      ? 'Make my first request'
                      : 'İlk talebimi yap'}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Section encouragement */}
        {stats.total > 0 && (
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <div className="flex items-center space-x-2 mb-2">
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300" />
                  <h3 className="text-lg sm:text-xl font-bold">
                    {stats.total >= 10
                      ? language === 'fr'
                        ? 'Utilisateur Expérimenté !'
                        : language === 'en'
                        ? 'Experienced User!'
                        : 'Deneyimli Kullanıcı!'
                      : language === 'fr'
                      ? 'Bon Travail !'
                      : language === 'en'
                      ? 'Good Work!'
                      : 'İyi İş!'}
                  </h3>
                </div>
                <p className="text-sm sm:text-base text-emerald-100 leading-relaxed">
                  {language === 'fr'
                    ? `Vous avez créé ${stats.total} demande(s) avec ${stats.livrees} livraison(s) réussie(s).`
                    : language === 'en'
                    ? `You have created ${stats.total} request(s) with ${stats.livrees} successful delivery(ies).`
                    : `${stats.total} talep oluşturdunuz, ${stats.livrees} başarılı teslimat.`}
                </p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 sm:p-4 rounded-xl backdrop-blur-sm">
                <Award className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showDetailsModal && selectedDemande && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-sm sm:max-w-2xl lg:max-w-4xl max-h-[95vh] overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-teal-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                    {language === 'fr' ? 'Détails de la Demande' : language === 'en' ? 'Request Details' : 'Talep Detayları'}
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 truncate">{selectedDemande.numero_demande}</p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedDemande(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1 ml-2"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="font-semibold text-slate-900 mb-3 text-sm sm:text-base">
                    {language === 'fr' ? 'Informations' : language === 'en' ? 'Information' : 'Bilgiler'}
                  </h4>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">
                        {language === 'fr' ? 'Statut:' : language === 'en' ? 'Status:' : 'Durum:'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedDemande.statut)}`}>
                        {getStatusText(selectedDemande.statut)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">
                        {language === 'fr' ? 'Priorité:' : language === 'en' ? 'Priority:' : 'Öncelik:'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold text-white ${getPriorityColor(selectedDemande.priorite)}`}>
                        {getPriorityText(selectedDemande.priorite)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">
                        {language === 'fr' ? 'Matériaux:' : language === 'en' ? 'Materials:' : 'Malzemeler:'}
                      </span>
                      <span className="font-medium text-slate-900">{selectedDemande.nombre_items}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="font-semibold text-slate-900 mb-3 text-sm sm:text-base">
                    {language === 'fr' ? 'Dates' : language === 'en' ? 'Dates' : 'Tarihler'}
                  </h4>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div>
                      <span className="text-slate-600">
                        {language === 'fr' ? 'Demande:' : language === 'en' ? 'Request:' : 'Talep:'}
                      </span>
                      <p className="font-medium text-slate-900">{new Date(selectedDemande.date_demande).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">
                        {language === 'fr' ? 'Livraison souhaitée:' : language === 'en' ? 'Desired delivery:' : 'İstenen teslimat:'}
                      </span>
                      <p className="font-medium text-slate-900">
                        {new Date(selectedDemande.date_livraison_souhaitee).toLocaleDateString()}
                      </p>
                    </div>
                    {selectedDemande.date_validation && (
                      <div>
                        <span className="text-slate-600">
                          {language === 'fr' ? 'Validation:' : language === 'en' ? 'Validation:' : 'Onay:'}
                        </span>
                        <p className="font-medium text-slate-900">
                          {new Date(selectedDemande.date_validation).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-4 mb-4 sm:mb-6">
                <h4 className="font-semibold text-slate-900 mb-3 text-sm sm:text-base">
                  {language === 'fr' ? 'Quantités' : language === 'en' ? 'Quantities' : 'Miktarlar'}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-slate-600 mb-1">
                      {language === 'fr' ? 'Total Demandé' : language === 'en' ? 'Total Requested' : 'Toplam İstenen'}
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600">
                      {selectedDemande.total_quantite_demandee || 0}
                    </p>
                  </div>
                  {(selectedDemande.statut === 'approuvee' ||
                    selectedDemande.statut === 'en_preparation' ||
                    selectedDemande.statut === 'livree') && (
                    <div className="text-center">
                      <p className="text-xs text-slate-600 mb-1">
                        {language === 'fr' ? 'Total Accordé' : language === 'en' ? 'Total Granted' : 'Toplam Verilen'}
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-green-600">
                        {selectedDemande.total_quantite_accordee || 0}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {selectedDemande.items && selectedDemande.items.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                    {language === 'fr' ? 'Matériaux Demandés' : language === 'en' ? 'Requested Materials' : 'İstenen Malzemeler'}
                  </h4>
                  <div className="space-y-2 sm:space-y-3">
                    {selectedDemande.items.map((item, index) => (
                      <div key={index} className="bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900 text-sm sm:text-base">{item.materiau_nom}</p>
                            <p className="text-xs sm:text-sm text-slate-600">{item.code_produit}</p>
                            {item.categorie_nom && (
                              <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {item.categorie_nom}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0">
                              <div>
                                <p className="text-xs text-slate-600">
                                  {language === 'fr' ? 'Demandé' : language === 'en' ? 'Requested' : 'İstenen'}
                                </p>
                                <p className="font-bold text-blue-600 text-sm sm:text-base">
                                  {item.quantite_demandee} {item.unite}
                                </p>
                              </div>
                              {(selectedDemande.statut === 'approuvee' ||
                                selectedDemande.statut === 'en_preparation' ||
                                selectedDemande.statut === 'livree') && (
                                <div>
                                  <p className="text-xs text-slate-600">
                                    {language === 'fr' ? 'Accordé' : language === 'en' ? 'Granted' : 'Verilen'}
                                  </p>
                                  <p className="font-bold text-green-600 text-sm sm:text-base">
                                    {item.quantite_accordee || 0} {item.unite}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDemande.commentaire_demandeur && (
                <div className="mb-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start space-x-2">
                    <MessageSquare className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-700 mb-1">
                        {language === 'fr' ? 'Mon commentaire:' : language === 'en' ? 'My comment:' : 'Yorumum:'}
                      </p>
                      <p className="text-sm text-blue-600 leading-relaxed">{selectedDemande.commentaire_demandeur}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedDemande.commentaire_magazinier && (
                <div className="mb-4 p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="flex items-start space-x-2">
                    <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        {language === 'fr' ? 'Réponse du magazinier:' : language === 'en' ? 'Warehouse response:' : 'Depo yanıtı:'}
                      </p>
                      <p className="text-sm text-gray-600 leading-relaxed">{selectedDemande.commentaire_magazinier}</p>
                      {selectedDemande.valideur_nom && selectedDemande.date_validation && (
                        <p className="text-xs text-gray-500 mt-2">
                          {language === 'fr' ? 'Par' : language === 'en' ? 'By' : 'Tarafından'} {selectedDemande.valideur_nom} -{' '}
                          {new Date(selectedDemande.date_validation).toLocaleDateString()}
                        </p>
                      )}
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
                className="w-full bg-gradient-to-r from-slate-600 to-slate-700 text-white py-3 px-4 rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
              >
                <X className="w-4 h-4" />
                <span>{language === 'fr' ? 'Fermer' : language === 'en' ? 'Close' : 'Kapat'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default MyRequestsPage;
