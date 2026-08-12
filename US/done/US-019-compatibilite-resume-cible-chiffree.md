---
type: user-story
id: US-019
titre: Compatibilité du résumé « Habit tracker » avec les habitudes à cible chiffrée
date: 2026-08-12
auteur: product-owner
statut: livrée
priorite: Should
estimation: S
source: chat
depend_de: ["US-005", "US-006", "US-017", "US-018"]
---

## Titre : US-019 — Compatibilité du résumé « Habit tracker » avec les habitudes à cible chiffrée

### Récit
> **En tant qu'** utilisateur de l'app,
> **je veux** que le résumé « Habit tracker » (US-005) continue de refléter correctement mes habitudes à cible chiffrée sur les vues semaine, mois et année,
> **afin de** conserver une vue fiable de ma régularité, y compris pour ce nouveau type d'habitude, sans que le résumé existant ne se casse silencieusement.

### Critères d'acceptation

**Scénario 1 — Cellule binaire (semaine/mois) pour une habitude à cible chiffrée**
> **Étant donné** une habitude « Boire de l'eau » a une cible chiffrée de 1,5 L
> **Quand** j'affiche le résumé en vue semaine ou mois
> **Alors** chaque cellule journalière indique fait/non fait selon que la valeur cumulée de ce jour a atteint ou dépassé la cible, exactement selon la même logique binaire que pour une habitude « case à cocher » (US-005 scénarios 1 et 2)
> **Et** aucune quantité ni pourcentage n'est affiché dans cette vue journalière : le rendu reste binaire, cohérent avec l'existant

**Scénario 2 — Cellule pourcentage (année) pour une habitude à cible chiffrée**
> **Étant donné** une habitude « Boire de l'eau » a une cible chiffrée
> **Quand** j'affiche le résumé en vue année
> **Alors** le pourcentage de complétion du mois pour cette habitude se calcule comme (nombre de jours où la cible a été atteinte ou dépassée ce mois-là / nombre de jours où l'habitude était prévue ce mois-là selon sa fréquence), exactement comme pour une habitude « case à cocher » (US-005 scénario 3)
> **Et** le code couleur vert/jaune/rouge (seuils configurés via US-006) s'applique de la même façon qu'aux autres habitudes

**Scénario 3 — Non-régression pour les habitudes « case à cocher » existantes**
> **Étant donné** des habitudes existantes n'ont pas de cible chiffrée (comportement actuel)
> **Quand** j'affiche le résumé sous toutes ses périodes (semaine, mois, année)
> **Alors** leur affichage et leur mode de calcul restent strictement identiques à ceux déjà livrés par US-005 et US-006, sans aucune régression observable

**Scénario 4 — Habitude à cible chiffrée mise en pause ou supprimée**
> **Étant donné** une habitude à cible chiffrée a été mise en pause (US-015) ou supprimée (US-013) après avoir accumulé de l'historique
> **Quand** j'affiche le résumé sur une période incluant des jours où elle était encore active
> **Alors** son historique de complétion déjà enregistré sur ces jours reste visible et pris en compte dans le résumé, selon les mêmes règles déjà garanties par US-013/US-015 pour les habitudes « case à cocher »

### Priorité
Should — garantit la non-régression du résumé déjà livré (US-005/US-006) face à un nouveau type d'habitude, indispensable pour livrer US-017/US-018 sans casser une fonctionnalité existante.

### Estimation
S — pas de nouveau composant visuel : il s'agit de faire dériver, pour une habitude à cible chiffrée, le même statut binaire « fait/non fait » déjà consommé par les calculs existants de US-005 (`habitCellStatus`, `habitMonthPercent`), à partir de la comparaison valeur cumulée du jour / cible plutôt que d'un simple booléen de complétion.

### Dépendances
US-005 (résumé existant, à ne pas régresser), US-006 (seuils de couleur, doivent continuer de s'appliquer), US-017 (habitude à cible chiffrée), US-018 (donnée de progression quotidienne à partir de laquelle dériver le statut fait/non fait).

### Notes / hors périmètre
- N'introduit aucun nouvel affichage de quantité ou de valeur numérique cumulée dans le résumé (semaine/mois/année) : uniquement la dérivation binaire fait/non fait déjà utilisée par les calculs de US-005. Afficher la quantité réelle (par exemple « 1,2 L / 1,5 L ») dans une cellule du résumé pourrait être une amélioration future intéressante, mais n'est ni demandée explicitement ni nécessaire pour préserver le comportement déjà livré par US-005/US-006.
- Ne modifie pas les seuils de couleur eux-mêmes (US-006) : cette US s'assure seulement qu'ils continuent de s'appliquer correctement aux habitudes à cible chiffrée.
- Le comportement pour l'indicateur de pourcentage de tâches ponctuelles (US-005 scénarios 4/4bis) n'est pas concerné : les tâches restent hors périmètre de la cible chiffrée (cf. US-017).

### Résumé d'implémentation (livrée le 2026-08-12)

Tous les scénarios (1 à 4) sont couverts et vérifiés par les tests automatisés ci-dessous ;
quality gate vert (`npm run check` 0 erreur, `npm test` 299/299, `npm run build` OK).

**Aucune modification de code de production n'a été nécessaire** dans `$lib/domain/summary.ts`,
`WeekMonthTable.svelte`, `YearTable.svelte` ni la route `/resume` : ce constat est le résultat
direct d'une décision d'implémentation prise en amont pendant US-018 (voir son résumé) — le statut
fait/pas fait d'une habitude à cible chiffrée est dérivé une fois, au moment de l'ajout/correction
de la progression ou de l'édition de la cible, et persisté dans le même `HabitCompletion.done`
que pour une habitude « case à cocher ». Les fonctions `habitCellStatus` / `habitMonthPercent` de
US-005 lisent donc `HabitCompletion[]` telles quelles, sans avoir besoin de connaître `target` ni
`HabitProgress`. Cette US a donc consisté à **vérifier et documenter par les tests** que cette
hypothèse tient dans tous les cas prévus par les scénarios, plutôt qu'à écrire du nouveau code de
résumé.

**Fichiers modifiés (tests uniquement) :**
- `src/lib/domain/summary.test.ts` — nouveau bloc « habitCellStatus / habitMonthPercent —
  habitude à cible chiffrée » : cellule binaire (scénario 1), pourcentage mensuel (scénario 2),
  non-régression pause/suppression avec une habitude à cible chiffrée (scénario 4).
- `src/routes/resume/WeekMonthTable.test.ts` — vérifie qu'une habitude à cible chiffrée affiche
  une cellule binaire classique, sans quantité ni pourcentage dans la vue semaine/mois
  (scénario 1).
- `src/routes/resume/YearTable.test.ts` — vérifie le pourcentage coloré selon les seuils
  (US-006) pour une habitude à cible chiffrée en vue année (scénario 2).
- `src/routes/resume/page.test.ts` — test d'intégration bout-en-bout : ajoute une quantité qui
  atteint la cible depuis le planning réel (`/`, US-018), puis vérifie que le résumé (`/resume`)
  affiche bien ce jour comme « fait », en binaire, sans aucune modification de code entre les deux
  routes — la preuve la plus directe de la non-régression visée par cette US.
- `src/routes/habitudes/page.test.ts`, `src/routes/page.test.ts` (déjà étendus pendant
  US-017/US-018) couvrent également indirectement la non-régression scénario 3 (habitudes « case
  à cocher » existantes, comportement strictement inchangé — confirmé par la suite complète
  passant à 299/299).

**Comment tester manuellement :**
1. Créer une habitude à cible chiffrée, l'amener à « faite » un jour donné via le planning (`/`,
   bouton « + »).
2. Aller sur `/resume`, vue semaine ou mois : le jour correspondant affiche une coche « fait »,
   sans quantité ni pourcentage — identique à une habitude « case à cocher ».
3. Basculer en vue année : le pourcentage du mois se colore selon les seuils configurés (US-006),
   en tenant compte des jours où la cible a été atteinte.
4. Mettre l'habitude en pause ou la supprimer (US-013/US-015) après avoir accumulé de
   l'historique : le résumé continue d'afficher cet historique sur les jours où elle était
   encore active.
