import React, { createContext, useContext, useState, useEffect } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Traductions
const translations = {
  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.services': 'Services',
    'nav.about': 'À propos',
    'nav.contact': 'Contact',
    'nav.login': 'Connexion',
    'nav.register': "S'inscrire",
    
    // HomePage
    'home.hero.title': 'DANTELA',
    'home.hero.subtitle': 'Construction & Commerce',
    'home.hero.description': 'Expertise turque au service du développement du Cameroun. Spécialisés en construction BTP, béton prêt à l\'emploi et commerce de matériaux depuis 2015.',
    'home.hero.join': 'Rejoindre Dantela',
    'home.hero.services': 'Nos Services',
    'home.stats.experience': 'Années d\'expérience',
    'home.stats.projects': 'Projets réalisés',
    'home.stats.employees': 'Employés formés',
    'home.stats.service': 'Service client',
    'home.services.title': 'Nos Activités & Prestations',
    'home.services.description': 'Dantela offre une gamme complète de services dans le domaine de la construction et du commerce, alliant expertise turque et savoir-faire local.',
    'home.about.title': 'À Propos de Dantela',
    'home.cta.title': 'Prêt à rejoindre l\'équipe Dantela ?',
    'home.cta.description': 'Que vous soyez magazinier ou chef de chantier, rejoignez notre système de gestion moderne pour optimiser vos opérations.',
    'home.cta.create': 'Créer un compte',
    'home.cta.login': 'Se connecter',
    
    // Dashboard
    'dashboard.overview': 'Vue D\'ensemble',
    'dashboard.catalog': 'Catalogue',
    'dashboard.stock': 'Gestion de stock',
    'dashboard.orders': 'Gestion de commande',
    'dashboard.delivery': 'Bon de sortie',
    'dashboard.chat': 'Chat',
    'dashboard.history': 'Historique',
    'dashboard.logout': 'Déconnexion',
    'dashboard.search': 'Rechercher',
    
    // Magazinier Dashboard
    'magazinier.title': 'Vue D\'ensemble - Magazinier',
    'magazinier.welcome': 'Bienvenue dans votre espace de gestion des stocks et matériaux',
    'magazinier.stats.depot_out': 'Sortie de Dépôt',
    'magazinier.stats.depot_in': 'Entrée de Dépôt',
    'magazinier.stats.stock_alert': 'Alerte Stock',
    'magazinier.stats.product_demand': 'Demande de Produits',
    'magazinier.charts.products_by_category': 'Produits par Catégories',
    'magazinier.charts.activities': 'Activités par Période',
    'magazinier.charts.alerts_by_category': 'Alertes par Catégories',
    'magazinier.period.day': 'Jour',
    'magazinier.period.week': 'Semaine',
    'magazinier.period.month': 'Mois',
    'magazinier.recent_activities': 'Activités Récentes',
    'magazinier.quick_actions': 'Actions Rapides',
    
    // Login
    'login.title': 'Welcome back',
    'login.subtitle': 'Veuillez entrer vos informations de connexion',
    'login.email': 'Email',
    'login.password': 'Mot de passe',
    'login.remember': 'Se souvenir pendant 30 jours',
    'login.forgot': 'Mot de passe oublié',
    'login.submit': 'Se connecter',
    'login.loading': 'Connexion...',
    'login.no_account': 'Vous n\'avez pas de compte ?',
    'login.create_account': 'Créer un compte',
    'login.back_home': '← Retour à l\'accueil',
    
    // Register
    'register.title': 'Créer un compte',
    'register.subtitle': 'Rejoignez l\'équipe Dantela',
    'register.account_type': 'Type de compte',
    'register.magazinier': 'Magazinier',
    'register.magazinier_desc': 'Gestion des stocks',
    'register.chef_chantier': 'Chef de chantier',
    'register.chef_chantier_desc': 'Gestion des chantiers',
    'register.nom': 'Nom',
    'register.prenom': 'Prénom',
    'register.telephone': 'Téléphone',
    'register.adresse': 'Adresse',
    'register.nom_chantier': 'Nom du chantier',
    'register.password': 'Mot de passe',
    'register.confirm_password': 'Confirmer le mot de passe',
    'register.submit': 'Créer mon compte',
    'register.loading': 'Création en cours...',
    'register.have_account': 'Déjà un compte ?',
    'register.login_here': 'Se connecter ici',
    'register.validation_notice': 'Important: Votre compte sera en attente de validation par le directeur avant que vous puissiez vous connecter.',
    
    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.cancel': 'Annuler',
    'common.save': 'Enregistrer',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.view': 'Voir',
    'common.required': 'Obligatoire',
    
    // Catalogue
    'catalogue.title': 'Catalogue des Matériaux',
    'catalogue.description': 'Parcourez et gérez les matériaux de construction',
    'catalogue.add_material': 'Ajouter Matériau',
    'catalogue.cart': 'Panier',
    'catalogue.search': 'Rechercher...',
    'catalogue.all_categories': 'Toutes les catégories',
    'catalogue.low_stock_only': 'Stock faible uniquement',
    'catalogue.materials_found': 'matériau(x) trouvé(s)',
    'catalogue.add_to_cart': 'Ajouter',
    'catalogue.stock': 'Stock:',
    'catalogue.minimum': 'Minimum:',
    'catalogue.category': 'Catégorie:',
    'catalogue.supplier': 'Fournisseur:',
    'catalogue.my_cart': 'Mon Panier',
    'catalogue.cart_empty': 'Votre panier est vide',
    'catalogue.available_stock': 'Stock disponible:',
    'catalogue.clear_cart': 'Vider',
    'catalogue.place_order': 'Passer Commande',
    
    // Order Management
    'orders.title': 'Gestion des Commandes',
    'orders.description': 'Validez et traitez les demandes de matériaux',
    'orders.pending': 'En Attente',
    'orders.approved': 'Approuvées',
    'orders.in_preparation': 'En Préparation',
    'orders.delivered': 'Livrées',
    'orders.validate': 'Valider',
    'orders.process': 'Traiter',
    'orders.view_details': 'Voir détails',
    'orders.validation_title': 'Validation de la Demande',
    'orders.decision': 'Décision',
    'orders.approve': 'Approuver',
    'orders.reject': 'Rejeter',
    'orders.quantities_to_grant': 'Quantités à Accorder',
    'orders.grant': 'Accorder:',
    'orders.approve_request': 'Approuver la Demande',
    'orders.reject_request': 'Rejeter la Demande',
    
    // Direct Distribution
    'distribution.title': 'Distribution Directe',
    'distribution.description': 'Distribuez des matériaux directement aux chefs de chantier',
    'distribution.select_materials': 'Sélectionner les Matériaux',
    'distribution.current_distribution': 'Distribution en Cours',
    'distribution.recipient': 'Destinataire',
    'distribution.select_recipient': 'Sélectionner un destinataire',
    'distribution.comment': 'Commentaire',
    'distribution.distribution_reason': 'Motif de la distribution...',
    'distribution.selected_materials': 'Matériaux Sélectionnés',
    'distribution.no_materials_selected': 'Aucun matériau sélectionné',
    'distribution.distribute_materials': 'Distribuer les Matériaux',
    'distribution.successful': 'Distribution Réussie !',
    'distribution.note_generated': 'Bon de livraison généré:',
    'distribution.print': 'Imprimer',
    
    // My Requests
    'requests.title': 'Mes Demandes',
    'requests.description': 'Suivez l\'état de vos demandes de matériaux',
    'requests.new_request': 'Nouvelle Demande',
    'requests.total': 'Total',
    'requests.search_by_number': 'Rechercher par numéro...',
    'requests.pending_validation': 'En attente de validation',
    'requests.approved_awaiting': 'Approuvée - En attente de traitement',
    'requests.rejected': 'Rejetée',
    'requests.being_prepared': 'En cours de préparation',
    'requests.delivered': 'Livrée',
    'requests.requested_on': 'Demandé le:',
    'requests.desired_delivery': 'Livraison souhaitée:',
    'requests.requested_quantity': 'Quantité demandée:',
    'requests.granted_quantity': 'Quantité accordée:',
    'requests.your_comment': 'Votre commentaire:',
    'requests.warehouse_response': 'Réponse du magazinier:',
    'requests.no_requests': 'Vous n\'avez pas encore fait de demande',
    'requests.first_request': 'Faire ma première demande',
    
    // Delivery Notes
    'delivery.title': 'Bons de Livraison',
    'delivery.description': 'Gérez et imprimez les bons de livraison',
    'delivery.in_preparation': 'En Préparation',
    'delivery.ready': 'Prêtes',
    'delivery.all_types': 'Tous les types',
    'delivery.order': 'Commande',
    'delivery.direct_distribution': 'Distribution directe',
    'delivery.details_title': 'Détails du Bon de Livraison',
    'delivery.recipient': 'Destinataire:',
    'delivery.warehouse_manager': 'Magazinier:',
    'delivery.preparation_date': 'Date de préparation:',
    'delivery.delivery_date': 'Date de livraison:',
    'delivery.type': 'Type:',
    'delivery.status': 'Statut:',
    'delivery.delivered_materials': 'Matériaux Livrés',
    'delivery.print_note': 'Imprimer ce Bon',
  },
  
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.services': 'Services',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.login': 'Login',
    'nav.register': 'Register',
    
    // HomePage
    'home.hero.title': 'DANTELA',
    'home.hero.subtitle': 'Construction & Commerce',
    'home.hero.description': 'Turkish expertise serving Cameroon\'s development. Specialized in BTP construction, ready-mix concrete and materials trade since 2015.',
    'home.hero.join': 'Join Dantela',
    'home.hero.services': 'Our Services',
    'home.stats.experience': 'Years of experience',
    'home.stats.projects': 'Completed projects',
    'home.stats.employees': 'Trained employees',
    'home.stats.service': 'Customer service',
    'home.services.title': 'Our Activities & Services',
    'home.services.description': 'Dantela offers a complete range of services in construction and commerce, combining Turkish expertise with local know-how.',
    'home.about.title': 'About Dantela',
    'home.cta.title': 'Ready to join the Dantela team?',
    'home.cta.description': 'Whether you are a warehouse manager or site manager, join our modern management system to optimize your operations.',
    'home.cta.create': 'Create account',
    'home.cta.login': 'Sign in',
    
    // Dashboard
    'dashboard.overview': 'Overview',
    'dashboard.catalog': 'Catalog',
    'dashboard.stock': 'Stock Management',
    'dashboard.orders': 'Order Management',
    'dashboard.delivery': 'Delivery Note',
    'dashboard.chat': 'Chat',
    'dashboard.history': 'History',
    'dashboard.logout': 'Logout',
    'dashboard.search': 'Search',
    
    // Magazinier Dashboard
    'magazinier.title': 'Overview - Warehouse Manager',
    'magazinier.welcome': 'Welcome to your stock and materials management space',
    'magazinier.stats.depot_out': 'Depot Outbound',
    'magazinier.stats.depot_in': 'Depot Inbound',
    'magazinier.stats.stock_alert': 'Stock Alert',
    'magazinier.stats.product_demand': 'Product Demand',
    'magazinier.charts.products_by_category': 'Products by Categories',
    'magazinier.charts.activities': 'Activities by Period',
    'magazinier.charts.alerts_by_category': 'Alerts by Categories',
    'magazinier.period.day': 'Day',
    'magazinier.period.week': 'Week',
    'magazinier.period.month': 'Month',
    'magazinier.recent_activities': 'Recent Activities',
    'magazinier.quick_actions': 'Quick Actions',
    
    // Login
    'login.title': 'Welcome back',
    'login.subtitle': 'Please enter your login information',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.remember': 'Remember for 30 days',
    'login.forgot': 'Forgot password',
    'login.submit': 'Sign in',
    'login.loading': 'Signing in...',
    'login.no_account': 'Don\'t have an account?',
    'login.create_account': 'Create account',
    'login.back_home': '← Back to home',
    
    // Register
    'register.title': 'Create account',
    'register.subtitle': 'Join the Dantela team',
    'register.account_type': 'Account type',
    'register.magazinier': 'Warehouse Manager',
    'register.magazinier_desc': 'Stock management',
    'register.chef_chantier': 'Site Manager',
    'register.chef_chantier_desc': 'Site management',
    'register.nom': 'Last Name',
    'register.prenom': 'First Name',
    'register.telephone': 'Phone',
    'register.adresse': 'Address',
    'register.nom_chantier': 'Site name',
    'register.password': 'Password',
    'register.confirm_password': 'Confirm password',
    'register.submit': 'Create my account',
    'register.loading': 'Creating...',
    'register.have_account': 'Already have an account?',
    'register.login_here': 'Sign in here',
    'register.validation_notice': 'Important: Your account will be pending validation by the director before you can log in.',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.required': 'Required',
    
    // Catalogue
    'catalogue.title': 'Materials Catalog',
    'catalogue.description': 'Browse and manage construction materials',
    'catalogue.add_material': 'Add Material',
    'catalogue.cart': 'Cart',
    'catalogue.search': 'Search...',
    'catalogue.all_categories': 'All categories',
    'catalogue.low_stock_only': 'Low stock only',
    'catalogue.materials_found': 'material(s) found',
    'catalogue.add_to_cart': 'Add',
    'catalogue.stock': 'Stock:',
    'catalogue.minimum': 'Minimum:',
    'catalogue.category': 'Category:',
    'catalogue.supplier': 'Supplier:',
    'catalogue.my_cart': 'My Cart',
    'catalogue.cart_empty': 'Your cart is empty',
    'catalogue.available_stock': 'Available stock:',
    'catalogue.clear_cart': 'Clear',
    'catalogue.place_order': 'Place Order',
    
    // Order Management
    'orders.title': 'Order Management',
    'orders.description': 'Validate and process material requests',
    'orders.pending': 'Pending',
    'orders.approved': 'Approved',
    'orders.in_preparation': 'In Preparation',
    'orders.delivered': 'Delivered',
    'orders.validate': 'Validate',
    'orders.process': 'Process',
    'orders.view_details': 'View details',
    'orders.validation_title': 'Request Validation',
    'orders.decision': 'Decision',
    'orders.approve': 'Approve',
    'orders.reject': 'Reject',
    'orders.quantities_to_grant': 'Quantities to Grant',
    'orders.grant': 'Grant:',
    'orders.approve_request': 'Approve Request',
    'orders.reject_request': 'Reject Request',
    
    // Direct Distribution
    'distribution.title': 'Direct Distribution',
    'distribution.description': 'Distribute materials directly to site managers',
    'distribution.select_materials': 'Select Materials',
    'distribution.current_distribution': 'Current Distribution',
    'distribution.recipient': 'Recipient',
    'distribution.select_recipient': 'Select a recipient',
    'distribution.comment': 'Comment',
    'distribution.distribution_reason': 'Distribution reason...',
    'distribution.selected_materials': 'Selected Materials',
    'distribution.no_materials_selected': 'No materials selected',
    'distribution.distribute_materials': 'Distribute Materials',
    'distribution.successful': 'Distribution Successful!',
    'distribution.note_generated': 'Delivery note generated:',
    'distribution.print': 'Print',
    
    // My Requests
    'requests.title': 'My Requests',
    'requests.description': 'Track the status of your material requests',
    'requests.new_request': 'New Request',
    'requests.total': 'Total',
    'requests.search_by_number': 'Search by number...',
    'requests.pending_validation': 'Pending validation',
    'requests.approved_awaiting': 'Approved - Awaiting processing',
    'requests.rejected': 'Rejected',
    'requests.being_prepared': 'Being prepared',
    'requests.delivered': 'Delivered',
    'requests.requested_on': 'Requested on:',
    'requests.desired_delivery': 'Desired delivery:',
    'requests.requested_quantity': 'Requested quantity:',
    'requests.granted_quantity': 'Granted quantity:',
    'requests.your_comment': 'Your comment:',
    'requests.warehouse_response': 'Warehouse response:',
    'requests.no_requests': 'You haven\'t made any requests yet',
    'requests.first_request': 'Make my first request',
    
    // Delivery Notes
    'delivery.title': 'Delivery Notes',
    'delivery.description': 'Manage and print delivery notes',
    'delivery.in_preparation': 'In Preparation',
    'delivery.ready': 'Ready',
    'delivery.all_types': 'All types',
    'delivery.order': 'Order',
    'delivery.direct_distribution': 'Direct distribution',
    'delivery.details_title': 'Delivery Note Details',
    'delivery.recipient': 'Recipient:',
    'delivery.warehouse_manager': 'Warehouse Manager:',
    'delivery.preparation_date': 'Preparation date:',
    'delivery.delivery_date': 'Delivery date:',
    'delivery.type': 'Type:',
    'delivery.status': 'Status:',
    'delivery.delivered_materials': 'Delivered Materials',
    'delivery.print_note': 'Print this Note',
  },
  
  tr: {
    // Navigation
    'nav.home': 'Ana Sayfa',
    'nav.services': 'Hizmetler',
    'nav.about': 'Hakkımızda',
    'nav.contact': 'İletişim',
    'nav.login': 'Giriş',
    'nav.register': 'Kayıt Ol',
    
    // HomePage
    'home.hero.title': 'DANTELA',
    'home.hero.subtitle': 'İnşaat ve Ticaret',
    'home.hero.description': 'Kamerun\'un kalkınmasına hizmet eden Türk uzmanlığı. 2015\'ten beri yapı inşaat, hazır beton ve malzeme ticaretinde uzmanız.',
    'home.hero.join': 'Dantela\'ya Katıl',
    'home.hero.services': 'Hizmetlerimiz',
    'home.stats.experience': 'Yıllık deneyim',
    'home.stats.projects': 'Tamamlanan proje',
    'home.stats.employees': 'Eğitilen çalışan',
    'home.stats.service': 'Müşteri hizmeti',
    'home.services.title': 'Faaliyetlerimiz ve Hizmetlerimiz',
    'home.services.description': 'Dantela, Türk uzmanlığını yerel bilgi birikimi ile birleştirerek inşaat ve ticaret alanında tam hizmet yelpazesi sunar.',
    'home.about.title': 'Dantela Hakkında',
    'home.cta.title': 'Dantela ekibine katılmaya hazır mısınız?',
    'home.cta.description': 'İster depo sorumlusu ister şantiye şefi olun, işlemlerinizi optimize etmek için modern yönetim sistemimize katılın.',
    'home.cta.create': 'Hesap oluştur',
    'home.cta.login': 'Giriş yap',
    
    // Dashboard
    'dashboard.overview': 'Genel Bakış',
    'dashboard.catalog': 'Katalog',
    'dashboard.stock': 'Stok Yönetimi',
    'dashboard.orders': 'Sipariş Yönetimi',
    'dashboard.delivery': 'Teslimat Fişi',
    'dashboard.chat': 'Sohbet',
    'dashboard.history': 'Geçmiş',
    'dashboard.logout': 'Çıkış',
    'dashboard.search': 'Ara',
    
    // Magazinier Dashboard
    'magazinier.title': 'Genel Bakış - Depo Sorumlusu',
    'magazinier.welcome': 'Stok ve malzeme yönetim alanınıza hoş geldiniz',
    'magazinier.stats.depot_out': 'Depo Çıkışı',
    'magazinier.stats.depot_in': 'Depo Girişi',
    'magazinier.stats.stock_alert': 'Stok Uyarısı',
    'magazinier.stats.product_demand': 'Ürün Talebi',
    'magazinier.charts.products_by_category': 'Kategorilere Göre Ürünler',
    'magazinier.charts.activities': 'Döneme Göre Aktiviteler',
    'magazinier.charts.alerts_by_category': 'Kategorilere Göre Uyarılar',
    'magazinier.period.day': 'Gün',
    'magazinier.period.week': 'Hafta',
    'magazinier.period.month': 'Ay',
    'magazinier.recent_activities': 'Son Aktiviteler',
    'magazinier.quick_actions': 'Hızlı İşlemler',
    
    // Login
    'login.title': 'Tekrar hoş geldiniz',
    'login.subtitle': 'Lütfen giriş bilgilerinizi girin',
    'login.email': 'E-posta',
    'login.password': 'Şifre',
    'login.remember': '30 gün hatırla',
    'login.forgot': 'Şifremi unuttum',
    'login.submit': 'Giriş yap',
    'login.loading': 'Giriş yapılıyor...',
    'login.no_account': 'Hesabınız yok mu?',
    'login.create_account': 'Hesap oluştur',
    'login.back_home': '← Ana sayfaya dön',
    
    // Register
    'register.title': 'Hesap oluştur',
    'register.subtitle': 'Dantela ekibine katıl',
    'register.account_type': 'Hesap türü',
    'register.magazinier': 'Depo Sorumlusu',
    'register.magazinier_desc': 'Stok yönetimi',
    'register.chef_chantier': 'Şantiye Şefi',
    'register.chef_chantier_desc': 'Şantiye yönetimi',
    'register.nom': 'Soyadı',
    'register.prenom': 'Adı',
    'register.telephone': 'Telefon',
    'register.adresse': 'Adres',
    'register.nom_chantier': 'Şantiye adı',
    'register.password': 'Şifre',
    'register.confirm_password': 'Şifreyi onayla',
    'register.submit': 'Hesabımı oluştur',
    'register.loading': 'Oluşturuluyor...',
    'register.have_account': 'Zaten hesabınız var mı?',
    'register.login_here': 'Buradan giriş yapın',
    'register.validation_notice': 'Hesabınız giriş yapabilmeniz için müdür tarafından onaylanmayı bekleyecektir.',
    
    // Common
    'common.loading': 'Yükleniyor...',
    'common.error': 'Hata',
    'common.success': 'Başarılı',
    'common.cancel': 'İptal',
    'common.save': 'Kaydet',
    'common.delete': 'Sil',
    'common.edit': 'Düzenle',
    'common.view': 'Görüntüle',
    'common.required': 'Gerekli',
    
    // Catalogue
    'catalogue.title': 'Malzeme Kataloğu',
    'catalogue.description': 'İnşaat malzemelerini görüntüleyin ve yönetin',
    'catalogue.add_material': 'Malzeme Ekle',
    'catalogue.cart': 'Sepet',
    'catalogue.search': 'Ara...',
    'catalogue.all_categories': 'Tüm kategoriler',
    'catalogue.low_stock_only': 'Sadece düşük stok',
    'catalogue.materials_found': 'malzeme bulundu',
    'catalogue.add_to_cart': 'Ekle',
    'catalogue.stock': 'Stok:',
    'catalogue.minimum': 'Minimum:',
    'catalogue.category': 'Kategori:',
    'catalogue.supplier': 'Tedarikçi:',
    'catalogue.my_cart': 'Sepetim',
    'catalogue.cart_empty': 'Sepetiniz boş',
    'catalogue.available_stock': 'Mevcut stok:',
    'catalogue.clear_cart': 'Temizle',
    'catalogue.place_order': 'Sipariş Ver',
    
    // Order Management
    'orders.title': 'Sipariş Yönetimi',
    'orders.description': 'Malzeme taleplerini onaylayın ve işleyin',
    'orders.pending': 'Beklemede',
    'orders.approved': 'Onaylandı',
    'orders.in_preparation': 'Hazırlanıyor',
    'orders.delivered': 'Teslim Edildi',
    'orders.validate': 'Onayla',
    'orders.process': 'İşle',
    'orders.view_details': 'Detayları gör',
    'orders.validation_title': 'Talep Onayı',
    'orders.decision': 'Karar',
    'orders.approve': 'Onayla',
    'orders.reject': 'Reddet',
    'orders.quantities_to_grant': 'Verilecek Miktarlar',
    'orders.grant': 'Ver:',
    'orders.approve_request': 'Talebi Onayla',
    'orders.reject_request': 'Talebi Reddet',
    
    // Direct Distribution
    'distribution.title': 'Doğrudan Dağıtım',
    'distribution.description': 'Malzemeleri doğrudan şantiye şeflerine dağıtın',
    'distribution.select_materials': 'Malzeme Seçin',
    'distribution.current_distribution': 'Mevcut Dağıtım',
    'distribution.recipient': 'Alıcı',
    'distribution.select_recipient': 'Alıcı seçin',
    'distribution.comment': 'Yorum',
    'distribution.distribution_reason': 'Dağıtım sebebi...',
    'distribution.selected_materials': 'Seçilen Malzemeler',
    'distribution.no_materials_selected': 'Seçilen malzeme yok',
    'distribution.distribute_materials': 'Malzemeleri Dağıt',
    'distribution.successful': 'Dağıtım Başarılı!',
    'distribution.note_generated': 'Teslimat fişi oluşturuldu:',
    'distribution.print': 'Yazdır',
    
    // My Requests
    'requests.title': 'Taleplerim',
    'requests.description': 'Malzeme taleplerinizin durumunu takip edin',
    'requests.new_request': 'Yeni Talep',
    'requests.total': 'Toplam',
    'requests.search_by_number': 'Numaraya göre ara...',
    'requests.pending_validation': 'Onay bekliyor',
    'requests.approved_awaiting': 'Onaylandı - İşlem bekliyor',
    'requests.rejected': 'Reddedildi',
    'requests.being_prepared': 'Hazırlanıyor',
    'requests.delivered': 'Teslim edildi',
    'requests.requested_on': 'Talep tarihi:',
    'requests.desired_delivery': 'İstenen teslimat:',
    'requests.requested_quantity': 'İstenen miktar:',
    'requests.granted_quantity': 'Verilen miktar:',
    'requests.your_comment': 'Yorumunuz:',
    'requests.warehouse_response': 'Depo yanıtı:',
    'requests.no_requests': 'Henüz talep yapmadınız',
    'requests.first_request': 'İlk talebimi yap',
    
    // Delivery Notes
    'delivery.title': 'Teslimat Fişleri',
    'delivery.description': 'Teslimat fişlerini yönetin ve yazdırın',
    'delivery.in_preparation': 'Hazırlanıyor',
    'delivery.ready': 'Hazır',
    'delivery.all_types': 'Tüm tipler',
    'delivery.order': 'Sipariş',
    'delivery.direct_distribution': 'Doğrudan dağıtım',
    'delivery.details_title': 'Teslimat Fişi Detayları',
    'delivery.recipient': 'Alıcı:',
    'delivery.warehouse_manager': 'Depo Sorumlusu:',
    'delivery.preparation_date': 'Hazırlık tarihi:',
    'delivery.delivery_date': 'Teslimat tarihi:',
    'delivery.type': 'Tip:',
    'delivery.status': 'Durum:',
    'delivery.delivered_materials': 'Teslim Edilen Malzemeler',
    'delivery.print_note': 'Bu Fişi Yazdır',
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || 'fr';
  });

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    // Force un re-render de tous les composants
    window.dispatchEvent(new Event('languageChanged'));
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language as keyof typeof translations] || translations['fr'];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    // Si la traduction n'existe pas dans la langue sélectionnée, retourner la version française
    if (!value && language !== 'fr') {
      const frKeys = key.split('.');
      let frValue: any = translations['fr'];
      for (const k of frKeys) {
        frValue = frValue?.[k];
      }
      return frValue || key;
    }
    
    return value || key;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = {
    language,
    setLanguage,
    t,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};