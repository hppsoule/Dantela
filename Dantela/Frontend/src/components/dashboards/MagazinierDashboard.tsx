import React, { useEffect, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Package, BarChart3 } from 'lucide-react';
import {
  BarChart as RBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { useLanguage } from '../../contexts/LanguageContext';

// Même base que tes autres pages (DirectDistribution, etc.)
const API_BASE = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

type PeriodKey = 'day' | 'week' | 'month';

interface Materiau {
  id: string;
  code_produit: string;
  nom: string;
  description: string;
  unite: string;
  stock_actuel: number;
  stock_minimum: number;
  fournisseur?: string;
  categorie_nom?: string;
  image_url?: string;
}

interface MouvementStock {
  id: string;
  type_mouvement: 'entree' | 'sortie';
  quantite: number;
  stock_avant: number;
  stock_apres: number;
  materiau_id?: string;
  materiau_nom: string;
  code_produit?: string;
  unite?: string;
  utilisateur_nom?: string;
  motif?: string;
  description?: string;
  created_at: string; // ISO
}

const COLORS = ['#0891b2', '#059669', '#dc2626', '#7c3aed', '#f59e0b', '#0ea5e9', '#10b981', '#ef4444', '#6366f1', '#84cc16'];

function startOfPeriod(period: PeriodKey) {
  const d = new Date();
  if (period === 'day') {
    d.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    const day = d.getDay(); // 0=dim, 1=lun...
    const diff = (day + 6) % 7; // ramener à lundi
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
  } else {
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
  }
  return d;
}

function formatNumber(n: number, lang: string) {
  const loc = lang === 'fr' ? 'fr-FR' : lang === 'en' ? 'en-US' : 'tr-TR';
  return new Intl.NumberFormat(loc).format(n);
}

function shortDayLabel(d: Date, lang: string) {
  const loc = lang === 'fr' ? 'fr-FR' : lang === 'en' ? 'en-US' : 'tr-TR';
  return new Intl.DateTimeFormat(loc, { weekday: 'short' }).format(d);
}

function dayMonthLabel(d: Date, lang: string) {
  const loc = lang === 'fr' ? 'fr-FR' : lang === 'en' ? 'en-US' : 'tr-TR';
  return new Intl.DateTimeFormat(loc, { day: '2-digit', month: 'short' }).format(d);
}

const MagazinierDashboard: React.FC = () => {
  const { language } = useLanguage();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('week');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [materiaux, setMateriaux] = useState<Materiau[]>([]);
  const [mouvements, setMouvements] = useState<MouvementStock[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // On charge beaucoup de mouvements, on filtrera côté client par la période sélectionnée
        const [matRes, movRes] = await Promise.all([
          fetch(`${API_BASE}/materiaux`, { headers }),
          fetch(`${API_BASE}/stock/movements?limit=1000`, { headers })
        ]);

        if (!matRes.ok) {
          const j = await matRes.json().catch(() => ({}));
          throw new Error(j.message || 'Impossible de charger les matériaux');
        }
        if (!movRes.ok) {
          const j = await movRes.json().catch(() => ({}));
          throw new Error(j.message || 'Impossible de charger les mouvements');
        }

        const mat = await matRes.json();
        const mov = await movRes.json();

        setMateriaux(mat.materiaux || mat.data || []);
        setMouvements(mov.mouvements || mov.data || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // charge au mount (les KPIs se recalculent quand selectedPeriod change)

  // Filtrage par période
  const periodStart = useMemo(() => startOfPeriod(selectedPeriod), [selectedPeriod]);
  const now = new Date();

  const mouvementsInPeriod = useMemo(() => {
    return (mouvements || []).filter(m => {
      const d = new Date(m.created_at);
      return d >= periodStart && d <= now;
    });
  }, [mouvements, periodStart, now]);

  // KPI
  const totalSortiesQty = useMemo(
    () => mouvementsInPeriod.filter(m => m.type_mouvement === 'sortie').reduce((s, m) => s + (Number(m.quantite) || 0), 0),
    [mouvementsInPeriod]
  );

  const totalEntreesQty = useMemo(
    () => mouvementsInPeriod.filter(m => m.type_mouvement === 'entree').reduce((s, m) => s + (Number(m.quantite) || 0), 0),
    [mouvementsInPeriod]
  );

  const alertesStock = useMemo(
    () => (materiaux || []).filter(m => (m.stock_actuel ?? 0) <= (m.stock_minimum ?? 0)).length,
    [materiaux]
  );

  const productDemandDistinct = useMemo(() => {
    const ids = new Set(
      mouvementsInPeriod.filter(m => m.type_mouvement === 'sortie').map(m => m.materiau_id || m.materiau_nom || m.code_produit)
    );
    return ids.size;
  }, [mouvementsInPeriod]);

  // Cartes stats (dynamiques)
  const stats = useMemo(() => ([
    {
      title: language === 'fr' ? 'Sorties (Qté)' : language === 'en' ? 'Outbound (Qty)' : 'Çıkış (Miktar)',
      value: formatNumber(totalSortiesQty, language),
      change: '', // Si tu veux, calcule la variation vs période précédente
      icon: TrendingDown,
      color: 'bg-red-500',
    },
    {
      title: language === 'fr' ? 'Entrées (Qté)' : language === 'en' ? 'Inbound (Qty)' : 'Giriş (Miktar)',
      value: formatNumber(totalEntreesQty, language),
      change: '',
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      title: language === 'fr' ? 'Alertes Stock' : language === 'en' ? 'Stock Alerts' : 'Stok Uyarısı',
      value: formatNumber(alertesStock, language),
      change: '',
      icon: AlertTriangle,
      color: 'bg-orange-500',
    },
    {
      title: language === 'fr' ? 'Demande Produits' : language === 'en' ? 'Product Demand' : 'Ürün Talebi',
      value: formatNumber(productDemandDistinct, language),
      change: '',
      icon: Package,
      color: 'bg-blue-500',
    },
  ]), [language, totalSortiesQty, totalEntreesQty, alertesStock, productDemandDistinct]);

  // Pie "Produits par Catégories" → compter les matériaux par catégorie
  const pieCategories = useMemo(() => {
    const map = new Map<string, number>();
    (materiaux || []).forEach(m => {
      const cat = (m.categorie_nom || 'Autres').trim() || 'Autres';
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    const arr = Array.from(map.entries()).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));
    // Option: trier par valeur descendante
    arr.sort((a, b) => b.value - a.value);
    return arr.slice(0, 8); // top 8
  }, [materiaux]);

  // Pie "Alertes par Catégories" → matériaux en alerte (stock <= mini) groupés
  const pieAlerts = useMemo(() => {
    const map = new Map<string, number>();
    (materiaux || [])
      .filter(m => (m.stock_actuel ?? 0) <= (m.stock_minimum ?? 0))
      .forEach(m => {
        const cat = (m.categorie_nom || 'Autres').trim() || 'Autres';
        map.set(cat, (map.get(cat) || 0) + 1);
      });
    const arr = Array.from(map.entries()).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));
    arr.sort((a, b) => b.value - a.value);
    return arr.length ? arr : [{ name: language === 'fr' ? 'Aucune alerte' : language === 'en' ? 'No alerts' : 'Uyarı yok', value: 1, color: '#e5e7eb' }];
  }, [materiaux, language]);

  // Bar "Activités par période" → somme des quantités entrée/sortie par jour depuis startOfPeriod
  const barActivities = useMemo(() => {
    // Génère les jours entre periodStart et today
    const days: Date[] = [];
    const d = new Date(periodStart);
    while (d <= now) {
      days.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    // Aggregate
    const rows = days.map(date => {
      const key = date.toDateString();
      const entries = mouvementsInPeriod.filter(m => new Date(m.created_at).toDateString() === key);
      const entrees = entries.filter(e => e.type_mouvement === 'entree').reduce((s, e) => s + (e.quantite || 0), 0);
      const sorties = entries.filter(e => e.type_mouvement === 'sortie').reduce((s, e) => s + (e.quantite || 0), 0);

      const label =
        selectedPeriod === 'month' ? dayMonthLabel(date, language) :
        shortDayLabel(date, language);

      return { name: label, entrees, sorties };
    });
    return rows;
  }, [mouvementsInPeriod, periodStart, now, selectedPeriod, language]);

  // Activités récentes (8 dernières)
  const recentActivities = useMemo(() => {
    return [...(mouvements || [])]
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
      .slice(0, 8)
      .map(m => ({
        action:
          m.type_mouvement === 'entree'
            ? (language === 'fr' ? 'Réception' : language === 'en' ? 'Reception' : 'Kabul')
            : (language === 'fr' ? 'Expédition' : language === 'en' ? 'Shipment' : 'Sevkiyat'),
        product: m.materiau_nom,
        quantity:
          m.type_mouvement === 'entree'
            ? `${m.quantite} ${m.unite || ''}`
            : `${m.quantite} ${m.unite || ''}`,
        time: new Date(m.created_at).toLocaleTimeString(language === 'fr' ? 'fr-FR' : language === 'en' ? 'en-US' : 'tr-TR', { hour: '2-digit', minute: '2-digit' })
      }));
  }, [mouvements, language]);

  const periods = [
    { key: 'day', label: language === 'fr' ? 'Jour' : language === 'en' ? 'Day' : 'Gün' },
    { key: 'week', label: language === 'fr' ? 'Semaine' : language === 'en' ? 'Week' : 'Hafta' },
    { key: 'month', label: language === 'fr' ? 'Mois' : language === 'en' ? 'Month' : 'Ay' },
  ] as const;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-100 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-100 rounded" />
            <div className="h-96 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {language === 'fr' ? 'Vue d\'ensemble - Magazinier' :
             language === 'en' ? 'Overview - Warehouse Manager' :
             'Genel Bakış - Depo Sorumlusu'}
          </h1>
          <p className="text-gray-600 mt-2">
            {language === 'fr' ? 'Bienvenue dans votre espace de gestion des stocks et matériaux' :
             language === 'en' ? 'Welcome to your stock and materials management space' :
             'Stok ve malzeme yönetim alanınıza hoş geldiniz'}
          </p>
          {error && <p className="text-red-600 mt-2">{error}</p>}
        </div>
        <div className="bg-teal-100 p-4 rounded-full">
          <BarChart3 className="w-8 h-8 text-teal-600" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                {stat.change && <p className="text-sm text-gray-500 mt-1">{stat.change}</p>}
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Diagramme Circulaire - Produits par Catégories */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {language === 'fr' ? 'Produits par Catégories' :
               language === 'en' ? 'Products by Categories' :
               'Kategorilere Göre Ürünler'}
            </h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieCategories}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                  label
                >
                  {pieCategories.map((entry, index) => (
                    <Cell key={`cat-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Diagramme en Barres - Activités */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {language === 'fr' ? 'Activités par Période' :
               language === 'en' ? 'Activities by Period' :
               'Döneme Göre Faaliyetler'}
            </h2>
            <div className="flex space-x-2">
              {periods.map((period) => (
                <button
                  key={period.key}
                  onClick={() => setSelectedPeriod(period.key)}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    selectedPeriod === period.key
                      ? 'bg-teal-100 text-teal-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RBarChart data={barActivities}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="entrees" fill="#059669" name={language === 'fr' ? 'Entrées' : language === 'en' ? 'Inbound' : 'Giriş'} />
                <Bar dataKey="sorties" fill="#dc2626" name={language === 'fr' ? 'Sorties' : language === 'en' ? 'Outbound' : 'Çıkış'} />
              </RBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activités Récentes */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {language === 'fr' ? 'Activités Récentes' :
               language === 'en' ? 'Recent Activities' :
               'Son Faaliyetler'}
            </h2>
            {/* Tu peux lier vers la page Historique */}
            {/* <Link to="/historique" className="text-teal-600 hover:text-teal-800 text-sm font-medium">Voir tout</Link> */}
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      /Réception|Reception|Kabul/i.test(activity.action) ? 'bg-green-500'
                        : /Expédition|Shipment|Sevkiyat/i.test(activity.action) ? 'bg-blue-500'
                        : 'bg-orange-500'
                    }`}
                  />
                  <div>
                    <p className="font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-600">{activity.product} — {activity.quantity}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">{activity.time}</span>
              </div>
            ))}
            {!recentActivities.length && (
              <div className="text-sm text-gray-500">Aucune activité récente</div>
            )}
          </div>
        </div>

        {/* Diagramme Circulaire - Alertes par Catégories */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {language === 'fr' ? 'Alertes par Catégories' :
               language === 'en' ? 'Alerts by Categories' :
               'Kategorilere Göre Uyarılar'}
            </h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieAlerts}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                  label
                >
                  {pieAlerts.map((entry, index) => (
                    <Cell key={`alert-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Actions Rapides (à brancher selon tes routes) */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {language === 'fr' ? 'Actions Rapides' :
           language === 'en' ? 'Quick Actions' :
           'Hızlı İşlemler'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { title: language === 'fr' ? 'Nouvelle Réception' : language === 'en' ? 'New Reception' : 'Yeni Kabul', icon: TrendingUp, color: 'bg-green-500' },
            { title: language === 'fr' ? 'Préparer Expédition' : language === 'en' ? 'Prepare Shipment' : 'Sevkiyat Hazırla', icon: TrendingDown, color: 'bg-blue-500' },
            { title: language === 'fr' ? 'Inventaire' : language === 'en' ? 'Inventory' : 'Envanter', icon: Package, color: 'bg-purple-500' },
            { title: language === 'fr' ? 'Rapport Stock' : language === 'en' ? 'Stock Report' : 'Stok Raporu', icon: BarChart3, color: 'bg-orange-500' }
          ].map((action, index) => (
            <button key={index} className="flex items-center justify-center space-x-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
              <div className={`${action.color} p-2 rounded-lg`}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <span className="font-medium text-gray-900">{action.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MagazinierDashboard;
