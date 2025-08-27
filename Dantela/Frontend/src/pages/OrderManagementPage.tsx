import React, { useState, useEffect } from 'react';
import {
  Package as PackageIcon,
  Search as SearchIcon,
  Filter as FilterIcon,
  Eye as EyeIcon,
  CheckCircle as CheckIcon,
  Clock as ClockIcon,
  AlertTriangle as AlertIcon,
  User as UserIcon,
  Calendar as CalendarIcon,
  MessageSquare as MessageIcon,
  Truck as TruckIcon,
  FileText as FileIcon,
  X as XIcon,
  XCircle as XCircleIcon,
  Trash2 as TrashIcon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

//const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
// En dev (Vite) -> /api via proxy
// En prod (Vercel) -> VITE_API_BASE_URL doit être défini = https://dantela.onrender.com/api
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

interface DemandeItem {
  id: string;
  materiau_nom: string;
  code_produit: string;
  unite: string;
  quantite_demandee: number;
  quantite_accordee: number;
  stock_actuel: number;
  categorie_nom: string;
}

const OrderManagementPage: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [, forceUpdate] = useState({});

  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');

  // Modals
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null);
  const [deleteForm, setDeleteForm] = useState({ motif: '' });
  const [validationForm, setValidationForm] = useState({
    action: 'approve' as 'approve' | 'reject',
    commentaire: '',
    items: [] as any[],
  });
  const [submitting, setSubmitting] = useState(false);

  // Re-rendu quand la langue change
  useEffect(() => {
    const handleLanguageChange = () => forceUpdate({});
    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);

  useEffect(() => {
    fetchDemandes();
  }, []);

  const authHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    };
  };
// Base URL déjà définie plus haut :
// const API = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');

const fetchDemandes = async () => {
  try {
    setLoading(true);
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Session expirée. Veuillez vous reconnecter.');
      return;
    }

    const res = await fetch(`${API}/api/demandes`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });

    if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);

    const data = await res.json();
    if (data.success) {
      setDemandes(data.demandes || []);
    } else {
      throw new Error(data.message || 'Erreur lors du chargement des demandes');
    }
  } catch (err) {
    console.error('❌ Erreur lors du chargement des demandes:', err);
    setError(err instanceof Error ? err.message : 'Erreur de connexion au serveur');
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchDemandes();
}, []);


const fetchDemandeDetails = async (demandeId: string) => {
  try {
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Session expirée');
      return;
    }

    console.log('📋 Récupération détails demande:', demandeId);

    const response = await fetch(`${API}/demandes/${demandeId}`, {
      headers: authHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.demande) {
      setSelectedDemande(data.demande);
      setValidationForm({
        action: 'approve',
        commentaire: '',
        items: (data.demande.items || []).map((item: any) => ({
          id: item.id,
          materiau_nom: item.materiau_nom,
          code_produit: item.code_produit,
          unite: item.unite,
          quantite_demandee: item.quantite_demandee,
          quantite_accordee: item.quantite_demandee,
          stock_actuel: item.stock_actuel,
        })),
      });
      console.log('✅ Détails demande récupérés:', {
        numero: data.demande.numero_demande,
        items: data.demande.items?.length || 0,
      });
      setShowValidationModal(true);
    } else {
      throw new Error(data.message || 'Demande non trouvée');
    }
  } catch (err) {
    console.error('❌ Erreur récupération détails:', err);
    setError(err instanceof Error ? err.message : 'Erreur de connexion');
  }
};


  /**
   * Ouvre le PDF du bon de livraison dans un nouvel onglet.
   * Essaie d'abord /api/bons/:id/pdf puis /api/bon-livraison/:id/pdf (fallback).
   */
  const openBonLivraisonPdf = async (bonId: string) => {
  const token = localStorage.getItem('token') || '';
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

  const tryOpen = async (path: string) => {
    const res = await fetch(`${API}${path}`, { headers, credentials: 'include' });
    if (!res.ok) return false;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    return true;
  };

  // Route principale attendue côté backend
  if (await tryOpen(`/bons-livraison/${bonId}/pdf`)) return;

  // Fallbacks éventuels si tu as d’autres alias côté API
  if (await tryOpen(`/bons/${bonId}/pdf`)) return;
  if (await tryOpen(`/bon-livraison/${bonId}/pdf`)) return;

  setError("Impossible d'ouvrir le bon de livraison (PDF introuvable). Vérifiez la route côté API.");
};

  // Générer le bon
const handleProcessOrder = async (demandeId: string) => {
  try {
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Session expirée');
      return;
    }

    console.log('📦 Traitement commande:', demandeId);

    const response = await fetch(`${API}/demandes/${demandeId}/process`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ commentaire: 'Bon de livraison généré automatiquement' }),
    });

    if (!response.ok) {
      const txt = await response.text().catch(() => '');
      throw new Error(`Erreur HTTP: ${response.status} ${txt}`);
    }

    const data = await response.json();

    if (data.success && data.bon_livraison) {
      const bonId = data.bon_livraison.id;
      const numeroBon = data.bon_livraison.numero_bon;

      console.log('✅ Bon généré avec succès:', { id: bonId, numero_bon: numeroBon, response_data: data.bon_livraison });
      alert(`✅ Bon de livraison ${numeroBon} généré avec succès !`);

      await openBonLivraisonPdf(bonId); // ouvre le PDF

      fetchDemandes();
    } else {
      throw new Error(data.message || 'Erreur lors de la génération du bon');
    }
  } catch (err) {
    console.error('❌ Erreur traitement commande:', err);
    alert(`❌ ${err instanceof Error ? err.message : 'Erreur lors du traitement'}`);
  }
};

// Valider
const handleValidation = async () => {
  if (!selectedDemande) return;

  try {
    setSubmitting(true);
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Session expirée');
      return;
    }

    console.log('✅ Validation demande:', selectedDemande.numero_demande, 'Action:', validationForm.action);

    const response = await fetch(`${API}/demandes/${selectedDemande.id}/validate`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({
        statut: validationForm.action === 'approve' ? 'approuvee' : 'rejetee',
        commentaire_magazinier: validationForm.commentaire,
        items_accordes: validationForm.action === 'approve' ? validationForm.items : [],
      }),
    });

    if (!response.ok) {
      const txt = await response.text().catch(() => '');
      throw new Error(`Erreur HTTP: ${response.status} ${txt}`);
    }

    const data = await response.json();

    if (data.success) {
      alert(`✅ ${data.message}`);
      console.log('✅ Validation réussie:', data.demande?.numero_demande);
      setShowValidationModal(false);
      setSelectedDemande(null);
      fetchDemandes();
    } else {
      throw new Error(data.message || 'Erreur lors de la validation');
    }
  } catch (err) {
    console.error('❌ Erreur validation:', err);
    alert(`❌ ${err instanceof Error ? err.message : 'Erreur lors de la validation'}`);
  } finally {
    setSubmitting(false);
  }
};

// Supprimer
const handleDeleteOrder = async () => {
  if (!selectedDemande) return;

  try {
    setSubmitting(true);
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Session expirée');
      return;
    }

    console.log('🗑️ Suppression demande:', selectedDemande.numero_demande);

    const response = await fetch(`${API}/demandes/${selectedDemande.id}`, {
      method: 'DELETE',
      headers: authHeaders(),
      body: JSON.stringify({
        motif: deleteForm.motif || 'Suppression par magazinier',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Erreur lors de la suppression');
    }

    const data = await response.json();

    if (data.success) {
      alert(`✅ ${data.message}`);
      console.log('✅ Suppression réussie:', {
        numero_demande: selectedDemande.numero_demande,
        items_sauvegardés: data.items_count,
        historique: data.history_saved,
      });

      setShowDeleteModal(false);
      setSelectedDemande(null);
      setDeleteForm({ motif: '' });
      fetchDemandes();
    } else {
      throw new Error(data.message || 'Erreur lors de la suppression');
    }
  } catch (err) {
    console.error('❌ Erreur suppression:', err);
    alert(`❌ ${err instanceof Error ? err.message : 'Erreur lors de la suppression'}`);
  } finally {
    setSubmitting(false);
  }
};

  // Filtrer les demandes
  const demandesFiltrees = demandes.filter((demande) => {
    const matchSearch =
      demande.numero_demande.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demande.demandeur_nom.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = selectedStatus === 'all' || demande.statut === selectedStatus;
    const matchPriority = selectedPriority === 'all' || demande.priorite === selectedPriority;

    return matchSearch && matchStatus && matchPriority;
  });

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'en_attente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approuvee':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejetee':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'en_preparation':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'livree':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'en_attente':
        return <ClockIcon className="w-4 h-4" />;
      case 'approuvee':
        return <CheckIcon className="w-4 h-4" />;
      case 'rejetee':
        return <XCircleIcon className="w-4 h-4" />;
      case 'en_preparation':
        return <PackageIcon className="w-4 h-4" />;
      case 'livree':
        return <TruckIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
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

  const getStatusText = (statut: string) => {
    switch (statut) {
      case 'en_attente':
        return language === 'fr'
          ? 'En attente de validation'
          : language === 'en'
          ? 'Pending validation'
          : 'Onay bekliyor';
      case 'approuvee':
        return language === 'fr' ? 'Approuvée' : language === 'en' ? 'Approved' : 'Onaylandı';
      case 'rejetee':
        return language === 'fr' ? 'Rejetée' : language === 'en' ? 'Rejected' : 'Reddedildi';
      case 'en_preparation':
        return language === 'fr' ? 'En préparation' : language === 'en' ? 'In preparation' : 'Hazırlanıyor';
      case 'livree':
        return language === 'fr' ? 'Livrée' : language === 'en' ? 'Delivered' : 'Teslim edildi';
      default:
        return statut;
    }
  };

  // Statistiques
  const stats = {
    total: demandes.length,
    en_attente: demandes.filter((d) => d.statut === 'en_attente').length,
    approuvees: demandes.filter((d) => d.statut === 'approuvee' || d.statut === 'en_preparation').length,
    urgentes: demandes.filter((d) => d.priorite === 'urgente').length,
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white bg-opacity-10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white bg-opacity-5 rounded-full translate-y-24 -translate-x-24"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-3">
                  {language === 'fr'
                    ? 'Gestion des Commandes'
                    : language === 'en'
                    ? 'Order Management'
                    : 'Sipariş Yönetimi'}
                </h1>
                <p className="text-xl text-teal-100 mb-4">
                  {language === 'fr'
                    ? 'Validez et traitez les demandes de matériaux'
                    : language === 'en'
                    ? 'Validate and process material requests'
                    : 'Malzeme taleplerini onaylayın ve işleyin'}
                </p>
                <div className="flex items-center space-x-4 text-teal-200">
                  <div className="flex items-center space-x-2">
                    <UserIcon className="w-5 h-5" />
                    <span>
                      {user?.prenom} {user?.nom}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <PackageIcon className="w-5 h-5" />
                    <span>Magazinier</span>
                  </div>
                </div>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-2xl backdrop-blur-sm">
                <PackageIcon className="w-12 h-12" />
              </div>
            </div>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              title:
                language === 'fr' ? 'Total Commandes' : language === 'en' ? 'Total Orders' : 'Toplam Sipariş',
              value: stats.total.toString(),
              change:
                language === 'fr' ? 'Toutes les demandes' : language === 'en' ? 'All requests' : 'Tüm talepler',
              icon: PackageIcon,
              color: 'from-blue-500 to-blue-600',
            },
            {
              title: language === 'fr' ? 'En Attente' : language === 'en' ? 'Pending' : 'Beklemede',
              value: stats.en_attente.toString(),
              change:
                language === 'fr' ? 'Action requise' : language === 'en' ? 'Action required' : 'Eylem gerekli',
              icon: ClockIcon,
              color: 'from-yellow-500 to-yellow-600',
            },
            {
              title: language === 'fr' ? 'Approuvées' : language === 'en' ? 'Approved' : 'Onaylandı',
              value: stats.approuvees.toString(),
              change:
                language === 'fr'
                  ? 'Prêtes/En cours'
                  : language === 'en'
                  ? 'Ready/In progress'
                  : 'Hazır/Devam eden',
              icon: CheckIcon,
              color: 'from-green-500 to-green-600',
            },
            {
              title: language === 'fr' ? 'Urgentes' : language === 'en' ? 'Urgent' : 'Acil',
              value: stats.urgentes.toString(),
              change:
                language === 'fr'
                  ? 'Priorité haute'
                  : language === 'en'
                  ? 'High priority'
                  : 'Yüksek öncelik',
              icon: AlertIcon,
              color: 'from-red-500 to-red-600',
            },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-100 hover:scale-105"
            >
              <div className={`bg-gradient-to-r ${stat.color} p-6 text-white`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold mb-2">{stat.value}</p>
                    <p className="text-white text-opacity-90 font-medium">{stat.title}</p>
                  </div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                    <stat.icon className="w-8 h-8" />
                  </div>
                </div>
              </div>
              <div className="p-4">
                <span className="text-sm text-slate-600">{stat.change}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  language === 'fr'
                    ? 'Rechercher par numéro ou nom...'
                    : language === 'en'
                    ? 'Search by number or name...'
                    : 'Numara veya isme göre ara...'
                }
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-slate-50 focus:bg-white transition-all duration-200"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-slate-50 focus:bg-white transition-all duration-200"
            >
              <option value="all">
                {language === 'fr' ? 'Tous les statuts' : language === 'en' ? 'All statuses' : 'Tüm durumlar'}
              </option>
              <option value="en_attente">
                {language === 'fr' ? 'En attente' : language === 'en' ? 'Pending' : 'Beklemede'}
              </option>
              <option value="approuvee">
                {language === 'fr' ? 'Approuvées' : language === 'en' ? 'Approved' : 'Onaylandı'}
              </option>
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-slate-50 focus:bg-white transition-all duration-200"
            >
              <option value="all">
                {language === 'fr' ? 'Toutes priorités' : language === 'en' ? 'All priorities' : 'Tüm öncelikler'}
              </option>
              <option value="urgente">{language === 'fr' ? 'Urgente' : language === 'en' ? 'Urgent' : 'Acil'}</option>
              <option value="haute">{language === 'fr' ? 'Haute' : language === 'en' ? 'High' : 'Yüksek'}</option>
              <option value="normale">{language === 'fr' ? 'Normale' : language === 'en' ? 'Normal' : 'Normal'}</option>
            </select>

            <div className="flex items-center text-slate-600">
              <PackageIcon className="w-5 h-5 mr-2 text-teal-600" />
              <span className="font-medium">
                {demandesFiltrees.length}{' '}
                {language === 'fr' ? 'commande(s)' : language === 'en' ? 'order(s)' : 'sipariş'}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">
            <div className="flex items-center space-x-2">
              <AlertIcon className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Liste */}
        <div className="space-y-4">
          {demandesFiltrees.map((demande) => (
            <div
              key={demande.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden"
            >
              {demande.statut === 'en_attente' && (
                <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <AlertIcon className="w-5 h-5 animate-pulse" />
                    <span className="font-bold text-lg">
                      {language === 'fr'
                        ? '⚡ ACTION REQUISE ⚡'
                        : language === 'en'
                        ? '⚡ ACTION REQUIRED ⚡'
                        : '⚡ EYLEM GEREKLİ ⚡'}
                    </span>
                    <AlertIcon className="w-5 h-5 animate-pulse" />
                  </div>
                </div>
              )}

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-xl font-bold text-slate-900">{demande.numero_demande}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center space-x-1 ${getStatusColor(
                          demande.statut,
                        )}`}
                      >
                        {getStatusIcon(demande.statut)}
                        <span>{getStatusText(demande.statut)}</span>
                      </span>
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor(demande.priorite)}`} title={demande.priorite}></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600 mb-4">
                      <div className="flex items-center space-x-2">
                        <UserIcon className="w-4 h-4 text-slate-500" />
                        <span>
                          {language === 'fr'
                            ? 'Demandeur:'
                            : language === 'en'
                            ? 'Requester:'
                            : 'Talep eden:'}{' '}
                          <strong>{demande.demandeur_nom}</strong>
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="w-4 h-4 text-slate-500" />
                        <span>
                          {language === 'fr'
                            ? 'Demandé le:'
                            : language === 'en'
                            ? 'Requested on:'
                            : 'Talep tarihi:'}{' '}
                          {new Date(demande.date_demande).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TruckIcon className="w-4 h-4 text-slate-500" />
                        <span>
                          {language === 'fr' ? 'Livraison:' : language === 'en' ? 'Delivery:' : 'Teslimat:'}{' '}
                          {new Date(demande.date_livraison_souhaitee).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-sm mb-4">
                      <div className="flex items-center space-x-2">
                        <PackageIcon className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-600">
                          {demande.nombre_items}{' '}
                          {language === 'fr'
                            ? 'matériau(x)'
                            : language === 'en'
                            ? 'material(s)'
                            : 'malzeme'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-600">
                          {language === 'fr'
                            ? 'Quantité totale:'
                            : language === 'en'
                            ? 'Total quantity:'
                            : 'Toplam miktar:'}
                        </span>
                        <span className="font-bold text-blue-600 ml-1">{demande.total_quantite_demandee}</span>
                      </div>
                    </div>

                    {demande.commentaire_demandeur && (
                      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <div className="flex items-start space-x-2">
                          <MessageIcon className="w-4 h-4 text-blue-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-blue-700">
                              {language === 'fr'
                                ? 'Commentaire du demandeur:'
                                : language === 'en'
                                ? 'Requester comment:'
                                : 'Talep eden yorumu:'}
                            </p>
                            <p className="text-sm text-blue-600">{demande.commentaire_demandeur}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {demande.commentaire_magazinier && (
                      <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                        <div className="flex items-start space-x-2">
                          <MessageIcon className="w-4 h-4 text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              {language === 'fr'
                                ? 'Votre réponse:'
                                : language === 'en'
                                ? 'Your response:'
                                : 'Yanıtınız:'}
                            </p>
                            <p className="text-sm text-gray-600">{demande.commentaire_magazinier}</p>
                            {demande.valideur_nom && demande.date_validation && (
                              <p className="text-xs text-gray-500 mt-1">
                                {language === 'fr' ? 'Par' : language === 'en' ? 'By' : 'Tarafından'}{' '}
                                {demande.valideur_nom} - {new Date(demande.date_validation).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white ${getPriorityColor(
                        demande.priorite,
                      )}`}
                    >
                      {demande.priorite.toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <div className="text-sm text-slate-500">
                    {language === 'fr'
                      ? 'Créé le'
                      : language === 'en'
                      ? 'Created on'
                      : 'Oluşturulma'}{' '}
                    {new Date(demande.date_demande).toLocaleDateString()} {language === 'fr' ? 'à' : 'at'}{' '}
                    {new Date(demande.date_demande).toLocaleTimeString()}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => fetchDemandeDetails(demande.id)}
                      className="text-slate-600 hover:text-slate-800 text-sm flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <EyeIcon className="w-4 h-4" />
                      <span>{language === 'fr' ? 'Détails' : language === 'en' ? 'Details' : 'Detaylar'}</span>
                    </button>

                    {demande.statut !== 'livree' && (
                      <button
                        onClick={() => {
                          setSelectedDemande(demande);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-800 text-sm flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                        <span>{language === 'fr' ? 'Supprimer' : language === 'en' ? 'Delete' : 'Sil'}</span>
                      </button>
                    )}

                    {demande.statut === 'en_attente' && (
                      <>
                        <button
                          onClick={() => {
                            fetchDemandeDetails(demande.id);
                            setTimeout(() => setValidationForm((prev) => ({ ...prev, action: 'reject' })), 100);
                          }}
                          className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center space-x-2 shadow-lg"
                        >
                          <XCircleIcon className="w-4 h-4" />
                          <span>{language === 'fr' ? 'Rejeter' : language === 'en' ? 'Reject' : 'Reddet'}</span>
                        </button>

                        <button
                          onClick={() => {
                            fetchDemandeDetails(demande.id);
                            setTimeout(() => setValidationForm((prev) => ({ ...prev, action: 'approve' })), 100);
                          }}
                          className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center space-x-2 shadow-lg"
                        >
                          <CheckIcon className="w-4 h-4" />
                          <span>
                            {language === 'fr' ? 'Valider' : language === 'en' ? 'Validate' : 'Onayla'}
                          </span>
                        </button>
                      </>
                    )}

                    {demande.statut === 'approuvee' && (
                      <button
                        onClick={() => handleProcessOrder(demande.id)}
                        className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-4 py-2 rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all duration-200 flex items-center space-x-2 shadow-lg"
                      >
                        <FileIcon className="w-4 h-4" />
                        <span>
                          {language === 'fr'
                            ? 'Générer Bon'
                            : language === 'en'
                            ? 'Generate Note'
                            : 'Fiş Oluştur'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {demandesFiltrees.length === 0 && (
          <div className="text-center py-16">
            <PackageIcon className="w-20 h-20 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-900 mb-2">
              {language === 'fr'
                ? 'Aucune commande trouvée'
                : language === 'en'
                ? 'No orders found'
                : 'Sipariş bulunamadı'}
            </h3>
            <p className="text-slate-600">
              {searchTerm || selectedStatus !== 'all' || selectedPriority !== 'all'
                ? language === 'fr'
                  ? 'Aucune commande ne correspond à vos critères'
                  : language === 'en'
                  ? 'No orders match your criteria'
                  : 'Kriterlerinize uygun sipariş yok'
                : language === 'fr'
                ? 'Aucune commande en attente de validation'
                : language === 'en'
                ? 'No orders pending validation'
                : 'Onay bekleyen sipariş yok'}
            </p>
          </div>
        )}
      </div>

      {/* Modal Validation */}
      {showValidationModal && selectedDemande && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-teal-50 to-blue-50">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">
                  {validationForm.action === 'approve'
                    ? language === 'fr'
                      ? 'Valider la Commande'
                      : language === 'en'
                      ? 'Validate Order'
                      : 'Siparişi Onayla'
                    : language === 'fr'
                    ? 'Rejeter la Commande'
                    : language === 'en'
                    ? 'Reject Order'
                    : 'Siparişi Reddet'}{' '}
                  - {selectedDemande.numero_demande}
                </h2>
                <button
                  onClick={() => {
                    setShowValidationModal(false);
                    setSelectedDemande(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <XIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-slate-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                      {language === 'fr'
                        ? 'Informations Commande'
                        : language === 'en'
                        ? 'Order Information'
                        : 'Sipariş Bilgileri'}
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <strong>Demandeur:</strong> {selectedDemande.demandeur_nom}
                      </div>
                      <div>
                        <strong>Chantier:</strong> {selectedDemande.nom_chantier || 'Non spécifié'}
                      </div>
                      <div>
                        <strong>Date demande:</strong>{' '}
                        {new Date(selectedDemande.date_demande).toLocaleDateString()}
                      </div>
                      <div>
                        <strong>Livraison souhaitée:</strong>{' '}
                        {new Date(selectedDemande.date_livraison_souhaitee).toLocaleDateString()}
                      </div>
                      <div>
                        <strong>Priorité:</strong>{' '}
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getPriorityColor(
                            selectedDemande.priorite,
                          )}`}
                        >
                          {selectedDemande.priorite.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {validationForm.action === 'approve'
                        ? language === 'fr'
                          ? "Commentaire d'approbation"
                          : language === 'en'
                          ? 'Approval comment'
                          : 'Onay yorumu'
                        : language === 'fr'
                        ? 'Motif de rejet'
                        : language === 'en'
                        ? 'Rejection reason'
                        : 'Red sebebi'}
                    </label>
                    <textarea
                      value={validationForm.commentaire}
                      onChange={(e) => setValidationForm({ ...validationForm, commentaire: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      rows={4}
                      placeholder={
                        validationForm.action === 'approve'
                          ? language === 'fr'
                            ? 'Commentaire sur la validation...'
                            : language === 'en'
                            ? 'Comment on validation...'
                            : 'Onay hakkında yorum...'
                          : language === 'fr'
                          ? 'Expliquez pourquoi cette commande est rejetée...'
                          : language === 'en'
                          ? 'Explain why this order is rejected...'
                          : 'Bu siparişin neden reddedildiğini açıklayın...'
                      }
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {language === 'fr'
                      ? 'Matériaux Demandés'
                      : language === 'en'
                      ? 'Requested Materials'
                      : 'İstenen Malzemeler'}
                  </h3>

                  {validationForm.action === 'approve' && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <p className="text-sm text-green-700 mb-2">
                        {language === 'fr'
                          ? 'Ajustez les quantités à accorder selon le stock disponible:'
                          : language === 'en'
                          ? 'Adjust quantities to grant according to available stock:'
                          : 'Mevcut stoka göre verilecek miktarları ayarlayın:'}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {validationForm.items.map((item, index) => (
                      <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{item.materiau_nom}</p>
                            <p className="text-sm text-slate-600">{item.code_produit}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-600">
                              Stock: <span className="font-medium text-blue-600">{item.stock_actuel}</span>
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">
                              {language === 'fr' ? 'Demandé' : language === 'en' ? 'Requested' : 'İstenen'}
                            </label>
                            <p className="font-bold text-blue-600">{item.quantite_demandee}</p>
                          </div>

                          {validationForm.action === 'approve' && (
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">
                                {language === 'fr' ? 'À accorder' : language === 'en' ? 'To grant' : 'Verilecek'}
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={Math.min(item.quantite_demandee, item.stock_actuel)}
                                value={item.quantite_accordee}
                                onChange={(e) => {
                                  const newItems = [...validationForm.items];
                                  newItems[index].quantite_accordee = parseInt(e.target.value) || 0;
                                  setValidationForm({ ...validationForm, items: newItems });
                                }}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center font-bold"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowValidationModal(false);
                    setSelectedDemande(null);
                  }}
                  className="flex-1 border border-slate-300 text-slate-700 py-3 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  {language === 'fr' ? 'Annuler' : language === 'en' ? 'Cancel' : 'İptal'}
                </button>
                <button
                  onClick={handleValidation}
                  disabled={submitting}
                  className={`flex-2 text-white py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg ${
                    validationForm.action === 'approve'
                      ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                      : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                  }`}
                >
                  {validationForm.action === 'approve' ? (
                    <CheckIcon className="w-5 h-5" />
                  ) : (
                    <XCircleIcon className="w-5 h-5" />
                  )}
                  <span>
                    {submitting
                      ? language === 'fr'
                        ? 'Traitement...'
                        : language === 'en'
                        ? 'Processing...'
                        : 'İşleniyor...'
                      : validationForm.action === 'approve'
                      ? language === 'fr'
                        ? 'Valider la Commande'
                        : language === 'en'
                        ? 'Validate Order'
                        : 'Siparişi Onayla'
                      : language === 'fr'
                      ? 'Rejeter la Commande'
                      : language === 'en'
                      ? 'Reject Order'
                      : 'Siparişi Reddet'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
      {showDeleteModal && selectedDemande && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-red-50 to-orange-50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  {language === 'fr' ? 'Supprimer la Commande' : language === 'en' ? 'Delete Order' : 'Siparişi Sil'}
                </h2>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedDemande(null);
                    setDeleteForm({ motif: '' });
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <XIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                  <AlertIcon className="w-6 h-6 text-orange-500 mt-1" />
                  <div>
                    <p className="font-medium text-orange-900 mb-1">
                      {language === 'fr' ? 'Attention' : language === 'en' ? 'Warning' : 'Uyarı'}
                    </p>
                    <p className="text-sm text-orange-700">
                      {language === 'fr'
                        ? "Cette commande sera supprimée mais sauvegardée dans l'historique des mouvements de stock pour traçabilité."
                        : language === 'en'
                        ? 'This order will be deleted but saved in stock movement history for traceability.'
                        : 'Bu sipariş silinecek ancak izlenebilirlik için stok hareket geçmişinde saklanacak.'}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="font-medium text-slate-900 mb-2">
                    {language === 'fr'
                      ? 'Commande à supprimer:'
                      : language === 'en'
                      ? 'Order to delete:'
                      : 'Silinecek sipariş:'}
                  </h4>
                  <div className="space-y-1 text-sm text-slate-600">
                    <p>
                      <strong>Numéro:</strong> {selectedDemande.numero_demande}
                    </p>
                    <p>
                      <strong>Demandeur:</strong> {selectedDemande.demandeur_nom}
                    </p>
                    <p>
                      <strong>Statut:</strong> {getStatusText(selectedDemande.statut)}
                    </p>
                    <p>
                      <strong>Matériaux:</strong> {selectedDemande.nombre_items}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {language === 'fr'
                      ? 'Motif de suppression'
                      : language === 'en'
                      ? 'Deletion reason'
                      : 'Silme sebebi'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={deleteForm.motif}
                    onChange={(e) => setDeleteForm({ motif: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={3}
                    placeholder={
                      language === 'fr'
                        ? 'Expliquez pourquoi cette commande est supprimée...'
                        : language === 'en'
                        ? 'Explain why this order is being deleted...'
                        : 'Bu siparişin neden silindiğini açıklayın...'
                    }
                    required
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start space-x-2">
                    <PackageIcon className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-700 mb-1">
                        {language === 'fr'
                          ? 'Sauvegarde Automatique'
                          : language === 'en'
                          ? 'Automatic Backup'
                          : 'Otomatik Yedekleme'}
                      </p>
                      <p className="text-xs text-blue-600">
                        {language === 'fr'
                          ? 'Toutes les données de cette commande seront automatiquement sauvegardées dans l’historique des mouvements de stock. Vous pourrez les retrouver dans la section "Mouvements Stock".'
                          : language === 'en'
                          ? 'All data from this order will be automatically saved in stock movement history. You can find them in the "Stock Movements" section.'
                          : 'Bu siparişin tüm verileri otomatik olarak stok hareket geçmişinde saklanacak. Bunları "Stok Hareketleri" bölümünde bulabilirsiniz.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedDemande(null);
                    setDeleteForm({ motif: '' });
                  }}
                  className="flex-1 border border-slate-300 text-slate-700 py-3 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  {language === 'fr' ? 'Annuler' : language === 'en' ? 'Cancel' : 'İptal'}
                </button>
                <button
                  onClick={handleDeleteOrder}
                  disabled={submitting || !deleteForm.motif.trim()}
                  className="flex-2 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-6 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
                >
                  <TrashIcon className="w-5 h-5" />
                  <span>
                    {submitting
                      ? language === 'fr'
                        ? 'Suppression...'
                        : language === 'en'
                        ? 'Deleting...'
                        : 'Siliniyor...'
                      : language === 'fr'
                      ? 'Confirmer la Suppression'
                      : language === 'en'
                      ? 'Confirm Deletion'
                      : 'Silmeyi Onayla'}
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

export default OrderManagementPage;
