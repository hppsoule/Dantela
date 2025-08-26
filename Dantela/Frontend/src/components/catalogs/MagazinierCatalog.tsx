import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Eye, 
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  CheckCircle,
  X,
  Camera,
  Download,
  FileSpreadsheet,
  FileText
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
  categorie_id: string;
  image_url?: string;
}

interface Categorie {
  id: string;
  nom: string;
  description: string;
  materiaux_count: number;
}

const MagazinierCatalog: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  
  // États principaux
  const [materiaux, setMateriaux] = useState<Materiau[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMateriau, setSelectedMateriau] = useState<Materiau | null>(null);
  
  // Formulaire
  const [formData, setFormData] = useState({
    code_produit: '',
    nom: '',
    description: '',
    unite: '',
    stock_actuel: 0,
    stock_minimum: 0,
    fournisseur: '',
    categorie_id: '',
    image: null as File | null
  });
  
  // États pour nouvelles catégories
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryData, setNewCategoryData] = useState({
    nom: '',
    description: ''
  });
  
  // Export
  const [exportCategory, setExportCategory] = useState('all');
  
  // Image preview
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Unités prédéfinies
  const unitesPredefines = [
    'sac 50kg', 'sac 25kg', 'm³', 'ml', 'm²', 'barre 12m', 'barre 6m',
    'panneau 6x2.4m', 'unité', 'paquet 100pcs', 'kg', 'litre', 'rouleau 100m',
    'tube 125ml', 'bidon 20L', 'cartouche 310ml'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const [materiauxResponse, categoriesResponse] = await Promise.all([
        fetch('http://localhost:5000/api/materiaux', { headers }),
        fetch('http://localhost:5000/api/materiaux/categories', { headers })
      ]);

      if (materiauxResponse.ok) {
        const materiauxData = await materiauxResponse.json();
        setMateriaux(materiauxData.materiaux || []);
      }

      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData.categories || []);
      }

    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour créer une nouvelle catégorie
  const handleCreateCategory = async () => {
    if (!newCategoryData.nom.trim()) {
      alert('Le nom de la catégorie est obligatoire');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/categories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCategoryData),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Recharger les catégories
        await fetchData();
        
        // Sélectionner automatiquement la nouvelle catégorie
        setFormData({ ...formData, categorie_id: data.categorie.id });
        
        // Réinitialiser le formulaire de nouvelle catégorie
        setNewCategoryData({ nom: '', description: '' });
        setShowNewCategoryForm(false);
        
        alert('Catégorie créée avec succès !');
      } else {
        const errorData = await response.json();
        alert(errorData.message);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création de la catégorie');
    }
  };

  // Fonction pour ouvrir le modal d'édition
  const openEditModal = (materiau: Materiau) => {
    setSelectedMateriau(materiau);
    setFormData({
      code_produit: materiau.code_produit,
      nom: materiau.nom,
      description: materiau.description || '',
      unite: materiau.unite,
      stock_actuel: materiau.stock_actuel,
      stock_minimum: materiau.stock_minimum,
      fournisseur: materiau.fournisseur || '',
      categorie_id: materiau.categorie_id,
      image: null
    });
    
    // Charger l'image existante dans l'aperçu
    if (materiau.image_url) {
      setImagePreview(materiau.image_url);
    }
    
    setShowEditModal(true);
  };

  // Fonction pour supprimer un produit
  const handleDeleteProduct = async () => {
    if (!selectedMateriau) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/materiaux/${selectedMateriau.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('Produit supprimé avec succès !');
        setShowDeleteModal(false);
        setSelectedMateriau(null);
        fetchData(); // Recharger les données
      } else {
        const errorData = await response.json();
        alert(errorData.message);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  };

  // Fonction pour soumettre le formulaire
  const handleSubmit = async () => {
    // Validation
    if (!formData.code_produit || !formData.nom || !formData.unite || !formData.categorie_id) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      // Ajouter tous les champs
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'image' && value !== null) {
          formDataToSend.append(key, value.toString());
        }
      });
      
      // Ajouter l'image si présente
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      const url = showEditModal 
        ? `http://localhost:5000/api/materiaux/${selectedMateriau?.id}`
        : 'http://localhost:5000/api/materiaux';
      
      const method = showEditModal ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        
        // Fermer le modal et réinitialiser
        setShowAddModal(false);
        setShowEditModal(false);
        resetForm();
        fetchData(); // Recharger les données
      } else {
        const errorData = await response.json();
        alert(errorData.message);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      code_produit: '',
      nom: '',
      description: '',
      unite: '',
      stock_actuel: 0,
      stock_minimum: 0,
      fournisseur: '',
      categorie_id: '',
      image: null
    });
    setImagePreview(null);
    setSelectedMateriau(null);
    setShowNewCategoryForm(false);
    setNewCategoryData({ nom: '', description: '' });
  };

  // Gestion de l'upload d'image
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      
      // Créer un aperçu
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Filtrer les matériaux
  const materiauxFiltres = materiaux.filter(materiau => {
    const matchSearch = materiau.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       materiau.code_produit.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchCategory = selectedCategory === 'all' || materiau.categorie_id === selectedCategory;
    
    const matchLowStock = !showLowStockOnly || materiau.stock_actuel <= materiau.stock_minimum;
    
    return matchSearch && matchCategory && matchLowStock;
  });

  // Export Excel
  const exportToExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      
      const dataToExport = materiauxFiltres.map(materiau => ({
        'Code Produit': materiau.code_produit,
        'Nom': materiau.nom,
        'Description': materiau.description,
        'Unité': materiau.unite,
        'Stock Actuel': materiau.stock_actuel,
        'Stock Minimum': materiau.stock_minimum,
        'Fournisseur': materiau.fournisseur,
        'Catégorie': materiau.categorie_nom
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Matériaux');
      XLSX.writeFile(wb, 'catalogue_materiaux.xlsx');
    } catch (error) {
      console.error('Erreur export Excel:', error);
      alert('Erreur lors de l\'export Excel');
    }
  };

  // Export PDF
  const exportToPDF = async () => {
    try {
      const jsPDF = await import('jspdf');
      const autoTable = await import('jspdf-autotable');
      
      const doc = new jsPDF.default();
      
      doc.setFontSize(20);
      doc.text('Catalogue des Matériaux - DANTELA', 20, 20);
      
      const tableData = materiauxFiltres.map(materiau => [
        materiau.code_produit,
        materiau.nom,
        materiau.unite,
        materiau.stock_actuel.toString(),
        materiau.stock_minimum.toString(),
        materiau.categorie_nom
      ]);

      autoTable.default(doc, {
        head: [['Code', 'Nom', 'Unité', 'Stock', 'Min', 'Catégorie']],
        body: tableData,
        startY: 30,
      });

      doc.save('catalogue_materiaux.pdf');
    } catch (error) {
      console.error('Erreur export PDF:', error);
      alert('Erreur lors de l\'export PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {language === 'fr' ? 'Catalogue des Matériaux' : 
             language === 'en' ? 'Materials Catalog' : 
             'Malzeme Kataloğu'}
          </h1>
          <p className="text-slate-600 mt-2">
            {language === 'fr' ? 'Gérez les matériaux de construction' : 
             language === 'en' ? 'Manage construction materials' : 
             'İnşaat malzemelerini yönetin'}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center space-x-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>
              {language === 'fr' ? 'Ajouter Produit' : 
               language === 'en' ? 'Add Product' : 
               'Ürün Ekle'}
            </span>
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { 
            label: language === 'fr' ? 'Total Produits' : language === 'en' ? 'Total Products' : 'Toplam Ürün',
            value: materiaux.length,
            color: 'bg-blue-500'
          },
          { 
            label: language === 'fr' ? 'Stock Faible' : language === 'en' ? 'Low Stock' : 'Düşük Stok',
            value: materiaux.filter(m => m.stock_actuel <= m.stock_minimum).length,
            color: 'bg-red-500'
          },
          { 
            label: language === 'fr' ? 'Catégories' : language === 'en' ? 'Categories' : 'Kategoriler',
            value: categories.length,
            color: 'bg-green-500'
          },
          { 
            label: language === 'fr' ? 'Fournisseurs' : language === 'en' ? 'Suppliers' : 'Tedarikçiler',
            value: new Set(materiaux.map(m => m.fournisseur).filter(Boolean)).size,
            color: 'bg-purple-500'
          }
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-4 border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
              <div className={`${stat.color} w-3 h-3 rounded-full`}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres et Export */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === 'fr' ? 'Rechercher...' : 
                           language === 'en' ? 'Search...' : 
                           'Ara...'}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition-colors"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition-colors"
          >
            <option value="all">
              {language === 'fr' ? 'Toutes les catégories' : 
               language === 'en' ? 'All categories' : 
               'Tüm kategoriler'}
            </option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.nom} ({category.materiaux_count})
              </option>
            ))}
          </select>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showLowStockOnly}
              onChange={(e) => setShowLowStockOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">
              {language === 'fr' ? 'Stock faible uniquement' : 
               language === 'en' ? 'Low stock only' : 
               'Sadece düşük stok'}
            </span>
          </label>

          <div className="flex space-x-2">
            <button
              onClick={exportToExcel}
              className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-1"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="text-sm">Excel</span>
            </button>
            <button
              onClick={exportToPDF}
              className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-1"
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm">PDF</span>
            </button>
          </div>

          <div className="flex items-center text-sm text-slate-600">
            <Package className="w-4 h-4 mr-2" />
            {materiauxFiltres.length} {language === 'fr' ? 'produit(s)' : 
                                       language === 'en' ? 'product(s)' : 
                                       'ürün'}
          </div>
        </div>
      </div>

      {/* Grille des matériaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {materiauxFiltres.map(materiau => (
          <div key={materiau.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-100 hover:scale-[1.02]">
            {/* Image */}
            <div className="relative h-48 bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center overflow-hidden">
              {materiau.image_url ? (
                <img
                  src={materiau.image_url}
                  alt={materiau.nom}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <Package className="w-16 h-16 text-slate-400 drop-shadow-lg" />
              )}
              
              {/* Badge de stock */}
              <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
                materiau.stock_actuel <= materiau.stock_minimum 
                  ? 'bg-red-500 text-white' 
                  : materiau.stock_actuel <= materiau.stock_minimum * 2
                  ? 'bg-orange-500 text-white'
                  : 'bg-green-500 text-white'
              }`}>
                Stock: {materiau.stock_actuel}
              </div>
            </div>

            {/* Contenu */}
            <div className="p-4">
              <div className="mb-3">
                <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-2 leading-tight">
                  {materiau.nom}
                </h3>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 px-2 py-1 rounded-md text-xs font-medium">
                    {materiau.code_produit}
                  </span>
                  <span className="bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 px-2 py-1 rounded-md text-xs">
                    {materiau.categorie_nom}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-600">Stock:</span>
                  <span className="font-bold text-slate-900">{materiau.stock_actuel} {materiau.unite}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Minimum:</span>
                  <span className="font-medium text-slate-700">{materiau.stock_minimum} {materiau.unite}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => openEditModal(materiau)}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2 px-3 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 flex items-center justify-center space-x-1 shadow-md"
                >
                  <Edit className="w-4 h-4" />
                  <span className="text-sm">Modifier</span>
                </button>
                
                <button
                  onClick={() => {
                    setSelectedMateriau(materiau);
                    setShowViewModal(true);
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-1 shadow-md"
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">Voir</span>
                </button>
                
                <button
                  onClick={() => {
                    setSelectedMateriau(materiau);
                    setShowDeleteModal(true);
                  }}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white py-2 px-3 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center justify-center shadow-md"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Ajout/Modification */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-6xl h-[90vh] flex flex-col">
            {/* Header fixe */}
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-blue-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">
                  {showAddModal ? 
                    (language === 'fr' ? 'Ajouter un Nouveau Produit' : 
                     language === 'en' ? 'Add New Product' : 
                     'Yeni Ürün Ekle') :
                    (language === 'fr' ? 'Modifier le Produit' : 
                     language === 'en' ? 'Edit Product' : 
                     'Ürünü Düzenle')
                  }
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Contenu scrollable */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Formulaire */}
                  <div className="space-y-6">
                    <div className="bg-slate-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">
                        {language === 'fr' ? 'Informations du Produit' : 
                         language === 'en' ? 'Product Information' : 
                         'Ürün Bilgileri'}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            {language === 'fr' ? 'Code Produit' : language === 'en' ? 'Product Code' : 'Ürün Kodu'} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.code_produit}
                            onChange={(e) => setFormData({ ...formData, code_produit: e.target.value.toUpperCase() })}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            placeholder="Ex: CIM-001"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            {language === 'fr' ? 'Nom du Produit' : language === 'en' ? 'Product Name' : 'Ürün Adı'} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.nom}
                            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            placeholder={language === 'fr' ? 'Nom du produit' : language === 'en' ? 'Product name' : 'Ürün adı'}
                            required
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          {language === 'fr' ? 'Description' : language === 'en' ? 'Description' : 'Açıklama'}
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          placeholder={language === 'fr' ? 'Description détaillée du produit' : 
                                       language === 'en' ? 'Detailed product description' : 
                                       'Detaylı ürün açıklaması'}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {/* Unité avec possibilité de créer */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            <Package className="w-4 h-4 inline mr-1" />
                            {language === 'fr' ? 'Unité de Mesure' : language === 'en' ? 'Unit of Measure' : 'Ölçü Birimi'} <span className="text-red-500">*</span>
                          </label>
                          <input
                            list="unites-list"
                            type="text"
                            value={formData.unite}
                            onChange={(e) => setFormData({ ...formData, unite: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            placeholder={language === 'fr' ? 'Tapez ou sélectionnez une unité' : 
                                         language === 'en' ? 'Type or select a unit' : 
                                         'Birim yazın veya seçin'}
                            required
                          />
                          <datalist id="unites-list">
                            {unitesPredefines.map(unite => (
                              <option key={unite} value={unite} />
                            ))}
                          </datalist>
                        </div>

                        {/* Catégorie avec possibilité de créer */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            {language === 'fr' ? 'Catégorie' : language === 'en' ? 'Category' : 'Kategori'} <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={formData.categorie_id}
                            onChange={(e) => {
                              if (e.target.value === 'new') {
                                setShowNewCategoryForm(true);
                              } else {
                                setFormData({ ...formData, categorie_id: e.target.value });
                              }
                            }}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            required
                          >
                            <option value="">
                              {language === 'fr' ? 'Sélectionner une catégorie' : 
                               language === 'en' ? 'Select a category' : 
                               'Kategori seçin'}
                            </option>
                            {categories.map(category => (
                              <option key={category.id} value={category.id}>
                                {category.nom}
                              </option>
                            ))}
                            <option value="new" className="font-medium text-blue-600">
                              ➕ {language === 'fr' ? 'Créer nouvelle catégorie' : 
                                   language === 'en' ? 'Create new category' : 
                                   'Yeni kategori oluştur'}
                            </option>
                          </select>

                          {/* Formulaire nouvelle catégorie */}
                          {showNewCategoryForm && (
                            <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <h4 className="font-medium text-blue-900 mb-3">
                                {language === 'fr' ? 'Nouvelle Catégorie' : 
                                 language === 'en' ? 'New Category' : 
                                 'Yeni Kategori'}
                              </h4>
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  value={newCategoryData.nom}
                                  onChange={(e) => setNewCategoryData({ ...newCategoryData, nom: e.target.value })}
                                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder={language === 'fr' ? 'Nom de la catégorie' : 
                                               language === 'en' ? 'Category name' : 
                                               'Kategori adı'}
                                />
                                <input
                                  type="text"
                                  value={newCategoryData.description}
                                  onChange={(e) => setNewCategoryData({ ...newCategoryData, description: e.target.value })}
                                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder={language === 'fr' ? 'Description (optionnel)' : 
                                               language === 'en' ? 'Description (optional)' : 
                                               'Açıklama (isteğe bağlı)'}
                                />
                                <div className="flex space-x-2">
                                  <button
                                    onClick={handleCreateCategory}
                                    className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
                                  >
                                    {language === 'fr' ? 'Créer' : language === 'en' ? 'Create' : 'Oluştur'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setShowNewCategoryForm(false);
                                      setNewCategoryData({ nom: '', description: '' });
                                    }}
                                    className="border border-slate-300 text-slate-700 px-3 py-1 rounded-md text-sm hover:bg-slate-50"
                                  >
                                    {language === 'fr' ? 'Annuler' : language === 'en' ? 'Cancel' : 'İptal'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            {language === 'fr' ? 'Stock Actuel' : language === 'en' ? 'Current Stock' : 'Mevcut Stok'}
                          </label>
                          <input
                            type="number"
                            value={formData.stock_actuel}
                            onChange={(e) => setFormData({ ...formData, stock_actuel: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            min="0"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            {language === 'fr' ? 'Stock Minimum' : language === 'en' ? 'Minimum Stock' : 'Minimum Stok'}
                          </label>
                          <input
                            type="number"
                            value={formData.stock_minimum}
                            onChange={(e) => setFormData({ ...formData, stock_minimum: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            min="0"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          {language === 'fr' ? 'Fournisseur' : language === 'en' ? 'Supplier' : 'Tedarikçi'}
                        </label>
                        <input
                          type="text"
                          value={formData.fournisseur}
                          onChange={(e) => setFormData({ ...formData, fournisseur: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          placeholder={language === 'fr' ? 'Nom du fournisseur' : 
                                       language === 'en' ? 'Supplier name' : 
                                       'Tedarikçi adı'}
                        />
                      </div>

                      {/* Upload d'image */}
                      <div className="mt-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          {language === 'fr' ? 'Image du Produit' : language === 'en' ? 'Product Image' : 'Ürün Resmi'}
                        </label>
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                          {imagePreview ? (
                            <div className="relative">
                              <img
                                src={imagePreview}
                                alt="Aperçu"
                                className="w-full h-48 object-cover rounded-lg"
                              />
                              <button
                                onClick={() => {
                                  setImagePreview(null);
                                  setFormData({ ...formData, image: null });
                                }}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div>
                              <Camera className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                              <p className="text-slate-600 mb-2">
                                {language === 'fr' ? 'Cliquez pour ajouter une image' : 
                                 language === 'en' ? 'Click to add an image' : 
                                 'Resim eklemek için tıklayın'}
                              </p>
                              <p className="text-xs text-slate-500">PNG, JPG, WEBP jusqu'à 5MB</p>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                                id="image-upload"
                              />
                              <label
                                htmlFor="image-upload"
                                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer mt-3"
                              >
                                {language === 'fr' ? 'Choisir une image' : 
                                 language === 'en' ? 'Choose image' : 
                                 'Resim seç'}
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Aperçu */}
                  <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                      {language === 'fr' ? 'Aperçu du Produit' : 
                       language === 'en' ? 'Product Preview' : 
                       'Ürün Önizlemesi'}
                    </h3>
                    
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                      {/* Image d'aperçu */}
                      <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="Aperçu"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-16 h-16 text-slate-400" />
                        )}
                      </div>

                      {/* Informations d'aperçu */}
                      <div className="p-4">
                        <h4 className="font-bold text-slate-900 text-lg mb-2">
                          {formData.nom || (language === 'fr' ? 'Nom du produit' : 
                                           language === 'en' ? 'Product name' : 
                                           'Ürün adı')}
                        </h4>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Code:</span>
                            <span className="font-medium">{formData.code_produit || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">
                              {language === 'fr' ? 'Unité:' : language === 'en' ? 'Unit:' : 'Birim:'}
                            </span>
                            <span className="font-medium">{formData.unite || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Stock:</span>
                            <span className="font-medium">{formData.stock_actuel}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Minimum:</span>
                            <span className="font-medium">{formData.stock_minimum}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">
                              {language === 'fr' ? 'Fournisseur:' : language === 'en' ? 'Supplier:' : 'Tedarikçi:'}
                            </span>
                            <span className="font-medium">{formData.fournisseur || '-'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer fixe avec boutons */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex-shrink-0">
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="flex-1 border-2 border-slate-300 text-slate-700 py-3 px-6 rounded-lg hover:bg-slate-100 font-medium transition-all duration-200"
                >
                  {language === 'fr' ? 'Annuler' : language === 'en' ? 'Cancel' : 'İptal'}
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-8 rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>
                    {showAddModal ? 
                      (language === 'fr' ? 'Ajouter le Produit' : 
                       language === 'en' ? 'Add Product' : 
                       'Ürün Ekle') :
                      (language === 'fr' ? 'Modifier le Produit' : 
                       language === 'en' ? 'Update Product' : 
                       'Ürünü Güncelle')
                    }
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de visualisation */}
      {showViewModal && selectedMateriau && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">
                  {language === 'fr' ? 'Détails du Produit' : 
                   language === 'en' ? 'Product Details' : 
                   'Ürün Detayları'}
                </h2>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedMateriau(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image */}
                <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl h-64 flex items-center justify-center">
                  {selectedMateriau.image_url ? (
                    <img
                      src={selectedMateriau.image_url}
                      alt={selectedMateriau.nom}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <Package className="w-20 h-20 text-slate-400" />
                  )}
                </div>

                {/* Informations */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{selectedMateriau.nom}</h3>
                    <p className="text-slate-600">{selectedMateriau.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-600 font-medium">Code Produit</p>
                      <p className="font-bold text-blue-900">{selectedMateriau.code_produit}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm text-green-600 font-medium">Unité</p>
                      <p className="font-bold text-green-900">{selectedMateriau.unite}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="text-sm text-purple-600 font-medium">Stock Actuel</p>
                      <p className="font-bold text-purple-900">{selectedMateriau.stock_actuel}</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <p className="text-sm text-orange-600 font-medium">Stock Minimum</p>
                      <p className="font-bold text-orange-900">{selectedMateriau.stock_minimum}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm text-slate-600 font-medium">Catégorie</p>
                    <p className="font-bold text-slate-900">{selectedMateriau.categorie_nom}</p>
                  </div>

                  {selectedMateriau.fournisseur && (
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-sm text-slate-600 font-medium">Fournisseur</p>
                      <p className="font-bold text-slate-900">{selectedMateriau.fournisseur}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedMateriau(null);
                  }}
                  className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-100"
                >
                  {language === 'fr' ? 'Fermer' : language === 'en' ? 'Close' : 'Kapat'}
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openEditModal(selectedMateriau);
                  }}
                  className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 text-white py-2 px-6 rounded-lg hover:from-orange-700 hover:to-orange-800 flex items-center justify-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>
                    {language === 'fr' ? 'Modifier' : language === 'en' ? 'Edit' : 'Düzenle'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de suppression */}
      {showDeleteModal && selectedMateriau && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                {language === 'fr' ? 'Supprimer le Produit' : 
                 language === 'en' ? 'Delete Product' : 
                 'Ürünü Sil'}
              </h2>
            </div>

            <div className="p-6">
              <div className="flex items-start space-x-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500 mt-1" />
                <div>
                  <p className="text-slate-900 font-medium mb-2">
                    {language === 'fr' ? 'Êtes-vous sûr de vouloir supprimer ce produit ?' : 
                     language === 'en' ? 'Are you sure you want to delete this product?' : 
                     'Bu ürünü silmek istediğinizden emin misiniz?'}
                  </p>
                  <p className="text-sm text-slate-600 mb-2">
                    <strong>{selectedMateriau.nom}</strong> ({selectedMateriau.code_produit})
                  </p>
                  <p className="text-sm text-red-600">
                    {language === 'fr' ? 'Cette action est irréversible.' : 
                     language === 'en' ? 'This action is irreversible.' : 
                     'Bu işlem geri alınamaz.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedMateriau(null);
                  }}
                  className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-100"
                >
                  {language === 'fr' ? 'Annuler' : language === 'en' ? 'Cancel' : 'İptal'}
                </button>
                <button
                  onClick={handleDeleteProduct}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-2 rounded-lg hover:from-red-700 hover:to-red-800"
                >
                  {language === 'fr' ? 'Supprimer' : language === 'en' ? 'Delete' : 'Sil'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {materiauxFiltres.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            {language === 'fr' ? 'Aucun produit trouvé' : 
             language === 'en' ? 'No products found' : 
             'Ürün bulunamadı'}
          </h3>
          <p className="text-slate-600">
            {searchTerm || selectedCategory !== 'all' || showLowStockOnly ? 
              (language === 'fr' ? 'Aucun produit ne correspond à vos critères' : 
               language === 'en' ? 'No products match your criteria' : 
               'Kriterlerinize uygun ürün yok') :
              (language === 'fr' ? 'Aucun produit dans le catalogue' : 
               language === 'en' ? 'No products in catalog' : 
               'Katalogda ürün yok')
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default MagazinierCatalog;