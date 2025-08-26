/**
 * Middleware d'authentification JWT
 * Module d'authentification - Vérification des tokens et protection des routes
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware de vérification du token JWT
 */
const authenticateToken = async (req, res, next) => {
    try {
        // Récupération du token depuis l'en-tête Authorization
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token d\'accès requis'
            });
        }

        // Vérification et décodage du token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Vérification que l'utilisateur existe toujours et est actif
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Compte désactivé'
            });
        }

        // Ajout des informations utilisateur à la requête
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role
        };

        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token invalide'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expiré'
            });
        }

        console.error('❌ Erreur d\'authentification:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
};

/**
 * Middleware de vérification des rôles
 * @param {Array} allowedRoles - Rôles autorisés
 */
const authorizeRoles = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentification requise'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé. Permissions insuffisantes.'
            });
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    authorizeRoles
};