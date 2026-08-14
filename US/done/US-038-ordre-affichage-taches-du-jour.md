---
type: user-story
id: US-038
titre: Ordre d'affichage des tâches d'un même jour par heure limite
date: 2026-08-14
auteur: product-owner
statut: livrée
priorite: Should
estimation: S
source: chat
depend_de: ["US-004", "US-021"]
---

## Titre : US-038 — Ordre d'affichage des tâches d'un même jour par heure limite

### Récit
> **En tant qu'** utilisateur de l'app,
> **je veux** que les tâches d'un même jour s'affichent dans l'ordre de leurs heures limites plutôt que dans un ordre arbitraire,
> **afin de** lire ma journée dans l'ordre où elle va se dérouler, sans avoir à reconstituer moi-même la chronologie.

### Contexte (état constaté dans le code — cette US *introduit* un ordre, elle n'en modifie pas)
Le planning affiche les tâches via `tasksStore.onDate()` → `tasksOn()`, qui est un simple filtre
sur la date : **aucun tri n'est appliqué**. L'ordre affiché est donc l'ordre d'insertion dans le
tableau persisté (une nouvelle tâche est ajoutée en fin de liste par `upsert`), c'est-à-dire un
ordre de création, jamais chronologique. L'écran `/taches` trie, lui, uniquement par `date`
(`a.date.localeCompare(b.date)`), sans second critère : deux tâches d'un même jour y sont donc,
elles aussi, dans un ordre non maîtrisé. L'heure limite existe depuis US-021 (`Task.dueTime`,
optionnelle, toujours alignée sur le quart d'heure) mais n'a jamais été exploitée pour l'affichage.

### Critères d'acceptation

**Scénario 1 — Tri chronologique des tâches à heure limite**
> **Étant donné** le planning du 20/08/2026 contient trois tâches créées dans cet ordre : « Courses » (heure limite 18:00), « Appeler le plombier » (heure limite 09:00), « Payer facture » (heure limite 14:30)
> **Quand** j'affiche ce jour
> **Alors** elles apparaissent dans l'ordre : « Appeler le plombier » (09:00), « Payer facture » (14:30), « Courses » (18:00)
> **Et** cet ordre est indépendant de leur ordre de création

**Scénario 2 — Tâches sans heure limite reléguées à la fin**
> **Étant donné** le planning d'un jour contient deux tâches sans heure limite et deux tâches avec heure limite
> **Quand** j'affiche ce jour
> **Alors** les deux tâches à heure limite apparaissent en premier, dans l'ordre chronologique
> **Et** les deux tâches sans heure limite apparaissent après elles, à la fin de la liste

**Scénario 3 — Jour ne contenant que des tâches sans heure limite**
> **Étant donné** aucune tâche du jour affiché n'a d'heure limite
> **Quand** j'affiche ce jour
> **Alors** la liste s'affiche normalement, sans erreur ni section vide
> **Et** son ordre est stable d'un affichage à l'autre (voir scénario 4)

**Scénario 4 — Ordre stable et déterministe en cas d'égalité**
> **Étant donné** deux tâches d'un même jour ont la même heure limite (ou n'ont toutes deux pas d'heure limite)
> **Quand** j'affiche ce jour, puis que je change de jour et reviens, puis que je ferme et rouvre l'application
> **Alors** leur ordre relatif est toujours le même
> **Et** il correspond à leur ordre de création (la plus anciennement créée en premier)

**Scénario 5 — La complétion ne déplace jamais une tâche**
> **Étant donné** une tâche située au milieu de la liste du jour
> **Quand** je la coche comme faite, puis la décoche
> **Alors** elle **reste exactement à la même position** dans la liste, dans les deux cas
> **Et** aucune carte ne se déplace sous mon doigt au moment où je coche
> **Et** son état « faite » reste signalé comme aujourd'hui (case cochée, texte barré, badge « Faite »)

**Scénario 6 — Le statut « en retard » ne déplace jamais une tâche**
> **Étant donné** je navigue vers un jour passé contenant des tâches non faites, donc en retard (US-003), et des tâches faites
> **Quand** j'affiche ce jour
> **Alors** l'ordre appliqué est exactement le même que pour n'importe quel autre jour (heure limite croissante, puis sans heure limite)
> **Et** les tâches en retard ne sont ni remontées ni reléguées à cause de leur statut

**Scénario 7 — Tâche en retard reprogrammée**
> **Étant donné** une tâche en retard, d'heure limite 09:00, est reprogrammée (US-003) vers un jour qui contient déjà des tâches à 08:00 et 12:00
> **Quand** j'affiche le planning de ce nouveau jour
> **Alors** elle s'y insère à sa place chronologique, entre celle de 08:00 et celle de 12:00
> **Et** elle disparaît du planning de son ancienne date
> **Et** son heure limite est inchangée par la reprogrammation

**Scénario 8 — Réordonnancement immédiat après modification d'une heure limite**
> **Étant donné** une tâche d'heure limite 18:00 est en dernière position des tâches à heure limite du jour
> **Quand** je l'édite pour lui donner l'heure limite 07:00 et que j'enregistre
> **Alors** elle remonte immédiatement en tête de la liste du jour, sans que j'aie à changer de jour ni à recharger l'application
> **Et quand** je vide son heure limite (US-021 scénario 4)
> **Alors** elle rejoint immédiatement le groupe des tâches sans heure limite, à la fin

**Scénario 9 — Cohérence de l'écran « Tâches »**
> **Étant donné** l'écran « Tâches » (`/taches`) liste toutes mes tâches triées par date
> **Quand** plusieurs tâches partagent la même date
> **Alors** elles sont ordonnées entre elles selon exactement la même règle que dans le planning (heure limite croissante, puis sans heure limite, puis ordre de création)
> **Et** le tri principal par date est inchangé

**Scénario 10 — Les habitudes ne sont pas concernées**
> **Étant donné** le planning affiche la section « 🔁 Habitudes » et la section « ✅ Tâches »
> **Quand** cet ordre est appliqué
> **Alors** seule la section des tâches est réordonnée
> **Et** l'ordre d'affichage des habitudes est strictement inchangé

### Priorité
Should — corrige un défaut de lisibilité réel (ordre d'insertion aujourd'hui) et pose la règle d'ordre que US-039 viendra étendre ; sans impact sur les données ni sur le fonctionnement.

### Estimation
S — une fonction de tri pure à ajouter dans `$lib/domain/tasks` et à brancher sur la liste du planning et sur celle de `/taches` ; aucun changement de modèle, aucune persistance, aucun impact serveur.

### Dépendances
- **US-004** : planning quotidien et liste des tâches du jour, dont l'ordre est aujourd'hui implicite.
- **US-021** : heure limite optionnelle (`Task.dueTime`), critère de tri consommé ici.
- **US-003** : reprogrammation, dont le résultat doit s'insérer correctement dans le nouvel ordre (scénario 7).
- **US-039** : extension à venir de cette règle (groupe « urgentes » placé avant tout le reste). US-038 est livrable seule ; US-039 dépend d'elle.

### Notes / hors périmètre
- **Décision PO — la complétion et le retard n'influencent pas l'ordre** (scénarios 5 et 6). Motif : faire descendre une tâche cochée déplacerait la carte sous le doigt au moment du cochage, et remonter les tâches en retard reviendrait à créer une hiérarchie d'insistance non demandée — contraire à l'arbitrage de lecture apaisée du 2026-08-12. L'état reste porté par la case, le texte barré et le badge, jamais par la position.
- **Décision PO — départage des égalités par l'ordre de création** (scénario 4), et non alphabétique : c'est l'ordre déjà implicitement observé aujourd'hui, donc le moins déroutant, et il est stable dans le temps (un renommage ne réordonne pas la liste).
- **Décision PO — sans heure limite = à la fin** pour les tâches non urgentes : une tâche sans heure limite n'a pas de contrainte horaire, elle ne doit donc pas s'intercaler entre deux échéances. (Attention : US-039 pose la règle **inverse** à l'intérieur du groupe des tâches urgentes — asymétrie voulue par l'utilisateur, expliquée là-bas.)
- Hors périmètre : tout réordonnancement manuel (glisser-déposer), tout regroupement par heure (« matin / après-midi / soir »), tout tri par couleur, toute notion de priorité — la priorisation explicite est l'objet d'**US-039**.
- Aucun impact sur les rappels push (US-022) : l'ordre d'affichage est purement local et ne change ni les instants d'envoi ni le contenu des notifications.

---

## Résumé d'implémentation (2026-08-14)

**Tous les critères d'acceptation sont satisfaits.** Quality gate vert (`npm run check` 0 erreur,
591 tests Vitest, `npm run build` OK). Aucun changement de modèle, aucune persistance, aucun
impact serveur — conformément à l'estimation.

### Règle d'ordre implémentée
`compareTasksSameDay` dans `$lib/domain/tasks` (fonction **pure**) :
1. les tâches **à heure limite** avant celles sans ;
2. entre elles, heure croissante — `dueTime` étant au format `HH:MM` zéro-paddé, la comparaison
   lexicographique **est** la comparaison chronologique (ni parsing, ni fuseau) ;
3. à égalité, `createdAt` croissant.

Deux enveloppes l'appliquent : `sortTasksForDay` (un jour) et `sortTasksByDateThenDay` (date
d'abord, puis même règle intra-jour — point (b) des questions ouvertes, traité comme spécifié).

**Arbitrage technique** : `createdAt` est un `IsoDate` (jour calendaire, sans heure), donc deux
tâches créées le même jour y sont à égalité stricte. Les deux fonctions ajoutent un départage
final sur la **position d'origine dans le tableau persisté** — qui est l'ordre de création, `upsert`
ajoutant en fin de liste. L'ordre reste donc « la plus anciennement créée en premier » et il est
totalement déterministe, sans dépendre de la stabilité de `Array.prototype.sort` (scénario 4,
vérifié après rechargement du stockage).

Ni la complétion ni le statut « en retard » n'entrent dans le comparateur : par construction, il ne
reçoit que des `Task`, jamais l'état de complétion (scénarios 5 et 6).

### Fichiers modifiés
- `src/lib/domain/tasks.ts` — `compareTasksSameDay`, `sortTasksForDay`, `sortTasksByDateThenDay`.
- `src/lib/stores/tasks.store.svelte.ts` — `onDate()` applique désormais l'ordre du jour.
- `src/routes/taches/+page.svelte` — tri par date remplacé par `sortTasksByDateThenDay`.
- Tests : `tasks.test.ts` (13 cas couvrant les scénarios 1 à 8, y compris liste vide et
  non-mutation de l'entrée), `tasks.store.svelte.test.ts` (branchement réel, réordonnancement
  immédiat, stabilité après rechargement, reprogrammation), `routes/page.test.ts` (ordre rendu à
  l'écran, cocher/décocher ne déplace rien, habitudes non réordonnées),
  `routes/taches/page.test.ts` (scénario 9).

### Comment tester manuellement
1. Créer, dans le désordre, trois tâches du même jour à 18:00, 09:00 et 14:30 → le planning les
   affiche 09:00, 14:30, 18:00.
2. Ajouter une tâche sans heure limite → elle passe en fin de liste.
3. Cocher la tâche du milieu → elle ne bouge pas.
4. Éditer la tâche de 18:00 en 07:00 → elle remonte en tête immédiatement, sans recharger ;
   vider son heure limite → elle rejoint la fin.
5. Naviguer vers un jour passé : les tâches en retard restent à leur place chronologique.
6. `/taches` : les tâches d'une même date sont ordonnées comme dans le planning.
