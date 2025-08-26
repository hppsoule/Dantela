import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Download, 
  Calendar, 
  Filter,
  Search,
  RefreshCw,
  FileText,
  BarChart3,
  PieChart,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  X,
  Eye,
  Printer
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
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Layout from '../components/Layout';

interface MouvementStock {
  id: string;
  type_mouvement: string;
  quantite: number;
  stock_avant: number;
  stock_apres: number;
  motif: string;
  description: string;
  created_at: string;
  materiau_nom: string;
  code_produit: string;
  unite: string;
  categorie_nom: string;
  utilisateur_nom: string;
  utilisateur_role: string;
  numero_demande?: string;
  numero_bon?: string;
}

interface Demande {
  id: string;
  numero_demande: string;
  statut: string;
  priorite: string;
  date_demande: string;
  date_livraison_souhaitee: string;
  demandeur_nom: string;
  demandeur_role: string;
  nom_chantier: string;
  depot_nom: string;
  nombre_items: number;
  total_quantite_demandee: number;
  total_quantite_accordee: number;
  commentaire_demandeur?: string;
  commentaire_magazinier?: string;
}

const StockMovementsPage: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [, forceUpdate] = useState({});
  
  // États principaux
  const [mouvements, setMouvements] = useState<MouvementStock[]>([]);
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtres
  const [filters, setFilters] = useState({
    type_mouvement: 'all',
    date_debut: '',
    date_fin: '',
    search: ''
  });
  
  // Export
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState<'mouvements' | 'commandes'>('mouvements');
  const [exportFilters, setExportFilters] = useState({
    period: 'month',
    category: 'all',
    product: 'all',
    format: 'pdf'
  });
  const [exporting, setExporting] = useState(false);

  // Statistiques
  const [stats, setStats] = useState({
    total_mouvements: 0,
    entrees: 0,
    sorties: 0,
    ajustements: 0,
    materiaux_concernes: 0
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
  }, [filters]);

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
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Construire les paramètres de requête
      const params = new URLSearchParams();
      if (filters.type_mouvement !== 'all') params.append('type_mouvement', filters.type_mouvement);
      if (filters.date_debut) params.append('date_debut', filters.date_debut);
      if (filters.date_fin) params.append('date_fin', filters.date_fin);
      if (filters.search) params.append('search', filters.search);

      // Récupérer les mouvements
      const mouvementsResponse = await fetch(`http://localhost:5000/api/stock/movements?${params}`, { headers });
      if (mouvementsResponse.ok) {
        const mouvementsData = await mouvementsResponse.json();
        setMouvements(mouvementsData.mouvements || []);
      }

      // Récupérer les statistiques
      const statsResponse = await fetch(`http://localhost:5000/api/stock/stats?${params}`, { headers });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats || {});
      }

      // Récupérer les demandes pour l'export
      const demandesResponse = await fetch('http://localhost:5000/api/demandes', { headers });
      if (demandesResponse.ok) {
        const demandesData = await demandesResponse.json();
        setDemandes(demandesData.demandes || []);
      }

    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les données selon les critères
  const mouvementsFiltres = mouvements.filter(mouvement => {
    const matchSearch = !filters.search || 
      mouvement.materiau_nom.toLowerCase().includes(filters.search.toLowerCase()) ||
      mouvement.code_produit.toLowerCase().includes(filters.search.toLowerCase()) ||
      mouvement.utilisateur_nom.toLowerCase().includes(filters.search.toLowerCase()) ||
      mouvement.motif.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchSearch;
  });

  // Générer PDF pour mouvements de stock
  const generateMovementsPDF = (data: MouvementStock[]) => {
    const doc = new jsPDF();
    
    // En-tête
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('DANTELA - Rapport Mouvements de Stock', 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Généré le ${new Date().toLocaleDateString()} par ${user?.prenom} ${user?.nom}`, 20, 30);
    
    // Statistiques
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Statistiques:', 20, 45);
    
    doc.setFontSize(10);
    doc.text(`Total mouvements: ${stats.total_mouvements}`, 20, 55);
    doc.text(`Entrées: ${stats.entrees}`, 20, 62);
    doc.text(`Sorties: ${stats.sorties}`, 20, 69);
    doc.text(`Matériaux concernés: ${stats.materiaux_concernes}`, 20, 76);
    
    // Tableau des mouvements
    const tableData = data.map(mouvement => [
      new Date(mouvement.created_at).toLocaleDateString(),
      mouvement.materiau_nom,
      mouvement.code_produit,
      mouvement.type_mouvement.toUpperCase(),
      mouvement.quantite.toString(),
      mouvement.unite,
      mouvement.utilisateur_nom,
      mouvement.motif || 'N/A'
    ]);

    (doc as any).autoTable({
      head: [['Date', 'Matériau', 'Code', 'Type', 'Quantité', 'Unité', 'Utilisateur', 'Motif']],
      body: tableData,
      startY: 85,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [32, 178, 170] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    return doc;
  };

  // Générer PDF pour historique des commandes
  const generateOrdersPDF = (data: Demande[]) => {
    const doc = new jsPDF();
    
    // En-tête
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('DANTELA - Historique des Commandes', 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Généré le ${new Date().toLocaleDateString()} par ${user?.prenom} ${user?.nom}`, 20, 30);
    
    // Statistiques des commandes
    const totalCommandes = data.length;
    const approuvees = data.filter(d => d.statut === 'approuvee' || d.statut === 'livree').length;
    const enAttente = data.filter(d => d.statut === 'en_attente').length;
    const rejetees = data.filter(d => d.statut === 'rejetee').length;
    
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Statistiques des Commandes:', 20, 45);
    
    doc.setFontSize(10);
    doc.text(`Total commandes: ${totalCommandes}`, 20, 55);
    doc.text(`Approuvées: ${approuvees}`, 20, 62);
    doc.text(`En attente: ${enAttente}`, 20, 69);
    doc.text(`Rejetées: ${rejetees}`, 20, 76);
    
    // Tableau des commandes
    const tableData = data.map(demande => [
      demande.numero_demande,
      new Date(demande.date_demande).toLocaleDateString(),
      demande.demandeur_nom,
      demande.nom_chantier || 'N/A',
      demande.statut.toUpperCase(),
      demande.priorite.toUpperCase(),
      demande.nombre_items.toString(),
      demande.total_quantite_demandee.toString()
    ]);

    (doc as any).autoTable({
      head: [['N° Demande', 'Date', 'Demandeur', 'Chantier', 'Statut', 'Priorité', 'Items', 'Quantité']],
      body: tableData,
      startY: 85,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    return doc;
  };

  // Générer CSV
  const generateCSV = (data: any[], type: 'mouvements' | 'commandes') => {
    let csvContent = '';
    
    if (type === 'mouvements') {
      // En-tête CSV pour mouvements
      csvContent = 'Date,Matériau,Code Produit,Type Mouvement,Quantité,Unité,Stock Avant,Stock Après,Utilisateur,Motif,Description\n';
      
      // Données
      data.forEach(mouvement => {
        const row = [
          new Date(mouvement.created_at).toLocaleDateString(),
          mouvement.materiau_nom,
          mouvement.code_produit,
          mouvement.type_mouvement,
          mouvement.quantite,
          mouvement.unite,
          mouvement.stock_avant,
          mouvement.stock_apres,
          mouvement.utilisateur_nom,
          mouvement.motif || '',
          mouvement.description || ''
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
        
        csvContent += row + '\n';
      });
    } else {
      // En-tête CSV pour commandes
      csvContent = 'Numéro Demande,Date Demande,Demandeur,Chantier,Statut,Priorité,Nombre Items,Quantité Demandée,Quantité Accordée,Commentaire Demandeur,Commentaire Magazinier\n';
      
      // Données
      data.forEach(demande => {
        const row = [
          demande.numero_demande,
          new Date(demande.date_demande).toLocaleDateString(),
          demande.demandeur_nom,
          demande.nom_chantier || '',
          demande.statut,
          demande.priorite,
          demande.nombre_items,
          demande.total_quantite_demandee,
          demande.total_quantite_accordee || 0,
          demande.commentaire_demandeur || '',
          demande.commentaire_magazinier || ''
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
        
        csvContent += row + '\n';
      });
    }
    
    return csvContent;
  };

  // Télécharger fichier
  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Filtrer les données selon la période d'export
  const getFilteredDataForExport = () => {
    const now = new Date();
    let startDate: Date;
    
    switch (exportFilters.period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    if (exportType === 'mouvements') {
      return mouvements.filter(mouvement => {
        const mouvementDate = new Date(mouvement.created_at);
        const matchPeriod = mouvementDate >= startDate;
        const matchCategory = exportFilters.category === 'all' || mouvement.categorie_nom === exportFilters.category;
        const matchProduct = exportFilters.product === 'all' || mouvement.materiau_nom === exportFilters.product;
        
        return matchPeriod && matchCategory && matchProduct;
      });
    } else {
      return demandes.filter(demande => {
        const demandeDate = new Date(demande.date_demande);
        const matchPeriod = demandeDate >= startDate;
        
        return matchPeriod;
      });
    }
  };

  // Gérer l'export
  const handleExport = async () => {
    try {
      setExporting(true);
      
      const filteredData = getFilteredDataForExport();
      
      if (filteredData.length === 0) {
        alert(language === 'fr' ? 'Aucune donnée à exporter pour cette période' : 
              language === 'en' ? 'No data to export for this period' : 
              'Bu dönem için dışa aktarılacak veri yok');
        return;
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const periodText = exportFilters.period === 'day' ? 'jour' : 
                        exportFilters.period === 'week' ? 'semaine' : 'mois';
      
      if (exportFilters.format === 'pdf') {
        try {
          // Générer PDF
          const doc = exportType === 'mouvements' ? 
            generateMovementsPDF(filteredData as MouvementStock[]) : 
            generateOrdersPDF(filteredData as Demande[]);
          
          const filename = `dantela_${exportType}_${periodText}_${timestamp}.pdf`;
          doc.save(filename);
          
          alert(language === 'fr' ? `PDF téléchargé: ${filename}` : 
                language === 'en' ? `PDF downloaded: ${filename}` : 
                `PDF indirildi: ${filename}`);
        } catch (pdfError) {
          console.error('Erreur génération PDF:', pdfError);
          alert(language === 'fr' ? 'Erreur lors de la génération du PDF. Veuillez réessayer.' : 
                language === 'en' ? 'PDF generation error. Please try again.' : 
                'PDF oluşturma hatası. Lütfen tekrar deneyin.');
          return;
        }
      } else {
        // Générer CSV
        const csvContent = generateCSV(filteredData, exportType);
        const filename = `dantela_${exportType}_${periodText}_${timestamp}.csv`;
        
        downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
        
        alert(language === 'fr' ? `CSV téléchargé: ${filename}` : 
              language === 'en' ? `CSV downloaded: ${filename}` : 
              `CSV indirildi: ${filename}`);
      }
      
      setShowExportModal(false);
      
    } catch (error) {
      console.error('Erreur export:', error);
      alert(language === 'fr' ? 'Erreur lors de l\'export' : 
            language === 'en' ? 'Export error' : 
            'Dışa aktarma hatası');
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      type_mouvement: 'all',
      date_debut: '',
      date_fin: '',
      search: ''
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'entree': return 'bg-green-100 text-green-800';
      case 'sortie': return 'bg-red-100 text-red-800';
      case 'ajustement': return 'bg-blue-100 text-blue-800';
      case 'inventaire': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'entree': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'sortie': return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'ajustement': return <RefreshCw className="w-4 h-4 text-blue-600" />;
      case 'inventaire': return <BarChart3 className="w-4 h-4 text-purple-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  // Données pour les graphiques
  const chartData = mouvementsFiltres.reduce((acc, mouvement) => {
    const date = new Date(mouvement.created_at).toLocaleDateString();
    const existing = acc.find(item => item.date === date);
    
    if (existing) {
      if (mouvement.type_mouvement === 'entree') {
        existing.entrees += Math.abs(mouvement.quantite);
      } else if (mouvement.type_mouvement === 'sortie') {
        existing.sorties += Math.abs(mouvement.quantite);
      }
    } else {
      acc.push({
        date,
        entrees: mouvement.type_mouvement === 'entree' ? Math.abs(mouvement.quantite) : 0,
        sorties: mouvement.type_mouvement === 'sortie' ? Math.abs(mouvement.quantite) : 0
      });
    }
    
    return acc;
  }, [] as any[]).slice(-7); // 7 derniers jours

  const categoriesData = mouvementsFiltres.reduce((acc, mouvement) => {
    const existing = acc.find(item => item.name === mouvement.categorie_nom);
    
    if (existing) {
      existing.value += Math.abs(mouvement.quantite);
    } else {
      acc.push({
        name: mouvement.categorie_nom,
        value: Math.abs(mouvement.quantite)
      });
    }
    
    return acc;
  }, [] as any[]);

  const COLORS = ['#0891b2', '#059669', '#dc2626', '#7c3aed', '#ea580c'];

  // Obtenir les catégories uniques pour les filtres d'export
  const categories = [...new Set(mouvements.map(m => m.categorie_nom))].filter(Boolean);
  const products = [...new Set(mouvements.map(m => m.materiau_nom))].filter(Boolean);

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
        <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white bg-opacity-10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white bg-opacity-5 rounded-full translate-y-24 -translate-x-24"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-3">
                  {language === 'fr' ? 'Mouvements de Stock' : 
                   language === 'en' ? 'Stock Movements' : 
                   'Stok Hareketleri'}
                </h1>
                <p className="text-xl text-slate-200 mb-4">
                  {language === 'fr' ? 'Historique complet des entrées et sorties de stock' : 
                   language === 'en' ? 'Complete history of stock inbound and outbound' : 
                   'Stok giriş ve çıkışlarının tam geçmişi'}
                </p>
                <div className="flex items-center space-x-4 text-slate-300">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>{user?.prenom} {user?.nom}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Dernière mise à jour: {new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-2xl backdrop-blur-sm">
                <Activity className="w-12 h-12" />
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            {
              title: language === 'fr' ? 'Total Mouvements' : language === 'en' ? 'Total Movements' : 'Toplam Hareket',
              value: stats.total_mouvements?.toString() || '0',
              change: language === 'fr' ? 'Tous types' : language === 'en' ? 'All types' : 'Tüm tipler',
              icon: Activity,
              color: 'from-blue-500 to-blue-600'
            },
            {
              title: language === 'fr' ? 'Entrées' : language === 'en' ? 'Inbound' : 'Giriş',
              value: stats.entrees?.toString() || '0',
              change: language === 'fr' ? 'Réceptions' : language === 'en' ? 'Receptions' : 'Alımlar',
              icon: TrendingUp,
              color: 'from-green-500 to-green-600'
            },
            {
              title: language === 'fr' ? 'Sorties' : language === 'en' ? 'Outbound' : 'Çıkış',
              value: stats.sorties?.toString() || '0',
              change: language === 'fr' ? 'Distributions' : language === 'en' ? 'Distributions' : 'Dağıtımlar',
              icon: TrendingDown,
              color: 'from-red-500 to-red-600'
            },
            {
              title: language === 'fr' ? 'Ajustements' : language === 'en' ? 'Adjustments' : 'Düzeltmeler',
              value: stats.ajustements?.toString() || '0',
              change: language === 'fr' ? 'Corrections' : language === 'en' ? 'Corrections' : 'Düzeltmeler',
              icon: RefreshCw,
              color: 'from-purple-500 to-purple-600'
            },
            {
              title: language === 'fr' ? 'Matériaux' : language === 'en' ? 'Materials' : 'Malzemeler',
              value: stats.materiaux_concernes?.toString() || '0',
              change: language === 'fr' ? 'Concernés' : language === 'en' ? 'Involved' : 'İlgili',
              icon: Package,
              color: 'from-orange-500 to-orange-600'
            }
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-100 hover:scale-105">
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

        {/* Filtres et Export */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Type de mouvement */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {language === 'fr' ? 'Type de mouvement' : language === 'en' ? 'Movement type' : 'Hareket türü'}
              </label>
              <select
                value={filters.type_mouvement}
                onChange={(e) => setFilters({...filters, type_mouvement: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">
                  {language === 'fr' ? 'Tous les types' : language === 'en' ? 'All types' : 'Tüm tipler'}
                </option>
                <option value="entree">
                  {language === 'fr' ? 'Entrées' : language === 'en' ? 'Inbound' : 'Giriş'}
                </option>
                <option value="sortie">
                  {language === 'fr' ? 'Sorties' : language === 'en' ? 'Outbound' : 'Çıkış'}
                </option>
                <option value="ajustement">
                  {language === 'fr' ? 'Ajustements' : language === 'en' ? 'Adjustments' : 'Düzeltmeler'}
                </option>
                <option value="inventaire">
                  {language === 'fr' ? 'Inventaire' : language === 'en' ? 'Inventory' : 'Envanter'}
                </option>
              </select>
            </div>

            {/* Date début */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {language === 'fr' ? 'Date début' : language === 'en' ? 'Start date' : 'Başlangıç tarihi'}
              </label>
              <input
                type="date"
                value={filters.date_debut}
                onChange={(e) => setFilters({...filters, date_debut: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date fin */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {language === 'fr' ? 'Date fin' : language === 'en' ? 'End date' : 'Bitiş tarihi'}
              </label>
              <input
                type="date"
                value={filters.date_fin}
                onChange={(e) => setFilters({...filters, date_fin: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Recherche */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {language === 'fr' ? 'Recherche' : language === 'en' ? 'Search' : 'Ara'}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  placeholder={language === 'fr' ? 'Rechercher...' : language === 'en' ? 'Search...' : 'Ara...'}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-end space-x-2">
              <button
                onClick={resetFilters}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>
                  {language === 'fr' ? 'Reset' : language === 'en' ? 'Reset' : 'Sıfırla'}
                </span>
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>
                  {language === 'fr' ? 'Exporter' : language === 'en' ? 'Export' : 'Dışa Aktar'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Évolution quotidienne */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-6">
              {language === 'fr' ? 'Évolution Quotidienne' : 
               language === 'en' ? 'Daily Evolution' : 
               'Günlük Gelişim'}
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="entrees" fill="#10b981" name={language === 'fr' ? 'Entrées' : language === 'en' ? 'Inbound' : 'Giriş'} />
                  <Bar dataKey="sorties" fill="#ef4444" name={language === 'fr' ? 'Sorties' : language === 'en' ? 'Outbound' : 'Çıkış'} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Répartition par catégorie */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-6">
              {language === 'fr' ? 'Répartition par Catégorie' : 
               language === 'en' ? 'Distribution by Category' : 
               'Kategoriye Göre Dağılım'}
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={categoriesData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label
                  >
                    {categoriesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Historique des mouvements */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                {language === 'fr' ? 'Historique des Mouvements' : 
                 language === 'en' ? 'Movement History' : 
                 'Hareket Geçmişi'}
              </h2>
              <span className="text-slate-600">
                {mouvementsFiltres.length} {language === 'fr' ? 'mouvement(s)' : language === 'en' ? 'movement(s)' : 'hareket'}
              </span>
            </div>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {mouvementsFiltres.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  {language === 'fr' ? 'Aucun mouvement trouvé' : 
                   language === 'en' ? 'No movements found' : 
                   'Hareket bulunamadı'}
                </h3>
                <p className="text-slate-600">
                  {language === 'fr' ? 'Aucun mouvement ne correspond à vos critères' : 
                   language === 'en' ? 'No movements match your criteria' : 
                   'Kriterlerinize uygun hareket yok'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {mouvementsFiltres.map(mouvement => (
                  <div key={mouvement.id} className="bg-slate-50 border border-slate-200 rounded-xl p-6 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          {getTypeIcon(mouvement.type_mouvement)}
                          <h4 className="text-lg font-semibold text-slate-900">
                            {mouvement.materiau_nom}
                          </h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(mouvement.type_mouvement)}`}>
                            {mouvement.type_mouvement.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600 mb-3">
                          <div>
                            <strong>Code:</strong> {mouvement.code_produit}
                          </div>
                          <div>
                            <strong>Quantité:</strong> {mouvement.quantite > 0 ? '+' : ''}{mouvement.quantite} {mouvement.unite}
                          </div>
                          <div>
                            <strong>Stock après:</strong> {mouvement.stock_apres} {mouvement.unite}
                          </div>
                          <div>
                            <strong>Catégorie:</strong> {mouvement.categorie_nom}
                          </div>
                          <div>
                            <strong>Utilisateur:</strong> {mouvement.utilisateur_nom}
                          </div>
                          <div>
                            <strong>Date:</strong> {new Date(mouvement.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        {mouvement.motif && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                            <p className="text-sm text-blue-700">
                              <strong>Motif:</strong> {mouvement.motif}
                            </p>
                          </div>
                        )}

                        {mouvement.description && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <p className="text-sm text-gray-700">
                              <strong>Description:</strong> {mouvement.description}
                            </p>
                          </div>
                        )}

                        {(mouvement.numero_demande || mouvement.numero_bon) && (
                          <div className="mt-3 flex items-center space-x-4 text-sm">
                            {mouvement.numero_demande && (
                              <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4 text-blue-500" />
                                <span className="text-blue-600 font-medium">{mouvement.numero_demande}</span>
                              </div>
                            )}
                            {mouvement.numero_bon && (
                              <div className="flex items-center space-x-2">
                                <Printer className="w-4 h-4 text-green-500" />
                                <span className="text-green-600 font-medium">{mouvement.numero_bon}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xs text-slate-500">
                          {new Date(mouvement.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Export */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl">
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <h2 className="text-xl font-bold text-slate-900">
                {language === 'fr' ? 'Exporter les Données' : 
                 language === 'en' ? 'Export Data' : 
                 'Verileri Dışa Aktar'}
              </h2>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {/* Type d'export */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    {language === 'fr' ? 'Type de données à exporter' : 
                     language === 'en' ? 'Data type to export' : 
                     'Dışa aktarılacak veri türü'}
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setExportType('mouvements')}
                      className={`p-4 border-2 rounded-xl text-left transition-all ${
                        exportType === 'mouvements'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Activity className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {language === 'fr' ? 'Mouvements de Stock' : language === 'en' ? 'Stock Movements' : 'Stok Hareketleri'}
                          </p>
                          <p className="text-sm text-slate-600">
                            {language === 'fr' ? 'Entrées, sorties, ajustements' : language === 'en' ? 'Inbound, outbound, adjustments' : 'Giriş, çıkış, düzeltmeler'}
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExportType('commandes')}
                      className={`p-4 border-2 rounded-xl text-left transition-all ${
                        exportType === 'commandes'
                          ? 'border-green-500 bg-green-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <FileText className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {language === 'fr' ? 'Historique Commandes' : language === 'en' ? 'Orders History' : 'Sipariş Geçmişi'}
                          </p>
                          <p className="text-sm text-slate-600">
                            {language === 'fr' ? 'Demandes et validations' : language === 'en' ? 'Requests and validations' : 'Talepler ve onaylar'}
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Filtres d'export */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Période */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {language === 'fr' ? 'Période' : language === 'en' ? 'Period' : 'Dönem'}
                    </label>
                    <select
                      value={exportFilters.period}
                      onChange={(e) => setExportFilters({...exportFilters, period: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="day">
                        {language === 'fr' ? 'Aujourd\'hui' : language === 'en' ? 'Today' : 'Bugün'}
                      </option>
                      <option value="week">
                        {language === 'fr' ? 'Cette semaine' : language === 'en' ? 'This week' : 'Bu hafta'}
                      </option>
                      <option value="month">
                        {language === 'fr' ? 'Ce mois' : language === 'en' ? 'This month' : 'Bu ay'}
                      </option>
                    </select>
                  </div>

                  {/* Format */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {language === 'fr' ? 'Format' : language === 'en' ? 'Format' : 'Format'}
                    </label>
                    <select
                      value={exportFilters.format}
                      onChange={(e) => setExportFilters({...exportFilters, format: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="pdf">PDF</option>
                      <option value="csv">CSV</option>
                    </select>
                  </div>
                </div>

                {/* Filtres spécifiques aux mouvements */}
                {exportType === 'mouvements' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {language === 'fr' ? 'Catégorie' : language === 'en' ? 'Category' : 'Kategori'}
                      </label>
                      <select
                        value={exportFilters.category}
                        onChange={(e) => setExportFilters({...exportFilters, category: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="all">
                          {language === 'fr' ? 'Toutes les catégories' : language === 'en' ? 'All categories' : 'Tüm kategoriler'}
                        </option>
                        {categories.map(category => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {language === 'fr' ? 'Produit spécifique' : language === 'en' ? 'Specific product' : 'Belirli ürün'}
                      </label>
                      <select
                        value={exportFilters.product}
                        onChange={(e) => setExportFilters({...exportFilters, product: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="all">
                          {language === 'fr' ? 'Tous les produits' : language === 'en' ? 'All products' : 'Tüm ürünler'}
                        </option>
                        {products.map(product => (
                          <option key={product} value={product}>
                            {product}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Aperçu */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {language === 'fr' ? 'Aperçu de l\'export' : 
                         language === 'en' ? 'Export preview' : 
                         'Dışa aktarma önizlemesi'}
                      </p>
                      <p className="text-sm text-slate-600">
                        {getFilteredDataForExport().length} {language === 'fr' ? 'éléments à exporter' : 
                                                             language === 'en' ? 'items to export' : 
                                                             'dışa aktarılacak öğe'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-700">
                        {exportFilters.format.toUpperCase()}
                      </p>
                      <p className="text-sm text-slate-600">
                        {exportType === 'mouvements' ? 
                          (language === 'fr' ? 'Mouvements' : language === 'en' ? 'Movements' : 'Hareketler') :
                          (language === 'fr' ? 'Commandes' : language === 'en' ? 'Orders' : 'Siparişler')
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 border border-slate-300 text-slate-700 py-3 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  {language === 'fr' ? 'Annuler' : language === 'en' ? 'Cancel' : 'İptal'}
                </button>
                <button
                  onClick={handleExport}
                  disabled={exporting || getFilteredDataForExport().length === 0}
                  className="flex-2 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>
                    {exporting ? 
                      (language === 'fr' ? 'Export en cours...' : language === 'en' ? 'Exporting...' : 'Dışa aktarılıyor...') :
                      (language === 'fr' ? 'Télécharger' : language === 'en' ? 'Download' : 'İndir')
                    }
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

export default StockMovementsPage;