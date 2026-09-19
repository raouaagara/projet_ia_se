-- ============================================================
-- Script : injecter les notifications de démo pour le médecin
-- À exécuter UNE SEULE FOIS dans clinique_db si la BD est déjà
-- seedée et que le médecin n'a pas encore de notifications.
-- ============================================================

-- Récupère l'id de l'utilisateur médecin (dr.martin@clinique.local)
-- et l'id du premier RDV pour la référence

INSERT INTO notifications (utilisateur_id, titre, message, type, lue, date_creation, reference_id, reference_type)
SELECT
    u.id,
    '🗓️ Nouveau rendez-vous',
    'Le patient Lucie Dupont a pris un rendez-vous — Motif : Contrôle annuel.',
    'RAPPEL_RDV',
    0,
    NOW(),
    (SELECT id FROM rendez_vous LIMIT 1),
    'RDV'
FROM utilisateurs u
WHERE u.email = 'dr.martin@clinique.local'
LIMIT 1;

INSERT INTO notifications (utilisateur_id, titre, message, type, lue, date_creation, reference_id, reference_type)
SELECT
    u.id,
    '✅ RDV confirmé',
    'Vous avez confirmé le rendez-vous avec Lucie Dupont.',
    'RDV_CONFIRME',
    0,
    NOW(),
    (SELECT id FROM rendez_vous LIMIT 1),
    'RDV'
FROM utilisateurs u
WHERE u.email = 'dr.martin@clinique.local'
LIMIT 1;

INSERT INTO notifications (utilisateur_id, titre, message, type, lue, date_creation, reference_id, reference_type)
SELECT
    u.id,
    '🔬 Résultat d\'examen soumis',
    'Un résultat d\'examen pour le patient Lucie Dupont a été enregistré.',
    'RESULTAT_DISPONIBLE',
    0,
    NOW(),
    (SELECT id FROM examen_laboratoire LIMIT 1),
    'EXAMEN'
FROM utilisateurs u
WHERE u.email = 'dr.martin@clinique.local'
LIMIT 1;
