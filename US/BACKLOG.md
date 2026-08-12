# Backlog — Habit Tracker

Index des User Stories. Cycle de vie des fichiers : `US/to_be_implemented/` → `US/in_progress/` → `US/done/` (géré par l'agent de développement).

| ID | Titre | Priorité | Statut | Estimation | Chemin |
|----|-------|----------|--------|------------|--------|
| US-001 | Création et édition d'une habitude | Must | livrée | M | US/done/US-001-creation-edition-habitude.md |
| US-007 | Rappels par notification pour les habitudes du jour | Must | prête | XL | US/to_be_implemented/US-007-rappels-notifications-locales.md |
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
