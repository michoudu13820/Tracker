---
type: user-story
id: US-017
titre: Définition d'une cible chiffrée optionnelle pour une habitude
date: 2026-08-12
auteur: product-owner
statut: livrée
priorite: Should
estimation: S
source: chat
depend_de: ["US-001"]
---

## Titre : US-017 — Définition d'une cible chiffrée optionnelle pour une habitude

### Récit
> **En tant qu'** utilisateur de l'app,
> **je veux** pouvoir définir, en option, une cible chiffrée avec une unité pour une habitude (par exemple 1,5 L pour « Boire de l'eau » ou 30 min pour « Faire du yoga »),
> **afin de** suivre une quantité précise plutôt qu'une simple case à cocher, quand cela correspond mieux à la nature de l'habitude.

### Critères d'acceptation

**Scénario 1 — Habitude simple par défaut, sans cible (rétrocompatibilité)**
> **Étant donné** je suis sur l'écran de création d'une habitude
> **Quand** je ne renseigne aucune cible chiffrée
> **Alors** l'habitude est enregistrée comme habitude « case à cocher », exactement selon le comportement déjà livré par US-001/US-004
> **Et** aucun changement n'est visible pour les habitudes déjà existantes n'ayant pas de cible

**Scénario 2 — Activation d'une cible chiffrée à la création**
> **Étant donné** je suis sur l'écran de création d'une habitude « Boire de l'eau »
> **Quand** j'active l'option « Suivre une quantité » et que je saisis une valeur cible « 1,5 » avec l'unité « Litres (L) »
> **Et** je valide la création
> **Alors** l'habitude est enregistrée avec une cible chiffrée de 1,5 L
> **Et** elle apparaît dans la liste des habitudes avec une indication de sa cible (par exemple « 1,5 L »)

**Scénario 3 — Liste d'unités prédéfinies fermée**
> **Étant donné** je suis en train de créer ou d'éditer une habitude et j'active l'option de cible chiffrée
> **Quand** j'ouvre le sélecteur d'unité
> **Alors** je vois une liste fermée d'unités prédéfinies : Litres (L), Millilitres (mL), Minutes (min), Heures (h), Kilomètres (km), Répétitions/Nombre (x)
> **Et** je ne peux pas saisir une unité libre en texte

**Scénario 4 — Validation de la valeur cible**
> **Étant donné** je suis en train de créer ou d'éditer une habitude avec l'option de cible chiffrée activée
> **Quand** je tente de valider avec une valeur cible vide, non numérique, nulle ou négative
> **Alors** la validation est bloquée
> **Et** un message m'indique que la cible doit être un nombre strictement positif

**Scénario 5 — Édition : passage d'une habitude simple à une cible chiffrée**
> **Étant donné** une habitude « Yoga » existe déjà en mode case à cocher, sans cible
> **Quand** j'édite cette habitude, que j'active l'option de cible chiffrée avec une valeur « 30 » et l'unité « Minutes (min) »
> **Et** je valide
> **Alors** l'habitude devient une habitude à cible chiffrée de 30 min
> **Et** l'historique de complétion déjà enregistré pour les jours passés reste inchangé

**Scénario 6 — Édition : retour d'une cible chiffrée à une habitude simple**
> **Étant donné** une habitude « Boire de l'eau » a une cible chiffrée de 1,5 L
> **Quand** j'édite cette habitude et que je désactive l'option de cible chiffrée
> **Et** je valide
> **Alors** l'habitude redevient une habitude « case à cocher » simple
> **Et** elle est de nouveau traitée par le planning et le résumé selon les règles de complétion binaire classiques (US-004/US-005) dès le prochain affichage

### Priorité
Should — extension de valeur pour un sous-ensemble d'habitudes (quantifiables), non bloquante pour le MVP déjà livré (US-001/US-004).

### Estimation
S — un champ optionnel supplémentaire (cible + unité) sur un formulaire existant (US-001), avec validation et une liste d'unités fermée ; pas de nouvel écran.

### Dépendances
US-001 (écran de création/édition d'habitude existant, à étendre).

### Notes / hors périmètre
- Ne couvre pas la saisie de la progression au quotidien ni l'affichage d'une barre de progression dans le planning : voir US-018.
- Ne couvre pas l'impact sur le résumé « Habit tracker » (US-005/US-006) : voir US-019.
- Le comportement du **changement de mode (case à cocher ↔ cible chiffrée) en cours de journée**, vis-à-vis d'une progression déjà enregistrée pour le jour courant, est traité par US-018 (qui gère la donnée de progression elle-même), pas par cette US.
- Liste d'unités volontairement fermée et non extensible par l'utilisateur dans cette US (pas de conversion entre unités, pas d'unité personnalisée en texte libre) — cohérent avec l'arbitrage déjà tranché par l'utilisateur. Une extension future (unités personnalisées, conversions) resterait à spécifier séparément si le besoin se confirme.
- Ne concerne que les habitudes (US-001) ; les tâches ponctuelles (US-002) restent en simple case à cocher et ne sont pas concernées par cette US.

### Résumé d'implémentation (livrée le 2026-08-12)

Tous les scénarios (1 à 6) sont couverts et vérifiés par les tests automatisés ci-dessous ; quality
gate vert (`npm run check` 0 erreur, `npm test` 252/252, `npm run build` OK).

**Fichiers créés/modifiés :**
- `src/lib/domain/types.ts` — nouveau type `HabitTargetUnit` (liste fermée), interface
  `HabitTarget` (`value` + `unit`), champ optionnel `target?: HabitTarget` sur `Habit`.
- `src/lib/domain/habits.ts` — `HabitDraft` étendu (`hasTarget`, `targetValue`, `targetUnit`) ;
  `validateHabitDraft` valide la cible (nombre strictement positif) ; nouvelles fonctions pures
  `TARGET_UNITS`, `targetUnitLabel`, `draftToTarget`, `targetToDraft`, `hasNumericTarget`,
  `formatTargetNumber`, `describeTarget`.
- `src/lib/domain/habits.test.ts` — tests des scénarios 1-6 au niveau domaine.
- `src/routes/habitudes/HabitForm.svelte` — nouveau fieldset « Cible chiffrée (optionnel) » :
  case à cocher « Suivre une quantité », champ valeur (`type="number"`, cohérent avec le champ
  intervalle existant), sélecteur d'unité (`<select>`, liste fermée = scénario 3, pas de saisie
  libre). Pré-rempli en édition via `targetToDraft`.
- `src/routes/habitudes/HabitForm.test.ts` — tests composant des scénarios 1 à 6.
- `src/routes/habitudes/HabitCard.svelte` + `HabitCard.test.ts` — affichage de la cible
  (« 🎯 1,5 L ») dans la liste des habitudes (scénario 2).

**Décisions d'implémentation :**
- Le champ « Valeur cible » du formulaire (US-017) reste un `<input type="number">`, dans le même
  style que le champ « intervalle » déjà présent sur ce formulaire — contrairement au champ de
  saisie libre du planning quotidien (US-018), qui est un texte libre acceptant la virgule
  française (`0,2`). Ce sont deux contextes de saisie différents (formulaire structuré vs. saisie
  rapide quotidienne), d'où le choix technique différent.
- `target` n'est pas encore consommé par le planning (US-018) ni le résumé (US-019) : cette US est
  livrable et testée indépendamment, sans aucun impact observable sur les habitudes existantes
  (rétrocompatibilité vérifiée par les tests scénario 1).

**Comment tester manuellement :**
1. Aller sur `/habitudes`, créer une habitude, cocher « Suivre une quantité », saisir une valeur
   et choisir une unité dans la liste déroulante → l'habitude apparaît avec sa cible affichée
   (ex. « 🎯 1,5 L »).
2. Tenter de valider avec une valeur vide/négative → message d'erreur bloquant.
3. Éditer une habitude existante sans cible pour lui en ajouter une, et inversement retirer la
   cible d'une habitude qui en a une → le formulaire se pré-remplit/se vide correctement.
