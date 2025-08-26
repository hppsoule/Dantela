import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Eye, 
  Grid3X3, 
  List, 
  MapPin,
  Building2,
  Calendar,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Star,
  X,
  Truck,
  Clock,
  User
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

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

interface Categorie {
  id: string;
  nom: string;
  description: string;
  materiaux_count: number;
}

interface Depot {
  id: string;
  nom: string;
  adresse: string;
  description: string;
}

interface CartItem {
  materiau: Materiau;
  quantite: number;
}

const DirecteurChefCatalog: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [, forceUpdate] = useState({});
  
  // États principaux
  const [materiaux, setMateriaux] = useState<Materiau[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Panier
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Modal commande
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState({
    destinationType: 'depot' as 'depot' | 'custom',
    depot_id: '',
    destination_name: '',
    priorite: 'normale' as 'normale' | 'urgente',
    date_livraison_souhaitee: '',
    commentaire_demandeur: ''
  });
  const [submittingOrder, setSubmittingOrder] = useState(false);

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
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Session expirée');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Récupérer les matériaux
      const materiauxResponse = await fetch('http://localhost:5000/api/materiaux', { headers });
      if (materiauxResponse.ok) {
        const materiauxData = await materiauxResponse.json();
        setMateriaux(materiauxData.materiaux || []);
      }

      // Récupérer les catégories
      const categoriesResponse = await fetch('http://localhost:5000/api/categories', { headers });
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData.categories || []);
      }

      // Récupérer les dépôts seulement pour le directeur
      if (user?.role === 'directeur') {
        const depotsResponse = await fetch('http://localhost:5000/api/admin/depots', { headers });
        if (depotsResponse.ok) {
          const depotsData = await depotsResponse.json();
          setDepots(depotsData.depots || []);
        }
      }

    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les matériaux
  const materiauxFiltres = materiaux.filter(materiau => {
    const matchSearch = materiau.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       materiau.code_produit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       materiau.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchCategory = selectedCategory === 'all' || materiau.categorie_nom === selectedCategory;
    
    return matchSearch && matchCategory;
  });

  // Gestion du panier
  const addToCart = (materiau: Materiau) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.materiau.id === materiau.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.materiau.id === materiau.id
            ? { ...item, quantite: item.quantite + 1 }
            : item
        );
      } else {
        return [...prevCart, { materiau, quantite: 1 }];
      }
    });
  };

  const updateQuantity = (materiauId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(materiauId);
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.materiau.id === materiauId
            ? { ...item, quantite: newQuantity }
            : item
        )
      );
    }
  };

  const removeFromCart = (materiauId: string) => {
    setCart(prevCart => prevCart.filter(item => item.materiau.id !== materiauId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantite, 0);
  };

  const getUniqueItems = () => {
    return cart.length;
  };

  // Soumission de commande
  const handleSubmitOrder = async () => {
    try {
      // Validation du panier
      if (cart.length === 0) {
        alert(language === 'fr' ? 'Votre panier est vide' : 
              language === 'en' ? 'Your cart is empty' : 
              'Sepetiniz boş');
        return;
      }

      // Validation du formulaire
      if (orderForm.destinationType === 'depot' && !orderForm.depot_id && user?.role === 'directeur') {
        alert(language === 'fr' ? 'Veuillez sélectionner un dépôt' : 
              language === 'en' ? 'Please select a depot' : 
              'Lütfen bir depo seçin');
        return;
      }

      if (orderForm.destinationType === 'custom' && !orderForm.destination_name.trim()) {
        alert(language === 'fr' ? 'Veuillez saisir une destination' : 
              language === 'en' ? 'Please enter a destination' : 
              'Lütfen bir hedef girin');
        return;
      }

      if (!orderForm.date_livraison_souhaitee) {
        alert(language === 'fr' ? 'Veuillez sélectionner une date de livraison' : 
              language === 'en' ? 'Please select a delivery date' : 
              'Lütfen teslimat tarihi seçin');
        return;
      }

      setSubmittingOrder(true);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Session expirée');
      }

      // Préparer les données de commande
      const commandeData = {
        depot_id: orderForm.destinationType === 'depot' && user?.role === 'directeur' ? orderForm.depot_id : null,
        destination_custom: orderForm.destinationType === 'custom' ? orderForm.destination_name : null,
        priorite: orderForm.priorite,
        date_livraison_souhaitee: orderForm.date_livraison_souhaitee,
        commentaire_demandeur: orderForm.commentaire_demandeur,
        items: cart.map(item => ({
          materiau_id: item.materiau.id,
          quantite_demandee: item.quantite,
          commentaire: ''
        }))
      };

      const response = await fetch('http://localhost:5000/api/demandes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commandeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création de la commande');
      }

      const data = await response.json();
      
      // Succès
      alert(language === 'fr' ? `Commande ${data.demande.numero_demande} créée avec succès !` : 
            language === 'en' ? `Order ${data.demande.numero_demande} created successfully!` : 
            `Sipariş ${data.demande.numero_demande} başarıyla oluşturuldu!`);
      
      // Reset
      clearCart();
      setShowOrderModal(false);
      resetOrderForm();

    } catch (error) {
      console.error('Erreur lors de la commande:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la création de la commande');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const resetOrderForm = () => {
    setOrderForm({
      destinationType: 'depot',
      depot_id: '',
      destination_name: '',
      priorite: 'normale',
      date_livraison_souhaitee: '',
      commentaire_demandeur: ''
    });
  };

  const getStockColor = (stock: number, minimum: number) => {
    if (stock <= minimum) return 'bg-red-500';
    if (stock <= minimum * 1.5) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getStockText = (stock: number, minimum: number) => {
    if (stock <= minimum) return language === 'fr' ? 'Stock critique' : language === 'en' ? 'Critical stock' : 'Kritik stok';
    if (stock <= minimum * 1.5) return language === 'fr' ? 'Stock faible' : language === 'en' ? 'Low stock' : 'Düşük stok';
    return language === 'fr' ? 'En stock' : language === 'en' ? 'In stock' : 'Stokta';
  };

  // Date minimum (aujourd'hui)
  const today = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header avec dégradé - Responsive */}
      <div className="bg-gradient-to-r from-blue-600 via-teal-600 to-teal-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white relative overflow-hidden">
        {/* Formes décoratives */}
        <div className="hidden sm:block absolute top-0 right-0 w-32 sm:w-48 lg:w-64 h-32 sm:h-48 lg:h-64 bg-white bg-opacity-10 rounded-full -translate-y-16 sm:-translate-y-24 lg:-translate-y-32 translate-x-16 sm:translate-x-24 lg:translate-x-32"></div>
        <div className="hidden sm:block absolute bottom-0 left-0 w-24 sm:w-36 lg:w-48 h-24 sm:h-36 lg:h-48 bg-white bg-opacity-5 rounded-full translate-y-12 sm:translate-y-18 lg:translate-y-24 -translate-x-12 sm:-translate-x-18 lg:-translate-x-24"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
                {language === 'fr' ? 'Catalogue des Matériaux' : 
                 language === 'en' ? 'Materials Catalog' : 
                 'Malzeme Kataloğu'}
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-blue-100">
                {language === 'fr' ? 'Parcourez et commandez vos matériaux de construction' : 
                 language === 'en' ? 'Browse and order your construction materials' : 
                 'İnşaat malzemelerinize göz atın ve sipariş verin'}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              {/* Toggle Vue */}
              <div className="hidden md:flex bg-white bg-opacity-20 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-white text-blue-600' : 'text-white hover:bg-white hover:bg-opacity-20'
                  }`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white text-blue-600' : 'text-white hover:bg-white hover:bg-opacity-20'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>

              {/* Bouton Panier */}
              <button
                onClick={() => setShowCart(true)}
                className="bg-white bg-opacity-20 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:bg-opacity-30 transition-all duration-200 flex items-center space-x-2 sm:space-x-3 backdrop-blur-sm shadow-lg"
              >
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="font-medium text-sm sm:text-base">
                  {language === 'fr' ? 'Panier' : language === 'en' ? 'Cart' : 'Sepet'}
                </span>
                {cart.length > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center animate-pulse">
                    {getTotalItems()}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres - Responsive */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-slate-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Recherche */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'fr' ? 'Rechercher un matériau...' : 
                             language === 'en' ? 'Search material...' : 
                             'Malzeme ara...'}
                className="w-full pl-10 pr-4 py-2 sm:py-3 border border-slate-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition-all duration-200"
              />
            </div>
          </div>

          {/* Catégories */}
          <div className="lg:col-span-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 sm:py-3 border border-slate-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition-all duration-200"
            >
              <option value="all">
                {language === 'fr' ? 'Toutes les catégories' : 
                 language === 'en' ? 'All categories' : 
                 'Tüm kategoriler'} ({materiaux.length})
              </option>
              {categories.map(categorie => (
                <option key={categorie.id} value={categorie.nom}>
                  {categorie.nom} ({categorie.materiaux_count})
                </option>
              ))}
            </select>
          </div>

          {/* Statistiques */}
          <div className="flex items-center justify-center sm:justify-start text-sm sm:text-base text-slate-600">
            <Package className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
            <span className="font-medium">
              {materiauxFiltres.length} {language === 'fr' ? 'matériau(x)' : 
                                        language === 'en' ? 'material(s)' : 
                                        'malzeme'}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">
          {error}
        </div>
      )}

      {/* Grille des matériaux - Responsive */}
      <div className={`grid gap-4 sm:gap-6 ${
        viewMode === 'grid' 
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
          : 'grid-cols-1'
      }`}>
        {materiauxFiltres.map(materiau => (
          <div key={materiau.id} className="bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden group hover:scale-[1.02]">
            {/* Image */}
            <div className="relative h-32 sm:h-40 lg:h-48 bg-gradient-to-br from-slate-100 to-slate-200">
              {materiau.image_url ? (
                <img
                  src={materiau.image_url}
                  alt={materiau.nom}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-12 h-12 sm:w-16 sm:h-16 text-slate-400" />
                </div>
              )}
              
              {/* Badge stock - Discret en haut à droite */}
              <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium text-white ${getStockColor(materiau.stock_actuel, materiau.stock_minimum)}`}>
                {materiau.stock_actuel}
              </div>
            </div>

            {/* Contenu */}
            <div className="p-3 sm:p-4 lg:p-6">
              <div className="mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 mb-1 sm:mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {materiau.nom}
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-1 sm:space-y-0">
                  <span className="text-xs sm:text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    {materiau.code_produit}
                  </span>
                  <span className="text-xs sm:text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
                    {materiau.categorie_nom}
                  </span>
                </div>
                {materiau.description && (
                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                    {materiau.description}
                  </p>
                )}
              </div>

              {/* Informations */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-slate-600">
                    {language === 'fr' ? 'Unité:' : language === 'en' ? 'Unit:' : 'Birim:'}
                  </span>
                  <span className="font-medium text-slate-900">{materiau.unite}</span>
                </div>
                {materiau.fournisseur && (
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-slate-600">
                      {language === 'fr' ? 'Fournisseur:' : language === 'en' ? 'Supplier:' : 'Tedarikçi:'}
                    </span>
                    <span className="font-medium text-slate-900 truncate ml-2">{materiau.fournisseur}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button className="flex-1 bg-slate-600 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl hover:bg-slate-700 transition-colors flex items-center justify-center space-x-1 sm:space-x-2 text-sm sm:text-base">
                  <Eye className="w-4 h-4" />
                  <span>
                    {language === 'fr' ? 'Voir' : language === 'en' ? 'View' : 'Gör'}
                  </span>
                </button>
                <button
                  onClick={() => addToCart(materiau)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center space-x-1 sm:space-x-2 shadow-lg text-sm sm:text-base"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>
                    {language === 'fr' ? 'Panier' : language === 'en' ? 'Cart' : 'Sepet'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {materiauxFiltres.length === 0 && (
        <div className="text-center py-12 sm:py-16">
          <Package className="w-16 h-16 sm:w-20 sm:h-20 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-medium text-slate-900 mb-2">
            {language === 'fr' ? 'Aucun matériau trouvé' : 
             language === 'en' ? 'No materials found' : 
             'Malzeme bulunamadı'}
          </h3>
          <p className="text-sm sm:text-base text-slate-600">
            {language === 'fr' ? 'Essayez de modifier vos critères de recherche' : 
             language === 'en' ? 'Try modifying your search criteria' : 
             'Arama kriterlerinizi değiştirmeyi deneyin'}
          </p>
        </div>
      )}

      {/* Modal Panier - Responsive */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-xs sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-teal-50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">
                  {language === 'fr' ? 'Mon Panier' : language === 'en' ? 'My Cart' : 'Sepetim'}
                </h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <ShoppingCart className="w-12 h-12 sm:w-16 sm:h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-sm sm:text-base text-slate-600">
                    {language === 'fr' ? 'Votre panier est vide' : 
                     language === 'en' ? 'Your cart is empty' : 
                     'Sepetiniz boş'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {cart.map(item => (
                    <div key={item.materiau.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-slate-200 rounded-lg sm:rounded-xl bg-slate-50 space-y-3 sm:space-y-0">
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900 text-sm sm:text-base">{item.materiau.nom}</h4>
                        <p className="text-xs sm:text-sm text-slate-600">{item.materiau.code_produit} - {item.materiau.unite}</p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <button
                            onClick={() => updateQuantity(item.materiau.id, item.quantite - 1)}
                            className="bg-red-500 text-white p-1 sm:p-2 rounded-lg hover:bg-red-600 transition-colors"
                          >
                            <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <span className="font-bold text-slate-900 min-w-[2rem] text-center text-sm sm:text-base">
                            {item.quantite}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.materiau.id, item.quantite + 1)}
                            className="bg-green-500 text-white p-1 sm:p-2 rounded-lg hover:bg-green-600 transition-colors"
                          >
                            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.materiau.id)}
                          className="text-red-500 hover:text-red-700 text-xs sm:text-sm font-medium"
                        >
                          {language === 'fr' ? 'Supprimer' : language === 'en' ? 'Remove' : 'Kaldır'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    onClick={clearCart}
                    className="flex-1 border border-slate-300 text-slate-700 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:bg-slate-100 transition-colors text-sm sm:text-base"
                  >
                    {language === 'fr' ? 'Vider le Panier' : language === 'en' ? 'Clear Cart' : 'Sepeti Temizle'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCart(false);
                      setShowOrderModal(true);
                    }}
                    className="flex-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-teal-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg text-sm sm:text-base"
                  >
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>
                      {language === 'fr' ? 'Passer Commande' : language === 'en' ? 'Place Order' : 'Sipariş Ver'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Commande - Ultra Responsive */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-xs sm:max-w-2xl lg:max-w-6xl max-h-[95vh] overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-teal-50">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">
                {language === 'fr' ? 'Finaliser la Commande' : 
                 language === 'en' ? 'Finalize Order' : 
                 'Siparişi Tamamla'}
              </h2>
            </div>

            <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Formulaire */}
                <div className="space-y-4 sm:space-y-6">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">
                    {language === 'fr' ? 'Informations de Livraison' : 
                     language === 'en' ? 'Delivery Information' : 
                     'Teslimat Bilgileri'}
                  </h3>

                  {/* Type de destination */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      {language === 'fr' ? 'Destination de livraison' : 
                       language === 'en' ? 'Delivery destination' : 
                       'Teslimat hedefi'} <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <button
                        type="button"
                        onClick={() => setOrderForm({ ...orderForm, destinationType: 'depot', destination_name: '' })}
                        className={`p-3 sm:p-4 border-2 rounded-lg sm:rounded-xl text-left transition-all ${
                          orderForm.destinationType === 'depot'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm sm:text-base">
                              {language === 'fr' ? 'Dépôt Existant' : language === 'en' ? 'Existing Depot' : 'Mevcut Depo'}
                            </p>
                            <p className="text-xs sm:text-sm text-slate-600">
                              {language === 'fr' ? 'Livrer à un dépôt' : language === 'en' ? 'Deliver to depot' : 'Depoya teslim et'}
                            </p>
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOrderForm({ ...orderForm, destinationType: 'custom', depot_id: '' })}
                        className={`p-3 sm:p-4 border-2 rounded-lg sm:rounded-xl text-left transition-all ${
                          orderForm.destinationType === 'custom'
                            ? 'border-green-500 bg-green-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="bg-green-100 p-2 rounded-lg">
                            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm sm:text-base">
                              {language === 'fr' ? 'Autre Destination' : language === 'en' ? 'Other Destination' : 'Diğer Hedef'}
                            </p>
                            <p className="text-xs sm:text-sm text-slate-600">
                              {language === 'fr' ? 'Nom personnalisé' : language === 'en' ? 'Custom name' : 'Özel ad'}
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Sélection dépôt ou nom custom */}
                  {orderForm.destinationType === 'depot' && user?.role === 'directeur' ? (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {language === 'fr' ? 'Sélectionner le dépôt' : 
                         language === 'en' ? 'Select depot' : 
                         'Depo seç'} <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={orderForm.depot_id}
                        onChange={(e) => setOrderForm({ ...orderForm, depot_id: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">
                          {language === 'fr' ? 'Choisir un dépôt...' : 
                           language === 'en' ? 'Choose a depot...' : 
                           'Depo seçin...'}
                        </option>
                        {depots.map(depot => (
                          <option key={depot.id} value={depot.id}>
                            {depot.nom} - {depot.adresse}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {language === 'fr' ? 'Nom de la destination' : 
                         language === 'en' ? 'Destination name' : 
                         'Hedef adı'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={orderForm.destination_name}
                        onChange={(e) => setOrderForm({ ...orderForm, destination_name: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder={language === 'fr' ? 'Ex: Chantier Bastos, Bureau Yaoundé...' : 
                                     language === 'en' ? 'Ex: Bastos Site, Yaoundé Office...' : 
                                     'Örn: Bastos Şantiyesi, Yaoundé Ofisi...'}
                        required
                      />
                    </div>
                  )}

                  {/* Priorité */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      {language === 'fr' ? 'Priorité' : language === 'en' ? 'Priority' : 'Öncelik'}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <button
                        type="button"
                        onClick={() => setOrderForm({ ...orderForm, priorite: 'normale' })}
                        className={`p-3 sm:p-4 border-2 rounded-lg sm:rounded-xl text-left transition-all ${
                          orderForm.priorite === 'normale'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-semibold text-slate-900 text-sm sm:text-base">
                              {language === 'fr' ? 'Normale' : language === 'en' ? 'Normal' : 'Normal'}
                            </p>
                            <p className="text-xs sm:text-sm text-slate-600">
                              {language === 'fr' ? 'Livraison standard' : language === 'en' ? 'Standard delivery' : 'Standart teslimat'}
                            </p>
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOrderForm({ ...orderForm, priorite: 'urgente' })}
                        className={`p-3 sm:p-4 border-2 rounded-lg sm:rounded-xl text-left transition-all ${
                          orderForm.priorite === 'urgente'
                            ? 'border-red-500 bg-red-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                          <div>
                            <p className="font-semibold text-slate-900 text-sm sm:text-base">
                              {language === 'fr' ? 'Urgente' : language === 'en' ? 'Urgent' : 'Acil'}
                            </p>
                            <p className="text-xs sm:text-sm text-slate-600">
                              {language === 'fr' ? 'Livraison prioritaire' : language === 'en' ? 'Priority delivery' : 'Öncelikli teslimat'}
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Date de livraison */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {language === 'fr' ? 'Date de livraison souhaitée' : 
                       language === 'en' ? 'Desired delivery date' : 
                       'İstenen teslimat tarihi'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={orderForm.date_livraison_souhaitee}
                      onChange={(e) => setOrderForm({ ...orderForm, date_livraison_souhaitee: e.target.value })}
                      min={today}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Commentaire */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {language === 'fr' ? 'Commentaire' : language === 'en' ? 'Comment' : 'Yorum'}
                    </label>
                    <textarea
                      value={orderForm.commentaire_demandeur}
                      onChange={(e) => setOrderForm({ ...orderForm, commentaire_demandeur: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder={language === 'fr' ? 'Précisions sur la commande...' : 
                                   language === 'en' ? 'Order specifications...' : 
                                   'Sipariş detayları...'}
                    />
                  </div>
                </div>

                {/* Résumé de commande - Ultra professionnel */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
                    <div className="flex items-center justify-center mb-4">
                      <Star className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-300 mr-2" />
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold">
                        {language === 'fr' ? 'Résumé de la Commande' : 
                         language === 'en' ? 'Order Summary' : 
                         'Sipariş Özeti'}
                      </h3>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <div className="bg-white bg-opacity-20 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center backdrop-blur-sm">
                        <Package className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2" />
                        <p className="text-lg sm:text-2xl font-bold">{getTotalItems()}</p>
                        <p className="text-xs sm:text-sm text-emerald-100">
                          {language === 'fr' ? 'Articles' : language === 'en' ? 'Items' : 'Ürün'}
                        </p>
                      </div>
                      <div className="bg-white bg-opacity-20 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center backdrop-blur-sm">
                        <User className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2" />
                        <p className="text-lg sm:text-2xl font-bold">{getUniqueItems()}</p>
                        <p className="text-xs sm:text-sm text-emerald-100">
                          {language === 'fr' ? 'Matériaux' : language === 'en' ? 'Materials' : 'Malzeme'}
                        </p>
                      </div>
                      <div className="bg-white bg-opacity-20 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center backdrop-blur-sm">
                        <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2" />
                        <p className="text-sm sm:text-lg font-bold">
                          {orderForm.priorite === 'urgente' ? 
                            (language === 'fr' ? 'URGENT' : language === 'en' ? 'URGENT' : 'ACİL') :
                            (language === 'fr' ? 'NORMAL' : language === 'en' ? 'NORMAL' : 'NORMAL')
                          }
                        </p>
                        <p className="text-xs sm:text-sm text-emerald-100">
                          {language === 'fr' ? 'Priorité' : language === 'en' ? 'Priority' : 'Öncelik'}
                        </p>
                      </div>
                      <div className="bg-white bg-opacity-20 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center backdrop-blur-sm">
                        <Calendar className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2" />
                        <p className="text-sm sm:text-lg font-bold">
                          {orderForm.date_livraison_souhaitee ? 
                            new Date(orderForm.date_livraison_souhaitee).toLocaleDateString() : 
                            '---'
                          }
                        </p>
                        <p className="text-xs sm:text-sm text-emerald-100">
                          {language === 'fr' ? 'Livraison' : language === 'en' ? 'Delivery' : 'Teslimat'}
                        </p>
                      </div>
                    </div>

                    {/* Destination */}
                    <div className="bg-white bg-opacity-20 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 backdrop-blur-sm">
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
                        <div>
                          <p className="font-medium text-sm sm:text-base">
                            {language === 'fr' ? 'Destination:' : language === 'en' ? 'Destination:' : 'Hedef:'}
                          </p>
                          <p className="text-emerald-100 text-sm sm:text-base">
                            {orderForm.destinationType === 'depot' && user?.role === 'directeur' ? 
                              (orderForm.depot_id ? 
                                depots.find(d => d.id === orderForm.depot_id)?.nom || 'Dépôt sélectionné' :
                                (language === 'fr' ? 'Veuillez sélectionner un dépôt' : 
                                 language === 'en' ? 'Please select a depot' : 
                                 'Lütfen depo seçin')
                              ) :
                              (orderForm.destination_name || 
                                (language === 'fr' ? 'Veuillez saisir une destination' : 
                                 language === 'en' ? 'Please enter destination' : 
                                 'Lütfen hedef girin')
                              )
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Liste des matériaux */}
                  <div className="space-y-3 sm:space-y-4">
                    <h4 className="font-semibold text-slate-900 text-sm sm:text-base">
                      {language === 'fr' ? 'Matériaux Commandés' : 
                       language === 'en' ? 'Ordered Materials' : 
                       'Sipariş Edilen Malzemeler'}
                    </h4>
                    <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
                      {cart.map(item => (
                        <div key={item.materiau.id} className="bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                            <div className="flex-1">
                              <p className="font-medium text-slate-900 text-sm sm:text-base">{item.materiau.nom}</p>
                              <p className="text-xs sm:text-sm text-slate-600">{item.materiau.code_produit}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-blue-600 text-sm sm:text-base">
                                {item.quantite} {item.materiau.unite}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={() => {
                    setShowOrderModal(false);
                    resetOrderForm();
                  }}
                  className="flex-1 border border-slate-300 text-slate-700 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:bg-slate-100 transition-colors text-sm sm:text-base"
                >
                  {language === 'fr' ? 'Annuler' : language === 'en' ? 'Cancel' : 'İptal'}
                </button>
                <button
                  onClick={handleSubmitOrder}
                  disabled={submittingOrder || cart.length === 0}
                  className="flex-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg text-sm sm:text-base"
                >
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>
                    {submittingOrder ? 
                      (language === 'fr' ? 'Envoi en cours...' : language === 'en' ? 'Submitting...' : 'Gönderiliyor...') :
                      (language === 'fr' ? 'Confirmer la Commande' : language === 'en' ? 'Confirm Order' : 'Siparişi Onayla')
                    }
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirecteurChefCatalog;