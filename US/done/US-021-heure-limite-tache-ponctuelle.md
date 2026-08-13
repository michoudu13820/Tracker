---
type: user-story
id: US-021
titre: Heure limite optionnelle pour une tâche ponctuelle
date: 2026-08-12
auteur: product-owner
statut: livrée
priorite: Should
estimation: S
source: chat
depend_de: ["US-002"]
---

## Titre : US-021 — Heure limite optionnelle pour une tâche ponctuelle

### Récit
> **En tant qu'** utilisateur de l'app,
> **je veux** pouvoir définir une heure limite optionnelle sur une tâche ponctuelle,
> **afin de** savoir jusqu'à quand je peux encore la faire dans la journée et être rappelé au bon moment (cf. US-022).

### Critères d'acceptation

**Scénario 1 — Ajout d'une heure limite à la création**
> **Étant donné** je suis sur l'écran de création d'une tâche
> **Quand** je saisis un nom, une date, et que je choisis en plus une heure limite (ex : 14:30)
> **Et** je valide la création
> **Alors** la tâche est enregistrée avec cette heure limite
> **Et** l'heure limite est affichée de façon visible sur la carte de la tâche, dans les écrans où elle apparaît (liste des tâches, planning)

**Scénario 2 — Champ optionnel : aucune régression si non renseigné**
> **Étant donné** je suis sur l'écran de création d'une tâche
> **Quand** je valide sans avoir renseigné d'heure limite
> **Alors** la tâche est créée normalement, sans heure limite, avec le même comportement d'affichage qu'avant cette US (US-002 non régressée)

**Scénario 3 — Saisie arrondie au quart d'heure**
> **Étant donné** je suis en train de renseigner une heure limite
> **Quand** je choisis une valeur via le sélecteur d'heure
> **Alors** seules des valeurs alignées sur le quart d'heure (…:00, …:15, …:30, …:45) peuvent être enregistrées
> **Et** si le contrôle de saisie utilisé permettait techniquement une valeur non alignée, elle est automatiquement arrondie au quart d'heure le plus proche avant l'enregistrement — jamais stockée à la minute près

**Scénario 4 — Retrait de l'heure limite en édition**
> **Étant donné** une tâche existante a une heure limite renseignée
> **Quand** je l'édite et vide le champ heure limite
> **Et** je valide
> **Alors** la tâche n'a plus d'heure limite
> **Et** elle revient à l'affichage standard, sans heure affichée sur sa carte

**Scénario 5 — Modification de l'heure limite en édition**
> **Étant donné** une tâche a une heure limite de 14:30
> **Quand** je la modifie pour 09:15
> **Et** je valide
> **Alors** la nouvelle heure limite (09:15) remplace l'ancienne et s'affiche désormais sur la carte

### Priorité
Should — améliore le confort d'usage des tâches ponctuelles et pose le pré-requis fonctionnel du rappel nominatif (US-022), mais n'est pas bloquant pour l'usage courant du planning déjà livré.

### Estimation
S — extension ciblée du formulaire et de l'affichage existants d'US-002 (un champ optionnel supplémentaire, une règle de saisie, un affichage sur la carte), sans logique métier lourde.

### Dépendances
US-002 (formulaire de création/édition de tâche existant, à étendre).

### Notes / hors périmètre
- Concerne **exclusivement les tâches ponctuelles** (US-002). Les habitudes ne sont **pas** concernées par une heure limite : leur rappel reste le récap matinal unique déjà livré par US-007 (arbitrage produit du 2026-08-12).
- Aucune validation bloquante n'est spécifiée si l'heure limite saisie est déjà passée au moment de la création (ex : créer aujourd'hui une tâche avec heure limite 08:00 alors qu'il est 10:00) : ce cas n'est pas couvert par cette US et n'entraîne pas d'erreur — comportement à préciser ultérieurement si un besoin réel apparaît.
- Cette US ne couvre **pas** l'envoi de notification à l'heure limite : c'est l'objet dédié d'US-022, qui consomme ce nouveau champ.
- L'arrondi au quart d'heure est dicté par la granularité du scheduler serveur (~15 min, cf. ADR-001) : aucune précision à la minute n'est jamais promise, y compris dans l'affichage sur la carte.

## Implémentation

Tous les scénarios sont satisfaits et couverts par des tests.

**Fichiers modifiés :**
- `src/lib/domain/types.ts` — ajout de `Task.dueTime?: string` (format `HH:MM`, optionnel).
- `src/lib/domain/dates.ts` — nouvelle fonction pure `roundTimeToQuarterHour(time: string): string`
  (arrondit au quart d'heure le plus proche, gère le débordement de fin de journée).
- `src/lib/domain/tasks.ts` — `TaskDraft.dueTime?: string | null` (brouillon de formulaire).
- `src/routes/taches/TaskForm.svelte` — champ `<input type="time" step="900">` optionnel,
  arrondi systématique via `roundTimeToQuarterHour` à la soumission (filet de sécurité côté code,
  indépendant du support du `step` par le contrôle natif) ; `novalidate` sur le `<form>` pour que
  la validation reste entièrement pilotée par le JS du composant (cohérent avec l'affichage
  d'erreurs existant d'US-002, évite que la contrainte native `step` bloque silencieusement la
  soumission sur certains navigateurs/valeurs).
- `src/lib/components/TaskItem.svelte` — affichage de l'heure limite (« · jusqu'à HH:MM ») à côté
  de la date, sur la carte partagée par `/taches` et le planning `/`.

**Fichiers de test modifiés :**
- `src/lib/domain/dates.test.ts` — tests de `roundTimeToQuarterHour` (valeurs déjà alignées,
  arrondi bas/haut, débordement 23:53 → 00:00).
- `src/routes/taches/TaskForm.test.ts` — scénarios 1 à 5 (création avec heure, création sans heure,
  arrondi au quart d'heure, retrait en édition, remplacement en édition).
- `src/lib/components/TaskItem.test.ts` — affichage conditionnel de l'heure limite sur la carte.

**Comment tester manuellement :**
1. `/taches` → « Nouvelle tâche » → renseigner nom, date, heure limite (ex. 14:30) → Créer :
   la carte affiche « 15/08/2026 · jusqu'à 14:30 ».
2. Créer une tâche sans heure limite : affichage inchangé (juste la date).
3. Modifier une tâche existante, vider le champ heure limite, enregistrer : l'heure disparaît de
   la carte.
4. Modifier une tâche existante, changer l'heure limite : la nouvelle heure remplace l'ancienne
   sur la carte.
5. La même carte de tâche (avec heure limite) est visible à l'identique dans le planning `/`.

**Dette / points assumés :** aucun. Pas d'écart avec la spécification. L'US ne couvre pas la
validation d'une heure limite déjà passée (explicitement hors périmètre) ni l'envoi de
notification (US-022, suivante).
