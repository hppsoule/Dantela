/**
 * Contrôleur d'authentification
 * Module d'authentification - Inscription et connexion par rôle
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Inscription d'un nouvel utilisateur
 */
const register = async (req, res) => {
    try {
        const {
            email,
            password,
            confirmPassword,
            nom,
            prenom,
            telephone,
            adresse,
            accountType,
            nomChantier
        } = req.body;

        console.log('📝 Tentative d\'inscription:', { email, role: accountType });

        // Validation des données
        if (!email || !password || !nom || !prenom || !accountType) {
            return res.status(400).json({
                success: false,
                message: 'Tous les champs obligatoires doivent être remplis'
            });
        }

        // Vérification de la correspondance des mots de passe
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Les mots de passe ne correspondent pas'
            });
        }

        // Validation de la longueur du mot de passe
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Le mot de passe doit contenir au moins 6 caractères'
            });
        }

        // Validation du nom de chantier pour les chefs de chantier
        if (accountType === 'chef_chantier' && !nomChantier) {
            return res.status(400).json({
                success: false,
                message: 'Le nom du chantier est obligatoire pour les chefs de chantier'
            });
        }

        // Vérification si l'utilisateur existe déjà
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Un utilisateur avec cet email existe déjà'
            });
        }

        // Création de l'utilisateur
        const userData = {
            email,
            password,
            nom,
            prenom,
            telephone,
            adresse,
            role: accountType,
            nom_chantier: accountType === 'chef_chantier' ? nomChantier : null
        };

        const newUser = await User.create(userData);

        console.log('✅ Utilisateur créé avec succès:', newUser.email);

        // Réponse de succès (sans mot de passe)
        const { password_hash, ...userResponse } = newUser;
        
        res.status(201).json({
            success: true,
            message: 'Compte créé avec succès. En attente de validation par le directeur.',
            user: userResponse
        });

    } catch (error) {
        console.error('❌ Erreur lors de l\'inscription:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur interne du serveur'
        });
    }
};

/**
 * Connexion d'un utilisateur
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('🔐 Tentative de connexion:', email);

        // Validation des données
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email et mot de passe sont obligatoires'
            });
        }

        // Recherche de l'utilisateur
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Identifiants incorrects'
            });
        }

        // Vérification du mot de passe
        const isPasswordValid = await User.verifyPassword(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Identifiants incorrects'
            });
        }

        // Vérification si le compte est actif
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Votre compte est en attente de validation par le directeur'
            });
        }

        // Génération du token JWT
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        console.log('✅ Connexion réussie:', { email: user.email, role: user.role });

        // Réponse de succès (sans mot de passe)
        const { password_hash, ...userResponse } = user;

        res.json({
            success: true,
            message: 'Connexion réussie',
            token,
            user: userResponse
        });

    } catch (error) {
        console.error('❌ Erreur lors de la connexion:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
};

/**
 * Obtenir les informations de l'utilisateur connecté
 */
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        res.json({
            success: true,
            user
        });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération du profil:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
};

module.exports = {
    register,
    login,
    getProfile
};