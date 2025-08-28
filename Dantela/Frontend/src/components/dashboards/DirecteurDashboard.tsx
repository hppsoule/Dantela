import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Package, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Plus,
  UserCheck,
  UserX,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Target,
  Award,
  Star,
  Zap,
  Eye,
  RefreshCw,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
  Bell,
  Shield,
  Truck,
  FileText,
  Database,
  Server,
  Wifi,
  HardDrive
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
  ComposedChart
} from 'recharts';
import { useLanguage } from '../../contexts/LanguageContext';
import { PendingUser, Depot } from '../../types';
// Dev (Vite): '/api' -> proxy vers http://localhost:5000
// Prod (Vercel): '/api' réécrit vers https://dantela.onrender.com/api via vercel.json
const API = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');


interface DashboardData {
  users: {
    total: number;
    active: number;
    pending: number;
    by_role: {
      directeur: number;
      magazinier: number;
      chef_chantier: number;
    };
    growth: {
      this_month: number;
      percentage: number;
    };
  };
  depots: {
    total: number;
    active: number;
    with_manager: number;
    efficiency: number;
    top_performing: Array<{
      nom: string;
      efficiency: number;
      demandes: number;
    }>;
  };
  materiaux: {
    total: number;
    categories: number;
    low_stock: number;
    out_of_stock: number;
    top_requested: Array<{
      nom: string;
      code_produit: string;
      requests: number;
      stock: number;
    }>;
  };
  demandes: {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    approval_rate: number;
    by_priority: {
      urgente: number;
      haute: number;
      normale: number;
      basse: number;
    };
    monthly_trend: Array<{
      month: string;
      demandes: number;
      approved: number;
    }>;
  };
  mouvements: {
    total: number;
    entrees: number;
    sorties: number;
    daily_activity: Array<{
      day: string;
      entrees: number;
      sorties: number;
    }>;
  };
  performance: {
    system_uptime: number;
    avg_response_time: number;
    error_rate: number;
    user_satisfaction: number;
    efficiency_score: number;
  };
}

const DirecteurDashboard: React.FC = () => {
  const { language } = useLanguage();
  const [, forceUpdate] = useState({});
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('week');
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
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
  try {
    setRefreshing(true);
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Session expirée');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // passer la période au backend
    const params = new URLSearchParams({ period: selectedPeriod });

    // ✅ plus de 'http://localhost:5000', on utilise API
    const [overviewResponse, pendingResponse] = await Promise.all([
      fetch(`${API}/reports/overview?${params.toString()}`, { headers }),
      fetch(`${API}/admin/pending-users`, { headers }),
    ]);

    if (!overviewResponse.ok) {
      throw new Error('Erreur lors du chargement des données du tableau de bord');
    }
    const overviewData = await overviewResponse.json();
    if (overviewData?.success) {
      setDashboardData(overviewData.data);
    } else {
      throw new Error(overviewData?.message || 'Erreur chargement overview');
    }

    if (pendingResponse.ok) {
      const pendingData = await pendingResponse.json();
      setPendingUsers(pendingData.users || []);
    } else {
      // pas bloquant pour l’écran
      console.warn('Chargement des utilisateurs en attente: statut', pendingResponse.status);
    }
  } catch (err) {
    console.error('Erreur lors du chargement du dashboard:', err);
    setError(err instanceof Error ? err.message : 'Erreur de connexion');
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  const handleValidateUser = async (userId: string, action: 'approve' | 'reject') => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Session expirée');
      return;
    }

    const response = await fetch(`${API}/admin/validate-user/${userId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la validation');
    }

    alert(data.message || (action === 'approve' ? 'Utilisateur approuvé' : 'Utilisateur rejeté'));
    fetchDashboardData(); // recharger les données
  } catch (error) {
    console.error('Erreur lors de la validation:', error);
    alert(error instanceof Error ? error.message : 'Erreur lors de la validation');
  }
};

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  // Couleurs pour les graphiques
  const COLORS = {
    primary: '#3b82f6',
    secondary: '#10b981',
    accent: '#f59e0b',
    danger: '#ef4444',
    warning: '#f97316',
    success: '#059669',
    info: '#0891b2',
    purple: '#8b5cf6',
    pink: '#ec4899',
    indigo: '#6366f1'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec métriques clés */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 rounded-2xl p-8 text-white relative overflow-hidden">
        {/* Formes décoratives */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white bg-opacity-10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white bg-opacity-5 rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-3">
                {language === 'fr' ? 'Vue d\'Ensemble Directeur' : 
                 language === 'en' ? 'Director Overview' : 
                 'Müdür Genel Bakış'}
              </h1>
              <p className="text-xl text-slate-200">
                {language === 'fr' ? 'Tableau de bord exécutif avec analyses en temps réel' : 
                 language === 'en' ? 'Executive dashboard with real-time analytics' : 
                 'Gerçek zamanlı analizlerle yönetici panosu'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchDashboardData}
                disabled={refreshing}
                className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-xl hover:bg-opacity-30 transition-all duration-200 flex items-center space-x-2 backdrop-blur-sm"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>
                  {language === 'fr' ? 'Actualiser' : language === 'en' ? 'Refresh' : 'Yenile'}
                </span>
              </button>
              <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
                <BarChart3 className="w-8 h-8" />
              </div>
            </div>
          </div>

          {/* Métriques principales en header */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white bg-opacity-20 rounded-xl p-4 text-center backdrop-blur-sm">
              <Target className="w-8 h-8 mx-auto mb-2" />
              <p className="text-2xl font-bold">{dashboardData.demandes.approval_rate}%</p>
              <p className="text-sm text-slate-200">
                {language === 'fr' ? 'Taux Succès' : language === 'en' ? 'Success Rate' : 'Başarı Oranı'}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl p-4 text-center backdrop-blur-sm">
              <Activity className="w-8 h-8 mx-auto mb-2" />
              <p className="text-2xl font-bold">{formatNumber(dashboardData.mouvements.total)}</p>
              <p className="text-sm text-slate-200">
                {language === 'fr' ? 'Mouvements' : language === 'en' ? 'Movements' : 'Hareketler'}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl p-4 text-center backdrop-blur-sm">
              <Users className="w-8 h-8 mx-auto mb-2" />
              <p className="text-2xl font-bold">{dashboardData.users.active}</p>
              <p className="text-sm text-slate-200">
                {language === 'fr' ? 'Utilisateurs' : language === 'en' ? 'Users' : 'Kullanıcılar'}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl p-4 text-center backdrop-blur-sm">
              <Building2 className="w-8 h-8 mx-auto mb-2" />
              <p className="text-2xl font-bold">{dashboardData.depots.active}</p>
              <p className="text-sm text-slate-200">
                {language === 'fr' ? 'Dépôts' : language === 'en' ? 'Depots' : 'Depolar'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Détaillées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: language === 'fr' ? 'Utilisateurs Actifs' : language === 'en' ? 'Active Users' : 'Aktif Kullanıcılar',
            value: dashboardData.users.active.toString(),
            total: dashboardData.users.total,
            change: dashboardData.users.growth.percentage,
            icon: Users,
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-50',
            description: language === 'fr' ? 'Comptes validés' : language === 'en' ? 'Validated accounts' : 'Onaylanmış hesaplar'
          },
          {
            title: language === 'fr' ? 'Dépôts Opérationnels' : language === 'en' ? 'Operational Depots' : 'Operasyonel Depolar',
            value: dashboardData.depots.active.toString(),
            total: dashboardData.depots.total,
            change: 12.5,
            icon: Building2,
            color: 'from-green-500 to-green-600',
            bgColor: 'bg-green-50',
            description: language === 'fr' ? 'Avec magaziniers' : language === 'en' ? 'With managers' : 'Müdürlü'
          },
          {
            title: language === 'fr' ? 'Efficacité Système' : language === 'en' ? 'System Efficiency' : 'Sistem Verimliliği',
            value: `${dashboardData.performance.efficiency_score}%`,
            total: 100,
            change: 5.2,
            icon: Target,
            color: 'from-emerald-500 to-emerald-600',
            bgColor: 'bg-emerald-50',
            description: language === 'fr' ? 'Performance globale' : language === 'en' ? 'Global performance' : 'Genel performans'
          },
          {
            title: language === 'fr' ? 'Alertes Actives' : language === 'en' ? 'Active Alerts' : 'Aktif Uyarılar',
            value: (dashboardData.materiaux.low_stock + dashboardData.materiaux.out_of_stock).toString(),
            total: dashboardData.materiaux.total,
            change: -8.3,
            icon: AlertTriangle,
            color: 'from-red-500 to-red-600',
            bgColor: 'bg-red-50',
            description: language === 'fr' ? 'Stock faible/rupture' : language === 'en' ? 'Low/out of stock' : 'Düşük/tükenen stok'
          }
        ].map((kpi, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-100 hover:scale-105">
            <div className={`bg-gradient-to-r ${kpi.color} p-6 text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold mb-2">{kpi.value}</p>
                  <p className="text-white text-opacity-90 font-medium">{kpi.title}</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                  <kpi.icon className="w-8 h-8" />
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">{kpi.description}</span>
                <div className={`flex items-center space-x-1 ${getChangeColor(kpi.change)}`}>
                  {getChangeIcon(kpi.change)}
                  <span className="text-sm font-medium">
                    {kpi.change > 0 ? '+' : ''}{kpi.change}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full bg-gradient-to-r ${kpi.color} transition-all duration-500`}
                  style={{ width: `${Math.min((kpi.value.replace('%', '') / kpi.total) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Graphiques Principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution des Demandes */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {language === 'fr' ? 'Évolution des Demandes' : 
                 language === 'en' ? 'Requests Evolution' : 
                 'Talep Evrimi'}
              </h3>
              <p className="text-sm text-slate-600">
                {language === 'fr' ? 'Tendance sur 6 mois' : 
                 language === 'en' ? '6-month trend' : 
                 '6 aylık eğilim'}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardData.demandes.monthly_trend || []}>
                <defs>
                  <linearGradient id="colorDemandes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.success} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="demandes" 
                  stroke={COLORS.primary}
                  fillOpacity={1}
                  fill="url(#colorDemandes)"
                  strokeWidth={3}
                  name={language === 'fr' ? 'Demandes' : language === 'en' ? 'Requests' : 'Talepler'}
                />
                <Area 
                  type="monotone" 
                  dataKey="approved" 
                  stroke={COLORS.success}
                  fillOpacity={1}
                  fill="url(#colorApproved)"
                  strokeWidth={3}
                  name={language === 'fr' ? 'Approuvées' : language === 'en' ? 'Approved' : 'Onaylandı'}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activité Stock Quotidienne */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {language === 'fr' ? 'Activité Stock (7 jours)' : 
                 language === 'en' ? 'Stock Activity (7 days)' : 
                 'Stok Faaliyeti (7 gün)'}
              </h3>
              <p className="text-sm text-slate-600">
                {language === 'fr' ? 'Mouvements quotidiens' : 
                 language === 'en' ? 'Daily movements' : 
                 'Günlük hareketler'}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-xl">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData.mouvements.daily_activity || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="entrees" 
                  fill={COLORS.success}
                  name={language === 'fr' ? 'Entrées' : language === 'en' ? 'Inbound' : 'Giriş'}
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="sorties" 
                  fill={COLORS.danger}
                  name={language === 'fr' ? 'Sorties' : language === 'en' ? 'Outbound' : 'Çıkış'}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Analyses Détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Répartition Utilisateurs */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">
              {language === 'fr' ? 'Répartition Utilisateurs' : 
               language === 'en' ? 'User Distribution' : 
               'Kullanıcı Dağılımı'}
            </h3>
            <div className="bg-purple-100 p-2 rounded-lg">
              <PieChartIcon className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { 
                      name: language === 'fr' ? 'Directeur' : language === 'en' ? 'Director' : 'Müdür', 
                      value: dashboardData.users.by_role.directeur, 
                      color: COLORS.purple 
                    },
                    { 
                      name: language === 'fr' ? 'Magazinier' : language === 'en' ? 'Warehouse Manager' : 'Depo Sorumlusu', 
                      value: dashboardData.users.by_role.magazinier, 
                      color: COLORS.primary 
                    },
                    { 
                      name: language === 'fr' ? 'Chef Chantier' : language === 'en' ? 'Site Manager' : 'Şantiye Şefi', 
                      value: dashboardData.users.by_role.chef_chantier, 
                      color: COLORS.success 
                    }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({value}) => value > 0 ? value : ''}
                >
                  {[COLORS.purple, COLORS.primary, COLORS.success].map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Demandes par Priorité */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">
              {language === 'fr' ? 'Demandes par Priorité' : 
               language === 'en' ? 'Requests by Priority' : 
               'Önceliğe Göre Talepler'}
            </h3>
            <div className="bg-orange-100 p-2 rounded-lg">
              <Star className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { 
                      name: language === 'fr' ? 'Urgente' : language === 'en' ? 'Urgent' : 'Acil', 
                      value: dashboardData.demandes.by_priority?.urgente || 0, 
                      color: COLORS.danger 
                    },
                    { 
                      name: language === 'fr' ? 'Haute' : language === 'en' ? 'High' : 'Yüksek', 
                      value: dashboardData.demandes.by_priority?.haute || 0, 
                      color: COLORS.warning 
                    },
                    { 
                      name: language === 'fr' ? 'Normale' : language === 'en' ? 'Normal' : 'Normal', 
                      value: dashboardData.demandes.by_priority?.normale || 0, 
                      color: COLORS.primary 
                    },
                    { 
                      name: language === 'fr' ? 'Basse' : language === 'en' ? 'Low' : 'Düşük', 
                      value: dashboardData.demandes.by_priority?.basse || 0, 
                      color: COLORS.info 
                    }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({value}) => value > 0 ? value : ''}
                >
                  {[COLORS.danger, COLORS.warning, COLORS.primary, COLORS.info].map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Score */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">
              {language === 'fr' ? 'Score Performance' : 
               language === 'en' ? 'Performance Score' : 
               'Performans Skoru'}
            </h3>
            <div className="bg-indigo-100 p-2 rounded-lg">
              <Award className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={[
                {
                  name: language === 'fr' ? 'Efficacité' : language === 'en' ? 'Efficiency' : 'Verimlilik',
                  value: dashboardData.performance.efficiency_score,
                  fill: COLORS.primary
                },
                {
                  name: language === 'fr' ? 'Satisfaction' : language === 'en' ? 'Satisfaction' : 'Memnuniyet',
                  value: dashboardData.performance.user_satisfaction * 20, // Convert to percentage
                  fill: COLORS.success
                },
                {
                  name: language === 'fr' ? 'Disponibilité' : language === 'en' ? 'Uptime' : 'Çalışma Süresi',
                  value: dashboardData.performance.system_uptime,
                  fill: COLORS.purple
                }
              ]}>
                <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" />
                <Tooltip />
                <Legend />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-4">
            <div className="text-3xl font-bold text-indigo-600 mb-1">
              {Math.round((dashboardData.performance.efficiency_score + (dashboardData.performance.user_satisfaction * 20) + dashboardData.performance.system_uptime) / 3)}%
            </div>
            <p className="text-sm text-slate-600">
              {language === 'fr' ? 'Score Global' : language === 'en' ? 'Global Score' : 'Genel Skor'}
            </p>
          </div>
        </div>
      </div>

      {/* Sections Détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Matériaux Demandés */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">
              {language === 'fr' ? 'Matériaux les Plus Demandés' : 
               language === 'en' ? 'Most Requested Materials' : 
               'En Çok Talep Edilen Malzemeler'}
            </h3>
            <div className="bg-green-100 p-2 rounded-lg">
              <Package className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="space-y-4">
            {(dashboardData.materiaux.top_requested || []).slice(0, 5).map((materiau, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl hover:from-slate-100 hover:to-slate-200 transition-all duration-200">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 
                    index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' : 
                    index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                    'bg-gradient-to-r from-blue-400 to-blue-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{materiau.nom}</p>
                    <p className="text-sm text-slate-600">{materiau.code_produit}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-blue-600">{materiau.requests}</span>
                    <span className="text-sm text-slate-500">
                      {language === 'fr' ? 'demandes' : language === 'en' ? 'requests' : 'talep'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    Stock: <span className="font-medium">{materiau.stock}</span>
                  </p>
                </div>
              </div>
            ))}
            {(!dashboardData.materiaux.top_requested || dashboardData.materiaux.top_requested.length === 0) && (
              <div className="text-center py-8 text-slate-500">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p>
                  {language === 'fr' ? 'Aucune donnée disponible' : 
                   language === 'en' ? 'No data available' : 
                   'Veri mevcut değil'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Performance des Dépôts */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">
              {language === 'fr' ? 'Performance des Dépôts' : 
               language === 'en' ? 'Depot Performance' : 
               'Depo Performansı'}
            </h3>
            <div className="bg-purple-100 p-2 rounded-lg">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="space-y-4">
            {(dashboardData.depots.top_performing || []).map((depot, index) => (
              <div key={index} className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      depot.efficiency >= 90 ? 'bg-green-500' :
                      depot.efficiency >= 80 ? 'bg-yellow-500' :
                      depot.efficiency >= 70 ? 'bg-orange-500' :
                      'bg-red-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{depot.nom}</p>
                      <p className="text-sm text-slate-600">
                        {depot.demandes} {language === 'fr' ? 'demandes' : language === 'en' ? 'requests' : 'talep'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      depot.efficiency >= 90 ? 'bg-green-100 text-green-800' :
                      depot.efficiency >= 80 ? 'bg-yellow-100 text-yellow-800' :
                      depot.efficiency >= 70 ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {depot.efficiency}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      depot.efficiency >= 90 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                      depot.efficiency >= 80 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                      depot.efficiency >= 70 ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                      'bg-gradient-to-r from-red-400 to-red-500'
                    }`}
                    style={{ width: `${depot.efficiency}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {(!dashboardData.depots.top_performing || dashboardData.depots.top_performing.length === 0) && (
              <div className="text-center py-8 text-slate-500">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p>
                  {language === 'fr' ? 'Aucune donnée disponible' : 
                   language === 'en' ? 'No data available' : 
                   'Veri mevcut değil'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alertes et Actions Rapides */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertes Système */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">
              {language === 'fr' ? 'Alertes Système' : 
               language === 'en' ? 'System Alerts' : 
               'Sistem Uyarıları'}
            </h3>
            <div className="bg-red-100 p-2 rounded-lg">
              <Bell className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <div className="space-y-4">
            {/* Ruptures de stock */}
            <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <div>
                  <p className="font-medium text-red-900">
                    {language === 'fr' ? 'Ruptures de Stock' : language === 'en' ? 'Stock Outages' : 'Stok Tükenmesi'}
                  </p>
                  <p className="text-sm text-red-700">
                    {language === 'fr' ? 'Action immédiate requise' : language === 'en' ? 'Immediate action required' : 'Acil eylem gerekli'}
                  </p>
                </div>
              </div>
              <span className="text-2xl font-bold text-red-600">{dashboardData.materiaux.out_of_stock}</span>
            </div>

            {/* Stock faible */}
            <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <div className="flex items-center space-x-3">
                <Clock className="w-6 h-6 text-orange-500" />
                <div>
                  <p className="font-medium text-orange-900">
                    {language === 'fr' ? 'Stock Faible' : language === 'en' ? 'Low Stock' : 'Düşük Stok'}
                  </p>
                  <p className="text-sm text-orange-700">
                    {language === 'fr' ? 'Réapprovisionnement conseillé' : language === 'en' ? 'Restocking recommended' : 'Yeniden stok önerilir'}
                  </p>
                </div>
              </div>
              <span className="text-2xl font-bold text-orange-600">{dashboardData.materiaux.low_stock}</span>
            </div>

            {/* Demandes en attente */}
            <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-center space-x-3">
                <Clock className="w-6 h-6 text-yellow-500" />
                <div>
                  <p className="font-medium text-yellow-900">
                    {language === 'fr' ? 'Demandes en Attente' : language === 'en' ? 'Pending Requests' : 'Bekleyen Talepler'}
                  </p>
                  <p className="text-sm text-yellow-700">
                    {language === 'fr' ? 'Validation requise' : language === 'en' ? 'Validation required' : 'Onay gerekli'}
                  </p>
                </div>
              </div>
              <span className="text-2xl font-bold text-yellow-600">{dashboardData.demandes.pending}</span>
            </div>

            {/* Comptes en attente */}
            {pendingUsers.length > 0 && (
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center space-x-3">
                  <UserCheck className="w-6 h-6 text-blue-500" />
                  <div>
                    <p className="font-medium text-blue-900">
                      {language === 'fr' ? 'Nouveaux Comptes' : language === 'en' ? 'New Accounts' : 'Yeni Hesaplar'}
                    </p>
                    <p className="text-sm text-blue-700">
                      {language === 'fr' ? 'Validation en attente' : language === 'en' ? 'Pending validation' : 'Onay bekliyor'}
                    </p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-blue-600">{pendingUsers.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Métriques Système */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">
              {language === 'fr' ? 'Métriques Système' : 
               language === 'en' ? 'System Metrics' : 
               'Sistem Metrikleri'}
            </h3>
            <div className="bg-indigo-100 p-2 rounded-lg">
              <Server className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="space-y-6">
            {[
              {
                label: language === 'fr' ? 'Disponibilité Système' : language === 'en' ? 'System Uptime' : 'Sistem Çalışma Süresi',
                value: `${dashboardData.performance.system_uptime}%`,
                percentage: dashboardData.performance.system_uptime,
                color: 'bg-green-500',
                icon: Wifi
              },
              {
                label: language === 'fr' ? 'Temps de Réponse' : language === 'en' ? 'Response Time' : 'Yanıt Süresi',
                value: `${dashboardData.performance.avg_response_time}ms`,
                percentage: Math.max(0, 100 - (dashboardData.performance.avg_response_time / 10)),
                color: 'bg-blue-500',
                icon: Zap
              },
              {
                label: language === 'fr' ? 'Satisfaction Utilisateur' : language === 'en' ? 'User Satisfaction' : 'Kullanıcı Memnuniyeti',
                value: `${dashboardData.performance.user_satisfaction}/5`,
                percentage: (dashboardData.performance.user_satisfaction / 5) * 100,
                color: 'bg-purple-500',
                icon: Star
              },
              {
                label: language === 'fr' ? 'Taux d\'Erreur' : language === 'en' ? 'Error Rate' : 'Hata Oranı',
                value: `${dashboardData.performance.error_rate}%`,
                percentage: Math.max(0, 100 - (dashboardData.performance.error_rate * 10)),
                color: dashboardData.performance.error_rate < 1 ? 'bg-green-500' : 'bg-red-500',
                icon: Shield
              }
            ].map((metric, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <metric.icon className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">{metric.label}</span>
                  </div>
                  <span className="text-lg font-bold text-slate-900">{metric.value}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${metric.color} transition-all duration-500`}
                    style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Approbations en Attente */}
      {pendingUsers.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              {language === 'fr' ? 'Approbations en Attente' : 
               language === 'en' ? 'Pending Approvals' : 
               'Bekleyen Onaylar'}
              <span className="ml-3 bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full">
                {pendingUsers.length}
              </span>
            </h2>
            <div className="bg-orange-100 p-2 rounded-lg">
              <UserCheck className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingUsers.map((user) => (
              <div key={user.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{user.prenom} {user.nom}</p>
                    <p className="text-sm text-slate-600">{user.email}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'magazinier' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role === 'magazinier' ? 
                          (language === 'fr' ? 'Magazinier' : language === 'en' ? 'Warehouse Manager' : 'Depo Sorumlusu') :
                          (language === 'fr' ? 'Chef Chantier' : language === 'en' ? 'Site Manager' : 'Şantiye Şefi')
                        }
                      </span>
                    </div>
                    {user.nom_chantier && (
                      <p className="text-xs text-slate-500 mt-1">
                        {language === 'fr' ? 'Chantier:' : language === 'en' ? 'Site:' : 'Şantiye:'} {user.nom_chantier}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      {language === 'fr' ? 'Demandé le' : language === 'en' ? 'Requested on' : 'Talep tarihi'} {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleValidateUser(user.id, 'approve')}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 flex items-center justify-center space-x-1 transition-colors"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>
                      {language === 'fr' ? 'Approuver' : language === 'en' ? 'Approve' : 'Onayla'}
                    </span>
                  </button>
                  <button 
                    onClick={() => handleValidateUser(user.id, 'reject')}
                    className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700 flex items-center justify-center space-x-1 transition-colors"
                  >
                    <UserX className="w-4 h-4" />
                    <span>
                      {language === 'fr' ? 'Rejeter' : language === 'en' ? 'Reject' : 'Reddet'}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions Rapides */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            {language === 'fr' ? 'Actions Rapides' : 
             language === 'en' ? 'Quick Actions' : 
             'Hızlı İşlemler'}
          </h2>
          <div className="bg-blue-100 p-2 rounded-lg">
            <Zap className="w-5 h-5 text-blue-600" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { 
              title: language === 'fr' ? 'Créer Dépôt' : language === 'en' ? 'Create Depot' : 'Depo Oluştur',
              description: language === 'fr' ? 'Nouveau dépôt' : language === 'en' ? 'New depot' : 'Yeni depo',
              icon: Building2, 
              color: 'from-blue-500 to-blue-600',
              bgColor: 'bg-blue-50',
              action: () => window.location.href = '/depots'
            },
            { 
              title: language === 'fr' ? 'Gérer Utilisateurs' : language === 'en' ? 'Manage Users' : 'Kullanıcıları Yönet',
              description: language === 'fr' ? 'Tous utilisateurs' : language === 'en' ? 'All users' : 'Tüm kullanıcılar',
              icon: Users, 
              color: 'from-green-500 to-green-600',
              bgColor: 'bg-green-50',
              action: () => window.location.href = '/users'
            },
            { 
              title: language === 'fr' ? 'Voir Rapports' : language === 'en' ? 'View Reports' : 'Raporları Gör',
              description: language === 'fr' ? 'Analyses détaillées' : language === 'en' ? 'Detailed analytics' : 'Detaylı analizler',
              icon: BarChart3, 
              color: 'from-purple-500 to-purple-600',
              bgColor: 'bg-purple-50',
              action: () => window.location.href = '/reports'
            },
            { 
              title: language === 'fr' ? 'Paramètres' : language === 'en' ? 'Settings' : 'Ayarlar',
              description: language === 'fr' ? 'Configuration' : language === 'en' ? 'Configuration' : 'Yapılandırma',
              icon: Shield, 
              color: 'from-orange-500 to-orange-600',
              bgColor: 'bg-orange-50',
              action: () => window.location.href = '/settings'
            }
          ].map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="group relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 hover:from-white hover:to-slate-50 rounded-xl p-6 border border-slate-200 hover:border-slate-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-left"
            >
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${action.color} opacity-10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform duration-300`}></div>
              
              <div className="relative z-10">
                <div className={`bg-gradient-to-r ${action.color} p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2 group-hover:text-slate-800">
                  {action.title}
                </h3>
                <p className="text-sm text-slate-600 group-hover:text-slate-700">
                  {action.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Métriques de Performance Avancées */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold mb-2">
              {language === 'fr' ? 'Performance Globale' : 
               language === 'en' ? 'Global Performance' : 
               'Genel Performans'}
            </h3>
            <p className="text-indigo-100">
              {language === 'fr' ? 'Indicateurs clés de performance du système Dantela' : 
               language === 'en' ? 'Key performance indicators of Dantela system' : 
               'Dantela sisteminin temel performans göstergeleri'}
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
            <Award className="w-8 h-8" />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: language === 'fr' ? 'Score Efficacité' : language === 'en' ? 'Efficiency Score' : 'Verimlilik Skoru',
              value: `${dashboardData.performance.efficiency_score}/100`,
              percentage: dashboardData.performance.efficiency_score,
              icon: Target
            },
            {
              label: language === 'fr' ? 'Satisfaction' : language === 'en' ? 'Satisfaction' : 'Memnuniyet',
              value: `${dashboardData.performance.user_satisfaction}/5`,
              percentage: (dashboardData.performance.user_satisfaction / 5) * 100,
              icon: Star
            },
            {
              label: language === 'fr' ? 'Disponibilité' : language === 'en' ? 'Uptime' : 'Çalışma Süresi',
              value: `${dashboardData.performance.system_uptime}%`,
              percentage: dashboardData.performance.system_uptime,
              icon: Server
            },
            {
              label: language === 'fr' ? 'Qualité Service' : language === 'en' ? 'Service Quality' : 'Hizmet Kalitesi',
              value: `${Math.round(100 - dashboardData.performance.error_rate)}%`,
              percentage: 100 - dashboardData.performance.error_rate,
              icon: Shield
            }
          ].map((metric, index) => (
            <div key={index} className="bg-white bg-opacity-20 rounded-xl p-4 text-center backdrop-blur-sm">
              <metric.icon className="w-8 h-8 mx-auto mb-2" />
              <p className="text-2xl font-bold mb-1">{metric.value}</p>
              <p className="text-sm text-indigo-100 mb-3">{metric.label}</p>
              <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                <div 
                  className="h-2 bg-white rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DirecteurDashboard;