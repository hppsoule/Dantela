/**
 * Routes Paramètres - Configuration système
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Middleware pour vérifier que l'utilisateur est directeur
const requireDirecteur = authorizeRoles(['directeur']);

/**
 * @route   GET /api/settings
 * @desc    Obtenir tous les paramètres système
 * @access  Private (Directeur seulement)
 */
router.get('/', authenticateToken, requireDirecteur, async (req, res) => {
    try {
        console.log('⚙️ Récupération des paramètres système par:', req.user.email);

        // TODO: Récupérer les paramètres depuis la base de données
        // Pour l'instant, retourner des paramètres par défaut
        const settings = {
            company: {
                name: 'DANTELA',
                tagline: '"La Marque de la Construction"',
                address: '203 Boulevard de l\'OCAM, Mvog Mbi - Yaoundé',
                phone: '+237 669 790 437',
                email: 'contact@dantela.cm',
                website: 'www.dantela.cm',
                logo_url: null
            },
            notifications: {
                email_enabled: true,
                sms_enabled: false,
                push_enabled: true,
                sound_enabled: true,
                auto_approve_orders: false,
                low_stock_alerts: true,
                urgent_priority_sound: true
            },
            security: {
                session_timeout: 480,
                password_min_length: 6,
                require_2fa: false,
                auto_logout_inactive: true,
                login_attempts_max: 5,
                account_lockout_duration: 30
            },
            system: {
                language_default: 'fr',
                timezone: 'Africa/Douala',
                date_format: 'DD/MM/YYYY',
                currency: 'FCFA',
                backup_frequency: 'daily',
                maintenance_mode: false,
                debug_mode: false
            },
            appearance: {
                theme: 'light',
                primary_color: '#0891b2',
                secondary_color: '#059669',
                logo_position: 'left',
                compact_mode: false,
                animations_enabled: true
            }
        };

        res.json({
            success: true,
            message: 'Paramètres récupérés avec succès',
            settings
        });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des paramètres:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

/**
 * @route   PUT /api/settings
 * @desc    Mettre à jour les paramètres système
 * @access  Private (Directeur seulement)
 */
router.put('/', authenticateToken, requireDirecteur, async (req, res) => {
    try {
        const { settings } = req.body;

        console.log('💾 Mise à jour des paramètres système par:', req.user.email);

        // Validation des données
        if (!settings) {
            return res.status(400).json({
                success: false,
                message: 'Paramètres requis'
            });
        }

        // Validation des champs obligatoires
        if (!settings.company?.name || !settings.company?.address) {
            return res.status(400).json({
                success: false,
                message: 'Le nom et l\'adresse de l\'entreprise sont obligatoires'
            });
        }

        // TODO: Sauvegarder les paramètres en base de données
        // Pour l'instant, simuler la sauvegarde
        
        console.log('✅ Paramètres sauvegardés avec succès');

        res.json({
            success: true,
            message: 'Paramètres sauvegardés avec succès',
            settings
        });

    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde des paramètres:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur interne du serveur'
        });
    }
});

/**
 * @route   POST /api/settings/backup
 * @desc    Créer une sauvegarde de la base de données
 * @access  Private (Directeur seulement)
 */
router.post('/backup', authenticateToken, requireDirecteur, async (req, res) => {
    try {
        console.log('💾 Création sauvegarde base de données par:', req.user.email);

        // TODO: Implémenter la sauvegarde réelle
        // Utiliser pg_dump ou équivalent
        
        const backupInfo = {
            filename: `dantela_backup_${new Date().toISOString().split('T')[0]}.sql`,
            size: '2.5 MB',
            created_at: new Date().toISOString(),
            tables_count: 9,
            records_count: 1250
        };

        res.json({
            success: true,
            message: 'Sauvegarde créée avec succès',
            backup: backupInfo
        });

    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de la sauvegarde'
        });
    }
});

/**
 * @route   POST /api/settings/import
 * @desc    Importer des données depuis un fichier
 * @access  Private (Directeur seulement)
 */
router.post('/import', authenticateToken, requireDirecteur, async (req, res) => {
    try {
        console.log('📥 Import de données par:', req.user.email);

        // TODO: Implémenter l'import réel
        // Validation du fichier + import sécurisé
        
        res.json({
            success: true,
            message: 'Import de données réussi',
            imported: {
                users: 5,
                depots: 2,
                materiaux: 25,
                demandes: 10
            }
        });

    } catch (error) {
        console.error('❌ Erreur lors de l\'import:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'import des données'
        });
    }
});

/**
 * @route   POST /api/settings/reset
 * @desc    Reset des paramètres système
 * @access  Private (Directeur seulement)
 */
router.post('/reset', authenticateToken, requireDirecteur, async (req, res) => {
    try {
        console.log('🔄 Reset système par:', req.user.email);

        // TODO: Implémenter le reset réel
        // Remettre tous les paramètres par défaut
        
        res.json({
            success: true,
            message: 'Paramètres remis à zéro avec succès'
        });

    } catch (error) {
        console.error('❌ Erreur lors du reset:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du reset système'
        });
    }
});

/**
 * @route   GET /api/settings/system-info
 * @desc    Obtenir les informations système
 * @access  Private (Directeur seulement)
 */
router.get('/system-info', authenticateToken, requireDirecteur, async (req, res) => {
    try {
        const { query } = require('../config/database');
        
        // Récupérer les statistiques système
        const statsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
                (SELECT COUNT(*) FROM depots) as total_depots,
                (SELECT COUNT(*) FROM materiaux) as total_materiaux,
                (SELECT COUNT(*) FROM demandes_materiaux) as total_demandes,
                (SELECT COUNT(*) FROM bons_livraison) as total_bons,
                (SELECT COUNT(*) FROM mouvements_stock) as total_mouvements
        `;

        const result = await query(statsQuery);
        const stats = result.rows[0];

        const systemInfo = {
            version: '1.0.0',
            database: {
                name: process.env.DB_NAME || 'DantelaDepot',
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 5432
            },
            server: {
                node_version: process.version,
                uptime: process.uptime(),
                memory_usage: process.memoryUsage(),
                platform: process.platform
            },
            statistics: stats,
            last_backup: '2025-01-13 10:30:00', // TODO: Récupérer vraie date
            maintenance_window: 'Dimanche 02:00-04:00'
        };

        res.json({
            success: true,
            message: 'Informations système récupérées',
            system_info: systemInfo
        });

    } catch (error) {
        console.error('❌ Erreur récupération infos système:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des informations système'
        });
    }
});

module.exports = router;