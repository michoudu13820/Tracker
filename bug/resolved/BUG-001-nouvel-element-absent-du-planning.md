---
type: bug
id: BUG-001
titre: Une habitude ou une tâche fraîchement créée n'apparaît pas dans le planning du jour
date: 2026-08-12
auteur: qa
statut: corrigé
severite: majeur
us_liee: [US-004]
reproductible: toujours
---

# BUG-001 — Une habitude ou une tâche fraîchement créée n'apparaît pas dans le planning du jour

## Résumé
Après création d'une nouvelle habitude (via `/habitudes`) ou d'une nouvelle tâche ponctuelle datée
d'aujourd'hui (via `/taches`), l'élément est bien enregistré et visible dans sa propre liste, mais
il n'apparaît pas dans le planning du jour (`/`, « Planning d'aujourd'hui »), alors que sa
fréquence (pour une habitude) ou sa date (pour une tâche) devrait l'y rendre visible.

## US / critère concerné
- **US-004 — Planning quotidien des habitudes et tâches**, Scénario 1 — Affichage du jour courant :
  > **Alors** les habitudes prévues ce jour (selon leur fréquence) sont listées dans une section
  > distincte des tâches
  > **Et** les tâches ponctuelles dont la date correspond à ce jour sont listées dans une autre
  > section distincte

  Ce critère est violé : un élément nouvellement créé et dû/daté du jour affiché n'apparaît pas
  dans la section correspondante du planning.

- Contexte connexe (non violé mais utile) : **US-001** scénario 1/2 (« elle apparaît dans la liste
  des habitudes ») et **US-002** scénario 1 (« elle apparaît dans la liste des tâches ») sont
  respectés — la création fonctionne et l'élément est visible sur son propre écran (`/habitudes`
  ou `/taches`). C'est bien le report vers le planning (`/`, périmètre US-004) qui est en défaut.

## Environnement
- Application lancée en local via `npm run dev` (serveur de dev SvelteKit/Vite).
- Navigateur / mode (onglet classique vs PWA installée) : non précisé par l'utilisateur — à
  confirmer (voir « Notes / pistes »).
- Aucune donnée préexistante mentionnée comme condition (le bug semble se produire même avec un
  planning déjà peuplé d'éléments plus anciens, qui eux s'affichent correctement).

## Étapes de reproduction
**Cas habitude :**
1. `npm run dev`, ouvrir l'application, aller sur l'onglet « Aujourd'hui » (`/`) et noter le
   contenu actuel de la section « 🔁 Habitudes ».
2. Aller sur l'onglet « Habitudes » (`/habitudes`), cliquer sur « + Nouvelle habitude ».
3. Saisir un nom (ex. « Boire de l'eau »), un emoji, choisir le mode « Intervalle en jours » avec
   la valeur « 1 » (tous les jours), valider.
4. Vérifier que l'habitude apparaît bien dans la liste de `/habitudes` (US-001, OK).
5. Revenir sur l'onglet « Aujourd'hui » (`/`).
6. **Constat** : l'habitude créée à l'étape 3 n'apparaît pas dans la section « 🔁 Habitudes » du
   planning du jour courant, alors qu'une fréquence « tous les jours » ancrée sur aujourd'hui
   devrait la rendre due dès aujourd'hui.

**Cas tâche (même schéma) :**
1. Aller sur l'onglet « Tâches » (`/taches`), créer une tâche avec un nom et la date du jour
   (aujourd'hui), valider.
2. Vérifier qu'elle apparaît dans la liste de `/taches` (US-002, OK).
3. Revenir sur l'onglet « Aujourd'hui » (`/`).
4. **Constat** : la tâche n'apparaît pas dans la section « ✅ Tâches » du planning du jour.

## Résultat observé
La nouvelle habitude / tâche est enregistrée et visible sur son propre écran de gestion
(`/habitudes` ou `/taches`), mais absente de la section correspondante du planning du jour (`/`)
alors qu'elle devrait y être due/datée.

## Résultat attendu
Conformément à US-004 scénario 1 : l'habitude prévue ce jour (selon sa fréquence) apparaît dans la
section « Habitudes » du planning, et la tâche datée de ce jour apparaît dans la section
« Tâches » — y compris immédiatement après leur création, sans action supplémentaire requise.

## Sévérité & impact
**Majeur.** Le planning quotidien (`/`) est l'écran d'atterrissage et l'usage principal quotidien
de l'application (ADR-002). Si un élément fraîchement créé n'y apparaît pas, l'utilisateur ne peut
pas suivre au jour le jour ce qu'il vient précisément de planifier — cela casse le parcours de
base « je crée une habitude/tâche → je la coche dans mon planning du jour ». Impact sur tous les
utilisateurs, à chaque création. Non classé « bloquant » car les éléments déjà existants
s'affichent correctement (fonctionnalité partiellement utilisable) et un contournement (à
confirmer) pourrait exister — voir notes ci-dessous.

## Cause racine confirmée (2026-08-12, via console navigateur fournie par l'utilisateur)
```
Uncaught (in promise) DataCloneError: Failed to execute 'put' on 'IDBObjectStore': [object Object] could not be cloned.
    at idb-keyval.js:39:11
    at idb-keyval.js:25:53
    at async Object.saveAll (repositories.ts:70:4)
    at async HabitsStore.upsert (habits.store.svelte.ts:31:30)
    at async Object.handleSave [as onSave] (+page.svelte:30:42)
```
`HabitsStore`/`TasksStore` stockent leurs données dans un tableau `$state` (Svelte 5). Les objets
poussés dans un `$state` sont enveloppés dans des **Proxy réactifs**. `upsert()` pousse l'élément
dans `this.habits`/`this.tasks` (tableau `$state`) puis passe ce tableau (donc des Proxy) tel quel
à `repo.saveAll()` → `idb-keyval.set()`, qui utilise `structuredClone` en interne. Un Proxy n'est
pas clonable par `structuredClone` → `DataCloneError`, la promesse de sauvegarde est rejetée sans
être interceptée (« Uncaught (in promise) »), donc **l'écriture en IndexedDB échoue silencieusement**.

L'état réactif en mémoire, lui, contient déjà le nouvel élément (le `push()` a eu lieu avant
l'échec de la sauvegarde), ce qui explique qu'il reste visible sur `/habitudes` ou `/taches` tant
qu'on ne recharge pas depuis IndexedDB. En revenant sur `/`, `+page.svelte` appelle `load()` qui
relit IndexedDB (qui ne contient PAS le nouvel élément, la sauvegarde ayant échoué) et écrase
l'état mémoire — d'où sa disparition du planning. Cohérent avec « toujours reproductible » et
« absent même après F5 » (rapporté par l'utilisateur).

**Piste de correctif** : dé-proxifier les données avant de les persister, par ex. via
`$state.snapshot(this.habits)` dans `upsert()` (et vérifier les autres stores du même patron :
`completions.store.svelte.ts`, `settings.store.svelte.ts`, `reminders.store.svelte.ts`, qui
pourraient être touchés par le même défaut s'ils persistent des données issues d'un `$state`).

## Notes / pistes (investigation initiale avant confirmation console)
Investigation de code statique (sans exécution, pas de correctif apporté) :
- `habitsStore` (`src/lib/stores/habits.store.svelte.ts`) et `tasksStore`
  (`src/lib/stores/tasks.store.svelte.ts`) sont des singletons exportés au niveau module, partagés
  entre `/habitudes`, `/taches` et `/`. Leur méthode `upsert()` pousse le nouvel élément dans le
  tableau réactif `$state` puis persiste via `repo.saveAll()` (IndexedDB, `idb-keyval`) — rien
  d'anormal identifié à ce niveau.
- La route `/` (`src/routes/+page.svelte`) recharge les données au montage (`onMount` →
  `habitsStore.load()` / `tasksStore.load()`), et calcule `dueHabits` / `dueTasks` via des
  `$derived` sur `habitsStore.dueOn(selectedDate)` / `tasksStore.onDate(selectedDate)`, avec
  `selectedDate` initialisé à `realToday`.
- La logique pure de sélection (`src/lib/domain/occurrences.ts::isDueOn`,
  `src/lib/domain/tasks.ts::tasksOn`) donne, pour un ancrage égal à aujourd'hui, un delta de 0
  jours — due dès le jour de création, quel que soit l'intervalle choisi.
- Aucun défaut logique évident n'a été identifié par simple lecture de ces fichiers pour le cas
  nominal (habitude quotidienne / tâche datée d'aujourd'hui créée puis planning consulté). Le test
  existant `src/routes/page.test.ts` ne couvre PAS ce scénario précis : il pré-charge les données
  directement dans le mock `idb-keyval` avant le montage de la page, mais ne simule jamais le
  parcours « création via le formulaire d'une autre route, puis navigation vers `/` » — c'est
  potentiellement un point aveugle de couverture de test à combler en même temps que le correctif.
- Pistes à vérifier en priorité par le développeur (pas confirmées par QA, faute d'environnement
  d'exécution disponible pour ce ticket) :
  1. Le rechargement complet du navigateur (F5) sur `/` fait-il apparaître l'élément manquant ?
     Si oui → piste réactivité/store (pas de re-fetch, ou store dupliqué entre routes). Si non →
     piste persistance (écriture IndexedDB non aboutie, ou lecture qui ne matche pas la date/la
     fréquence réellement enregistrée).
  2. Y a-t-il une erreur dans la console navigateur au moment de la création ou de la navigation ?
  3. Le comportement dépend-il du mode de fréquence choisi pour l'habitude (intervalle vs jours de
     semaine) ou est-il systématique quel que soit le mode ?
  4. Le bug se produit-il aussi lors d'un rafraîchissement complet de la page (pas seulement via la
     navigation SPA par la barre d'onglets `TabBar.svelte`) ?
- Fichiers concernés à examiner en premier lieu : `src/routes/+page.svelte`,
  `src/lib/stores/habits.store.svelte.ts`, `src/lib/stores/tasks.store.svelte.ts`,
  `src/lib/data/repositories.ts`, `src/lib/domain/occurrences.ts`, `src/lib/domain/tasks.ts`.

## Résumé de correction (2026-08-12)

**Cause racine** : confirmée conforme à l'analyse de la fiche. `HabitsStore.upsert()` et
`TasksStore.upsert()` passaient leur tableau `$state` (donc des éléments enveloppés dans des
Proxy réactifs Svelte 5) directement à `repo.saveAll()`. `idb-keyval.set()` s'appuie en interne
sur `structuredClone`/`IDBObjectStore.put`, qui rejette les Proxy avec `DataCloneError` — vérifié
empiriquement : `structuredClone(new Proxy({...}, {}))` lève bien `DataCloneError` côté Node/V8,
ce qui reproduit fidèlement le comportement Chromium/Safari décrit dans la console utilisateur.
La promesse rejetée n'étant interceptée nulle part, l'écriture IndexedDB échouait silencieusement
alors que l'état mémoire (donc l'affichage sur `/habitudes`/`/taches`) contenait déjà le nouvel
élément. Au retour sur `/`, `+page.svelte` rechargeait depuis IndexedDB et écrasait l'état
mémoire avec la donnée persistée (incomplète), faisant disparaître l'élément du planning.

Même patron de risque retrouvé (non rapporté par l'utilisateur, corrigé par prudence) dans
`CompletionsStore.setHabitDone`/`setTaskDone` (tableaux `$state`) et dans
`SettingsStore.saveReminder`/`saveThresholds` (si un appelant relit `store.reminder`/
`store.thresholds`, devenus des Proxy après la première écriture, et les repasse à une
sauvegarde ultérieure). `RemindersStore` a été vérifié et n'est **pas** concerné : il ne persiste
rien en IndexedDB, son seul flux sortant (`$lib/push/client::pushSchedule`) sérialise via
`JSON.stringify`, qui traverse les Proxy sans problème.

**Correctif appliqué** : dé-proxification via `$state.snapshot(...)` juste avant l'appel au
repository, dans chaque store concerné :
- `src/lib/stores/habits.store.svelte.ts` — `upsert()` : `saveAll($state.snapshot(this.habits))`.
- `src/lib/stores/tasks.store.svelte.ts` — `upsert()` : `saveAll($state.snapshot(this.tasks))`.
- `src/lib/stores/completions.store.svelte.ts` — `setHabitDone()`/`setTaskDone()` :
  snapshot des tableaux `habitCompletions`/`taskCompletions` avant `saveHabitCompletions`/
  `saveTaskCompletions`.
- `src/lib/stores/settings.store.svelte.ts` — `saveReminder()`/`saveThresholds()` : snapshot de
  l'argument avant `saveReminderSettings`/`saveColorThresholds` (défense en profondeur si
  l'appelant repasse une valeur déjà lue depuis le store).

**Tests de non-régression ajoutés** (rouges avant correctif, vérifiés puis repassés au vert
après) :
- `src/lib/stores/habits.store.svelte.test.ts`
- `src/lib/stores/tasks.store.svelte.test.ts`
- `src/lib/stores/completions.store.svelte.test.ts`
- `src/lib/stores/settings.store.svelte.test.ts`

Chaque test injecte un repository de test dont l'implémentation appelle `structuredClone` sur les
données reçues (comme le fait réellement `idb-keyval`/IndexedDB), et exécute le vrai chemin
`store.<action>()` sans mocker `idb-keyval` — ce qui aurait masqué le défaut de clonage, comme le
faisait déjà `src/routes/page.test.ts`. Nécessitent `// @vitest-environment jsdom` : en
environnement `node` (par défaut pour `domain`/`data`), Svelte compile `$state` en no-op SSR
(aucun Proxy créé), ce qui aurait laissé passer le bug silencieusement — point de vigilance à
garder pour tout futur test de store persistant vers IndexedDB.

**Test manuel** : `npm run dev` → créer une habitude quotidienne (ou une tâche datée du jour) →
revenir sur `/` → l'élément apparaît immédiatement dans la section correspondante, sans erreur
`DataCloneError` en console ; rechargement complet (F5) confirme la persistance réelle en
IndexedDB.

**Quality gate** : `npm run check` (svelte-check, 0 erreur/avertissement), `npm test` (133/133
tests passés, dont les 6 nouveaux tests de régression), `npm run build` (succès). Pas de script
de lint configuré dans le projet (aucun fichier ESLint) — étape non applicable.
