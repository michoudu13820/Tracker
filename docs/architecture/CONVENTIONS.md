# Conventions de développement — Tracker (PWA SvelteKit)

Conventions de code pour le projet **Tracker** (PWA SvelteKit 2 + Svelte 5, 100 % locale,
`adapter-static`). Ce document complète les ADR (`docs/architecture/`) : les ADR disent le
*pourquoi* des décisions structurantes, ce document dit le *comment* au quotidien.

> Contexte figé par les ADR : app **statique** (`ssr = false`), données **100 % locales**
> (IndexedDB), **aucun** endpoint serveur SvelteKit, seul code serveur = micro-scheduler dans
> `netlify/functions/`. Voir ADR-001 à ADR-004.

## 1. Où placer la logique ? (la règle d'or)

| Type de code | Emplacement | Exemple |
|---|---|---|
| **Logique métier pure** (calcul, règles) | `src/lib/domain/` | `isDueOn`, `isTaskOverdue`, `computeReminderWindow`, `colorFor` |
| **État partagé + orchestration** | `src/lib/stores/` | charger, muter, persister, exposer à l'UI |
| **Accès aux données** (IndexedDB) | `src/lib/data/` | repositories, backup/restore |
| **UI réutilisable** | `src/lib/components/` | composants partagés entre routes |
| **Écran / page** | `src/routes/<route>/+page.svelte` | assemble stores + composants |
| **Client Web Push** | `src/lib/push/` | souscription, upload de la fenêtre |
| **Code serveur** (rappels) | `netlify/functions/` | découplé de l'app (ADR-001) |

**Décider vite :** *« Est-ce un calcul pur, sans état ni I/O ? »* → `domain/`. *« Est-ce de
l'état partagé entre écrans ? »* → `stores/`. *« Est-ce lire/écrire IndexedDB ? »* → `data/`.
*« Est-ce du visuel ? »* → `components/` (si partagé) ou colocalisé dans la route (si local).

## 2. Règles de dépendance entre couches

```
routes / components  →  stores  →  data + domain
                                    data    →  domain
                                    domain  →  (rien : pur)
push  →  domain            (calcule la fenêtre, sérialise)
```

- `domain/` ne dépend **de rien** (ni framework, ni stockage, ni store). Toujours **pur et
  testable en isolation**. Aucun `import` de `$lib/stores`, `$lib/data`, `svelte`, `$app/*`.
- Un **composant n'accède jamais à IndexedDB en direct** : toujours via un store.
- Les **routes** orchestrent stores + composants ; elles ne contiennent pas de logique métier
  (elles appellent le domaine/les stores).
- **Interdits stricts** (frontière ADR-001) : aucun `+page.server.ts`, `+server.ts`, `hooks.server.ts`,
  ni `load` serveur. Pas d'appel réseau vers un backend applicatif — le seul `fetch` sortant
  autorisé est celui de `$lib/push/client` vers le micro-scheduler (souscription + horodatages).

## 3. Nommage

- **Fichiers domain / data / utils** : `kebab-case.ts` (ex. `occurrences.ts`, `repositories.ts`).
  Un fichier de test à côté : `<nom>.test.ts` (ex. `tasks.test.ts`).
- **Stores** : `<domaine>.store.svelte.ts` (le suffixe `.svelte.ts` est **obligatoire** pour que
  les runes `$state`/`$derived` fonctionnent hors composant). Classe `PascalCase` + `Store`
  (`TasksStore`), singleton exporté en `camelCase` (`tasksStore`).
- **Composants** : `PascalCase.svelte` (ex. `TabBar.svelte`, `HabitForm.svelte`).
- **Routes** : dossiers en **français, minuscules, sans apostrophe ni accent dans l'URL**
  (`/taches`, `/reglages`, `/resume`). Libellés accentués uniquement à l'affichage.
- **Types** : `PascalCase` (`Habit`, `ReminderSettings`, `BackupData`). Unions discriminées
  avec un champ `kind` (`Frequency`).
- **Dates** : type `IsoDate` = `YYYY-MM-DD` (**jour calendaire local**, sans heure ni fuseau).
  Ne jamais manipuler des `Date` brutes pour un jour métier ; passer par `$lib/domain/dates`.

## 4. Svelte 5 (runes) — idiomes

- `$state` pour l'état réactif ; `$derived` pour toute valeur **calculable** (ne pas la
  recopier dans un `$effect`).
- `$effect` réservé aux **effets de bord** (I/O, abonnements) et utilisé avec parcimonie.
- `$props()` pour les props de composant ; `{@render children()}` pour le slot par défaut.
- État partagé encapsulé dans une **classe** exportée depuis `stores/` (patron `HabitsStore`),
  avec **injection du repository au constructeur** (défaut = repo IndexedDB, override en test).
- Accès à la route courante : `page` depuis `$app/state` (pas l'ancien `$app/stores`).

## 5. Tests

- **Pyramide** : concentrer l'effort sur `domain/` (unitaire, pur, sans DOM) et `data/`
  (repository en mémoire). Peu de tests de composants, quelques e2e sur les parcours clés.
- **Domain / data** : Vitest, environnement `node` (défaut du projet). Fichier `<nom>.test.ts`
  colocalisé. Injecter `now`/dates pour des tests **déterministes** (voir `reminders.test.ts`,
  `tasks.test.ts`).
- **Composants** : Vitest + `@testing-library/svelte` en jsdom, via l'en-tête
  `// @vitest-environment jsdom` en tête de fichier. À réserver aux composants critiques.
- **Stores** : tester en injectant un **repository en mémoire** (implémentant l'interface),
  sans IndexedDB ni navigateur.
- **e2e (Playwright)** : à ajouter pour les parcours clés quand l'UI existera (non installé
  pour l'instant).
- **Rappels (US-007)** : la fiabilité « app fermée / verrouillée » ne se valide **que sur
  iPhone réel avec la PWA installée** (cf. ADR-001) — pas automatisable en CI.
- Commandes : `npm test` (run), `npm run test:watch`, `npm run check` (types svelte-check).

## 6. Frontière serveur (rappel de discipline)

Le contenu qui remonte au micro-scheduler est **strictement** limité à : la souscription Web
Push + une liste d'instants d'envoi (`sendAt`). **Aucun** nom d'habitude/tâche, aucune
complétion, aucun réglage métier ne doit transiter. Toute évolution de `$lib/push/client` ou de
`netlify/functions/` doit préserver cette limite (ADR-001). Le contenu du push reste **générique**
(éventuel compteur non nominatif), jamais nominatif.

## 7. Colocation vs partage

- Un composant utilisé par **une seule** route → le colocaliser dans le dossier de la route
  (`src/routes/<route>/MonComposant.svelte`).
- Dès qu'il est utilisé par **≥ 2** routes → le déplacer dans `src/lib/components/` et l'exporter
  via le barrel `src/lib/components/index.ts`.
- Garder proche ce qui change ensemble (composant + ses styles `<style>` + son test).
