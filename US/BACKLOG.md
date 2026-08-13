# Backlog — Habit Tracker

Index des User Stories. Cycle de vie des fichiers : `US/to_be_implemented/` → `US/in_progress/` → `US/done/` (géré par l'agent de développement).

| ID | Titre | Priorité | Statut | Estimation | Chemin |
|----|-------|----------|--------|------------|--------|
| US-001 | Création et édition d'une habitude | Must | livrée | M | US/done/US-001-creation-edition-habitude.md |
| US-007 | Rappels par notification pour les habitudes du jour | Must | livrée | XL | US/done/US-007-rappels-notifications-locales.md |
| US-002 | Création et édition d'une tâche ponctuelle | Must | livrée | S | US/done/US-002-creation-edition-tache-ponctuelle.md |
| US-004 | Planning quotidien des habitudes et tâches | Must | livrée | L | US/done/US-004-planning-quotidien.md |
| US-003 | Reprogrammation manuelle d'une tâche en retard | Should | livrée | S | US/done/US-003-reprogrammation-tache-en-retard.md |
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
| US-021 | Heure limite optionnelle pour une tâche ponctuelle | Should | livrée | S | US/done/US-021-heure-limite-tache-ponctuelle.md |
| US-022 | Rappel push nominatif à l'heure limite d'une tâche | Should | livrée | L | US/done/US-022-rappel-push-nominatif-heure-limite-tache.md |
| US-023 | Resynchronisation de la fenêtre d'échéances à chaque cochage | Should | livrée | M | US/done/US-023-resynchronisation-echeances-a-chaque-cochage.md |
| US-024 | Indicateur de régularité apaisé sur la carte d'habitude | Should | livrée | M | US/done/US-024-indicateur-regularite-habitude.md |
| US-025 | Signal doux « manquée hier » sur une habitude non faite la veille | Could | livrée | S | US/done/US-025-signal-habitude-manquee-hier.md |
| US-026 | Ajout rapide d'une habitude ou d'une tâche depuis le planning | Should | livrée | M | US/done/US-026-ajout-rapide-depuis-planning.md |
| US-027 | Section « En pause / Supprimées » sur l'écran Habitudes et reprise automatique programmée | Should | livrée | M | US/done/US-027-section-pause-supprimees-reprise-automatique.md |
| US-008 | Sauvegarde et restauration de mes données | Should | prête | M | US/to_be_implemented/US-008-sauvegarde-restauration-donnees.md |
| US-028 | Revue hebdomadaire poussée | Could | livrée | M | US/done/US-028-revue-hebdomadaire-poussee.md |
| US-029 | Mode sombre / respect de prefers-color-scheme | Could | livrée | S | US/done/US-029-mode-sombre.md |
| US-030 | Cibles chiffrées « à ne pas dépasser » | Could | prête | L | US/to_be_implemented/US-030-cibles-chiffrees-a-ne-pas-depasser.md |
| US-031 | Badge d'icône PWA indiquant les éléments restants du jour | Could | livrée | M | US/done/US-031-badge-icone-pwa.md |

## Ordre logique d'implémentation recommandé (MVP puis extensions)

1. **US-001** — Création/édition d'une habitude (Must)
2. **US-007** — Rappels par notification pour les habitudes du jour (Must) — *avancée devant US-002/003/004/005/006 : le benchmark en fait le point le plus critique et discriminant du projet (25 % de sa pondération) et recommande de le valider tôt, pas en fin de projet, car c'est un risque technique (permission système, planification, comportement app fermée) et non une simple préférence produit. Voir ADR-001 (Web Push + micro-scheduler).*
3. **US-002** — Création/édition d'une tâche ponctuelle (Must)
4. **US-004** — Planning quotidien : affichage habitudes + tâches, navigation, cochage (Must) — *MVP complet à ce stade*
5. **US-003** — Reprogrammation manuelle d'une tâche en retard (Should)
6. **US-005** — Résumé « Habit tracker » en tableau sur une période, avec code couleur vert/jaune/rouge par défaut (80 %/40 %) en vue année (Should)
7. **US-006** — Paramétrage des seuils de couleur du résumé annuel (Should) — vient après US-005
8. **US-009** — Thème de couleurs pastel appliqué à l'ensemble de l'application (Should) — refonte visuelle, indépendante des fonctionnalités MVP déjà livrées
9. **US-010** — Cards horizontales pleine largeur pour les listes de tâches et d'habitudes (Should) — restyle des écrans US-001/US-002/US-004 déjà livrés
10. **US-011** — Frise de dates en haut de l'écran pour naviguer entre les jours du planning (Should) — remplace le mécanisme de navigation par flèches livré dans US-004
11. **US-012** — Titre dynamique « Planning du/d'... » selon le jour sélectionné (Could) — vient après US-011, réutilise son mécanisme de sélection de jour
12. **US-015** — Mise en pause et reprise d'une habitude (Should) — avancée devant US-013 : introduit le mécanisme de statut sur l'habitude (actif/en pause) que US-013 réutilise et étend pour son propre statut « supprimée » (soft-delete), plutôt que d'avoir deux systèmes de statut développés indépendamment
13. **US-013** — Suppression d'une habitude par glisser + confirmation (Should) — s'appuie sur l'écran Habitudes (US-001), la carte restylée (US-010) et le mécanisme de statut introduit par US-015
14. **US-014** — Suppression d'une tâche ponctuelle par glisser + confirmation (Should) — s'appuie sur l'écran Tâches (US-002/US-003) et la carte restylée (US-010)
15. **US-016** — Choix de la police de caractères de l'application (Should) — réutilise le pattern de réglage persistant de US-006 et le principe de centralisation visuelle de US-009 ; inclut des polices Google Fonts (dépendance réseau assumée, avec repli hors-ligne sur la police système)
16. **US-017** — Définition d'une cible chiffrée optionnelle pour une habitude (Should) — extension du formulaire de création/édition d'habitude (US-001) ; sans valeur d'usage tant que le planning (US-018) ne consomme pas cette cible, mais livrable indépendamment (rétrocompatible, n'affecte aucune habitude existante)
17. **US-018** — Suivi quotidien d'une habitude à cible chiffrée dans le planning (Should) — cœur de la valeur utilisateur du besoin « cible chiffrée » : bouton « + », saisie libre, barre de progression, passage automatique à « fait », réinitialisation quotidienne ; dépend directement de US-017 et s'appuie sur le planning (US-004) et la navigation par jour (US-011)
18. **US-019** — Compatibilité du résumé « Habit tracker » avec les habitudes à cible chiffrée (Should) — placée en dernier de cette série car elle ne fait que garantir la non-régression de US-005/US-006 face au nouveau type d'habitude introduit par US-017/US-018, sur le même principe de séparation planning/résumé déjà appliqué entre US-004 et US-005
19. **US-020** — Ajout de la police Dancing Script et changement de la police par défaut de l'application (Should) — extension directe et indépendante de US-016 (réutilise strictement son catalogue, son mécanisme d'application globale, sa persistance et son cache offline) ; aucune dépendance vis-à-vis du lot US-017/US-018/US-019
20. **US-021** — Heure limite optionnelle pour une tâche ponctuelle (Should) — extension du formulaire de tâche (US-002), pré-requis fonctionnel du rappel nominatif (US-022)
21. **US-022** — Rappel push nominatif à l'heure limite d'une tâche (Should) — révise explicitement la règle de confidentialité du contenu de push posée par US-007/ADR-001 (voir notes ajoutées dans ces deux documents, amendement du 2026-08-12) ; dépend directement de US-021 et de l'infrastructure Web Push de US-007
22. **US-023** — Resynchronisation de la fenêtre d'échéances à chaque cochage (Should) — étend le mécanisme de resynchronisation déjà livré par US-007 aux deux fenêtres (habitudes ET tâches à heure limite introduites par US-022), sans lever le best-effort documenté dans ADR-001
23. **US-024** — Indicateur de régularité apaisé sur la carte d'habitude (Should) — nouvel indicateur visuel neutre, sans mécanique de streak (arbitrage produit explicite du 2026-08-12), sur la carte restylée (US-010)
24. **US-025** — Signal doux « manquée hier » sur une habitude non faite la veille (Could) — complément visuel à US-024, purement informatif, sans reprogrammation (une habitude reste récurrente)
25. **US-026** — Ajout rapide d'une habitude ou d'une tâche depuis le planning (Should) — réutilise tel quel les formulaires d'US-001/US-002 depuis un nouveau point d'entrée sur l'écran de planning (US-004)
26. **US-027** — Section « En pause / Supprimées » sur l'écran Habitudes et reprise automatique programmée (Should) — regroupe et étend les statuts déjà livrés par US-013/US-015 (nouveau champ de reprise automatique optionnelle)
27. **US-008** — Sauvegarde et restauration de mes données (Should) — *repositionnée en fin de roadmap le 2026-08-12 (arbitrage utilisateur explicite) : le risque de purge du stockage local iOS qu'elle mitige est jugé théorique par l'utilisateur à ce jour, aucune perte de données n'ayant été subie. Reste `Should` (pas dégradée en `Could`) et demeure prête à être implémentée à tout moment (spécification déjà complète, couche données `collectBackup`/`restoreBackup` déjà posée) — seul son ordre de passage dans la roadmap change, pas son contenu ni sa priorité MoSCoW.*
28. **US-028** — Revue hebdomadaire poussée (Could) — priorisée basse (Lot 3, 2026-08-12), non planifiée à court terme
29. **US-029** — Mode sombre / respect de `prefers-color-scheme` (Could) — priorisée basse (Lot 3, 2026-08-12), non planifiée à court terme
30. **US-030** — Cibles chiffrées « à ne pas dépasser » (Could) — **explicitement non planifiée** (arbitrage utilisateur du 2026-08-12) : rédigée pour mémoire uniquement
31. **US-031** — Badge d'icône PWA indiquant les éléments restants du jour (Could) — **conditionnée à un spike technique préalable** de compatibilité `navigator.setAppBadge()` en PWA standalone iOS (non garantie) ; à ne pas engager avant vérification sur appareil réel

## Dépendances

- US-007 dépend de US-001 (avancée dans l'ordre d'implémentation malgré sa numérotation, pour valider tôt le risque technique des notifications — cf. ADR-001)
- US-003 dépend de US-002
- US-004 dépend de US-001 et US-002
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
- US-021 dépend de US-002 (formulaire de tâche existant, à étendre)
- US-022 dépend de US-021 (heure limite à consommer) et US-007 (infrastructure Web Push/scheduler et activation globale des rappels, réutilisées) ; révise la règle de confidentialité du contenu de push posée par US-007/ADR-001 (voir amendement du 2026-08-12 dans ces deux documents)
- US-023 dépend de US-007 (mécanisme de resynchronisation existant, rendu plus réactif) et US-022 (seconde fenêtre d'échéances — tâches à heure limite — à resynchroniser également)
- US-024 dépend de US-001, US-004 et US-005 (historique de complétion déjà produit), US-009/US-010 (cohérence et carte restylée)
- US-025 dépend de US-001, US-004 (historique de complétion) et US-024 (cohérence visuelle de l'indicateur de régularité, sans dépendance technique stricte)
- US-026 dépend de US-001 (formulaire habitude), US-002 (formulaire tâche) et US-004 (écran de planning, jour affiché)
- US-027 dépend de US-013 (statut « supprimée ») et US-015 (statut « en pause »/« active » et actions de bascule, étendus par cette US)
- US-008 dépend de US-001, US-002 et US-004 (données réelles à exporter/importer : habitudes, tâches, historique de complétion) — **repositionnée en fin de roadmap le 2026-08-12** (arbitrage utilisateur : risque de purge iOS jugé théorique, aucune perte subie à ce jour), sans changement de ses dépendances fonctionnelles ni de sa priorité MoSCoW (reste `Should`)
- US-028 dépend de US-007 (infrastructure Web Push/scheduler, second créneau de notification), US-005 (données de résumé) et US-024 (ton neutre déjà établi)
- US-029 dépend de US-009 (thème pastel de référence et centralisation des variables visuelles globales, à décliner en version sombre)
- US-030 dépend de US-017, US-018 et US-019 (étend le mécanisme de cible chiffrée, son suivi quotidien et sa compatibilité résumé pour un second sens de cible) — **non planifiée** (arbitrage utilisateur du 2026-08-12)
- US-031 dépend de US-004 (nombre d'éléments restants du jour) et, avant tout, d'un **spike technique préalable** de compatibilité `navigator.setAppBadge()` en PWA standalone iOS — pré-requis bloquant non négociable avant tout développement
