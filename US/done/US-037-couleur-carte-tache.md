---
type: user-story
id: US-037
titre: Couleur choisie par tâche ponctuelle
date: 2026-08-14
auteur: product-owner
statut: livrée
priorite: Should
estimation: S
source: chat
depend_de: ["US-002", "US-036"]
---

## Titre : US-037 — Couleur choisie par tâche ponctuelle

### Récit
> **En tant qu'** utilisateur de l'app,
> **je veux** choisir, tâche par tâche, la couleur de sa carte parmi la même palette pastel que mes habitudes,
> **afin de** repérer mes tâches d'un coup d'œil dans le planning et de les regrouper visuellement selon mes propres repères.

### Critères d'acceptation

**Scénario 1 — Même palette fermée que les habitudes**
> **Étant donné** je suis sur l'écran de création d'une tâche
> **Quand** j'arrive sur le champ de couleur
> **Alors** les teintes proposées sont **exactement** celles de la palette introduite par US-036, dans le même ordre et avec les mêmes libellés
> **Et** aucun sélecteur de couleur libre ni saisie de code hexadécimal n'est proposé

**Scénario 2 — Création avec une couleur choisie**
> **Étant donné** je crée une tâche « Payer facture EDF » au 20/08/2026
> **Quand** je sélectionne la teinte « Ciel » et je valide
> **Alors** la tâche est enregistrée avec cette couleur
> **Et** sa carte s'affiche dans cette teinte à l'identique sur l'écran « Tâches » **et** dans le planning du jour

**Scénario 3 — Couleur non choisie : couleur par défaut, aucune régression visuelle**
> **Étant donné** je crée une tâche sans toucher au choix de couleur
> **Quand** je valide
> **Alors** la tâche est créée avec la couleur par défaut
> **Et** sa carte s'affiche **exactement** comme avant cette évolution

**Scénario 4 — Tâches déjà enregistrées avant cette évolution**
> **Étant donné** des tâches ont été créées avant cette évolution et ne portent donc aucune couleur
> **Quand** j'ouvre l'application après la mise à jour
> **Alors** elles s'affichent toutes avec la couleur par défaut, sans erreur
> **Et** aucune de leurs données existantes (nom, date, heure limite, statut, complétion) n'est perdue ni modifiée
> **Et** aucune migration ni ressaisie ne m'est demandée

**Scénario 5 — Changement et retrait de la couleur en édition**
> **Étant donné** une tâche est en « Ciel »
> **Quand** je l'édite et sélectionne « Sable », puis j'enregistre
> **Alors** sa carte passe en « Sable » sur tous les écrans où elle apparaît
> **Et quand** je l'édite à nouveau pour resélectionner la teinte par défaut
> **Alors** sa carte revient au rendu par défaut, identique à celui d'une tâche n'ayant jamais eu de couleur

**Scénario 6 — Ajout rapide depuis le planning**
> **Étant donné** j'utilise l'ajout rapide « Nouvelle tâche » depuis le planning (US-026), qui réutilise le formulaire complet de création
> **Quand** le formulaire s'ouvre
> **Alors** le même choix de couleur y est disponible, avec la même valeur par défaut
> **Et** la date reste pré-remplie avec le jour affiché (US-026 scénario 3 non régressé)

**Scénario 7 — La couleur survit aux autres actions sur la tâche**
> **Étant donné** une tâche colorée
> **Quand** je la coche comme faite, la décoche, ou la reprogramme à une autre date (US-003)
> **Alors** sa couleur reste inchangée
> **Et** elle conserve cette couleur dans le planning de sa nouvelle date

**Scénario 8 — Cohabitation avec le badge de statut**
> **Étant donné** une tâche colorée affiche son badge de statut (« Faite » en vert, « À faire » en neutre, « En retard » en rouge)
> **Quand** sa carte est affichée dans n'importe quelle teinte de la palette
> **Alors** le badge reste parfaitement lisible et garde sa sémantique, sans se fondre dans la teinte de la carte
> **Et** une tâche de teinte verte (« Menthe ») ne peut jamais être confondue avec une tâche « Faite », ni une tâche de teinte rosée avec une tâche « En retard »
> **Et** le texte barré d'une tâche faite reste visible sur toutes les teintes

**Scénario 9 — La distinction habitude / tâche reste garantie**
> **Étant donné** le planning affiche, le même jour, une habitude et une tâche ayant **la même couleur** choisie
> **Quand** je consulte l'écran
> **Alors** je distingue toujours immédiatement laquelle est une habitude et laquelle est une tâche (sections séparées « 🔁 Habitudes » / « ✅ Tâches » et icônes propres à chaque type — US-002 scénario 2 et US-004 scénario 8 non régressés)
> **Et** la couleur de carte n'est jamais le porteur de cette distinction

**Scénario 10 — Mode clair et mode sombre**
> **Étant donné** j'ai des tâches de plusieurs teintes différentes
> **Quand** mon téléphone est en mode clair, puis en mode sombre (US-029)
> **Alors** chaque teinte utilise sa déclinaison adaptée au thème en cours
> **Et** le nom de la tâche, sa date, son heure limite et son badge de statut restent lisibles dans les deux thèmes (contraste texte/fond d'au moins 4,5:1)

**Scénario 11 — La couleur ne porte jamais seule une information**
> **Étant donné** j'utilise un lecteur d'écran, ou je consulte l'app en niveaux de gris
> **Quand** je parcours une carte de tâche colorée
> **Alors** toutes ses informations (nom, date, heure limite, état fait/à faire/en retard, actions « Reprogrammer » / « Modifier ») restent restituées et compréhensibles sans percevoir la couleur
> **Et** la couleur de carte ne signifie jamais un statut, une échéance ou une priorité : c'est un repère personnel choisi par moi

**Scénario 12 — Le résumé n'est pas coloré par les couleurs de carte**
> **Étant donné** mes tâches portent des couleurs personnalisées
> **Quand** j'ouvre l'écran « Résumé »
> **Alors** son rendu est strictement inchangé, y compris la ligne « Tâches » et son traitement à trois états (US-035 scénario 12)

**Scénario 13 — Aucune couleur dans les notifications**
> **Étant donné** une tâche colorée a une heure limite et déclenche un rappel push nominatif (US-022)
> **Quand** la notification arrive
> **Alors** son contenu est strictement inchangé : aucune mention de couleur, aucune donnée supplémentaire transmise au serveur

### Priorité
Should — même valeur d'usage qu'US-036, sur le second type d'élément ; livrable juste après elle.

### Estimation
S — la palette, ses déclinaisons claire/sombre et les règles de contraste étant déjà posées par US-036, il ne reste qu'un champ optionnel sur la tâche, le contrôle de sélection dans le formulaire partagé (US-002/US-026) et l'application de la teinte au composant de carte unique `TaskItem` (partagé par `/taches` et le planning).

### Dépendances
- **US-036** : palette fermée, déclinaisons claire/sombre, couleur par défaut, règles de contraste et d'accessibilité — **réutilisées telles quelles**, aucune teinte propre aux tâches, aucune règle redéfinie ici.
- **US-002** : formulaire de création/édition de tâche, à étendre d'un champ.
- **US-003** : reprogrammation — la couleur doit y survivre (scénario 7).
- **Contrainte non négociable** : champ **optionnel** en persistance, `undefined` = couleur par défaut, **aucune migration** de l'IndexedDB existante — même principe que `Task.status` (US-014) et `Task.dueTime` (US-021).

### Notes / hors périmètre
- Cette US **ne crée aucune teinte** : si le besoin d'une teinte supplémentaire apparaît, c'est la palette d'US-036 qui évolue, pour les deux types d'éléments à la fois.
- **Décision PO** : la couleur d'une tâche est **indépendante** de celle de ses éventuelles habitudes ; aucun héritage, aucune propagation, aucune couleur « par type ».
- Hors périmètre : tri ou filtre par couleur, regroupement automatique par couleur, couleur dans le résumé, couleur dans les notifications.
- Interaction connue avec **US-039** (tâche urgente) : l'urgence **n'impose ni n'écrase** la couleur choisie ici — arbitrage tranché et détaillé dans US-039. Les deux US sont livrables dans n'importe quel ordre.

---

## Résumé d'implémentation (2026-08-14)

**Tous les critères d'acceptation sont satisfaits.** Quality gate vert (`npm run check` 0 erreur,
567 tests Vitest, `npm run build` OK).

Aucune teinte n'a été créée : la palette, les déclinaisons claire/sombre, la teinte par défaut et
les règles de contraste d'US-036 sont réutilisées **telles quelles**, via le même composant
`CardColorPicker` et les mêmes variables `--card-tint`/`--card-accent`. Un test vérifie
explicitement que le sélecteur de tâche propose la même liste, dans le même ordre, que celui des
habitudes (scénario 1).

### Fichiers modifiés
- `src/lib/domain/types.ts` — `Task.color?: CardColor` (optionnel, aucune migration).
- `src/lib/domain/tasks.ts` — `TaskDraft.color`, `taskColorToDraft`, `draftToTaskColor`.
- `src/lib/components/TaskForm.svelte` — champ couleur ; le formulaire reprend désormais la tâche
  existante par étalement (`...task`) au lieu de repartir d'un objet neuf, pour ne perdre aucun
  champ géré ailleurs (scénario 7).
- `src/lib/components/TaskItem.svelte` — fond + liseré teintés ; badge de statut, texte barré et
  icône ✅ de type strictement inchangés (scénarios 8/9).
- Tests : `tasks.test.ts`, `TaskForm.test.ts`, `TaskItem.test.ts`, `tasks.store.svelte.test.ts`
  (rétro-compatibilité IndexedDB + survie de la couleur à une reprogrammation),
  `reminders.test.ts` (scénario 13 : le contenu du push et les données transmises au
  micro-scheduler sont bit à bit identiques avec ou sans couleur).

### Comment tester manuellement
1. `/taches` → « + Nouvelle tâche » : le même bloc « Couleur de la carte » qu'une habitude.
2. Créer une tâche « Ciel » → même rendu sur `/taches` et dans le planning du jour.
3. La cocher / la décocher / la reprogrammer (US-003) : la teinte ne bouge pas et suit la tâche
   vers sa nouvelle date.
4. Placer une habitude et une tâche de **même teinte** le même jour : les sections « 🔁 Habitudes »
   et « ✅ Tâches » et les icônes doivent continuer à les distinguer (scénario 9).

### Reste ouvert
- Validation **visuelle sur iPhone** : lisibilité du badge de statut posé sur une carte teintée
  (notamment « À faire », dont le fond est `--bg`, sur les teintes les plus claires) — garanti par
  le calcul de contraste mais à confirmer à l'œil.
