# Backlog — Habit Tracker

Index des User Stories. Cycle de vie des fichiers : `US/to_be_implemented/` → `US/in_progress/` → `US/done/` (géré par l'agent de développement).

| ID | Titre | Priorité | Statut | Estimation | Chemin |
|----|-------|----------|--------|------------|--------|
| US-001 | Création et édition d'une habitude | Must | prête | M | US/to_be_implemented/US-001-creation-edition-habitude.md |
| US-007 | Rappels par notification pour les habitudes du jour | Must | prête | XL | US/to_be_implemented/US-007-rappels-notifications-locales.md |
| US-002 | Création et édition d'une tâche ponctuelle | Must | prête | S | US/to_be_implemented/US-002-creation-edition-tache-ponctuelle.md |
| US-004 | Planning quotidien des habitudes et tâches | Must | prête | L | US/to_be_implemented/US-004-planning-quotidien.md |
| US-003 | Reprogrammation manuelle d'une tâche en retard | Should | prête | S | US/to_be_implemented/US-003-reprogrammation-tache-en-retard.md |
| US-005 | Résumé « Habit tracker » en tableau sur une période | Should | prête | L | US/to_be_implemented/US-005-resume-habit-tracker-tableau-periode.md |
| US-006 | Paramétrage des seuils de couleur du résumé annuel | Should | prête | XS | US/to_be_implemented/US-006-parametrage-seuils-couleur-resume.md |

## Ordre logique d'implémentation recommandé (MVP puis extensions)

1. **US-001** — Création/édition d'une habitude (Must)
2. **US-007** — Rappels par notification pour les habitudes du jour (Must) — *avancée devant US-002/003/004/005/006 : le benchmark en fait le point le plus critique et discriminant du projet (25 % de sa pondération) et recommande de le valider tôt, pas en fin de projet, car c'est un risque technique (permission système, planification, comportement app fermée) et non une simple préférence produit. Voir ADR-005.*
3. **US-002** — Création/édition d'une tâche ponctuelle (Must)
4. **US-004** — Planning quotidien : affichage habitudes + tâches, navigation, cochage (Must) — *MVP complet à ce stade*
5. **US-003** — Reprogrammation manuelle d'une tâche en retard (Should)
6. **US-005** — Résumé « Habit tracker » en tableau sur une période, avec code couleur vert/jaune/rouge par défaut (80 %/40 %) en vue année (Should)
7. **US-006** — Paramétrage des seuils de couleur du résumé annuel (Should) — vient après US-005

## Dépendances

- US-007 dépend de US-001 (avancée dans l'ordre d'implémentation malgré sa numérotation, pour valider tôt le risque technique des notifications — cf. ADR-005)
- US-003 dépend de US-002
- US-004 dépend de US-001 et US-002
- US-005 dépend de US-001, US-002 et US-004
- US-006 dépend de US-005
