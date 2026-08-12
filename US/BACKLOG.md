# Backlog — Habit Tracker

Index des User Stories. Cycle de vie des fichiers : `US/to_be_implemented/` → `US/in_progress/` → `US/done/` (géré par l'agent de développement).

| ID | Titre | Priorité | Statut | Estimation | Chemin |
|----|-------|----------|--------|------------|--------|
| US-001 | Création et édition d'une habitude | Must | livrée | M | US/done/US-001-creation-edition-habitude.md |
| US-007 | Rappels par notification pour les habitudes du jour | Must | livrée | XL | US/done/US-007-rappels-notifications-locales.md |
| US-002 | Création et édition d'une tâche ponctuelle | Must | livrée | S | US/done/US-002-creation-edition-tache-ponctuelle.md |
| US-004 | Planning quotidien des habitudes et tâches | Must | livrée | L | US/done/US-004-planning-quotidien.md |
| US-003 | Reprogrammation manuelle d'une tâche en retard | Should | livrée | S | US/done/US-003-reprogrammation-tache-en-retard.md |
| US-008 | Sauvegarde et restauration de mes données | Should | prête | M | US/to_be_implemented/US-008-sauvegarde-restauration-donnees.md |
| US-005 | Résumé « Habit tracker » en tableau sur une période | Should | livrée | L | US/done/US-005-resume-habit-tracker-tableau-periode.md |
| US-006 | Paramétrage des seuils de couleur du résumé annuel | Should | livrée | XS | US/done/US-006-parametrage-seuils-couleur-resume.md |
| US-009 | Thème de couleurs pastel appliqué à l'ensemble de l'application | Should | livrée | S | US/done/US-009-theme-couleurs-pastel.md |
| US-010 | Cards horizontales pleine largeur pour les listes de tâches et d'habitudes | Should | livrée | S | US/done/US-010-cards-horizontales-pleine-largeur.md |
| US-011 | Frise de dates en haut de l'écran pour naviguer entre les jours du planning | Should | livrée | L | US/done/US-011-frise-dates-navigation-jour.md |
| US-012 | Titre dynamique « Planning du/d'... » selon le jour sélectionné | Could | livrée | XS | US/done/US-012-titre-dynamique-planning-jour-selectionne.md |
| US-013 | Suppression d'une habitude par glisser + confirmation | Should | livrée | M | US/done/US-013-suppression-habitude-glisser-confirmation.md |
| US-014 | Suppression d'une tâche ponctuelle par glisser + confirmation | Should | livrée | M | US/done/US-014-suppression-tache-glisser-confirmation.md |
| US-015 | Mise en pause et reprise d'une habitude | Should | livrée | M | US/done/US-015-mise-en-pause-reprise-habitude.md |
| US-016 | Choix de la police de caractères de l'application | Should | livrée | S | US/done/US-016-choix-police-caracteres.md |
| US-017 | Définition d'une cible chiffrée optionnelle pour une habitude | Should | livrée | S | US/done/US-017-cible-chiffree-habitude.md |
| US-018 | Suivi quotidien d'une habitude à cible chiffrée dans le planning | Should | livrée | L | US/done/US-018-suivi-quotidien-cible-chiffree.md |
| US-019 | Compatibilité du résumé « Habit tracker » avec les habitudes à cible chiffrée | Should | livrée | S | US/done/US-019-compatibilite-resume-cible-chiffree.md |
| US-020 | Ajout de la police Dancing Script et changement de la police par défaut de l'application | Should | livrée | S | US/done/US-020-police-dancing-script-par-defaut.md |

## Ordre logique d'implémentation recommandé (MVP puis extensions)

1. **US-001** — Création/édition d'une habitude (Must)
2. **US-007** — Rappels par notification pour les habitudes du jour (Must) — *avancée devant US-002/003/004/005/006 : le benchmark en fait le point le plus critique et discriminant du projet (25 % de sa pondération) et recommande de le valider tôt, pas en fin de projet, car c'est un risque technique (permission système, planification, comportement app fermée) et non une simple préférence produit. Voir ADR-001 (Web Push + micro-scheduler).*
3. **US-002** — Création/édition d'une tâche ponctuelle (Must)
4. **US-004** — Planning quotidien : affichage habitudes + tâches, navigation, cochage (Must) — *MVP complet à ce stade*
5. **US-008** — Sauvegarde et restauration de mes données (Should) — *placée juste après le MVP core (US-001/002/004) et avant US-003/005/006 : c'est le premier moment où il existe des données réelles (habitudes, tâches, historique de complétion) qui valent la peine d'être protégées. Le risque qu'elle mitige (perte du stockage local IndexedDB, cf. ADR-001) est jugé plus impactant pour l'utilisateur qu'une reprogrammation manuelle de tâche en retard ou qu'un résumé visuel — perdre tout son historique est pire que de manquer une fonctionnalité de confort. Elle n'a en revanche aucune dépendance vis-à-vis de US-007 (rappels) : la souscription push est un état serveur lié à l'appareil, pas une donnée métier à sauvegarder.*
6. **US-003** — Reprogrammation manuelle d'une tâche en retard (Should)
7. **US-005** — Résumé « Habit tracker » en tableau sur une période, avec code couleur vert/jaune/rouge par défaut (80 %/40 %) en vue année (Should)
8. **US-006** — Paramétrage des seuils de couleur du résumé annuel (Should) — vient après US-005
9. **US-009** — Thème de couleurs pastel appliqué à l'ensemble de l'application (Should) — refonte visuelle, indépendante des fonctionnalités MVP déjà livrées
10. **US-010** — Cards horizontales pleine largeur pour les listes de tâches et d'habitudes (Should) — restyle des écrans US-001/US-002/US-004 déjà livrés
11. **US-011** — Frise de dates en haut de l'écran pour naviguer entre les jours du planning (Should) — remplace le mécanisme de navigation par flèches livré dans US-004
12. **US-012** — Titre dynamique « Planning du/d'... » selon le jour sélectionné (Could) — vient après US-011, réutilise son mécanisme de sélection de jour
13. **US-015** — Mise en pause et reprise d'une habitude (Should) — avancée devant US-013 : introduit le mécanisme de statut sur l'habitude (actif/en pause) que US-013 réutilise et étend pour son propre statut « supprimée » (soft-delete), plutôt que d'avoir deux systèmes de statut développés indépendamment
14. **US-013** — Suppression d'une habitude par glisser + confirmation (Should) — s'appuie sur l'écran Habitudes (US-001), la carte restylée (US-010) et le mécanisme de statut introduit par US-015
15. **US-014** — Suppression d'une tâche ponctuelle par glisser + confirmation (Should) — s'appuie sur l'écran Tâches (US-002/US-003) et la carte restylée (US-010)
16. **US-016** — Choix de la police de caractères de l'application (Should) — réutilise le pattern de réglage persistant de US-006 et le principe de centralisation visuelle de US-009 ; inclut des polices Google Fonts (dépendance réseau assumée, avec repli hors-ligne sur la police système)
17. **US-017** — Définition d'une cible chiffrée optionnelle pour une habitude (Should) — extension du formulaire de création/édition d'habitude (US-001) ; sans valeur d'usage tant que le planning (US-018) ne consomme pas cette cible, mais livrable indépendamment (rétrocompatible, n'affecte aucune habitude existante)
18. **US-018** — Suivi quotidien d'une habitude à cible chiffrée dans le planning (Should) — cœur de la valeur utilisateur du besoin « cible chiffrée » : bouton « + », saisie libre, barre de progression, passage automatique à « fait », réinitialisation quotidienne ; dépend directement de US-017 et s'appuie sur le planning (US-004) et la navigation par jour (US-011)
19. **US-019** — Compatibilité du résumé « Habit tracker » avec les habitudes à cible chiffrée (Should) — placée en dernier de cette série car elle ne fait que garantir la non-régression de US-005/US-006 face au nouveau type d'habitude introduit par US-017/US-018, sur le même principe de séparation planning/résumé déjà appliqué entre US-004 et US-005
20. **US-020** — Ajout de la police Dancing Script et changement de la police par défaut de l'application (Should) — extension directe et indépendante de US-016 (réutilise strictement son catalogue, son mécanisme d'application globale, sa persistance et son cache offline) ; aucune dépendance vis-à-vis du lot US-017/US-018/US-019

## Dépendances

- US-007 dépend de US-001 (avancée dans l'ordre d'implémentation malgré sa numérotation, pour valider tôt le risque technique des notifications — cf. ADR-001)
- US-003 dépend de US-002
- US-004 dépend de US-001 et US-002
- US-008 dépend de US-001, US-002 et US-004 (données réelles à exporter/importer : habitudes, tâches, historique de complétion)
- US-005 dépend de US-001, US-002 et US-004
- US-006 dépend de US-005
- US-009 n'a pas de dépendance bloquante (refonte du thème CSS global)
- US-010 dépend de US-001, US-002 et US-004 (écrans restylés)
- US-011 dépend de US-004 (remplace sa navigation par jour)
- US-012 dépend de US-011 (réutilise le mécanisme de sélection de jour de la frise)
- US-013 dépend de US-001, US-010 et US-015 (écran et carte d'habitude existants, support du geste de glissement, et réutilisation du mécanisme de statut actif/en pause/supprimée introduit par US-015)
- US-014 dépend de US-002, US-003 et US-010 (écran, composant `TaskItem` partagé avec US-003, et carte restylée)
- US-015 dépend de US-001, US-004 et US-005 (habitude existante, filtrage du planning à ajuster, résumé à ne pas régresser)
- US-016 dépend de US-006 (pattern de réglage persistant à réutiliser) et US-009 (principe de centralisation des variables visuelles globales)
- US-017 dépend de US-001 (formulaire de création/édition d'habitude existant, à étendre)
- US-018 dépend de US-001, US-004, US-011 et US-017 (cible chiffrée définie au préalable, planning quotidien et navigation par jour à étendre pour ce nouveau type d'habitude)
- US-019 dépend de US-005, US-006, US-017 et US-018 (résumé et seuils de couleur existants, à ne pas régresser face à la donnée de progression quotidienne introduite par US-017/US-018)
- US-020 dépend de US-016 (catalogue de polices, mécanisme d'application globale, persistance du réglage et cache offline déjà en place, réutilisés tels quels) ; aucune dépendance vis-à-vis de US-017/US-018/US-019 (sujet indépendant, en cours d'implémentation en parallèle)
