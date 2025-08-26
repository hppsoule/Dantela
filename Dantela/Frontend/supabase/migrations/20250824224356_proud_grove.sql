/*
  # Correction erreur colonne ambiguë dans fonction get_retour_stats

  1. Problème
    - Erreur: column reference "nettoyage_requis" is ambiguous
    - La fonction get_retour_stats() a un conflit de noms

  2. Solution
    - Supprimer et recréer la fonction avec qualification explicite des colonnes
    - Utiliser le préfixe de table pour éviter l'ambiguïté

  3. Correction
    - Remplacer la fonction get_retour_stats() défaillante
    - Ajouter qualification explicite des colonnes
*/

-- Supprimer la fonction défaillante
DROP FUNCTION IF EXISTS get_retour_stats();

-- Recréer la fonction avec qualification explicite des colonnes
CREATE OR REPLACE FUNCTION get_retour_stats()
RETURNS TABLE (
    total_retours BIGINT,
    etat_bon BIGINT,
    etat_usage BIGINT,
    etat_abime BIGINT,
    nettoyage_requis_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_retours,
        COUNT(CASE WHEN mr.etat = 'bon' THEN 1 END) as etat_bon,
        COUNT(CASE WHEN mr.etat = 'usage' THEN 1 END) as etat_usage,
        COUNT(CASE WHEN mr.etat = 'abime' THEN 1 END) as etat_abime,
        COUNT(CASE WHEN mr.nettoyage_requis = true THEN 1 END) as nettoyage_requis_count
    FROM materiaux_retour_utilise mr;
END;
$$ LANGUAGE plpgsql;

-- Supprimer et recréer aussi la fonction get_panne_stats pour cohérence
DROP FUNCTION IF EXISTS get_panne_stats();

CREATE OR REPLACE FUNCTION get_panne_stats()
RETURNS TABLE (
    total_pannes BIGINT,
    pannes_legeres BIGINT,
    pannes_moyennes BIGINT,
    pannes_graves BIGINT,
    reparables BIGINT,
    irreparables BIGINT,
    en_attente BIGINT,
    en_cours BIGINT,
    reparees BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_pannes,
        COUNT(CASE WHEN mp.gravite = 'legere' THEN 1 END) as pannes_legeres,
        COUNT(CASE WHEN mp.gravite = 'moyenne' THEN 1 END) as pannes_moyennes,
        COUNT(CASE WHEN mp.gravite = 'grave' THEN 1 END) as pannes_graves,
        COUNT(CASE WHEN mp.reparable = true THEN 1 END) as reparables,
        COUNT(CASE WHEN mp.reparable = false THEN 1 END) as irreparables,
        COUNT(CASE WHEN mp.statut_reparation = 'en_attente' THEN 1 END) as en_attente,
        COUNT(CASE WHEN mp.statut_reparation = 'en_cours' THEN 1 END) as en_cours,
        COUNT(CASE WHEN mp.statut_reparation = 'reparee' THEN 1 END) as reparees
    FROM materiaux_en_panne mp;
END;
$$ LANGUAGE plpgsql;

-- Test des fonctions corrigées
SELECT 'Fonctions corrigées avec succès!' as message;

-- Tester la fonction get_retour_stats
SELECT 'Test fonction get_retour_stats:' as info;
SELECT * FROM get_retour_stats();

-- Tester la fonction get_panne_stats
SELECT 'Test fonction get_panne_stats:' as info;
SELECT * FROM get_panne_stats();

-- Vérifier que les tables existent
SELECT 'Tables vérifiées:' as info;
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as nombre_colonnes
FROM information_schema.tables t
WHERE t.table_schema = 'public' 
AND t.table_name IN ('materiaux_en_panne', 'materiaux_retour_utilise');