import React, { useEffect, useState } from 'react';
import {
  Package,
  Plus,
  Minus,
  Search,
  User,
  Building2,
  Truck,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  X,
  Eye,
  Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

// 👇 Base d'URL unique
const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

interface Materiau {
  id: string;
  code_produit: string;
  nom: string;
  description: string;
  unite: string;
  stock_actuel: number;
  stock_minimum: number;
  fournisseur: string;
  categorie_nom: string;
  image_url?: string;
}

interface NewMateriauPayload {
  nom: string;
  code_produit?: string;
  unite?: string;
  image_url?: string;
}

interface ChefChantier {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  nom_chantier: string;
}

interface CartItem {
  materiau: Materiau;
  quantite: number;
}

interface MouvementStock {
  id: string;
  type_mouvement: 'entree' | 'sortie';
  quantite: number;
  stock_avant: number;
  stock_apres: number;
  materiau_nom: string;
  code_produit: string;
  unite: string;
  utilisateur_nom: string;
  motif: string;
  description: string;
  created_at: string;
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const DirectDistributionPage: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [, forceUpdate] = useState({});

  // États principaux
  const [activeTab, setActiveTab] = useState<'sortie' | 'entree' | 'historique'>('sortie');
  const [materiaux, setMateriaux] = useState<Materiau[]>([]);
  const [chefsChantier, setChefsChantier] = useState<ChefChantier[]>([]);
  const [mouvements, setMouvements] = useState<MouvementStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Panier pour sorties
  const [cart, setCart] = useState<CartItem[]>([]);
  const [destinataire, setDestinataire] = useState({
    type: 'existing' as 'existing' | 'custom',
    chef_id: '',
    nom_custom: '',
    adresse_custom: '',
    telephone_custom: '',
    nom_chantier_custom: ''
  });
  const [commentaire, setCommentaire] = useState('');

  // Formulaire entrée
  const [entreeForm, setEntreeForm] = useState({
    materiau_id: '',
    quantite: '',
    fournisseur: '',
    numero_facture: '',
    motif: 'Réception fournisseur',
    description: ''
  });

  // Création de nouveau matériau (entrée)
  const [isNewMateriau, setIsNewMateriau] = useState(false);
  const [newMateriau, setNewMateriau] = useState<NewMateriauPayload>({
    nom: '',
    code_produit: '',
    unite: 'pcs',
    image_url: ''
  });

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // États UI
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Écouter les changements de langue
  useEffect(() => {
    const handleLanguageChange = () => {
      forceUpdate({});
    };
    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Session expirée');
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [materiauxRes, chefsRes, mouvementsRes] = await Promise.all([
        fetch(`${API_BASE}/materiaux`, { headers }),
        fetch(`${API_BASE}/admin/chefs-chantier`, { headers }),
        fetch(`${API_BASE}/stock/movements?limit=20`, { headers })
      ]);

      if (materiauxRes.ok) {
        const materiauxData = await materiauxRes.json();
        setMateriaux(materiauxData.materiaux || []);
      }

      if (chefsRes.ok) {
        const chefsData = await chefsRes.json();
        setChefsChantier(chefsData.users || []);
      }

      if (mouvementsRes.ok) {
        const mouvementsData = await mouvementsRes.json();
        setMouvements(mouvementsData.mouvements || []);
      }
    } catch (e) {
      console.error('Erreur lors du chargement:', e);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Gestion du panier
  const addToCart = (materiau: Materiau) => {
    setCart(prev => {
      const found = prev.find(i => i.materiau.id === materiau.id);
      if (found) {
        const q = clamp(found.quantite + 1, 1, Math.max(1, materiau.stock_actuel));
        if (q === found.quantite) {
          alert(`Stock insuffisant ! Maximum disponible: ${materiau.stock_actuel} ${materiau.unite}`);
          return prev;
        }
        return prev.map(i => (i.materiau.id === materiau.id ? { ...i, quantite: q } : i));
      }
      if (materiau.stock_actuel <= 0) {
        alert(`Stock épuisé pour ${materiau.nom}`);
        return prev;
      }
      return [...prev, { materiau, quantite: 1 }];
    });
  };

  const updateCartQuantity = (materiauId: string, newQuantity: number) => {
    const materiau = materiaux.find(m => m.id === materiauId);
    if (!materiau) return;

    if (newQuantity <= 0) {
      removeFromCart(materiauId);
      return;
    }

    const q = clamp(newQuantity, 1, Math.max(1, materiau.stock_actuel));
    if (q !== newQuantity) {
      alert(`Stock insuffisant ! Maximum: ${materiau.stock_actuel} ${materiau.unite}`);
    }

    setCart(prev =>
      prev.map(i => (i.materiau.id === materiauId ? { ...i, quantite: q } : i))
    );
  };

  const removeFromCart = (materiauId: string) => {
    setCart(prev => prev.filter(i => i.materiau.id !== materiauId));
  };

  const clearCart = () => setCart([]);

  // Soumission sortie (distribution)
  const handleDistribution = async () => {
    try {
      if (cart.length === 0) {
        alert('Aucun matériau sélectionné');
        return;
      }
      if (destinataire.type === 'existing' && !destinataire.chef_id) {
        alert('Veuillez sélectionner un destinataire');
        return;
      }
      if (destinataire.type === 'custom' && !destinataire.nom_custom.trim()) {
        alert('Veuillez saisir le nom du destinataire');
        return;
      }
      if (destinataire.type === 'custom' && !destinataire.nom_chantier_custom.trim()) {
        alert('Veuillez saisir le nom du chantier');
        return;
      }

      setSubmitting(true);
      const token = localStorage.getItem('token');

      const depotId =
        (await fetch(`${API_BASE}/admin/depots`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(r => r.json())
          .then(d => d.depots?.[0]?.id)) || null;

      const distributionData = {
        destinataire_id: destinataire.type === 'existing' ? destinataire.chef_id : null,
        destinataire_custom:
          destinataire.type === 'custom'
            ? {
                nom: destinataire.nom_custom,
                adresse: destinataire.adresse_custom,
                telephone: destinataire.telephone_custom,
                nom_chantier: destinataire.nom_chantier_custom
              }
            : null,
        depot_id: depotId,
        commentaire,
        items: cart.map(item => ({
          materiau_id: item.materiau.id,
          quantite: item.quantite,
          materiau_nom: item.materiau.nom,
          code_produit: item.materiau.code_produit,
          unite: item.materiau.unite
        }))
      };

      const response = await fetch(`${API_BASE}/bons-livraison/direct`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(distributionData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la distribution');
      }

      const data = await response.json();
      const bonInfo = data.bon_livraison;
      const itemsCount = cart.length;
      const totalQuantite = cart.reduce((s, i) => s + i.quantite, 0);

      alert(
        `✅ Distribution réussie !\n\nBon: ${bonInfo.numero_bon}\nMatériaux: ${itemsCount}\nQuantité totale: ${totalQuantite}\n\nRedirection vers impression...`
      );

      // Données à imprimer (sauvegarde locale)
      const demandeurNom =
        destinataire.type === 'existing'
          ? (() => {
              const chef = chefsChantier.find(c => c.id === destinataire.chef_id);
              return chef ? `${chef.prenom} ${chef.nom}` : 'Chef de Chantier';
            })()
          : destinataire.nom_custom || 'Destinataire Custom';

      const bonDataForPrint = {
        id: bonInfo.id,
        numero_bon: bonInfo.numero_bon,
        date_preparation: bonInfo.date_preparation || new Date().toISOString(),
        demandeur_nom: demandeurNom,
        demandeur_email:
          destinataire.type === 'existing'
            ? chefsChantier.find(c => c.id === destinataire.chef_id)?.email || 'chef@dantela.cm'
            : 'externe@dantela.cm',
        demandeur_telephone:
          destinataire.type === 'existing'
            ? chefsChantier.find(c => c.id === destinataire.chef_id)?.telephone || '+237669790437'
            : destinataire.telephone_custom || '+237669790437',
        demandeur_adresse:
          destinataire.type === 'existing'
            ? 'Adresse du chantier'
            : destinataire.adresse_custom || "203 Boulevard de l'OCAM, Mvog Mbi - Yaoundé",
        nom_chantier:
          destinataire.type === 'existing'
            ? chefsChantier.find(c => c.id === destinataire.chef_id)?.nom_chantier || 'Chantier'
            : destinataire.nom_chantier_custom || 'Distribution Directe',
        magazinier_nom: `${user?.prenom || ''} ${user?.nom || ''}`.trim(),
        depot_nom: 'Dépôt Elig-Essono',
        items: cart.map(item => ({
          id: item.materiau.id,
          code_produit: item.materiau.code_produit,
          materiau_nom: item.materiau.nom,
          quantite_demandee: item.quantite,
          unite: item.materiau.unite
        }))
      };

      localStorage.setItem(`bon_direct_${bonInfo.id}`, JSON.stringify(bonDataForPrint));

      // Reset & refresh
      clearCart();
      setCommentaire('');
      setDestinataire({
        type: 'existing',
        chef_id: '',
        nom_custom: '',
        adresse_custom: '',
        telephone_custom: '',
        nom_chantier_custom: ''
      });
      fetchData();

      // Rediriger pour impression
      navigate(`/bon-livraison/direct-${bonInfo.id}`);
    } catch (e) {
      console.error('Erreur distribution:', e);
      alert(e instanceof Error ? e.message : 'Erreur lors de la distribution');
    } finally {
      setSubmitting(false);
    }
  };

  // Soumission entrée
  const handleEntree = async () => {
    try {
      if (isNewMateriau && !newMateriau.nom.trim()) {
        alert('Veuillez saisir le nom du nouveau matériau');
        return;
      }
      if (!isNewMateriau && (!entreeForm.materiau_id || !entreeForm.materiau_id.trim())) {
        alert('Veuillez sélectionner un matériau');
        return;
      }
      if (!entreeForm.quantite || parseInt(entreeForm.quantite, 10) <= 0) {
        alert('Veuillez saisir une quantité positive');
        return;
      }

      setSubmitting(true);
      const token = localStorage.getItem('token');

      let materiauId = entreeForm.materiau_id;

      // 1) Créer le matériau si nécessaire
      if (isNewMateriau) {
        const resCreate = await fetch(`${API_BASE}/materiaux`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newMateriau)
        });

        if (!resCreate.ok) {
          const ed = await resCreate.json();
          throw new Error(ed.message || 'Échec de création du matériau');
        }

        const created = await resCreate.json();
        materiauId = created?.materiau?.id || created?.id;

        // Refresh liste
        await fetchData();

        // Reset formulaire de création
        setIsNewMateriau(false);
        setNewMateriau({ nom: '', code_produit: '', unite: 'pcs', image_url: '' });
      }

      // 2) Enregistrer l’entrée
      const entreeData = {
        materiau_id: materiauId,
        quantite: parseInt(entreeForm.quantite, 10),
        fournisseur: entreeForm.fournisseur,
        numero_facture: entreeForm.numero_facture,
        motif: entreeForm.motif,
        description: entreeForm.description || `Réception de ${entreeForm.quantite} unités`
      };

      const response = await fetch(`${API_BASE}/stock/add`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entreeData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de l'entrée de stock");
      }

      await response.json();
      alert(`Entrée de stock enregistrée avec succès !`);

      // Reset formulaire d’entrée
      setEntreeForm({
        materiau_id: '',
        quantite: '',
        fournisseur: '',
        numero_facture: '',
        motif: 'Réception fournisseur',
        description: ''
      });

      fetchData();
    } catch (e) {
      console.error('Erreur entrée:', e);
      alert(e instanceof Error ? e.message : "Erreur lors de l'entrée de stock");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtrer les matériaux
  const materiauxFiltres = materiaux.filter(m =>
    (m.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.code_produit || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculer les statistiques
  const stats = {
    total_materiaux: materiaux.length,
    alertes_stock: materiaux.filter(m => m.stock_actuel <= m.stock_minimum).length,
    entrees_aujourd_hui: mouvements.filter(
      m => m.type_mouvement === 'entree' && new Date(m.created_at).toDateString() === new Date().toDateString()
    ).length,
    sorties_aujourd_hui: mouvements.filter(
      m => m.type_mouvement === 'sortie' && new Date(m.created_at).toDateString() === new Date().toDateString()
    ).length
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
    return `Il y a ${Math.floor(diffInMinutes / 1440)}j`;
  };

  const getStockColor = (stock: number, minimum: number) => {
    if (stock === 0) return 'bg-red-500';
    if (stock <= minimum) return 'bg-orange-500';
    if (stock <= minimum * 1.5) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white relative overflow-hidden">
          <div className="hidden sm:block absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-24 translate-x-24"></div>
          <div className="hidden sm:block absolute bottom-0 left-0 w-36 h-36 bg-white/5 rounded-full translate-y-20 -translate-x-20"></div>

          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3">
                  {language === 'fr'
                    ? 'Gestion des Stocks'
                    : language === 'en'
                    ? 'Stock Management'
                    : 'Stok Yönetimi'}
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-teal-100 mb-2">
                  {language === 'fr'
                    ? 'Entrées, sorties et distribution directe'
                    : language === 'en'
                    ? 'Inbound, outbound and direct distribution'
                    : 'Giriş, çıkış ve doğrudan dağıtım'}
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 text-sm sm:text-base text-teal-200">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span className="truncate">{user?.prenom} {user?.nom}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5" />
                    <span>Magazinier</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="bg-white/20 text-white p-3 rounded-xl hover:bg-white/30 transition-all backdrop-blur-sm"
                >
                  <RefreshCw className={`w-6 h-6 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                  <Package className="w-10 h-10 lg:w-12 lg:h-12" />
                </div>
              </div>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
              <div className="bg-white/20 rounded-xl p-4 text-center backdrop-blur-sm">
                <Package className="w-8 h-8 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.total_materiaux}</p>
                <p className="text-sm text-teal-100">{language === 'fr' ? 'Matériaux' : language === 'en' ? 'Materials' : 'Malzeme'}</p>
              </div>
              <div className="bg-white/20 rounded-xl p-4 text-center backdrop-blur-sm">
                <ArrowDown className="w-8 h-8 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.sorties_aujourd_hui}</p>
                <p className="text-sm text-teal-100">{language === 'fr' ? 'Sorties (aujourd.)' : language === 'en' ? 'Outbound (today)' : 'Çıkış (bugün)'}</p>
              </div>
              <div className="bg-white/20 rounded-xl p-4 text-center backdrop-blur-sm">
                <ArrowUp className="w-8 h-8 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.entrees_aujourd_hui}</p>
                <p className="text-sm text-teal-100">{language === 'fr' ? 'Entrées (aujourd.)' : language === 'en' ? 'Inbound (today)' : 'Giriş (bugün)'}</p>
              </div>
              <div className="bg-white/20 rounded-xl p-4 text-center backdrop-blur-sm">
                <Activity className="w-8 h-8 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.alertes_stock}</p>
                <p className="text-sm text-teal-100">{language === 'fr' ? 'Alertes stock' : language === 'en' ? 'Stock alerts' : 'Stok uyarısı'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-100">
          <div className="border-b border-slate-200">
            <nav className="flex">
              {[
                { key: 'sortie', label: language === 'fr' ? 'Sortie' : language === 'en' ? 'Outbound' : 'Çıkış', icon: ArrowDown, color: 'text-red-600', count: cart.length },
                { key: 'entree', label: language === 'fr' ? 'Entrée' : language === 'en' ? 'Inbound' : 'Giriş', icon: ArrowUp, color: 'text-green-600', count: 0 },
                { key: 'historique', label: language === 'fr' ? 'Historique' : language === 'en' ? 'History' : 'Geçmiş', icon: Activity, color: 'text-blue-600', count: mouvements.length }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-4 border-b-2 font-medium transition-colors ${
                    activeTab === tab.key ? 'border-teal-500 text-teal-600 bg-teal-50' : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <tab.icon className={`w-5 h-5 ${activeTab === tab.key ? tab.color : ''}`} />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {tab.count > 99 ? '99+' : tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Contenu */}
          <div className="p-4 sm:p-6">
            {/* SORTIE */}
            {activeTab === 'sortie' && (
              <div className="space-y-6">
                {/* Filtres */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="sm:hidden bg-slate-100 text-slate-700 px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
                    >
                      <Search className="w-4 h-4" />
                      <span>Filtres</span>
                    </button>

                    <div className={`${showFilters ? 'block' : 'hidden'} sm:block w-full sm:max-w-md`}>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder={
                            language === 'fr'
                              ? 'Rechercher matériau...'
                              : language === 'en'
                              ? 'Search material...'
                              : 'Malzeme ara...'
                          }
                          className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-sm text-slate-600">
                      <Package className="w-4 h-4 text-teal-600" />
                      <span>{materiauxFiltres.length} matériaux</span>
                    </div>
                  </div>
                </div>

                {/* Grille matériaux avec IMAGE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {materiauxFiltres.map(m => (
                    <div key={m.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition">
                      {/* IMAGE */}
                      <div className="aspect-[4/3] bg-slate-50 flex items-center justify-center overflow-hidden">
                        {m.image_url ? (
                          <img src={m.image_url} alt={m.nom} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="text-slate-400 text-xs">Aucune image</div>
                        )}
                      </div>

                      <div className="p-4">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">{m.nom}</h3>
                            <p className="text-xs sm:text-sm text-slate-600">{m.code_produit}</p>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStockColor(m.stock_actuel, m.stock_minimum)}`}>
                            {m.stock_actuel}
                          </div>
                        </div>

                        {/* Infos */}
                        <div className="space-y-2 mb-3">
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span className="text-slate-600">Unité:</span>
                            <span className="font-medium">{m.unite}</span>
                          </div>
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span className="text-slate-600">Stock:</span>
                            <span className={`font-bold ${m.stock_actuel <= m.stock_minimum ? 'text-red-600' : 'text-green-600'}`}>
                              {m.stock_actuel} / {m.stock_minimum}
                            </span>
                          </div>
                          {m.fournisseur && (
                            <div className="flex justify-between text-xs sm:text-sm">
                              <span className="text-slate-600">Fournisseur:</span>
                              <span className="font-medium truncate ml-2">{m.fournisseur}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-2">
                          <button className="flex-1 bg-slate-600 text-white py-2 px-3 rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center space-x-1 text-sm">
                            <Eye className="w-4 h-4" />
                            <span>Voir</span>
                          </button>
                          <button
                            onClick={() => addToCart(m)}
                            disabled={m.stock_actuel === 0}
                            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-2 px-3 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1 text-sm"
                          >
                            <Minus className="w-4 h-4" />
                            <span>Sortir</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Panier */}
                {cart.length > 0 && (
                  <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg sm:text-xl font-bold text-red-900">
                        {language === 'fr' ? 'Distribution en Cours' : language === 'en' ? 'Current Distribution' : 'Mevcut Dağıtım'}
                      </h3>
                      <button onClick={clearCart} className="text-red-600 hover:text-red-800 text-sm">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Liste matériaux sélectionnés */}
                    <div className="space-y-2 mb-4 max-h-32 sm:max-h-48 overflow-y-auto">
                      {cart.map(item => (
                        <div key={item.materiau.id} className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-lg border border-red-200">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 text-sm truncate">{item.materiau.nom}</p>
                            <p className="text-xs text-slate-600">{item.materiau.code_produit}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateCartQuantity(item.materiau.id, item.quantite - 1)}
                              className="bg-red-500 text-white p-1 rounded hover:bg-red-600"
                              aria-label="Diminuer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>

                            {/* INPUT DIRECT DE QUANTITÉ */}
                            <input
                              type="number"
                              min={1}
                              max={Math.max(1, item.materiau.stock_actuel)}
                              value={item.quantite}
                              onChange={(e) => {
                                const v = parseInt(e.target.value || '1', 10);
                                updateCartQuantity(item.materiau.id, isNaN(v) ? 1 : v);
                              }}
                              className="w-16 text-center border border-slate-300 rounded-md py-1 text-sm"
                            />

                            <button
                              onClick={() => updateCartQuantity(item.materiau.id, item.quantite + 1)}
                              className="bg-green-500 text-white p-1 rounded hover:bg-green-600"
                              aria-label="Augmenter"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Destinataire */}
                    <div className="space-y-3 mb-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={() => setDestinataire({ ...destinataire, type: 'existing', nom_custom: '' })}
                          className={`p-3 border-2 rounded-lg text-left transition-all ${
                            destinataire.type === 'existing' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium">Chef Existant</span>
                          </div>
                        </button>
                        <button
                          onClick={() => setDestinataire({ ...destinataire, type: 'custom', chef_id: '' })}
                          className={`p-3 border-2 rounded-lg text-left transition-all ${
                            destinataire.type === 'custom' ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <Building2 className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium">Autre Personne</span>
                          </div>
                        </button>
                      </div>

                      {destinataire.type === 'existing' ? (
                        <select
                          value={destinataire.chef_id}
                          onChange={(e) => setDestinataire({ ...destinataire, chef_id: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Sélectionner un chef de chantier...</option>
                          {chefsChantier.map(chef => (
                            <option key={chef.id} value={chef.id}>
                              {chef.prenom} {chef.nom} - {chef.nom_chantier}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={destinataire.nom_custom}
                            onChange={(e) => setDestinataire({ ...destinataire, nom_custom: e.target.value })}
                            placeholder="Nom complet du destinataire..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            required
                          />
                          <input
                            type="text"
                            value={destinataire.nom_chantier_custom}
                            onChange={(e) => setDestinataire({ ...destinataire, nom_chantier_custom: e.target.value })}
                            placeholder="Nom du chantier..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            required
                          />
                          <input
                            type="text"
                            value={destinataire.adresse_custom}
                            onChange={(e) => setDestinataire({ ...destinataire, adresse_custom: e.target.value })}
                            placeholder="Adresse de livraison..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          />
                          <input
                            type="text"
                            value={destinataire.telephone_custom}
                            onChange={(e) => setDestinataire({ ...destinataire, telephone_custom: e.target.value })}
                            placeholder="Téléphone (optionnel)..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      )}
                    </div>

                    {/* Commentaire */}
                    <textarea
                      value={commentaire}
                      onChange={(e) => setCommentaire(e.target.value)}
                      placeholder="Commentaire sur la distribution..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 mb-4"
                      rows={2}
                    />

                    {/* Bouton distribution */}
                    <button
                      onClick={handleDistribution}
                      disabled={submitting || cart.length === 0}
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg"
                    >
                      <Truck className="w-5 h-5" />
                      <span>{submitting ? 'Distribution...' : 'Distribuer les Matériaux'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ENTREE */}
            {activeTab === 'entree' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-green-900 mb-4">
                    {language === 'fr'
                      ? 'Réception de Matériaux'
                      : language === 'en'
                      ? 'Material Reception'
                      : 'Malzeme Kabulü'}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Sélection / Nouveau matériau */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Matériau <span className="text-red-500">*</span>
                      </label>

                      <select
                        value={isNewMateriau ? '__new__' : entreeForm.materiau_id}
                        onChange={(e) => {
                          if (e.target.value === '__new__') {
                            setIsNewMateriau(true);
                            setEntreeForm({ ...entreeForm, materiau_id: '' });
                          } else {
                            setIsNewMateriau(false);
                            setEntreeForm({ ...entreeForm, materiau_id: e.target.value });
                          }
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        required
                      >
                        <option value="">Sélectionner un matériau...</option>
                        {materiaux.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.nom} ({m.code_produit}) - Stock: {m.stock_actuel}
                          </option>
                        ))}
                        <option value="__new__">➕ Nouveau matériau…</option>
                      </select>

                      {/* Champs si nouveau matériau */}
                      {isNewMateriau && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={newMateriau.nom}
                            onChange={(e) => setNewMateriau({ ...newMateriau, nom: e.target.value })}
                            placeholder="Nom du matériau *"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            required
                          />
                          <input
                            type="text"
                            value={newMateriau.code_produit}
                            onChange={(e) => setNewMateriau({ ...newMateriau, code_produit: e.target.value })}
                            placeholder="Code produit (optionnel)"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          />
                          <input
                            type="text"
                            value={newMateriau.unite}
                            onChange={(e) => setNewMateriau({ ...newMateriau, unite: e.target.value })}
                            placeholder="Unité (ex: pcs, sac, m²…)"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          />
                          <input
                            type="url"
                            value={newMateriau.image_url}
                            onChange={(e) => setNewMateriau({ ...newMateriau, image_url: e.target.value })}
                            placeholder="URL image (optionnel)"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      )}
                    </div>

                    {/* Quantité */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Quantité <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={entreeForm.quantite}
                        onChange={(e) => setEntreeForm({ ...entreeForm, quantite: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="Quantité reçue..."
                        required
                      />
                    </div>

                    {/* Fournisseur */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Fournisseur</label>
                      <input
                        type="text"
                        value={entreeForm.fournisseur}
                        onChange={(e) => setEntreeForm({ ...entreeForm, fournisseur: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="Nom du fournisseur..."
                      />
                    </div>

                    {/* Numéro facture */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">N° Facture</label>
                      <input
                        type="text"
                        value={entreeForm.numero_facture}
                        onChange={(e) => setEntreeForm({ ...entreeForm, numero_facture: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="Numéro de facture..."
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                    <textarea
                      value={entreeForm.description}
                      onChange={(e) => setEntreeForm({ ...entreeForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      rows={2}
                      placeholder="Détails sur la réception..."
                    />
                  </div>

                  {/* Bouton entrée */}
                  <button
                    onClick={handleEntree}
                    disabled={submitting || (!isNewMateriau && !entreeForm.materiau_id) || !entreeForm.quantite}
                    className="w-full mt-4 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg"
                  >
                    <ArrowUp className="w-5 h-5" />
                    <span>{submitting ? 'Enregistrement...' : "Enregistrer l'Entrée"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* HISTORIQUE */}
            {activeTab === 'historique' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    {language === 'fr' ? 'Mouvements Récents' : language === 'en' ? 'Recent Movements' : 'Son Hareketler'}
                  </h3>
                  <span className="text-sm text-slate-600">{mouvements.length} mouvements</span>
                </div>

                <div className="space-y-3">
                  {mouvements.map(mvt => (
                    <div key={mvt.id} className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${mvt.type_mouvement === 'entree' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {mvt.type_mouvement === 'entree' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-slate-900 text-sm truncate">{mvt.materiau_nom}</h4>
                            <span className={`font-bold text-sm ${mvt.type_mouvement === 'entree' ? 'text-green-600' : 'text-red-600'}`}>
                              {mvt.type_mouvement === 'entree' ? '+' : ''}
                              {mvt.quantite} {mvt.unite}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                            <span>{mvt.code_produit}</span>
                            <span>Stock: {mvt.stock_avant} → {mvt.stock_apres}</span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">{mvt.utilisateur_nom}</span>
                            <span className="text-slate-500">{formatTimeAgo(mvt.created_at)}</span>
                          </div>

                          {mvt.motif && <p className="text-xs text-slate-600 mt-1 italic">{mvt.motif}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {mouvements.length === 0 && (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">Aucun mouvement récent</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">{error}</div>}
      </div>
    </Layout>
  );
};

export default DirectDistributionPage;
