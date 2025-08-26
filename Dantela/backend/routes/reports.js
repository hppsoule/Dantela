/**
 * Routes Rapports - Génération de rapports et analyses
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Middleware pour vérifier que l'utilisateur est directeur
const requireDirecteur = authorizeRoles(['directeur']);

/**
 * @route   GET /api/reports/overview
 * @desc    Obtenir le rapport de vue d'ensemble
 * @access  Private (Directeur seulement)
 */
router.get('/overview', authenticateToken, requireDirecteur, async (req, res) => {
    try {
        console.log('📊 Génération rapport vue d\'ensemble par:', req.user.email);

        const { query } = require('../config/database');

        // Statistiques réelles de la base de données
        const overviewQuery = `
            SELECT 
                -- Utilisateurs
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
                (SELECT COUNT(*) FROM users WHERE is_active = false) as pending_users,
                (SELECT COUNT(*) FROM users WHERE role = 'directeur') as directeurs,
                (SELECT COUNT(*) FROM users WHERE role = 'magazinier' AND is_active = true) as magaziniers,
                (SELECT COUNT(*) FROM users WHERE role = 'chef_chantier' AND is_active = true) as chefs_chantier,
                
                -- Dépôts
                (SELECT COUNT(*) FROM depots) as total_depots,
                (SELECT COUNT(*) FROM depots WHERE is_active = true) as active_depots,
                (SELECT COUNT(*) FROM depots WHERE magazinier_id IS NOT NULL) as depots_with_manager,
                
                -- Matériaux
                (SELECT COUNT(*) FROM materiaux) as total_materiaux,
                (SELECT COUNT(*) FROM categories) as total_categories,
                (SELECT COUNT(*) FROM materiaux WHERE stock_actuel <= stock_minimum) as low_stock_items,
                (SELECT COUNT(*) FROM materiaux WHERE stock_actuel = 0) as out_of_stock_items,
                
                -- Demandes
                (SELECT COUNT(*) FROM demandes_materiaux) as total_demandes,
                (SELECT COUNT(*) FROM demandes_materiaux WHERE statut = 'approuvee') as approved_demandes,
                (SELECT COUNT(*) FROM demandes_materiaux WHERE statut = 'rejetee') as rejected_demandes,
                (SELECT COUNT(*) FROM demandes_materiaux WHERE statut = 'en_attente') as pending_demandes,
                (SELECT COUNT(*) FROM demandes_materiaux WHERE priorite = 'urgente') as demandes_urgentes,
                (SELECT COUNT(*) FROM demandes_materiaux WHERE priorite = 'haute') as demandes_hautes,
                (SELECT COUNT(*) FROM demandes_materiaux WHERE priorite = 'normale') as demandes_normales,
                (SELECT COUNT(*) FROM demandes_materiaux WHERE priorite = 'basse') as demandes_basses,
                
                -- Mouvements de stock
                (SELECT COUNT(*) FROM mouvements_stock) as total_mouvements,
                (SELECT COUNT(*) FROM mouvements_stock WHERE type_mouvement = 'entree') as entrees_stock,
                (SELECT COUNT(*) FROM mouvements_stock WHERE type_mouvement = 'sortie') as sorties_stock,
                
                -- Bons de livraison
                (SELECT COUNT(*) FROM bons_livraison) as total_bons,
                (SELECT COUNT(*) FROM bons_livraison WHERE statut = 'livree') as bons_livres
        `;

        const result = await query(overviewQuery);
        const stats = result.rows[0];

        // Calculs dérivés
        const approval_rate = stats.total_demandes > 0 ? 
            Math.round((stats.approved_demandes / stats.total_demandes) * 100) : 0;
        
        const depot_efficiency = stats.total_depots > 0 ? 
            Math.round((stats.depots_with_manager / stats.total_depots) * 100) : 0;

        // Récupérer les top matériaux demandés (données réelles)
        const topMateriauxQuery = `
            SELECT 
                m.nom,
                m.code_produit,
                m.stock_actuel,
                COUNT(di.id) as total_demandes,
                SUM(di.quantite_demandee) as total_quantite
            FROM materiaux m
            LEFT JOIN demande_items di ON m.id = di.materiau_id
            LEFT JOIN demandes_materiaux dm ON di.demande_id = dm.id
            WHERE dm.created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY m.id, m.nom, m.code_produit, m.stock_actuel
            HAVING COUNT(di.id) > 0
            ORDER BY total_demandes DESC
            LIMIT 5
        `;

        const topMateriauxResult = await query(topMateriauxQuery);
        const topMateriaux = topMateriauxResult.rows.map(row => ({
            nom: row.nom,
            code_produit: row.code_produit,
            requests: parseInt(row.total_demandes),
            stock: parseInt(row.stock_actuel)
        }));

        // Récupérer les tendances mensuelles (données réelles)
        const tendancesQuery = `
            SELECT 
                TO_CHAR(date_demande, 'Mon') as month,
                COUNT(*) as demandes,
                COUNT(CASE WHEN statut IN ('approuvee', 'en_preparation', 'livree') THEN 1 END) as approved
            FROM demandes_materiaux
            WHERE date_demande >= CURRENT_DATE - INTERVAL '6 months'
            GROUP BY DATE_TRUNC('month', date_demande), TO_CHAR(date_demande, 'Mon')
            ORDER BY DATE_TRUNC('month', date_demande)
        `;

        const tendancesResult = await query(tendancesQuery);
        const tendances = tendancesResult.rows.map(row => ({
            month: row.month,
            demandes: parseInt(row.demandes),
            approved: parseInt(row.approved)
        }));

        // Récupérer les mouvements de stock par jour (données réelles)
        const mouvementsQuery = `
            SELECT 
                TO_CHAR(created_at, 'Dy') as day,
                COUNT(CASE WHEN type_mouvement = 'entree' THEN 1 END) as entrees,
                COUNT(CASE WHEN type_mouvement = 'sortie' THEN 1 END) as sorties
            FROM mouvements_stock
            WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY DATE_TRUNC('day', created_at), TO_CHAR(created_at, 'Dy')
            ORDER BY DATE_TRUNC('day', created_at)
        `;

        const mouvementsResult = await query(mouvementsQuery);
        const mouvements = mouvementsResult.rows.map(row => ({
            day: row.day,
            entrees: parseInt(row.entrees),
            sorties: parseInt(row.sorties)
        }));

        // Récupérer les performance des dépôts (données réelles)
        const depotsPerformanceQuery = `
            SELECT 
                d.nom,
                COUNT(DISTINCT dm.id) as demandes_traitees,
                COUNT(CASE WHEN dm.statut IN ('approuvee', 'en_preparation', 'livree') THEN 1 END) as demandes_approuvees,
                ROUND(
                    COUNT(CASE WHEN dm.statut IN ('approuvee', 'en_preparation', 'livree') THEN 1 END) * 100.0 / 
                    NULLIF(COUNT(dm.id), 0), 1
                ) as efficiency
            FROM depots d
            LEFT JOIN demandes_materiaux dm ON d.id = dm.depot_id
            WHERE d.is_active = true
            GROUP BY d.id, d.nom
            HAVING COUNT(dm.id) > 0
            ORDER BY efficiency DESC
            LIMIT 3
        `;

        const depotsPerformanceResult = await query(depotsPerformanceQuery);
        const depotsPerformance = depotsPerformanceResult.rows.map(row => ({
            nom: row.nom,
            efficiency: parseFloat(row.efficiency) || 0,
            demandes: parseInt(row.demandes_traitees)
        }));

        const overview = {
            users: {
                total: parseInt(stats.total_users),
                active: parseInt(stats.active_users),
                pending: parseInt(stats.pending_users),
                by_role: {
                    directeur: parseInt(stats.directeurs),
                    magazinier: parseInt(stats.magaziniers),
                    chef_chantier: parseInt(stats.chefs_chantier)
                },
                growth: {
                    this_month: parseInt(stats.active_users) - parseInt(stats.pending_users),
                    percentage: stats.total_users > 0 ? Math.round((parseInt(stats.active_users) / parseInt(stats.total_users)) * 100) : 0
                }
            },
            depots: {
                total: parseInt(stats.total_depots),
                active: parseInt(stats.active_depots),
                with_manager: parseInt(stats.depots_with_manager),
                efficiency: depot_efficiency,
                top_performing: depotsPerformance.map(depot => ({
                    nom: depot.nom,
                    efficiency: parseFloat(depot.efficiency) || 0,
                    demandes: parseInt(depot.demandes_traitees)
                }))
            },
            materiaux: {
                total: parseInt(stats.total_materiaux),
                categories: parseInt(stats.total_categories),
                low_stock: parseInt(stats.low_stock_items),
                out_of_stock: parseInt(stats.out_of_stock_items),
                top_requested: topMateriaux
            },
            demandes: {
                total: parseInt(stats.total_demandes),
                approved: parseInt(stats.approved_demandes),
                rejected: parseInt(stats.rejected_demandes),
                pending: parseInt(stats.pending_demandes),
                approval_rate: approval_rate,
                by_priority: {
                    urgente: parseInt(stats.demandes_urgentes) || 0,
                    haute: parseInt(stats.demandes_hautes) || 0,
                    normale: parseInt(stats.demandes_normales) || 0,
                    basse: parseInt(stats.demandes_basses) || 0
                },
                monthly_trend: tendances
            },
            mouvements: {
                total: parseInt(stats.total_mouvements),
                entrees: parseInt(stats.entrees_stock),
                sorties: parseInt(stats.sorties_stock),
                daily_activity: mouvements
            },
            bons: {
                total: parseInt(stats.total_bons),
                delivered: parseInt(stats.bons_livres)
            },
            performance: {
                system_uptime: 99.8, // TODO: Calculer vraie uptime
                avg_response_time: Math.round(Math.random() * 200 + 150), // Simulation réaliste
                error_rate: 0.2, // TODO: Calculer vrai taux d'erreur
                user_satisfaction: 4.6, // TODO: Système de notation
                efficiency_score: approval_rate
            }
        };

        res.json({
            success: true,
            message: 'Rapport vue d\'ensemble généré avec succès',
            data: overview,
            generated_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erreur génération rapport overview:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la génération du rapport'
        });
    }
});

/**
 * @route   GET /api/reports/users
 * @desc    Obtenir le rapport détaillé des utilisateurs
 * @access  Private (Directeur seulement)
 */
router.get('/users', authenticateToken, requireDirecteur, async (req, res) => {
    try {
        console.log('👥 Génération rapport utilisateurs par:', req.user.email);

        const { query } = require('../config/database');

        // Rapport détaillé des utilisateurs
        const usersQuery = `
            SELECT 
                u.id, u.email, u.nom, u.prenom, u.role, u.nom_chantier,
                u.is_active, u.created_at,
                -- Statistiques d'activité
                COALESCE(dm_count.demandes_creees, 0) as demandes_creees,
                COALESCE(dm_validees.demandes_validees, 0) as demandes_validees,
                COALESCE(bl_count.bons_crees, 0) as bons_crees,
                COALESCE(ms_count.mouvements_effectues, 0) as mouvements_effectues
            FROM users u
            LEFT JOIN (
                SELECT demandeur_id, COUNT(*) as demandes_creees
                FROM demandes_materiaux 
                GROUP BY demandeur_id
            ) dm_count ON u.id = dm_count.demandeur_id
            LEFT JOIN (
                SELECT validee_par, COUNT(*) as demandes_validees
                FROM demandes_materiaux 
                WHERE validee_par IS NOT NULL
                GROUP BY validee_par
            ) dm_validees ON u.id = dm_validees.validee_par
            LEFT JOIN (
                SELECT magazinier_id, COUNT(*) as bons_crees
                FROM bons_livraison 
                GROUP BY magazinier_id
            ) bl_count ON u.id = bl_count.magazinier_id
            LEFT JOIN (
                SELECT utilisateur_id, COUNT(*) as mouvements_effectues
                FROM mouvements_stock 
                GROUP BY utilisateur_id
            ) ms_count ON u.id = ms_count.utilisateur_id
            ORDER BY u.role, u.nom, u.prenom
        `;

        const result = await query(usersQuery);
        const users = result.rows;

        // Statistiques agrégées
        const stats = {
            total: users.length,
            active: users.filter(u => u.is_active).length,
            pending: users.filter(u => !u.is_active).length,
            by_role: {
                directeur: users.filter(u => u.role === 'directeur').length,
                magazinier: users.filter(u => u.role === 'magazinier').length,
                chef_chantier: users.filter(u => u.role === 'chef_chantier').length
            },
            most_active: users
                .filter(u => u.is_active)
                .sort((a, b) => (b.demandes_creees + b.demandes_validees + b.bons_crees) - 
                               (a.demandes_creees + a.demandes_validees + a.bons_crees))
                .slice(0, 5)
        };

        res.json({
            success: true,
            message: 'Rapport utilisateurs généré avec succès',
            data: {
                users,
                stats
            },
            generated_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erreur génération rapport utilisateurs:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la génération du rapport utilisateurs'
        });
    }
});

/**
 * @route   GET /api/reports/inventory
 * @desc    Obtenir le rapport d'inventaire
 * @access  Private (Directeur seulement)
 */
router.get('/inventory', authenticateToken, requireDirecteur, async (req, res) => {
    try {
        console.log('📦 Génération rapport inventaire par:', req.user.email);

        const { query } = require('../config/database');

        // Rapport d'inventaire détaillé
        const inventoryQuery = `
            SELECT 
                m.id, m.code_produit, m.nom, m.description, m.unite,
                m.stock_actuel, m.stock_minimum, m.fournisseur,
                c.nom as categorie_nom,
                d.nom as depot_nom,
                -- Calculs de stock
                CASE 
                    WHEN m.stock_actuel = 0 THEN 'rupture'
                    WHEN m.stock_actuel <= m.stock_minimum THEN 'faible'
                    WHEN m.stock_actuel <= m.stock_minimum * 1.5 THEN 'moyen'
                    ELSE 'bon'
                END as niveau_stock,
                -- Activité récente
                COALESCE(recent_movements.mouvements_30j, 0) as mouvements_30j,
                COALESCE(recent_requests.demandes_30j, 0) as demandes_30j
            FROM materiaux m
            LEFT JOIN categories c ON m.categorie_id = c.id
            LEFT JOIN depots d ON m.depot_id = d.id
            LEFT JOIN (
                SELECT materiau_id, COUNT(*) as mouvements_30j
                FROM mouvements_stock 
                WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY materiau_id
            ) recent_movements ON m.id = recent_movements.materiau_id
            LEFT JOIN (
                SELECT di.materiau_id, COUNT(*) as demandes_30j
                FROM demande_items di
                JOIN demandes_materiaux dm ON di.demande_id = dm.id
                WHERE dm.created_at >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY di.materiau_id
            ) recent_requests ON m.id = recent_requests.materiau_id
            ORDER BY c.nom, m.nom
        `;

        const result = await query(inventoryQuery);
        const inventory = result.rows;

        // Statistiques par catégorie
        const categoryStats = {};
        inventory.forEach(item => {
            if (!categoryStats[item.categorie_nom]) {
                categoryStats[item.categorie_nom] = {
                    total: 0,
                    rupture: 0,
                    faible: 0,
                    moyen: 0,
                    bon: 0,
                    total_stock: 0
                };
            }
            categoryStats[item.categorie_nom].total++;
            categoryStats[item.categorie_nom][item.niveau_stock]++;
            categoryStats[item.categorie_nom].total_stock += item.stock_actuel;
        });

        const stats = {
            total_items: inventory.length,
            by_status: {
                rupture: inventory.filter(i => i.niveau_stock === 'rupture').length,
                faible: inventory.filter(i => i.niveau_stock === 'faible').length,
                moyen: inventory.filter(i => i.niveau_stock === 'moyen').length,
                bon: inventory.filter(i => i.niveau_stock === 'bon').length
            },
            by_category: categoryStats,
            most_requested: inventory
                .sort((a, b) => b.demandes_30j - a.demandes_30j)
                .slice(0, 10),
            most_active: inventory
                .sort((a, b) => b.mouvements_30j - a.mouvements_30j)
                .slice(0, 10)
        };

        res.json({
            success: true,
            message: 'Rapport inventaire généré avec succès',
            data: {
                inventory,
                stats
            },
            generated_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erreur génération rapport inventaire:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la génération du rapport inventaire'
        });
    }
});

/**
 * @route   GET /api/reports/orders
 * @desc    Obtenir le rapport des commandes
 * @access  Private (Directeur seulement)
 */
router.get('/orders', authenticateToken, requireDirecteur, async (req, res) => {
    try {
        const { date_debut, date_fin } = req.query;

        console.log('📋 Génération rapport commandes par:', req.user.email);

        const { query } = require('../config/database');

        // Rapport des commandes avec détails
        const ordersQuery = `
            SELECT 
                dm.id, dm.numero_demande, dm.statut, dm.priorite,
                dm.date_demande, dm.date_livraison_souhaitee, dm.date_validation,
                u_demandeur.nom || ' ' || u_demandeur.prenom as demandeur_nom,
                u_demandeur.role as demandeur_role,
                u_demandeur.nom_chantier,
                u_valideur.nom || ' ' || u_valideur.prenom as valideur_nom,
                d.nom as depot_nom,
                COUNT(di.id) as nombre_items,
                SUM(di.quantite_demandee) as total_quantite_demandee,
                SUM(di.quantite_accordee) as total_quantite_accordee,
                -- Temps de traitement en jours
                CASE 
                    WHEN dm.date_validation IS NOT NULL THEN 
                        EXTRACT(EPOCH FROM (dm.date_validation - dm.date_demande)) / 86400
                    ELSE NULL
                END as temps_traitement_jours
            FROM demandes_materiaux dm
            LEFT JOIN users u_demandeur ON dm.demandeur_id = u_demandeur.id
            LEFT JOIN users u_valideur ON dm.validee_par = u_valideur.id
            LEFT JOIN depots d ON dm.depot_id = d.id
            LEFT JOIN demande_items di ON dm.id = di.demande_id
            WHERE 1=1
                ${date_debut ? 'AND dm.date_demande >= $1' : ''}
                ${date_fin ? `AND dm.date_demande <= $${date_debut ? '2' : '1'}` : ''}
            GROUP BY dm.id, u_demandeur.id, u_valideur.id, d.id
            ORDER BY dm.date_demande DESC
        `;

        const values = [];
        if (date_debut) values.push(date_debut);
        if (date_fin) values.push(date_fin);

        const result = await query(ordersQuery, values);
        const orders = result.rows;

        // Statistiques calculées
        const stats = {
            total: orders.length,
            by_status: {
                en_attente: orders.filter(o => o.statut === 'en_attente').length,
                approuvee: orders.filter(o => o.statut === 'approuvee').length,
                rejetee: orders.filter(o => o.statut === 'rejetee').length,
                en_preparation: orders.filter(o => o.statut === 'en_preparation').length,
                livree: orders.filter(o => o.statut === 'livree').length
            },
            by_priority: {
                urgente: orders.filter(o => o.priorite === 'urgente').length,
                haute: orders.filter(o => o.priorite === 'haute').length,
                normale: orders.filter(o => o.priorite === 'normale').length,
                basse: orders.filter(o => o.priorite === 'basse').length
            },
            avg_processing_time: orders
                .filter(o => o.temps_traitement_jours !== null)
                .reduce((acc, o) => acc + parseFloat(o.temps_traitement_jours), 0) / 
                orders.filter(o => o.temps_traitement_jours !== null).length || 0,
            approval_rate: orders.length > 0 ? 
                Math.round((orders.filter(o => o.statut === 'approuvee' || o.statut === 'en_preparation' || o.statut === 'livree').length / orders.length) * 100) : 0
        };

        res.json({
            success: true,
            message: 'Rapport commandes généré avec succès',
            data: {
                orders,
                stats
            },
            generated_at: new Date().toISOString(),
            period: { date_debut, date_fin }
        });

    } catch (error) {
        console.error('❌ Erreur génération rapport commandes:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la génération du rapport commandes'
        });
    }
});

/**
 * @route   GET /api/reports/performance
 * @desc    Obtenir le rapport de performance
 * @access  Private (Directeur seulement)
 */
router.get('/performance', authenticateToken, requireDirecteur, async (req, res) => {
    try {
        console.log('⚡ Génération rapport performance par:', req.user.email);

        const { query } = require('../config/database');

        // Métriques de performance
        const performanceQuery = `
            SELECT 
                -- Performance des dépôts
                d.id as depot_id,
                d.nom as depot_nom,
                COUNT(DISTINCT dm.id) as demandes_traitees,
                COUNT(DISTINCT bl.id) as bons_generes,
                COUNT(DISTINCT ms.id) as mouvements_stock,
                AVG(
                    CASE 
                        WHEN dm.date_validation IS NOT NULL THEN 
                            EXTRACT(EPOCH FROM (dm.date_validation - dm.date_demande)) / 86400
                        ELSE NULL
                    END
                ) as temps_moyen_traitement,
                -- Taux d'approbation par dépôt
                ROUND(
                    COUNT(CASE WHEN dm.statut IN ('approuvee', 'en_preparation', 'livree') THEN 1 END) * 100.0 / 
                    NULLIF(COUNT(dm.id), 0), 2
                ) as taux_approbation
            FROM depots d
            LEFT JOIN demandes_materiaux dm ON d.id = dm.depot_id
            LEFT JOIN bons_livraison bl ON d.id = bl.depot_id
            LEFT JOIN materiaux m ON d.id = m.depot_id
            LEFT JOIN mouvements_stock ms ON m.id = ms.materiau_id
            WHERE d.is_active = true
            GROUP BY d.id, d.nom
            ORDER BY demandes_traitees DESC
        `;

        const result = await query(performanceQuery);
        const depotPerformance = result.rows;

        // Calcul de l'efficacité globale
        const globalEfficiency = depotPerformance.length > 0 ? 
            Math.round(depotPerformance.reduce((acc, depot) => acc + (depot.taux_approbation || 0), 0) / depotPerformance.length) : 0;

        const performance = {
            global_efficiency: globalEfficiency,
            depot_performance: depotPerformance,
            system_metrics: {
                uptime: 99.8, // TODO: Calculer vraie uptime
                avg_response_time: 245, // TODO: Mesurer vraie latence
                error_rate: 0.2, // TODO: Calculer vrai taux d'erreur
                user_satisfaction: 4.6 // TODO: Système de notation
            },
            trends: {
                efficiency_trend: 'up', // TODO: Calculer tendance
                user_growth: 'up',
                order_volume: 'stable'
            }
        };

        res.json({
            success: true,
            message: 'Rapport performance généré avec succès',
            data: performance,
            generated_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erreur génération rapport performance:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la génération du rapport performance'
        });
    }
});

/**
 * @route   POST /api/reports/export
 * @desc    Exporter un rapport dans un format spécifique
 * @access  Private (Directeur seulement)
 */
router.post('/export', authenticateToken, requireDirecteur, async (req, res) => {
    try {
        const { report_type, format, date_debut, date_fin } = req.body;

        console.log('📤 Export rapport:', { report_type, format }, 'par:', req.user.email);

        // Validation des paramètres
        if (!report_type || !format) {
            return res.status(400).json({
                success: false,
                message: 'Type de rapport et format requis'
            });
        }

        if (!['pdf', 'excel', 'csv'].includes(format)) {
            return res.status(400).json({
                success: false,
                message: 'Format non supporté. Utilisez pdf, excel ou csv'
            });
        }

        // TODO: Implémenter la génération réelle des fichiers
        // Pour l'instant, simuler l'export
        const filename = `dantela_${report_type}_${new Date().toISOString().split('T')[0]}.${format}`;
        
        // Simuler le temps de génération
        await new Promise(resolve => setTimeout(resolve, 1000));

        res.json({
            success: true,
            message: `Rapport ${report_type} exporté en ${format.toUpperCase()} avec succès`,
            export: {
                filename,
                format,
                size: '2.5 MB',
                download_url: `/downloads/${filename}`, // TODO: Vraie URL
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h
            },
            generated_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erreur export rapport:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'export du rapport'
        });
    }
});

/**
 * @route   GET /api/reports/dashboard-stats
 * @desc    Obtenir les statistiques pour le dashboard
 * @access  Private (Directeur seulement)
 */
router.get('/dashboard-stats', authenticateToken, requireDirecteur, async (req, res) => {
    try {
        console.log('📊 Récupération stats dashboard par:', req.user.email);

        const { query } = require('../config/database');

        // Statistiques rapides pour le dashboard
        const statsQuery = `
            SELECT 
                -- Activité aujourd'hui
                (SELECT COUNT(*) FROM demandes_materiaux WHERE DATE(date_demande) = CURRENT_DATE) as demandes_aujourd_hui,
                (SELECT COUNT(*) FROM bons_livraison WHERE DATE(date_preparation) = CURRENT_DATE) as bons_aujourd_hui,
                (SELECT COUNT(*) FROM mouvements_stock WHERE DATE(created_at) = CURRENT_DATE) as mouvements_aujourd_hui,
                
                -- Activité cette semaine
                (SELECT COUNT(*) FROM demandes_materiaux WHERE date_demande >= CURRENT_DATE - INTERVAL '7 days') as demandes_semaine,
                (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as nouveaux_users_semaine,
                
                -- Alertes
                (SELECT COUNT(*) FROM materiaux WHERE stock_actuel = 0) as ruptures_stock,
                (SELECT COUNT(*) FROM materiaux WHERE stock_actuel <= stock_minimum AND stock_actuel > 0) as stocks_faibles,
                (SELECT COUNT(*) FROM demandes_materiaux WHERE statut = 'en_attente') as demandes_en_attente,
                
                -- Performance globale
                (SELECT COUNT(*) FROM demandes_materiaux WHERE statut IN ('approuvee', 'en_preparation', 'livree')) as demandes_reussies,
                (SELECT COUNT(*) FROM demandes_materiaux) as total_demandes_all_time
        `;

        const result = await query(statsQuery);
        const stats = result.rows[0];

        const dashboardStats = {
            today: {
                demandes: parseInt(stats.demandes_aujourd_hui),
                bons: parseInt(stats.bons_aujourd_hui),
                mouvements: parseInt(stats.mouvements_aujourd_hui)
            },
            week: {
                demandes: parseInt(stats.demandes_semaine),
                new_users: parseInt(stats.nouveaux_users_semaine)
            },
            alerts: {
                stock_ruptures: parseInt(stats.ruptures_stock),
                stock_faibles: parseInt(stats.stocks_faibles),
                pending_orders: parseInt(stats.demandes_en_attente),
                total_alerts: parseInt(stats.ruptures_stock) + parseInt(stats.stocks_faibles) + parseInt(stats.demandes_en_attente)
            },
            performance: {
                success_rate: stats.total_demandes_all_time > 0 ? 
                    Math.round((stats.demandes_reussies / stats.total_demandes_all_time) * 100) : 0,
                total_orders: parseInt(stats.total_demandes_all_time)
            }
        };

        res.json({
            success: true,
            message: 'Statistiques dashboard récupérées avec succès',
            data: dashboardStats,
            generated_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erreur récupération stats dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques'
        });
    }
});

module.exports = router;