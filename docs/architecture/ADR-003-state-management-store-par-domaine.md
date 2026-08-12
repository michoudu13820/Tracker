---
type: adr
numero: 003
titre: State management — un store Svelte 5 (runes) par domaine fonctionnel
date: 2026-08-12
auteur: sveltekit-architect
statut: accepté
remplace: null
---

# ADR-003 — State management : un store Svelte 5 (runes) par domaine fonctionnel

## Contexte

L'embryon de code posé avec l'ADR-001 contenait un seul store, `HabitsStore`
(`src/lib/stores/habits.store.svelte.ts`) : une classe encapsulant un état `$state` et
déléguant la persistance à un repository injecté. Les 8 US introduisent d'autres domaines
d'état : tâches (US-002/003), historique de complétion (US-004/005), réglages persistés
(seuils US-006, rappels US-007) et orchestration runtime du push (US-007). Il faut trancher
la **granularité** et le **patron** du state management avant d'implémenter les US.

## Décision

**Un store par domaine fonctionnel**, chacun suivant le patron déjà établi par `HabitsStore` :
classe exportée + instance singleton, état en runes `$state`, persistance déléguée à un
repository **injecté au constructeur** (mockable en test), aucun accès direct à IndexedDB.

| Store | Fichier | État | US |
|-------|---------|------|----|
| `HabitsStore` | `habits.store.svelte.ts` | habitudes | US-001/004/005/007 |
| `TasksStore` | `tasks.store.svelte.ts` | tâches ponctuelles | US-002/003/004/005 |
| `CompletionsStore` | `completions.store.svelte.ts` | complétions habitudes + tâches | US-004/005 |
| `SettingsStore` | `settings.store.svelte.ts` | réglages **persistés** (seuils, rappels) | US-006/007 |
| `RemindersStore` | `reminders.store.svelte.ts` | état **runtime** du push (permission, souscription, sync) | US-007 |

**Règles :**
- Chaque store expose une méthode `load()` appelée par la route qui en a besoin (typiquement
  dans `onMount`). L'app étant `ssr = false`, l'instance singleton au niveau module est **sûre**
  (pas de partage d'état entre requêtes serveur, puisqu'il n'y a pas de serveur) — ce qui serait
  un anti-pattern en SSR est ici acceptable et volontaire.
- **Séparation prefs persistées / état device** : les réglages de rappel *stockés*
  (`enabled`, `time`, `timezone`) vivent dans `SettingsStore` ; la *souscription push* et la
  *synchronisation de la fenêtre* (état lié à l'appareil, non exporté par US-008) vivent dans
  `RemindersStore`. Cette frontière évite de mélanger une préférence sauvegardée avec un état
  runtime volatil.
- La **logique métier reste dans `domain/`** : les stores orchestrent (charger, muter,
  persister, notifier l'UI) mais délèguent les calculs purs (`isDueOn`, `isTaskOverdue`,
  `computeReminderWindow`, `colorFor`…) au domaine.
- Après un **import** (US-008, stratégie replace), les stores concernés doivent **recharger**
  leur état via `load()` pour refléter les données restaurées.

## Alternatives considérées

| Option | Avantages | Inconvénients | Retenue ? |
|--------|-----------|---------------|-----------|
| **Un store par domaine (retenue)** | Cohérent avec l'embryon, fichiers petits/testables, frontières claires alignées sur les repositories | 5 fichiers de store à charger/coordonner | **Oui** |
| **Store global unique** (un objet d'état monolithique) | Un seul point de chargement | Couplage fort, fichier qui grossit, re-rendus plus larges, tests moins ciblés | Non — sur-couplage injustifié |
| **Runes brutes dans les composants** (pas de store) | Zéro abstraction | État non partagé entre routes, duplication de la persistance, non testable hors DOM | Non — l'état est partagé entre plusieurs routes |
| **Contexte Svelte (`setContext`)** au lieu de singletons module | Évite l'état module global | Inutile sans SSR ; complexifie l'accès depuis le domaine/tests | Non — le singleton module suffit en SPA |

## Conséquences

**Positives :**
- Frontières nettes : un store ↔ un domaine ↔ (souvent) un repository. Facile à raisonner et
  à tester en injectant un repository en mémoire.
- Extensible : ajouter un domaine = ajouter un store, sans toucher aux autres.
- Idiomatique Svelte 5 (runes `$state`, classes, `$derived` côté composant pour les vues).

**Négatives / limites :**
- La **coordination inter-stores** est explicite et à la charge de l'appelant (ex. après un
  import US-008, recharger plusieurs stores ; après un changement d'habitude, `RemindersStore.sync`).
  Pas de bus d'événements — choix de simplicité assumé ; à réévaluer si les dépendances croisées
  se multiplient.
- Le singleton module suppose `ssr = false` (garanti par ADR-001/ADR-002). Réintroduire du SSR
  invaliderait ce patron et imposerait de passer par le contexte Svelte.

## Liens

- [ADR-001 — PWA SvelteKit + Web Push](./ADR-001-pwa-sveltekit-web-push-scheduler.md)
- [ADR-004 — Couche de persistance IndexedDB](./ADR-004-persistance-indexeddb-repositories.md)
- [CONVENTIONS.md](./CONVENTIONS.md)
