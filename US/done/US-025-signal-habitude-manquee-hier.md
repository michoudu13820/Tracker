---
type: user-story
id: US-025
titre: Signal doux « manquée hier » sur une habitude non faite la veille
date: 2026-08-12
auteur: product-owner
statut: livrée
priorite: Could
estimation: S
source: chat
depend_de: ["US-001", "US-004", "US-024"]
---

## Titre : US-025 — Signal doux « manquée hier » sur une habitude non faite la veille

### Récit
> **En tant qu'** utilisateur de l'app,
> **je veux** un signal visuel discret sur une habitude que je n'ai pas faite alors qu'elle était due hier,
> **afin de** en avoir conscience sans reproche, sans que cela modifie sa programmation future — une habitude reste récurrente.

### Critères d'acceptation

**Scénario 1 — Signal affiché le lendemain d'une occurrence manquée**
> **Étant donné** une habitude « Méditer » était due hier et n'a pas été cochée comme faite
> **Quand** je consulte l'écran « Habitudes » ou le planning du jour aujourd'hui
> **Alors** un signal visuel doux (par exemple une icône discrète ou une teinte légère, cohérente avec le ton pastel de l'application) est affiché sur cette habitude, avec un libellé du type « manquée hier »

**Scénario 2 — Pas de signal si l'habitude n'était pas due hier**
> **Étant donné** une habitude n'était pas due hier selon sa fréquence
> **Quand** je consulte l'écran aujourd'hui
> **Alors** aucun signal « manquée hier » n'est affiché pour cette habitude

**Scénario 3 — Pas de signal si l'habitude a été faite hier**
> **Étant donné** une habitude était due hier et a été cochée comme faite
> **Quand** je consulte l'écran aujourd'hui
> **Alors** aucun signal « manquée hier » ne s'affiche pour cette habitude

**Scénario 4 — Le signal ne porte que sur l'occurrence d'hier, sans cumul**
> **Étant donné** une habitude a été manquée avant-hier mais n'était pas due hier
> **Quand** je consulte l'écran aujourd'hui
> **Alors** aucun signal ne s'affiche (le signal ne concerne que le jour « hier » par rapport à aujourd'hui, jamais un historique plus ancien)

**Scénario 5 — Aucune action de reprogrammation proposée**
> **Étant donné** le signal « manquée hier » est affiché sur une habitude
> **Quand** je consulte les actions disponibles sur sa carte
> **Alors** aucune action de « reprogrammation » ou de rattrapage n'est proposée : une habitude reste récurrente selon sa fréquence normale, contrairement à une tâche ponctuelle en retard (US-003)

### Priorité
Could — complément visuel utile mais non essentiel, à livrer après les indicateurs de régularité (US-024) dont il partage l'esprit.

### Estimation
S — calcul simple (l'habitude était-elle due hier, a-t-elle été cochée), affichage conditionnel sur la carte déjà existante, aucune nouvelle donnée à stocker.

### Dépendances
US-001, US-004 (historique de complétion), US-024 (cohérence visuelle avec l'indicateur de régularité — peut être livrée avant ou après, sans dépendance technique stricte).

### Notes / hors périmètre
- Ne concerne que le jour « hier » par rapport à aujourd'hui : aucun cumul ni historique plus large (couvert par US-024/US-005 si besoin).
- N'introduit aucune notion de retard ni de reprogrammation, notions réservées aux tâches ponctuelles (US-003) : une habitude manquée reste simplement « non faite » ce jour-là, sans statut particulier au-delà du signal visuel.
- Le ton et l'intitulé exacts du signal (icône, texte) sont à valider avec le PO/design au moment de l'implémentation, dans l'esprit « apaisé, pas culpabilisant » explicitement demandé.

## Implémentation

Tous les scénarios sont satisfaits et couverts par des tests.

**Fichiers modifiés :**
- `src/lib/domain/regularity.ts` — nouvelle fonction pure `missedYesterday(habit, completions,
  today)` : vraie seulement si l'habitude était due hier et non cochée faite ce jour-là (aucun
  cumul, aucune notion de série).
- `src/routes/habitudes/HabitCard.svelte` — badge « manquée hier » (même style que le badge
  « En pause », teinte habitude pastel, pas de couleur d'alerte), affiché à côté du nom.
- `src/routes/HabitCheckItem.svelte` et `src/routes/HabitProgressItem.svelte` (planning `/`) —
  nouvelle prop optionnelle `missedYesterday` (défaut `false`), même badge visuel.
- `src/routes/+page.svelte` — calcule `missedYesterday(habit, completionsStore.habitCompletions,
  realToday)` pour chaque habitude affichée (toujours par rapport au jour réel, indépendamment
  du jour sélectionné dans la frise) et le transmet aux deux composants d'habitude.
- `src/routes/habitudes/HabitCard.test.ts` — `baseProps().today` recalé sur l'ancrage de
  l'habitude de test (`2026-08-01`) pour que le nouveau signal ne s'active pas involontairement
  dans les tests existants qui ne le concernent pas.

**Fichiers de test modifiés :**
- `src/lib/domain/regularity.test.ts` — 4 scénarios de `missedYesterday` (due et non faite, non
  due, due et faite, ne porte que sur hier).
- `src/routes/habitudes/HabitCard.test.ts`, `src/routes/HabitCheckItem.test.ts`,
  `src/routes/HabitProgressItem.test.ts` — affichage conditionnel du badge, absence par défaut,
  absence de toute action de reprogrammation/rattrapage (scénario 5).

**Comment tester manuellement :** créer une habitude quotidienne, ne pas la cocher hier (ou
revenir dessus demain sans la cocher aujourd'hui), puis consulter `/habitudes` et `/` : le badge
« manquée hier » apparaît sur sa carte, sans aucune action de reprogrammation proposée.

**Dette / points assumés :** aucun écart avec la spécification. Le signal est calculé par rapport
au jour réel (`realToday`) sur le planning, même si un autre jour est sélectionné dans la frise —
choix cohérent avec la formulation de l'US (« aujourd'hui »), non précisé explicitement au-delà.
