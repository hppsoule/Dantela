import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  MapPin, 
  User, 
  Edit, 
  Trash2,
  Users,
  Package,
  CheckCircle,
  X,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Layout from '../components/Layout';
//const API_BASE = import.meta.env.VITE_API_URL ?? '/api';


interface Depot {
  id: string;
  nom: string;
  adresse: string;
  description: string;
  directeur_nom: string;
  directeur_prenom: string;
  magazinier_nom: string;
  magazinier_prenom: string;
  magazinier_email: string;
  is_active: boolean;
  created_at: string;
}

interface Magazinier {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  created_at: string;
}

const DepotManagementPage: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [, forceUpdate] = useState({});
  
  const [depots, setDepots] = useState<Depot[]>([]);
  const [magaziniers, setMagaziniers] = useState<Magazinier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDepot, setSelectedDepot] = useState<Depot | null>(null);

  // Formulaire
  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    description: '',
    magazinier_id: ''
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
    fetchData();
  }, []);

// en haut du fichier (optionnel) : base configurable
const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

const fetchData = async () => {
  try {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const [depotsResponse, magaziniersResponse] = await Promise.all([
      fetch(`${API_BASE}/admin/depots`, { headers }),
      fetch(`${API_BASE}/admin/magaziniers`, { headers }),
    ]);

    if (depotsResponse.ok) {
      const depotsData = await depotsResponse.json();
      setDepots(depotsData.depots || []);
    }

    if (magaziniersResponse.ok) {
      const magaziniersData = await magaziniersResponse.json();
      setMagaziniers(magaziniersData.magaziniers || []);
    }
  } catch (error) {
    console.error('Erreur lors du chargement:', error);
    setError('Erreur de connexion');
  } finally {
    setLoading(false);
  }
};

const handleCreateDepot = async () => {
  if (!formData.nom || !formData.adresse) {
    alert("Le nom et l'adresse sont obligatoires");
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}/admin/depots`, {
      method: 'POST',
      headers,
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      const data = await response.json();
      alert(data.message);
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } else {
      const errorData = await response.json();
      alert(errorData.message);
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de la création du dépôt');
  }
};

const handleUpdateDepot = async () => {
  if (!selectedDepot || !formData.nom || !formData.adresse) {
    alert("Le nom et l'adresse sont obligatoires");
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}/admin/depots/${selectedDepot.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      const data = await response.json();
      alert(data.message);
      setShowEditModal(false);
      resetForm();
      setSelectedDepot(null);
      fetchData();
    } else {
      const errorData = await response.json();
      alert(errorData.message);
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de la mise à jour du dépôt');
  }
};

const handleDeleteDepot = async (force = false) => {
  if (!selectedDepot) return;

  try {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}/admin/depots/${selectedDepot.id}`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ force }),
    });

    const data = await response.json();

    if (response.ok) {
      alert(data.message);
      setShowDeleteModal(false);
      setSelectedDepot(null);
      fetchData();
    } else {
      if (data.message?.includes('contient') || data.message?.includes('associée')) {
        const confirmForce = window.confirm(
          `${data.message}\n\nVoulez-vous désactiver le dépôt au lieu de le supprimer définitivement ?`
        );
        if (confirmForce) handleDeleteDepot(true);
      } else {
        alert(data.message);
      }
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de la suppression du dépôt');
  }
};

const handleAssignMagazinier = async (depotId: string, magazinierId: string) => {
  try {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}/admin/depots/${depotId}/assign-magazinier`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ magazinier_id: magazinierId }),
    });

    if (response.ok) {
      const data = await response.json();
      alert(data.message);
      setShowAssignModal(false);
      setSelectedDepot(null);
      fetchData();
    } else {
      const errorData = await response.json();
      alert(errorData.message);
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert("Erreur lors de l'attribution du magazinier");
  }
};


  const resetForm = () => {
    setFormData({
      nom: '',
      adresse: '',
      description: '',
      magazinier_id: ''
    });
  };

  // Filtrer les dépôts
  const depotsFiltres = depots.filter(depot =>
    depot.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    depot.adresse.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {language === 'fr' ? 'Gestion des Dépôts' : 
               language === 'en' ? 'Depot Management' : 
               'Depo Yönetimi'}
            </h1>
            <p className="text-slate-600 mt-2">
              {language === 'fr' ? 'Créez et gérez les dépôts de matériaux' : 
               language === 'en' ? 'Create and manage material depots' : 
               'Malzeme depolarını oluşturun ve yönetin'}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center space-x-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>
              {language === 'fr' ? 'Nouveau Dépôt' : 
               language === 'en' ? 'New Depot' : 
               'Yeni Depo'}
            </span>
          </button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { 
              label: language === 'fr' ? 'Total Dépôts' : language === 'en' ? 'Total Depots' : 'Toplam Depo',
              value: depots.length,
              color: 'bg-blue-500'
            },
            { 
              label: language === 'fr' ? 'Dépôts Actifs' : language === 'en' ? 'Active Depots' : 'Aktif Depolar',
              value: depots.filter(d => d.is_active).length,
              color: 'bg-green-500'
            },
            { 
              label: language === 'fr' ? 'Avec Magazinier' : language === 'en' ? 'With Manager' : 'Müdürlü',
              value: depots.filter(d => d.magazinier_nom).length,
              color: 'bg-purple-500'
            },
            { 
              label: language === 'fr' ? 'Sans Magazinier' : language === 'en' ? 'Without Manager' : 'Müdürsüz',
              value: depots.filter(d => !d.magazinier_nom).length,
              color: 'bg-orange-500'
            }
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-4">
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

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'fr' ? 'Rechercher un dépôt...' : 
                             language === 'en' ? 'Search depot...' : 
                             'Depo ara...'}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition-colors"
              />
            </div>

            <div className="flex items-center text-sm text-slate-600">
              <Building2 className="w-4 h-4 mr-2" />
              {depotsFiltres.length} {language === 'fr' ? 'dépôt(s) trouvé(s)' : 
                                     language === 'en' ? 'depot(s) found' : 
                                     'depo bulundu'}
            </div>
          </div>
        </div>

        {/* Liste des dépôts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {depotsFiltres.map(depot => (
            <div key={depot.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100">
              <div className="p-6">
                {/* Header avec statut */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{depot.nom}</h3>
                    <div className="flex items-center space-x-2 mb-3">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <p className="text-sm text-slate-600">{depot.adresse}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    depot.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {depot.is_active ? 
                      (language === 'fr' ? 'Actif' : language === 'en' ? 'Active' : 'Aktif') : 
                      (language === 'fr' ? 'Inactif' : language === 'en' ? 'Inactive' : 'Pasif')
                    }
                  </span>
                </div>

                {/* Description */}
                {depot.description && (
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">{depot.description}</p>
                )}

                {/* Informations du magazinier */}
                <div className="bg-slate-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">
                      {language === 'fr' ? 'Magazinier Responsable' : 
                       language === 'en' ? 'Responsible Manager' : 
                       'Sorumlu Müdür'}
                    </span>
                  </div>
                  
                  {depot.magazinier_nom ? (
                    <div>
                      <p className="font-medium text-slate-900">
                        {depot.magazinier_prenom} {depot.magazinier_nom}
                      </p>
                      <p className="text-sm text-slate-600">{depot.magazinier_email}</p>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      <span className="text-sm text-orange-600">
                        {language === 'fr' ? 'Aucun magazinier attribué' : 
                         language === 'en' ? 'No manager assigned' : 
                         'Atanmış müdür yok'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedDepot(depot);
                      setFormData({
                        nom: depot.nom,
                        adresse: depot.adresse,
                        description: depot.description || '',
                        magazinier_id: ''
                      });
                      setShowEditModal(true);
                    }}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-1 shadow-md"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="text-sm">
                      {language === 'fr' ? 'Modifier' : language === 'en' ? 'Edit' : 'Düzenle'}
                    </span>
                  </button>
                  
                  {!depot.magazinier_nom && (
                    <button
                      onClick={() => {
                        setSelectedDepot(depot);
                        setShowAssignModal(true);
                      }}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center space-x-1 shadow-md"
                    >
                      <Users className="w-4 h-4" />
                      <span className="text-sm">
                        {language === 'fr' ? 'Attribuer' : language === 'en' ? 'Assign' : 'Ata'}
                      </span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setSelectedDepot(depot);
                      setShowDeleteModal(true);
                    }}
                    className="bg-gradient-to-r from-red-500 to-red-600 text-white py-2 px-3 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center justify-center shadow-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Date de création */}
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    {language === 'fr' ? 'Créé le' : language === 'en' ? 'Created on' : 'Oluşturulma'} {new Date(depot.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {depotsFiltres.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {language === 'fr' ? 'Aucun dépôt trouvé' : 
               language === 'en' ? 'No depot found' : 
               'Depo bulunamadı'}
            </h3>
            <p className="text-slate-600">
              {searchTerm ? 
                (language === 'fr' ? 'Aucun dépôt ne correspond à votre recherche' : 
                 language === 'en' ? 'No depot matches your search' : 
                 'Aramanıza uygun depo yok') :
                (language === 'fr' ? 'Aucun dépôt créé pour le moment' : 
                 language === 'en' ? 'No depot created yet' : 
                 'Henüz depo oluşturulmadı')
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                {language === 'fr' ? 'Créer le premier dépôt' : 
                 language === 'en' ? 'Create first depot' : 
                 'İlk depoyu oluştur'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal Création/Modification */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                {showCreateModal ? 
                  (language === 'fr' ? 'Créer un Nouveau Dépôt' : 
                   language === 'en' ? 'Create New Depot' : 
                   'Yeni Depo Oluştur') :
                  (language === 'fr' ? 'Modifier le Dépôt' : 
                   language === 'en' ? 'Edit Depot' : 
                   'Depoyu Düzenle')
                }
              </h2>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {language === 'fr' ? 'Nom du dépôt' : language === 'en' ? 'Depot name' : 'Depo adı'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={language === 'fr' ? 'Ex: Dépôt Douala' : language === 'en' ? 'Ex: Douala Depot' : 'Örn: Douala Deposu'}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {language === 'fr' ? 'Adresse' : language === 'en' ? 'Address' : 'Adres'} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.adresse}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={language === 'fr' ? 'Adresse complète du dépôt' : language === 'en' ? 'Complete depot address' : 'Deponun tam adresi'}
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {language === 'fr' ? 'Description' : language === 'en' ? 'Description' : 'Açıklama'}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={language === 'fr' ? 'Description du dépôt (optionnel)' : language === 'en' ? 'Depot description (optional)' : 'Depo açıklaması (isteğe bağlı)'}
                    rows={2}
                  />
                </div>

                {showCreateModal && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {language === 'fr' ? 'Magazinier responsable' : language === 'en' ? 'Responsible manager' : 'Sorumlu müdür'}
                    </label>
                    <select
                      value={formData.magazinier_id}
                      onChange={(e) => setFormData({ ...formData, magazinier_id: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">
                        {language === 'fr' ? 'Sélectionner un magazinier (optionnel)' : 
                         language === 'en' ? 'Select a manager (optional)' : 
                         'Müdür seçin (isteğe bağlı)'}
                      </option>
                      {magaziniers.map((magazinier) => (
                        <option key={magazinier.id} value={magazinier.id}>
                          {magazinier.prenom} {magazinier.nom} - {magazinier.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    showCreateModal ? setShowCreateModal(false) : setShowEditModal(false);
                    resetForm();
                    setSelectedDepot(null);
                  }}
                  className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-100"
                >
                  {language === 'fr' ? 'Annuler' : language === 'en' ? 'Cancel' : 'İptal'}
                </button>
                <button
                  onClick={showCreateModal ? handleCreateDepot : handleUpdateDepot}
                  className="flex-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {showCreateModal ? 
                      (language === 'fr' ? 'Créer le Dépôt' : language === 'en' ? 'Create Depot' : 'Depo Oluştur') :
                      (language === 'fr' ? 'Modifier le Dépôt' : language === 'en' ? 'Update Depot' : 'Depoyu Güncelle')
                    }
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Attribution Magazinier */}
      {showAssignModal && selectedDepot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                {language === 'fr' ? 'Attribuer un Magazinier' : 
                 language === 'en' ? 'Assign Manager' : 
                 'Müdür Ata'}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {language === 'fr' ? 'Dépôt:' : language === 'en' ? 'Depot:' : 'Depo:'} {selectedDepot.nom}
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {magaziniers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">
                      {language === 'fr' ? 'Aucun magazinier disponible' : 
                       language === 'en' ? 'No manager available' : 
                       'Müsait müdür yok'}
                    </p>
                  </div>
                ) : (
                  magaziniers.map(magazinier => (
                    <div key={magazinier.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 cursor-pointer"
                         onClick={() => handleAssignMagazinier(selectedDepot.id, magazinier.id)}>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {magazinier.prenom.charAt(0)}{magazinier.nom.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {magazinier.prenom} {magazinier.nom}
                          </p>
                          <p className="text-sm text-slate-600">{magazinier.email}</p>
                          {magazinier.telephone && (
                            <p className="text-xs text-slate-500">{magazinier.telephone}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedDepot(null);
                }}
                className="w-full border border-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-100"
              >
                {language === 'fr' ? 'Annuler' : language === 'en' ? 'Cancel' : 'İptal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
      {showDeleteModal && selectedDepot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                {language === 'fr' ? 'Supprimer le Dépôt' : 
                 language === 'en' ? 'Delete Depot' : 
                 'Depoyu Sil'}
              </h2>
            </div>

            <div className="p-6">
              <div className="flex items-start space-x-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500 mt-1" />
                <div>
                  <p className="text-slate-900 font-medium mb-2">
                    {language === 'fr' ? 'Êtes-vous sûr de vouloir supprimer ce dépôt ?' : 
                     language === 'en' ? 'Are you sure you want to delete this depot?' : 
                     'Bu depoyu silmek istediğinizden emin misiniz?'}
                  </p>
                  <p className="text-sm text-slate-600 mb-2">
                    <strong>{selectedDepot.nom}</strong>
                  </p>
                  <p className="text-sm text-red-600">
                    {language === 'fr' ? 'Cette action est irréversible et supprimera tous les matériaux associés.' : 
                     language === 'en' ? 'This action is irreversible and will delete all associated materials.' : 
                     'Bu işlem geri alınamaz ve ilişkili tüm malzemeleri siler.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedDepot(null);
                  }}
                  className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-100"
                >
                  {language === 'fr' ? 'Annuler' : language === 'en' ? 'Cancel' : 'İptal'}
                </button>
                <button
                  onClick={() => {
                    handleDeleteDepot(false);
                  }}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-2 rounded-lg hover:from-red-700 hover:to-red-800"
                >
                  {language === 'fr' ? 'Supprimer' : language === 'en' ? 'Delete' : 'Sil'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default DepotManagementPage;