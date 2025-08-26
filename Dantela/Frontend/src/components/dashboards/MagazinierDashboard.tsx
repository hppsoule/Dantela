import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Package, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useLanguage } from '../../contexts/LanguageContext';

const MagazinierDashboard: React.FC = () => {
  const { t, language } = useLanguage();
  const [, forceUpdate] = useState({});
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  // Écouter les changements de langue
  useEffect(() => {
    const handleLanguageChange = () => {
      forceUpdate({});
    };
    
    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);

  const stats = [
    {
      title: language === 'fr' ? 'Sortie de Dépôt' : language === 'en' ? 'Depot Outbound' : 'Depo Çıkışı',
      value: '245',
      change: language === 'fr' ? '+12% cette semaine' : language === 'en' ? '+12% this week' : '+12% bu hafta',
      icon: TrendingDown,
      color: 'bg-red-500',
    },
    {
      title: language === 'fr' ? 'Entrée de Dépôt' : language === 'en' ? 'Depot Inbound' : 'Depo Girişi',
      value: '189',
      change: language === 'fr' ? '+8% cette semaine' : language === 'en' ? '+8% this week' : '+8% bu hafta',
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      title: language === 'fr' ? 'Alerte Stock' : language === 'en' ? 'Stock Alert' : 'Stok Uyarısı',
      value: '23',
      change: language === 'fr' ? '5 nouveaux' : language === 'en' ? '5 new' : '5 yeni',
      icon: AlertTriangle,
      color: 'bg-orange-500',
    },
    {
      title: language === 'fr' ? 'Demande de Produits' : language === 'en' ? 'Product Demand' : 'Ürün Talebi',
      value: '67',
      change: language === 'fr' ? '+15% cette semaine' : language === 'en' ? '+15% this week' : '+15% bu hafta',
      icon: Package,
      color: 'bg-blue-500',
    },
  ];

  const periods = [
    { key: 'day', label: language === 'fr' ? 'Jour' : language === 'en' ? 'Day' : 'Gün' },
    { key: 'week', label: language === 'fr' ? 'Semaine' : language === 'en' ? 'Week' : 'Hafta' },
    { key: 'month', label: language === 'fr' ? 'Mois' : language === 'en' ? 'Month' : 'Ay' },
  ];

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
                <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
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
                  data={[
                    { name: 'Électronique', value: 35, color: '#0891b2' },
                    { name: 'Vêtements', value: 25, color: '#059669' },
                    { name: 'Alimentation', value: 20, color: '#dc2626' },
                    { name: 'Maison', value: 20, color: '#7c3aed' }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {[
                    { name: 'Électronique', value: 35, color: '#0891b2' },
                    { name: 'Vêtements', value: 25, color: '#059669' },
                    { name: 'Alimentation', value: 20, color: '#dc2626' },
                    { name: 'Maison', value: 20, color: '#7c3aed' }
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
              <BarChart
                data={[
                  { name: 'Lun', entrees: 20, sorties: 15 },
                  { name: 'Mar', entrees: 25, sorties: 18 },
                  { name: 'Mer', entrees: 30, sorties: 22 },
                  { name: 'Jeu', entrees: 28, sorties: 20 },
                  { name: 'Ven', entrees: 35, sorties: 25 },
                  { name: 'Sam', entrees: 15, sorties: 12 },
                  { name: 'Dim', entrees: 10, sorties: 8 }
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="entrees" fill="#059669" name="Entrées" />
                <Bar dataKey="sorties" fill="#dc2626" name="Sorties" />
              </BarChart>
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
            <button className="text-teal-600 hover:text-teal-800 text-sm font-medium">
              {language === 'fr' ? 'Voir tout' : language === 'en' ? 'View all' : 'Tümünü gör'}
            </button>
          </div>
          <div className="space-y-4">
            {[
              { action: 'Réception', product: 'iPhone 14', quantity: '50 unités', time: '10:30' },
              { action: 'Expédition', product: 'MacBook Pro', quantity: '5 unités', time: '09:15' },
              { action: 'Alerte Stock', product: 'AirPods', quantity: 'Stock faible', time: '08:45' },
              { action: 'Réception', product: 'iPad Air', quantity: '25 unités', time: '08:00' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.action === 'Réception' ? 'bg-green-500' :
                    activity.action === 'Expédition' ? 'bg-blue-500' : 'bg-orange-500'
                  }`}></div>
                  <div>
                    <p className="font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-600">{activity.product} - {activity.quantity}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">{activity.time}</span>
              </div>
            ))}
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
                  data={[
                    { name: 'Stock Faible', value: 45, color: '#dc2626' },
                    { name: 'Rupture', value: 30, color: '#ea580c' },
                    { name: 'Péremption', value: 15, color: '#ca8a04' },
                    { name: 'Autres', value: 10, color: '#6b7280' }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {[
                    { name: 'Stock Faible', value: 45, color: '#dc2626' },
                    { name: 'Rupture', value: 30, color: '#ea580c' },
                    { name: 'Péremption', value: 15, color: '#ca8a04' },
                    { name: 'Autres', value: 10, color: '#6b7280' }
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
      </div>

      {/* Actions Rapides */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {language === 'fr' ? 'Actions Rapides' : 
           language === 'en' ? 'Quick Actions' : 
           'Hızlı İşlemler'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { 
              title: language === 'fr' ? 'Nouvelle Réception' : language === 'en' ? 'New Reception' : 'Yeni Kabul', 
              icon: TrendingUp, 
              color: 'bg-green-500' 
            },
            { 
              title: language === 'fr' ? 'Préparer Expédition' : language === 'en' ? 'Prepare Shipment' : 'Sevkiyat Hazırla', 
              icon: TrendingDown, 
              color: 'bg-blue-500' 
            },
            { 
              title: language === 'fr' ? 'Inventaire' : language === 'en' ? 'Inventory' : 'Envanter', 
              icon: Package, 
              color: 'bg-purple-500' 
            },
            { 
              title: language === 'fr' ? 'Rapport Stock' : language === 'en' ? 'Stock Report' : 'Stok Raporu', 
              icon: BarChart3, 
              color: 'bg-orange-500' 
            }
          ].map((action, index) => (
            <button
              key={index}
              className="flex items-center justify-center space-x-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
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