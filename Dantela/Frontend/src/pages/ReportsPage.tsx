import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Filter,
  FileText,
  Users,
  Package,
  Building2,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Truck,
  DollarSign,
  Target,
  Award,
  Star,
  Eye,
  Printer,
  RefreshCw,
  Search,
  ArrowUp,
  ArrowDown,
  Minus,
  X
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
  Area,
  AreaChart
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Layout from '../components/Layout';

// Dev (Vite): '/api' via proxy → http://localhost:5000
// Prod (Vercel): '/api' réécrit vers https://dantela.onrender.com/api via vercel.json
const API = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');

interface ReportData {
  users: any;
  depots: any;
  materiaux: any;
  demandes: any;
  mouvements: any;
  performance: any;
}

const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [, forceUpdate] = useState({});

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtres
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year' | 'custom'>('month');
  const [selectedReport, setSelectedReport] = useState<'overview' | 'users' | 'inventory' | 'orders' | 'performance'>('overview');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  // Modals
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<any>(null);

  // Re-render sur changement de langue (si tu utilises un event global)
  useEffect(() => {
    const handleLanguageChange = () => forceUpdate({});
    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);

  // Chargement des données (dépend de la période et du range)
  useEffect(() => {
    fetchReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod, dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Session expirée');
        setLoading(false); // éviter spinner infini si on return tôt
        return;
      }

      const headers: HeadersInit = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Construire les query params
      const params = new URLSearchParams({
        period: selectedPeriod,
        start: dateRange.start,
        end: dateRange.end,
      });

      // ✅ Corrigé: pas de /api en double
      const response = await fetch(`${API}/reports/overview?${params.toString()}`, { headers });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des données');
      }

      const data = await response.json();
      if (data.success) {
        setReportData(data.data);
      } else {
        throw new Error(data.message || 'Erreur lors de la récupération des données');
      }
    } catch (err) {
      console.error('Erreur lors du chargement des rapports:', err);
      setError(err instanceof Error ? err.message : 'Erreur de connexion');

      // Données neutres par défaut pour garder l’écran utilisable
      setReportData({
        users: { active: 0, total: 0, by_role: { directeur: 0, magazinier: 0, chef_chantier: 0 }, growth: { percentage: 0, this_month: 0 } },
        depots: { active: 0, total: 0, with_manager: 0, efficiency: 0, top_performing: [] },
        materiaux: { total: 0, low_stock: 0, out_of_stock: 0, top_requested: [] },
        demandes: { total: 0, approved: 0, rejected: 0, pending: 0, approval_rate: 0, by_priority: { urgente: 0, haute: 0, normale: 0, basse: 0 }, monthly_trend: [] },
        mouvements: { total: 0, entrees: 0, sorties: 0, daily_activity: [] },
        bons: { total: 0, delivered: 0 },
        performance: { system_uptime: 0, avg_response_time: 0, error_rate: 0, user_satisfaction: 0, efficiency_score: 0 },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Session expirée');
      }

      const response = await fetch(`${API}/reports/export`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          report_type: selectedReport,
          format,
          date_debut: dateRange.start,
          date_fin: dateRange.end,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'export");
      }

      const data = await response.json();
      if (data.success) {
        alert(
          language === 'fr'
            ? `Rapport exporté : ${data.export.filename}`
            : language === 'en'
            ? `Report exported: ${data.export.filename}`
            : `Rapor dışa aktarıldı: ${data.export.filename}`
        );
      } else {
        throw new Error(data.message || "Erreur lors de l'export");
      }

      setShowExportModal(false);
    } catch (err) {
      console.error('Erreur export:', err);
      alert(err instanceof Error ? err.message : "Erreur lors de l'export");
    }
  };

  const reportTypes = [
    { key: 'overview', title: language === 'fr' ? "Vue d'ensemble" : language === 'en' ? 'Overview' : 'Genel Bakış', icon: BarChart3, color: 'from-blue-500 to-blue-600' },
    { key: 'users', title: language === 'fr' ? 'Utilisateurs' : language === 'en' ? 'Users' : 'Kullanıcılar', icon: Users, color: 'from-green-500 to-green-600' },
    { key: 'inventory', title: language === 'fr' ? 'Inventaire' : language === 'en' ? 'Inventory' : 'Envanter', icon: Package, color: 'from-purple-500 to-purple-600' },
    { key: 'orders', title: language === 'fr' ? 'Commandes' : language === 'en' ? 'Orders' : 'Siparişler', icon: FileText, color: 'from-orange-500 to-orange-600' },
    { key: 'performance', title: language === 'fr' ? 'Performance' : language === 'en' ? 'Performance' : 'Performans', icon: TrendingUp, color: 'from-red-500 to-red-600' },
  ] as const;

  const periods = [
    { key: 'week', label: language === 'fr' ? 'Cette semaine' : language === 'en' ? 'This week' : 'Bu hafta' },
    { key: 'month', label: language === 'fr' ? 'Ce mois' : language === 'en' ? 'This month' : 'Bu ay' },
    { key: 'quarter', label: language === 'fr' ? 'Ce trimestre' : language === 'en' ? 'This quarter' : 'Bu çeyrek' },
    { key: 'year', label: language === 'fr' ? 'Cette année' : language === 'en' ? 'This year' : 'Bu yıl' },
    { key: 'custom', label: language === 'fr' ? 'Personnalisé' : language === 'en' ? 'Custom' : 'Özel' },
  ] as const;

  const formatNumber = (num: number) => new Intl.NumberFormat('fr-FR').format(num);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(amount);

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getChangeColor = (change: number) => (change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600');

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!reportData) {
    return (
      <Layout>
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </Layout>
    );
  }

 

//export default ReportsPage;


  return (
    <Layout>
      <div className="space-y-6">
        {/* Header avec dégradé professionnel */}
        <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 rounded-2xl p-8 text-white relative overflow-hidden">
          {/* Formes décoratives */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white bg-opacity-10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white bg-opacity-5 rounded-full translate-y-24 -translate-x-24"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-3">
                  {language === 'fr' ? 'Rapports & Analyses' : 
                   language === 'en' ? 'Reports & Analytics' : 
                   'Raporlar ve Analizler'}
                </h1>
                <p className="text-xl text-slate-200 mb-4">
                  {language === 'fr' ? 'Analyses détaillées et indicateurs de performance' : 
                   language === 'en' ? 'Detailed analytics and performance indicators' : 
                   'Detaylı analizler ve performans göstergeleri'}
                </p>
                <div className="flex items-center space-x-4 text-slate-300">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>Période: {periods.find(p => p.key === selectedPeriod)?.label}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Dernière mise à jour: {new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-2xl backdrop-blur-sm">
                <BarChart3 className="w-12 h-12" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtres et contrôles */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Sélection du type de rapport */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {language === 'fr' ? 'Type de rapport' : language === 'en' ? 'Report type' : 'Rapor türü'}
              </label>
              <select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition-all duration-200"
              >
                {reportTypes.map(type => (
                  <option key={type.key} value={type.key}>
                    {type.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Sélection de la période */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {language === 'fr' ? 'Période' : language === 'en' ? 'Period' : 'Dönem'}
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition-all duration-200"
              >
                {periods.map(period => (
                  <option key={period.key} value={period.key}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Dates personnalisées */}
            {selectedPeriod === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {language === 'fr' ? 'Date début' : language === 'en' ? 'Start date' : 'Başlangıç tarihi'}
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {language === 'fr' ? 'Date fin' : language === 'en' ? 'End date' : 'Bitiş tarihi'}
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex items-end space-x-2">
              <button
                onClick={fetchReportData}
                className="bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="w-5 h-5" />
                <span>
                  {language === 'fr' ? 'Actualiser' : language === 'en' ? 'Refresh' : 'Yenile'}
                </span>
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="bg-green-600 text-white px-4 py-3 rounded-xl hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>
                  {language === 'fr' ? 'Exporter' : language === 'en' ? 'Export' : 'Dışa Aktar'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards - Vue d'ensemble */}
        {selectedReport === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: language === 'fr' ? 'Utilisateurs Actifs' : language === 'en' ? 'Active Users' : 'Aktif Kullanıcılar',
                  value: reportData.users.active.toString(),
                  total: reportData.users.total,
                  change: reportData.users.growth.percentage,
                  icon: Users,
                  color: 'from-blue-500 to-blue-600',
                  bgColor: 'bg-blue-50'
                },
                {
                  title: language === 'fr' ? 'Dépôts Opérationnels' : language === 'en' ? 'Operational Depots' : 'Operasyonel Depolar',
                  value: reportData.depots.active.toString(),
                  total: reportData.depots.total,
                  change: 12.5,
                  icon: Building2,
                  color: 'from-green-500 to-green-600',
                  bgColor: 'bg-green-50'
                },
                {
                  title: language === 'fr' ? 'Taux d\'Approbation' : language === 'en' ? 'Approval Rate' : 'Onay Oranı',
                  value: `${reportData.demandes.approval_rate}%`,
                  total: 100,
                  change: 5.2,
                  icon: CheckCircle,
                  color: 'from-emerald-500 to-emerald-600',
                  bgColor: 'bg-emerald-50'
                },
                {
                  title: language === 'fr' ? 'Efficacité Système' : language === 'en' ? 'System Efficiency' : 'Sistem Verimliliği',
                  value: `${reportData.performance.efficiency_score}%`,
                  total: 100,
                  change: 3.1,
                  icon: Target,
                  color: 'from-purple-500 to-purple-600',
                  bgColor: 'bg-purple-50'
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
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">
                        {language === 'fr' ? 'Sur' : language === 'en' ? 'Out of' : 'Toplam'} {kpi.total}
                      </span>
                      <div className={`flex items-center space-x-1 ${getChangeColor(kpi.change)}`}>
                        {getChangeIcon(kpi.change)}
                        <span className="text-sm font-medium">
                          {kpi.change > 0 ? '+' : ''}{kpi.change}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Graphiques principaux */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Évolution des demandes */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">
                    {language === 'fr' ? 'Évolution des Demandes' : 
                     language === 'en' ? 'Requests Evolution' : 
                     'Talep Evrimi'}
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedMetric(reportData.demandes);
                      setShowDetailsModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>
                      {language === 'fr' ? 'Détails' : language === 'en' ? 'Details' : 'Detaylar'}
                    </span>
                  </button>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={reportData.demandes.monthly_trend || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="demandes" 
                        stackId="1"
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.6}
                        name={language === 'fr' ? 'Demandes' : language === 'en' ? 'Requests' : 'Talepler'}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="approved" 
                        stackId="2"
                        stroke="#10b981" 
                        fill="#10b981" 
                        fillOpacity={0.8}
                        name={language === 'fr' ? 'Approuvées' : language === 'en' ? 'Approved' : 'Onaylandı'}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Activité quotidienne */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">
                    {language === 'fr' ? 'Activité Quotidienne' : 
                     language === 'en' ? 'Daily Activity' : 
                     'Günlük Faaliyet'}
                  </h3>
                  <div className="text-sm text-slate-600">
                    {language === 'fr' ? 'Mouvements de stock' : 
                     language === 'en' ? 'Stock movements' : 
                     'Stok hareketleri'}
                  </div>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.mouvements.daily_activity || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="entrees" 
                        fill="#10b981" 
                        name={language === 'fr' ? 'Entrées' : language === 'en' ? 'Inbound' : 'Giriş'}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="sorties" 
                        fill="#ef4444" 
                        name={language === 'fr' ? 'Sorties' : language === 'en' ? 'Outbound' : 'Çıkış'}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Répartition par priorité */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 mb-6">
                  {language === 'fr' ? 'Demandes par Priorité' : 
                   language === 'en' ? 'Requests by Priority' : 
                   'Önceliğe Göre Talepler'}
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: language === 'fr' ? 'Urgente' : language === 'en' ? 'Urgent' : 'Acil', value: reportData.demandes.by_priority?.urgente || 0, color: '#ef4444' },
                          { name: language === 'fr' ? 'Haute' : language === 'en' ? 'High' : 'Yüksek', value: reportData.demandes.by_priority?.haute || 0, color: '#f97316' },
                          { name: language === 'fr' ? 'Normale' : language === 'en' ? 'Normal' : 'Normal', value: reportData.demandes.by_priority?.normale || 0, color: '#3b82f6' },
                          { name: language === 'fr' ? 'Basse' : language === 'en' ? 'Low' : 'Düşük', value: reportData.demandes.by_priority?.basse || 0, color: '#6b7280' }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label
                      >
                        {[
                          { color: '#ef4444' },
                          { color: '#f97316' },
                          { color: '#3b82f6' },
                          { color: '#6b7280' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top matériaux demandés */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 mb-6">
                  {language === 'fr' ? 'Matériaux les Plus Demandés' : 
                   language === 'en' ? 'Most Requested Materials' : 
                   'En Çok Talep Edilen Malzemeler'}
                </h3>
                <div className="space-y-4">
                  {(reportData.materiaux.top_requested || []).map((materiau, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          'bg-orange-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{materiau.nom}</p>
                          <p className="text-sm text-slate-600">
                            {materiau.requests} {language === 'fr' ? 'demandes' : language === 'en' ? 'requests' : 'talep'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">{materiau.stock}</p>
                        <p className="text-xs text-slate-500">
                          {language === 'fr' ? 'en stock' : language === 'en' ? 'in stock' : 'stokta'}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!reportData.materiaux.top_requested || reportData.materiaux.top_requested.length === 0) && (
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

              {/* Performance des dépôts */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 mb-6">
                  {language === 'fr' ? 'Performance des Dépôts' : 
                   language === 'en' ? 'Depot Performance' : 
                   'Depo Performansı'}
                </h3>
                <div className="space-y-4">
                  {(reportData.depots.top_performing || []).map((depot, index) => (
                    <div key={index} className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-slate-900">{depot.nom}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          depot.efficiency >= 90 ? 'bg-green-100 text-green-800' :
                          depot.efficiency >= 80 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {depot.efficiency}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                        <div 
                          className={`h-2 rounded-full ${
                            depot.efficiency >= 90 ? 'bg-green-500' :
                            depot.efficiency >= 80 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${depot.efficiency}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-slate-600">
                        {depot.demandes} {language === 'fr' ? 'demandes traitées' : language === 'en' ? 'requests processed' : 'talep işlendi'}
                      </p>
                    </div>
                  ))}
                  {(!reportData.depots.top_performing || reportData.depots.top_performing.length === 0) && (
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

            {/* Alertes et notifications */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Alertes stock */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">
                    {language === 'fr' ? 'Alertes Stock' : 
                     language === 'en' ? 'Stock Alerts' : 
                     'Stok Uyarıları'}
                  </h3>
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                    {reportData.materiaux.low_stock + reportData.materiaux.out_of_stock} {language === 'fr' ? 'alertes' : language === 'en' ? 'alerts' : 'uyarı'}
                  </span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="w-6 h-6 text-red-500" />
                      <div>
                        <p className="font-medium text-red-900">
                          {language === 'fr' ? 'Rupture de Stock' : language === 'en' ? 'Out of Stock' : 'Stok Tükendi'}
                        </p>
                        <p className="text-sm text-red-700">
                          {language === 'fr' ? 'Action immédiate requise' : language === 'en' ? 'Immediate action required' : 'Acil eylem gerekli'}
                        </p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-red-600">{reportData.materiaux.out_of_stock}</span>
                  </div>
                  
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
                    <span className="text-2xl font-bold text-orange-600">{reportData.materiaux.low_stock}</span>
                  </div>
                </div>
              </div>

              {/* Métriques de performance */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 mb-6">
                  {language === 'fr' ? 'Métriques de Performance' : 
                   language === 'en' ? 'Performance Metrics' : 
                   'Performans Metrikleri'}
                </h3>
                <div className="space-y-6">
                  {[
                    {
                      label: language === 'fr' ? 'Temps de Traitement Moyen' : language === 'en' ? 'Avg Processing Time' : 'Ort. İşlem Süresi',
                      value: `${reportData.demandes.avg_processing_time}j`,
                      target: '2j',
                      percentage: 85,
                      color: 'bg-blue-500'
                    },
                    {
                      label: language === 'fr' ? 'Satisfaction Utilisateur' : language === 'en' ? 'User Satisfaction' : 'Kullanıcı Memnuniyeti',
                      value: `${reportData.performance.user_satisfaction}/5`,
                      target: '4.5/5',
                      percentage: 92,
                      color: 'bg-green-500'
                    },
                    {
                      label: language === 'fr' ? 'Disponibilité Système' : language === 'en' ? 'System Uptime' : 'Sistem Çalışma Süresi',
                      value: `${reportData.performance.system_uptime}%`,
                      target: '99.9%',
                      percentage: 99.8,
                      color: 'bg-purple-500'
                    }
                  ].map((metric, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">{metric.label}</span>
                        <div className="text-right">
                          <span className="text-lg font-bold text-slate-900">{metric.value}</span>
                          <span className="text-sm text-slate-500 ml-2">/ {metric.target}</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${metric.color} transition-all duration-500`}
                          style={{ width: `${metric.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Rapport Utilisateurs */}
        {selectedReport === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-6">
                {language === 'fr' ? 'Répartition par Rôle' : 
                 language === 'en' ? 'Distribution by Role' : 
                 'Role Göre Dağılım'}
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: language === 'fr' ? 'Directeur' : language === 'en' ? 'Director' : 'Müdür', value: reportData.users.by_role.directeur, color: '#8b5cf6' },
                        { name: language === 'fr' ? 'Magazinier' : language === 'en' ? 'Warehouse Manager' : 'Depo Sorumlusu', value: reportData.users.by_role.magazinier, color: '#3b82f6' },
                        { name: language === 'fr' ? 'Chef Chantier' : language === 'en' ? 'Site Manager' : 'Şantiye Şefi', value: reportData.users.by_role.chef_chantier, color: '#10b981' }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label
                    >
                      {[
                        { color: '#8b5cf6' },
                        { color: '#3b82f6' },
                        { color: '#10b981' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-6">
                {language === 'fr' ? 'Croissance Utilisateurs' : 
                 language === 'en' ? 'User Growth' : 
                 'Kullanıcı Büyümesi'}
              </h3>
              <div className="space-y-6">
                <div className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                  <div className="text-4xl font-bold text-green-600 mb-2">+{reportData.users.growth.percentage}%</div>
                  <p className="text-green-700 font-medium">
                    {language === 'fr' ? 'Croissance ce mois' : language === 'en' ? 'Growth this month' : 'Bu ay büyüme'}
                  </p>
                  <p className="text-sm text-green-600 mt-2">
                    +{reportData.users.growth.this_month} {language === 'fr' ? 'nouveaux utilisateurs' : language === 'en' ? 'new users' : 'yeni kullanıcı'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-xl">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{reportData.users.active}</div>
                    <p className="text-sm text-blue-700">
                      {language === 'fr' ? 'Actifs' : language === 'en' ? 'Active' : 'Aktif'}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-xl">
                    <div className="text-2xl font-bold text-orange-600 mb-1">{reportData.users.pending}</div>
                    <p className="text-sm text-orange-700">
                      {language === 'fr' ? 'En attente' : language === 'en' ? 'Pending' : 'Beklemede'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section d'export et actions */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">
                {language === 'fr' ? 'Actions Rapides' : 
                 language === 'en' ? 'Quick Actions' : 
                 'Hızlı İşlemler'}
              </h3>
              <p className="text-indigo-100">
                {language === 'fr' ? 'Exportez vos rapports ou consultez les détails' : 
                 language === 'en' ? 'Export your reports or view details' : 
                 'Raporlarınızı dışa aktarın veya detayları görüntüleyin'}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowExportModal(true)}
                className="bg-white bg-opacity-20 text-white px-6 py-3 rounded-xl hover:bg-opacity-30 transition-all duration-200 flex items-center space-x-2 backdrop-blur-sm"
              >
                <Download className="w-5 h-5" />
                <span>
                  {language === 'fr' ? 'Exporter' : language === 'en' ? 'Export' : 'Dışa Aktar'}
                </span>
              </button>
              <button
                onClick={() => window.print()}
                className="bg-white bg-opacity-20 text-white px-6 py-3 rounded-xl hover:bg-opacity-30 transition-all duration-200 flex items-center space-x-2 backdrop-blur-sm"
              >
                <Printer className="w-5 h-5" />
                <span>
                  {language === 'fr' ? 'Imprimer' : language === 'en' ? 'Print' : 'Yazdır'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Export */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <h2 className="text-xl font-bold text-slate-900">
                {language === 'fr' ? 'Exporter le Rapport' : 
                 language === 'en' ? 'Export Report' : 
                 'Raporu Dışa Aktar'}
              </h2>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <p className="text-slate-600 mb-4">
                  {language === 'fr' ? 'Choisissez le format d\'export :' : 
                   language === 'en' ? 'Choose export format:' : 
                   'Dışa aktarma formatını seçin:'}
                </p>
                
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => handleExport('pdf')}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="w-6 h-6 text-red-500" />
                      <div className="text-left">
                        <p className="font-medium text-slate-900">PDF</p>
                        <p className="text-sm text-slate-600">
                          {language === 'fr' ? 'Rapport formaté pour impression' : 
                           language === 'en' ? 'Formatted report for printing' : 
                           'Yazdırma için biçimlendirilmiş rapor'}
                        </p>
                      </div>
                    </div>
                    <ArrowUp className="w-5 h-5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => handleExport('excel')}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <BarChart3 className="w-6 h-6 text-green-500" />
                      <div className="text-left">
                        <p className="font-medium text-slate-900">Excel</p>
                        <p className="text-sm text-slate-600">
                          {language === 'fr' ? 'Données pour analyse avancée' : 
                           language === 'en' ? 'Data for advanced analysis' : 
                           'Gelişmiş analiz için veri'}
                        </p>
                      </div>
                    </div>
                    <ArrowUp className="w-5 h-5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => handleExport('csv')}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="w-6 h-6 text-blue-500" />
                      <div className="text-left">
                        <p className="font-medium text-slate-900">CSV</p>
                        <p className="text-sm text-slate-600">
                          {language === 'fr' ? 'Données brutes pour import' : 
                           language === 'en' ? 'Raw data for import' : 
                           'İçe aktarma için ham veri'}
                        </p>
                      </div>
                    </div>
                    <ArrowUp className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setShowExportModal(false)}
                className="w-full border border-slate-300 text-slate-700 py-3 rounded-xl hover:bg-slate-100 transition-colors"
              >
                {language === 'fr' ? 'Annuler' : language === 'en' ? 'Cancel' : 'İptal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Détails */}
      {showDetailsModal && selectedMetric && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  {language === 'fr' ? 'Détails du Rapport' : 
                   language === 'en' ? 'Report Details' : 
                   'Rapor Detayları'}
                </h2>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedMetric(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{selectedMetric.total}</div>
                  <p className="text-blue-700 font-medium">
                    {language === 'fr' ? 'Total' : language === 'en' ? 'Total' : 'Toplam'}
                  </p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{selectedMetric.approved}</div>
                  <p className="text-green-700 font-medium">
                    {language === 'fr' ? 'Approuvées' : language === 'en' ? 'Approved' : 'Onaylandı'}
                  </p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">{selectedMetric.rejected}</div>
                  <p className="text-red-700 font-medium">
                    {language === 'fr' ? 'Rejetées' : language === 'en' ? 'Rejected' : 'Reddedildi'}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-lg font-semibold text-slate-900 mb-4">
                  {language === 'fr' ? 'Tendance Mensuelle' : 
                   language === 'en' ? 'Monthly Trend' : 
                   'Aylık Eğilim'}
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedMetric.monthly_trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="demandes" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        name={language === 'fr' ? 'Demandes' : language === 'en' ? 'Requests' : 'Talepler'}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="approved" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        name={language === 'fr' ? 'Approuvées' : language === 'en' ? 'Approved' : 'Onaylandı'}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedMetric(null);
                }}
                className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl hover:bg-slate-200 transition-colors"
              >
                {language === 'fr' ? 'Fermer' : language === 'en' ? 'Close' : 'Kapat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ReportsPage;