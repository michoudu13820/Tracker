---
type: user-story
id: US-018
titre: Suivi quotidien d'une habitude à cible chiffrée dans le planning
date: 2026-08-12
auteur: product-owner
statut: livrée
priorite: Should
estimation: L
source: chat
depend_de: ["US-001", "US-004", "US-011", "US-017"]
---

## Titre : US-018 — Suivi quotidien d'une habitude à cible chiffrée dans le planning

### Récit
> **En tant qu'** utilisateur de l'app,
> **je veux**, sur le planning quotidien, ajouter la quantité que je viens d'accomplir pour une habitude à cible chiffrée et voir une barre de progression correspondante,
> **afin de** suivre ma progression du jour vers ma cible, sans avoir à cocher une simple case qui ne refléterait pas la nature quantitative de l'habitude.

### Critères d'acceptation

**Scénario 1 — Affichage initial à 0**
> **Étant donné** le planning du jour affiche une habitude « Boire de l'eau » à cible chiffrée de 1,5 L, prévue aujourd'hui, sans aucune saisie encore faite aujourd'hui
> **Alors** une barre de progression vide est affichée à la place de la case à cocher habituelle
> **Et** un bouton « + » est visible pour ajouter une quantité
> **Et** la valeur cumulée affichée est « 0 / 1,5 L » (ou équivalent lisible)

**Scénario 2 — Ajout d'une quantité via le bouton « + »**
> **Étant donné** l'habitude « Boire de l'eau » affiche une valeur cumulée de 0 L aujourd'hui
> **Quand** je clique sur le bouton « + »
> **Et** je saisis « 0,2 » dans le champ de saisie libre proposé, puis je valide
> **Alors** la valeur cumulée du jour passe à 0,2 L
> **Et** la barre de progression se met à jour pour refléter 0,2 / 1,5 (≈ 13 %)

**Scénario 3 — Cumul de plusieurs saisies dans la même journée**
> **Étant donné** j'ai déjà ajouté 0,2 L aujourd'hui pour « Boire de l'eau »
> **Quand** j'ajoute une nouvelle saisie de « 0,3 » via le bouton « + »
> **Alors** la valeur cumulée du jour devient 0,5 L
> **Et** la barre de progression reflète 0,5 / 1,5 (≈ 33 %)

**Scénario 4 — Passage automatique à « fait » à l'atteinte de la cible**
> **Étant donné** la valeur cumulée du jour pour « Boire de l'eau » est 1,3 L sur une cible de 1,5 L
> **Quand** j'ajoute une saisie de « 0,2 »
> **Alors** la valeur cumulée atteint 1,5 L (100 %)
> **Et** l'habitude est automatiquement marquée comme « faite » pour ce jour, avec le même traitement visuel que les habitudes cochées (US-004) et comptée comme faite dans le résumé (US-005, voir US-019)

**Scénario 5 — Dépassement possible au-delà de la cible**
> **Étant donné** l'habitude « Boire de l'eau » a déjà atteint sa cible aujourd'hui et est marquée « faite »
> **Quand** j'ajoute une nouvelle saisie de « 0,3 »
> **Alors** la valeur cumulée passe à 1,8 L, au-delà de la cible de 1,5 L
> **Et** la saisie n'est jamais bloquée du fait d'avoir atteint 100 % ; la barre de progression indique visuellement le dépassement (par exemple pleine et stylée distinctement) sans qu'aucune limite haute n'empêche d'ajouter davantage
> **Et** l'habitude reste marquée « faite »

**Scénario 6 — Saisie invalide**
> **Étant donné** le champ de saisie libre est ouvert suite à un clic sur « + »
> **Quand** je saisis une valeur non numérique, négative ou nulle, puis je tente de valider
> **Alors** l'ajout est refusé
> **Et** un message m'indique que la quantité doit être un nombre strictement positif
> **Et** la valeur cumulée du jour reste inchangée

**Scénario 7 — Réinitialisation quotidienne**
> **Étant donné** l'habitude « Boire de l'eau » avait une valeur cumulée de 1,5 L pour le jour affiché hier
> **Quand** j'affiche le planning du jour suivant (aujourd'hui)
> **Alors** la valeur cumulée affichée pour aujourd'hui repart à 0
> **Et** aucune saisie n'est reportée ou ajoutée automatiquement depuis la veille

**Scénario 8 — Consultation d'un jour passé**
> **Étant donné** l'habitude « Boire de l'eau » avait une valeur cumulée de 1,2 L (sur une cible de 1,5 L) un jour passé donné
> **Quand** je navigue vers ce jour passé dans le planning (US-011)
> **Alors** la valeur cumulée et la barre de progression affichées correspondent à ce qui a été enregistré ce jour-là (1,2 / 1,5, statut « non fait »)
> **Et** aucune nouvelle saisie effectuée sur un autre jour ne modifie rétroactivement ce jour passé

**Scénario 9 — Correction d'une saisie erronée**
> **Étant donné** j'ai ajouté par erreur une quantité de « 2 » au lieu de « 0,2 » pour « Boire de l'eau » aujourd'hui, portant la valeur cumulée du jour à 2 L
> **Quand** j'utilise l'action de correction proposée sur la valeur cumulée du jour (par exemple en cliquant sur la valeur affichée) pour la remplacer directement par « 0,2 »
> **Et** je valide
> **Alors** la valeur cumulée du jour pour aujourd'hui est corrigée à 0,2 L
> **Et** la barre de progression et le statut « fait/pas fait » sont recalculés en conséquence

**Scénario 10 — Édition de la cible en cours de journée**
> **Étant donné** l'habitude « Boire de l'eau » a une cible de 1,5 L et une valeur cumulée de 1 L déjà enregistrée aujourd'hui
> **Quand** je modifie la cible de cette habitude à 2 L depuis l'écran d'édition (US-017)
> **Alors** la valeur cumulée déjà enregistrée aujourd'hui (1 L) est conservée telle quelle, sans être réinitialisée ni recalculée en valeur brute
> **Et** la barre de progression du jour est recalculée immédiatement par rapport à la nouvelle cible (1 / 2, soit 50 %)
> **Et** le statut « fait/pas fait » du jour est réévalué selon la nouvelle cible (ici toujours « pas fait » puisque 1 < 2)

### Priorité
Should — apporte la valeur d'usage réelle de la cible chiffrée définie en US-017 ; non bloquant pour le MVP déjà livré, mais nécessaire pour que US-017 ait un intérêt concret au quotidien.

### Estimation
L — nouvelle donnée de progression cumulée par habitude et par jour (persistée, distincte du simple booléen fait/pas fait), UI de saisie libre sur le planning, calcul de barre de progression, dérivation automatique du statut « fait », gestion de la correction et du recalcul lors d'un changement de cible en cours de journée, navigation multi-jours, tests domain + composant + store.

### Dépendances
US-001 (habitude existante), US-004 (planning quotidien à étendre pour ce type d'habitude), US-011 (navigation entre jours, dont le comportement doit rester cohérent avec la progression quotidienne), US-017 (définition de la cible chiffrée et de son unité, préalable indispensable).

### Notes / hors périmètre
- **Hypothèse produit tranchée — pas d'historique détaillé des ajouts individuels** : cette US ne conserve pas de journal de chaque saisie effectuée dans la journée (pas de liste « 08h30 : +0,2 L », « 12h00 : +0,3 L »). Seule la valeur cumulée du jour est persistée et directement modifiable (scénario 9), ce qui suffit à couvrir le besoin de correction exprimé sans complexifier le modèle de données. Un historique détaillé des ajouts pourrait être une amélioration future si le besoin se confirme.
- **Hypothèse produit tranchée — pas de décochage manuel indépendant** : contrairement à une habitude « case à cocher » (US-004 scénario 5, où l'on peut décocher directement), le statut « fait » d'une habitude à cible chiffrée dérive uniquement du calcul valeur cumulée / cible. Pour repasser sous la cible, l'utilisateur corrige la valeur cumulée elle-même (scénario 9) plutôt que de disposer d'une action de décochage distincte.
- **Hypothèse produit tranchée — style de la barre de progression** : remplissage proportionnel simple, dans la teinte d'accent du thème pastel déjà en place (US-009). Les seuils de couleur multi-niveaux (vert/jaune/rouge) introduits par US-006 ne sont **pas** repris ici : ils ont été conçus pour une vue agrégée sur une période (résumé annuel), pas pour la progression d'un seul jour et d'une seule habitude. Ce choix est assumé et pourra être revu si un besoin utilisateur contraire se manifeste.
- Pas de conversion d'unité : la quantité saisie est toujours exprimée et cumulée dans l'unité définie pour l'habitude (ex. toujours en L pour « Boire de l'eau », jamais un mélange L/mL).
- L'impact sur le résumé « Habit tracker » (US-005/US-006) est traité par une US dédiée (US-019) pour ne pas mélanger les responsabilités planning quotidien / résumé sur une période, comme le fait déjà la séparation existante entre US-004 et US-005.

### Résumé d'implémentation (livrée le 2026-08-12)

Tous les scénarios (1 à 10) sont couverts et vérifiés par les tests automatisés ci-dessous ;
quality gate vert (`npm run check` 0 erreur, `npm test` 293/293, `npm run build` OK).

**Fichiers créés/modifiés :**
- `src/lib/domain/types.ts` — nouvelle interface `HabitProgress` (`habitId`, `date`, `value`) :
  une seule valeur cumulée par jour, pas de journal détaillé des ajouts (hypothèse produit
  tranchée par l'US).
- `src/lib/domain/progress.ts` (nouveau) + `progress.test.ts` — fonctions pures :
  `validateAmount`/`parseAmount` (saisie libre, virgule française acceptée), `roundAmount`
  (évite les artefacts de virgule flottante type `0.2 + 0.3`), `progressValue`, `progressPercent`
  (sans plafond, scénario 5), `isTargetReached`.
- `src/lib/data/repositories.ts` — `CompletionsRepository` étendu avec `getHabitProgress()` /
  `saveHabitProgress()`, nouvelle clé IndexedDB `habit-progress`.
- `src/lib/data/backup.ts` — `BackupData.habitProgress` ajouté (export/import US-008) pour ne pas
  perdre silencieusement cette nouvelle donnée métier ; champ optionnel à l'import pour rester
  compatible avec les exports antérieurs à cette US.
- `src/lib/stores/completions.store.svelte.ts` (+ test) — état `habitProgress`, et nouvelles
  méthodes `habitProgressValue`, `setHabitProgress` (correction directe, scénario 9, dérive le
  statut fait/pas fait via `setHabitDone`), `addHabitProgress` (cumul, scénarios 2/3/5),
  `recomputeTargetCompletions` (réévaluation du statut après édition de la cible, scénario 10 —
  no-op si l'habitude n'a plus de cible, US-017 scénario 6).
- `src/routes/HabitProgressItem.svelte` (nouveau) + test colocalisé — remplace `HabitCheckItem`
  pour les habitudes à cible chiffrée dans le planning : barre de progression, bouton « + »
  ouvrant une saisie libre (texte + `inputmode="decimal"`, accepte la virgule), valeur cumulée
  cliquable pour correction directe, message d'erreur si saisie invalide (scénario 6), style de
  dépassement distinct au-delà de 100 % (scénario 5).
- `src/routes/+page.svelte` (+ test étendu) — branchement conditionnel `hasNumericTarget(habit)` :
  `HabitProgressItem` ou `HabitCheckItem` selon le type d'habitude ; `handleProgressAdd` /
  `handleProgressCorrect` délèguent au store pour le jour actuellement affiché (`selectedDate`),
  ce qui couvre naturellement la réinitialisation quotidienne (scénario 7) et la consultation d'un
  jour passé (scénario 8) — chaque jour est une entrée indépendante dans `habitProgress`.
- `src/routes/habitudes/+page.svelte` — après `habitsStore.upsert`, appelle
  `completionsStore.recomputeTargetCompletions(habit)` (scénario 10).

**Décision d'implémentation clé — statut « fait » toujours dérivé via `HabitCompletion`** : plutôt
que de faire porter aux fonctions déjà livrées de `$lib/domain/summary` (US-005/US-006) la
connaissance de `HabitProgress`/`target`, le statut fait/pas fait d'une habitude à cible chiffrée
est calculé une fois (au moment de l'ajout/correction/édition de cible) et persisté dans
`HabitCompletion.done`, exactement comme pour une habitude « case à cocher ». Cela signifie que
`summary.ts`, `WeekMonthTable.svelte` et `YearTable.svelte` n'ont **eu besoin d'aucune
modification** : ils continuent de lire `HabitCompletion[]` tel quel. Ce choix réduit la surface de
régression sur une fonctionnalité déjà livrée et prépare directement US-019 (qui n'aura qu'à
vérifier/documenter ce comportement, sans changer le code du résumé).

**Comment tester manuellement :**
1. Créer une habitude à cible chiffrée (US-017), ex. « Boire de l'eau » 1,5 L.
2. Sur `/` (planning du jour), constater la barre de progression vide et « 0 / 1,5 L ».
3. Cliquer sur « + », saisir « 0,2 », valider → cumul à 0,2 L, barre à ~13 %.
4. Répéter jusqu'à dépasser 1,5 L → l'habitude passe visuellement « faite » (nom barré), la barre
   affiche un style de dépassement au-delà de 100 %, sans blocage de saisie.
5. Cliquer sur la valeur cumulée affichée pour la corriger directement à une autre valeur.
6. Naviguer vers un autre jour (frise de dates, US-011) : le cumul repart à 0 ; revenir en arrière
   restitue la valeur enregistrée ce jour-là.
7. Éditer la cible de l'habitude depuis `/habitudes` : le cumul du jour est conservé, la barre et
   le statut « fait » sont recalculés par rapport à la nouvelle cible.
