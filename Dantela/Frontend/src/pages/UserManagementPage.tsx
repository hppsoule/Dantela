import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  Shield,
  User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Layout from '../components/Layout';

interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  adresse?: string;
  role: 'directeur' | 'magazinier' | 'chef_chantier';
  nom_chantier?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PendingUser {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  role: 'magazinier' | 'chef_chantier';
  nom_chantier?: string;
  created_at: string;
}

const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { language } = useLanguage();
  const [, forceUpdate] = useState({});
  
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // Modals
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | PendingUser | null>(null);

  // État pour le formulaire d'édition
  const [editForm, setEditForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    nom_chantier: ''
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

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Récupérer les utilisateurs en attente
      const pendingResponse = await fetch('http://localhost:5000/api/admin/pending-users', { headers });
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        setPendingUsers(pendingData.users || []);
      }

      // Récupérer tous les utilisateurs actifs
      const usersResponse = await fetch('http://localhost:5000/api/admin/users?is_active=true', { headers });
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
      }

    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateUser = async (userId: string, action: 'approve' | 'reject') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/validate-user/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        fetchData(); // Recharger les données
      } else {
        const errorData = await response.json();
        alert(errorData.message);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la validation');
    }
  };

  const resetEditForm = () => {
    setEditForm({
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      adresse: '',
      nom_chantier: ''
    });
  };

  const handleUpdateUser = async () => {
    if (!selectedUser || !('is_active' in selectedUser)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        setShowEditModal(false);
        setSelectedUser(null);
        resetEditForm();
        fetchData();
      } else {
        const errorData = await response.json();
        alert(errorData.message);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteUser = async (force: boolean = false) => {
    if (!selectedUser || !('is_active' in selectedUser)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        setShowDeleteModal(false);
        setSelectedUser(null);
        fetchData();
      } else {
        const errorData = await response.json();
        alert(errorData.message);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  };

  // Filtrer les utilisateurs en attente
  const pendingUsersFiltres = pendingUsers.filter(user => {
    const matchSearch = user.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       user.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchRole = selectedRole === 'all' || user.role === selectedRole;
    
    return matchSearch && matchRole;
  });

  // Filtrer les utilisateurs actifs
  const usersFiltres = users.filter(user => {
    const matchSearch = user.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       user.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (user.nom_chantier && user.nom_chantier.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchRole = selectedRole === 'all' || user.role === selectedRole;
    const matchStatus = selectedStatus === 'all' || 
                       (selectedStatus === 'active' && user.is_active) ||
                       (selectedStatus === 'pending' && !user.is_active);
    
    return matchSearch && matchRole && matchStatus;
  });
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'directeur': return 'bg-purple-100 text-purple-800';
      case 'magazinier': return 'bg-blue-100 text-blue-800';
      case 'chef_chantier': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'directeur': return <Shield className="w-4 h-4" />;
      case 'magazinier': return <Building2 className="w-4 h-4" />;
      case 'chef_chantier': return <User className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'directeur': 
        return language === 'fr' ? 'Directeur' : 
               language === 'en' ? 'Director' : 
               'Müdür';
      case 'magazinier': 
        return language === 'fr' ? 'Magazinier' : 
               language === 'en' ? 'Warehouse Manager' : 
               'Depo Sorumlusu';
      case 'chef_chantier': 
        return language === 'fr' ? 'Chef de Chantier' : 
               language === 'en' ? 'Site Manager' : 
               'Şantiye Şefi';
      default: return role;
    }
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {language === 'fr' ? 'Gestion des Utilisateurs' : 
               language === 'en' ? 'User Management' : 
               'Kullanıcı Yönetimi'}
            </h1>
            <p className="text-slate-600 mt-2">
              {language === 'fr' ? 'Gérez les comptes utilisateurs et les validations' : 
               language === 'en' ? 'Manage user accounts and validations' : 
               'Kullanıcı hesaplarını ve onayları yönetin'}
            </p>
          </div>
          <div className="flex space-x-3">
            <button className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center space-x-2 shadow-lg">
              <Plus className="w-5 h-5" />
              <span>
                {language === 'fr' ? 'Inviter Utilisateur' : 
                 language === 'en' ? 'Invite User' : 
                 'Kullanıcı Davet Et'}
              </span>
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { 
              label: language === 'fr' ? 'En Attente' : language === 'en' ? 'Pending' : 'Beklemede',
              value: pendingUsers.length,
              color: 'bg-orange-500',
              icon: Clock
            },
            { 
              label: language === 'fr' ? 'Magaziniers' : language === 'en' ? 'Warehouse Managers' : 'Depo Sorumluları',
              value: users.filter(u => u.role === 'magazinier').length,
              color: 'bg-blue-500',
              icon: Building2
            },
            { 
              label: language === 'fr' ? 'Chefs de Chantier' : language === 'en' ? 'Site Managers' : 'Şantiye Şefleri',
              value: users.filter(u => u.role === 'chef_chantier').length,
              color: 'bg-green-500',
              icon: User
            },
            { 
              label: language === 'fr' ? 'Total Utilisateurs' : language === 'en' ? 'Total Users' : 'Toplam Kullanıcı',
              value: users.length + pendingUsers.length,
              color: 'bg-purple-500',
              icon: Users
            }
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-xl shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'fr' ? 'Rechercher un utilisateur...' : 
                             language === 'en' ? 'Search user...' : 
                             'Kullanıcı ara...'}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition-colors"
              />
            </div>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition-colors"
            >
              <option value="all">
                {language === 'fr' ? 'Tous les rôles' : 
                 language === 'en' ? 'All roles' : 
                 'Tüm roller'}
              </option>
              <option value="magazinier">
                {language === 'fr' ? 'Magaziniers' : 
                 language === 'en' ? 'Warehouse Managers' : 
                 'Depo Sorumluları'}
              </option>
              <option value="chef_chantier">
                {language === 'fr' ? 'Chefs de Chantier' : 
                 language === 'en' ? 'Site Managers' : 
                 'Şantiye Şefleri'}
              </option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition-colors"
            >
              <option value="all">
                {language === 'fr' ? 'Tous les statuts' : 
                 language === 'en' ? 'All statuses' : 
                 'Tüm durumlar'}
              </option>
              <option value="pending">
                {language === 'fr' ? 'En attente' : 
                 language === 'en' ? 'Pending' : 
                 'Beklemede'}
              </option>
              <option value="active">
                {language === 'fr' ? 'Actifs' : 
                 language === 'en' ? 'Active' : 
                 'Aktif'}
              </option>
            </select>

            <div className="flex items-center text-sm text-slate-600">
              <Users className="w-4 h-4 mr-2" />
              {(selectedStatus === 'pending' ? pendingUsersFiltres.length : 
                selectedStatus === 'active' ? usersFiltres.length : 
                pendingUsersFiltres.length + usersFiltres.length)} {language === 'fr' ? 'utilisateur(s)' : 
                                                                    language === 'en' ? 'user(s)' : 
                                                                    'kullanıcı'}
            </div>
          </div>
        </div>

        {/* Section Utilisateurs en Attente - Afficher seulement si pas de filtre "active" */}
        {pendingUsers.length > 0 && selectedStatus !== 'active' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100">
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-orange-50 to-orange-100">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-500 p-2 rounded-lg">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {language === 'fr' ? 'Demandes en Attente de Validation' : 
                     language === 'en' ? 'Pending Validation Requests' : 
                     'Onay Bekleyen Talepler'}
                  </h2>
                  <p className="text-slate-600">
                    {pendingUsers.length} {language === 'fr' ? 'nouvelle(s) demande(s) d\'inscription' : 
                                           language === 'en' ? 'new registration request(s)' : 
                                           'yeni kayıt talebi'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingUsersFiltres.map(user => (
                  <div key={user.id} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-all duration-300">
                    {/* Header avec avatar */}
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-lg">
                          {user.prenom.charAt(0)}{user.nom.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 text-lg">
                          {user.prenom} {user.nom}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getRoleColor(user.role)}`}>
                            {getRoleIcon(user.role)}
                            <span>{getRoleText(user.role)}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Informations */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-700">{user.email}</span>
                      </div>
                      
                      {user.telephone && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Phone className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-700">{user.telephone}</span>
                        </div>
                      )}

                      {user.nom_chantier && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Building2 className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-700">{user.nom_chantier}</span>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-700">
                          {language === 'fr' ? 'Demandé le' : language === 'en' ? 'Requested on' : 'Talep tarihi'} {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDetailsModal(true);
                        }}
                        className="flex-1 bg-gradient-to-r from-slate-600 to-slate-700 text-white py-2 px-3 rounded-lg hover:from-slate-700 hover:to-slate-800 transition-all duration-200 flex items-center justify-center space-x-1 shadow-md"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-sm">
                          {language === 'fr' ? 'Détails' : language === 'en' ? 'Details' : 'Detaylar'}
                        </span>
                      </button>
                      
                      <button
                        onClick={() => handleValidateUser(user.id, 'approve')}
                        className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-2 px-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center justify-center space-x-1 shadow-md"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span className="text-sm">
                          {language === 'fr' ? 'Approuver' : language === 'en' ? 'Approve' : 'Onayla'}
                        </span>
                      </button>
                      
                      <button
                        onClick={() => handleValidateUser(user.id, 'reject')}
                        className="bg-gradient-to-r from-red-600 to-red-700 text-white py-2 px-3 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 flex items-center justify-center shadow-md"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {pendingUsersFiltres.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    {language === 'fr' ? 'Aucune demande en attente' : 
                     language === 'en' ? 'No pending requests' : 
                     'Bekleyen talep yok'}
                  </h3>
                  <p className="text-slate-600">
                    {language === 'fr' ? 'Toutes les demandes ont été traitées' : 
                     language === 'en' ? 'All requests have been processed' : 
                     'Tüm talepler işlendi'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section Utilisateurs Actifs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-blue-100">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 p-2 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {language === 'fr' ? 'Utilisateurs Actifs' : 
                   language === 'en' ? 'Active Users' : 
                   'Aktif Kullanıcılar'}
                </h2>
                <p className="text-slate-600">
                  {users.length} {language === 'fr' ? 'comptes validés et opérationnels' : 
                                  language === 'en' ? 'validated and operational accounts' : 
                                  'onaylanmış ve operasyonel hesap'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  {language === 'fr' ? 'Aucun utilisateur actif' : 
                   language === 'en' ? 'No active users' : 
                   'Aktif kullanıcı yok'}
                </h3>
                <p className="text-slate-600">
                  {language === 'fr' ? 'Les utilisateurs validés apparaîtront ici' : 
                   language === 'en' ? 'Validated users will appear here' : 
                   'Onaylanmış kullanıcılar burada görünecek'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map(user => (
                  <div key={user.id} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-all duration-300">
                    {/* Header avec avatar */}
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-lg">
                          {user.prenom.charAt(0)}{user.nom.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 text-lg">
                          {user.prenom} {user.nom}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getRoleColor(user.role)}`}>
                            {getRoleIcon(user.role)}
                            <span>{getRoleText(user.role)}</span>
                          </span>
                          <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3" />
                            <span>
                              {language === 'fr' ? 'Actif' : language === 'en' ? 'Active' : 'Aktif'}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Informations */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-700">{user.email}</span>
                      </div>
                      
                      {user.telephone && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Phone className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-700">{user.telephone}</span>
                        </div>
                      )}

                      {user.nom_chantier && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Building2 className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-700">{user.nom_chantier}</span>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-700">
                          {language === 'fr' ? 'Créé le' : language === 'en' ? 'Created on' : 'Oluşturulma'} {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDetailsModal(true);
                        }}
                        className="flex-1 bg-gradient-to-r from-slate-600 to-slate-700 text-white py-2 px-3 rounded-lg hover:from-slate-700 hover:to-slate-800 transition-all duration-200 flex items-center justify-center space-x-1 shadow-md"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-sm">
                          {language === 'fr' ? 'Détails' : language === 'en' ? 'Details' : 'Detaylar'}
                        </span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setEditForm({
                            nom: user.nom,
                            prenom: user.prenom,
                            email: user.email,
                            telephone: user.telephone || '',
                            adresse: user.adresse || '',
                            nom_chantier: user.nom_chantier || ''
                          });
                          setShowEditModal(true);
                        }}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center space-x-1 shadow-md"
                      >
                        <Edit className="w-4 h-4" />
                        <span className="text-sm">
                          {language === 'fr' ? 'Modifier' : language === 'en' ? 'Edit' : 'Düzenle'}
                        </span>
                      </button>
                      
                      {user.role !== 'directeur' && (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeleteModal(true);
                          }}
                          className="bg-gradient-to-r from-red-600 to-red-700 text-white py-2 px-3 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 flex items-center justify-center shadow-md"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Détails Utilisateur */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">
                  {language === 'fr' ? 'Détails de l\'Utilisateur' : 
                   language === 'en' ? 'User Details' : 
                   'Kullanıcı Detayları'}
                </h2>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedUser(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="space-y-6">
                {/* Informations personnelles */}
                <div className="bg-slate-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>
                      {language === 'fr' ? 'Informations Personnelles' : 
                       language === 'en' ? 'Personal Information' : 
                       'Kişisel Bilgiler'}
                    </span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        {language === 'fr' ? 'Nom complet' : language === 'en' ? 'Full name' : 'Tam ad'}
                      </label>
                      <p className="text-slate-900 font-medium">{selectedUser.prenom} {selectedUser.nom}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        {language === 'fr' ? 'Rôle' : language === 'en' ? 'Role' : 'Rol'}
                      </label>
                      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(selectedUser.role)}`}>
                        {getRoleIcon(selectedUser.role)}
                        <span>{getRoleText(selectedUser.role)}</span>
                      </span>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                      <p className="text-slate-900">{selectedUser.email}</p>
                    </div>
                    
                    {selectedUser.telephone && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {language === 'fr' ? 'Téléphone' : language === 'en' ? 'Phone' : 'Telefon'}
                        </label>
                        <p className="text-slate-900">{selectedUser.telephone}</p>
                      </div>
                    )}
                    
                    {selectedUser.nom_chantier && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {language === 'fr' ? 'Nom du chantier' : language === 'en' ? 'Site name' : 'Şantiye adı'}
                        </label>
                        <p className="text-slate-900">{selectedUser.nom_chantier}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informations de compte */}
                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>
                      {language === 'fr' ? 'Informations de Compte' : 
                       language === 'en' ? 'Account Information' : 
                       'Hesap Bilgileri'}
                    </span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        {language === 'fr' ? 'Date de création' : language === 'en' ? 'Creation date' : 'Oluşturma tarihi'}
                      </label>
                      <p className="text-slate-900">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        {language === 'fr' ? 'Statut' : language === 'en' ? 'Status' : 'Durum'}
                      </label>
                      {'is_active' in selectedUser && selectedUser.is_active ? (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-4 h-4" />
                          <span>
                            {language === 'fr' ? 'Actif' : language === 'en' ? 'Active' : 'Aktif'}
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                          <Clock className="w-4 h-4" />
                          <span>
                            {language === 'fr' ? 'En attente de validation' : 
                             language === 'en' ? 'Pending validation' : 
                             'Onay bekliyor'}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-100"
                >
                  {language === 'fr' ? 'Fermer' : language === 'en' ? 'Close' : 'Kapat'}
                </button>
                {!('is_active' in selectedUser) || !selectedUser.is_active ? (
                  <>
                    <button
                      onClick={() => handleValidateUser(selectedUser.id, 'approve')}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-2 px-6 rounded-lg hover:from-green-700 hover:to-green-800 flex items-center justify-center space-x-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>
                        {language === 'fr' ? 'Approuver' : language === 'en' ? 'Approve' : 'Onayla'}
                      </span>
                    </button>
                    <button
                      onClick={() => handleValidateUser(selectedUser.id, 'reject')}
                      className="bg-gradient-to-r from-red-600 to-red-700 text-white py-2 px-4 rounded-lg hover:from-red-700 hover:to-red-800 flex items-center justify-center shadow-md"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="flex-1 text-center py-2">
                    <span className="text-green-600 font-medium">
                      {language === 'fr' ? 'Utilisateur actif' : language === 'en' ? 'Active user' : 'Aktif kullanıcı'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Modification Utilisateur */}
      {showEditModal && selectedUser && 'is_active' in selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">
                  {language === 'fr' ? 'Modifier l\'Utilisateur' : 
                   language === 'en' ? 'Edit User' : 
                   'Kullanıcıyı Düzenle'}
                </h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                    resetEditForm();
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {language === 'fr' ? 'Nom' : language === 'en' ? 'Last Name' : 'Soyadı'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.nom}
                      onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {language === 'fr' ? 'Prénom' : language === 'en' ? 'First Name' : 'Adı'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.prenom}
                      onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {language === 'fr' ? 'Téléphone' : language === 'en' ? 'Phone' : 'Telefon'}
                  </label>
                  <input
                    type="tel"
                    value={editForm.telephone}
                    onChange={(e) => setEditForm({ ...editForm, telephone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+237 6XX XXX XXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {language === 'fr' ? 'Adresse' : language === 'en' ? 'Address' : 'Adres'}
                  </label>
                  <textarea
                    value={editForm.adresse}
                    onChange={(e) => setEditForm({ ...editForm, adresse: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder={language === 'fr' ? 'Adresse complète' : language === 'en' ? 'Complete address' : 'Tam adres'}
                  />
                </div>

                {selectedUser.role === 'chef_chantier' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {language === 'fr' ? 'Nom du chantier' : language === 'en' ? 'Site name' : 'Şantiye adı'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.nom_chantier}
                      onChange={(e) => setEditForm({ ...editForm, nom_chantier: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                    resetEditForm();
                  }}
                  className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-100"
                >
                  {language === 'fr' ? 'Annuler' : language === 'en' ? 'Cancel' : 'İptal'}
                </button>
                <button
                  onClick={handleUpdateUser}
                  className="flex-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {language === 'fr' ? 'Enregistrer les Modifications' : 
                     language === 'en' ? 'Save Changes' : 
                     'Değişiklikleri Kaydet'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Suppression Utilisateur - SÉCURISÉ */}
      {showDeleteModal && selectedUser && 'is_active' in selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                {language === 'fr' ? '⚠️ Suppression d\'Utilisateur' : 
                 language === 'en' ? '⚠️ User Deletion' : 
                 '⚠️ Kullanıcı Silme'}
              </h2>
            </div>

            <div className="p-6">
              <div className="flex items-start space-x-3 mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-slate-900 font-medium mb-3">
                    {language === 'fr' ? 'Êtes-vous sûr de vouloir supprimer cet utilisateur ?' : 
                     language === 'en' ? 'Are you sure you want to delete this user?' : 
                     'Bu kullanıcıyı silmek istediğinizden emin misiniz?'}
                  </p>
                  
                  <div className="bg-slate-100 rounded-lg p-3 mb-3">
                    <p className="font-bold text-slate-900">
                      {selectedUser.prenom} {selectedUser.nom}
                    </p>
                    <p className="text-sm text-slate-600">{selectedUser.email}</p>
                    <p className="text-sm text-slate-600 capitalize">{getRoleText(selectedUser.role)}</p>
                  </div>
                  
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                    <p className="text-sm text-orange-800">
                      <strong>
                        {language === 'fr' ? '🛡️ SÉCURITÉ :' : 
                         language === 'en' ? '🛡️ SECURITY:' : 
                         '🛡️ GÜVENLİK:'}
                      </strong><br/>
                      {language === 'fr' ? 'Si cet utilisateur a des commandes ou données associées, il sera DÉSACTIVÉ au lieu d\'être supprimé pour préserver l\'historique.' : 
                       language === 'en' ? 'If this user has orders or associated data, they will be DEACTIVATED instead of deleted to preserve history.' : 
                       'Bu kullanıcının siparişleri veya ilişkili verileri varsa, geçmişi korumak için silinmek yerine DEVRE DIŞI bırakılacaktır.'}
                    </p>
                  </div>
                  
                  <p className="text-sm text-red-600">
                    {language === 'fr' ? '⚠️ Cette action peut être irréversible selon les données associées.' : 
                     language === 'en' ? '⚠️ This action may be irreversible depending on associated data.' : 
                     '⚠️ Bu işlem ilişkili verilere bağlı olarak geri alınamaz olabilir.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-100"
                >
                  {language === 'fr' ? 'Annuler' : language === 'en' ? 'Cancel' : 'İptal'}
                </button>
                <button
                  onClick={() => handleDeleteUser(false)}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-2 rounded-lg hover:from-red-700 hover:to-red-800 flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>
                    {language === 'fr' ? 'Supprimer' : language === 'en' ? 'Delete' : 'Sil'}
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


export default UserManagementPage