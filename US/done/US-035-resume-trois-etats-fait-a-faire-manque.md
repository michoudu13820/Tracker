---
type: user-story
id: US-035
titre: Trois états visuels distincts dans le résumé (fait / à faire / manqué)
date: 2026-08-14
auteur: product-owner
statut: livrée
priorite: Should
estimation: M
source: chat
depend_de: ["US-005", "US-019", "US-029", "US-034"]
---

## Titre : US-035 — Trois états visuels distincts dans le résumé (fait / à faire / manqué)

### Récit
> **En tant qu'** utilisateur de l'app,
> **je veux** distinguer d'un coup d'œil, dans le résumé, ce que j'ai fait, ce qu'il me reste à faire et ce que j'ai manqué,
> **afin de** lire ma régularité sans effort et savoir immédiatement où agir, alors que le point « · » actuel ne me dit rien de lisible.

### Critères d'acceptation

**Scénario 1 — Habitude faite**
> **Étant donné** une habitude était prévue un jour donné et je l'ai faite ce jour-là
> **Quand** j'affiche le résumé sur une période contenant ce jour
> **Alors** la cellule affiche le symbole « fait » ✅
> **Et** ce symbole est identique quel que soit le jour concerné (passé, aujourd'hui ou à venir)

**Scénario 2 — À faire : jour à venir**
> **Étant donné** une habitude est prévue un jour postérieur à aujourd'hui et n'est évidemment pas encore faite
> **Quand** j'affiche le résumé sur une période contenant ce jour
> **Alors** la cellule affiche le symbole « à faire » ⬜
> **Et** elle n'affiche jamais le symbole « manqué »

**Scénario 3 — À faire : aujourd'hui**
> **Étant donné** une habitude est prévue aujourd'hui et n'est pas encore cochée
> **Quand** j'affiche le résumé
> **Alors** la cellule d'aujourd'hui affiche le symbole « à faire » ⬜
> **Et** elle continue d'afficher ⬜ tout au long de la journée, y compris en soirée : la journée n'est considérée comme écoulée qu'à partir du lendemain

**Scénario 4 — Manqué : jour passé non fait**
> **Étant donné** une habitude était prévue un jour antérieur à aujourd'hui et n'a pas été cochée ce jour-là
> **Quand** j'affiche le résumé sur une période contenant ce jour
> **Alors** la cellule affiche le symbole « manqué » ❌

**Scénario 5 — Non prévu**
> **Étant donné** une habitude n'était pas prévue un jour donné selon sa fréquence
> **Quand** j'affiche le résumé
> **Alors** la cellule reste neutre et vide, sans aucun des trois symboles
> **Et** elle reste visuellement distincte des trois autres états, comme aujourd'hui (comportement actuel conservé)

**Scénario 6 — Bascule d'état au cochage**
> **Étant donné** une habitude prévue aujourd'hui affiche ⬜ dans le résumé
> **Quand** je la coche depuis le planning puis je reviens au résumé
> **Alors** la cellule d'aujourd'hui affiche ✅
> **Et** si je la décoche, elle réaffiche ⬜ (et non ❌, puisque la journée n'est pas écoulée)

**Scénario 7 — Jamais de « manqué » avant la création de l'habitude**
> **Étant donné** je crée aujourd'hui (jeudi) une habitude prévue les lundis et mercredis
> **Quand** j'affiche le résumé de la semaine en cours
> **Alors** le lundi et le mercredi qui précèdent sa création n'affichent pas ❌
> **Et** ils affichent une cellule neutre, l'habitude n'existant pas encore ces jours-là
> **Et** la même règle s'applique en vue mois

**Scénario 8 — Jamais de « manqué » pour une habitude en pause ou supprimée**
> **Étant donné** une habitude est actuellement en pause (US-015) ou supprimée (US-013)
> **Quand** j'affiche le résumé sur une période où elle était prévue mais non cochée
> **Alors** aucune cellule n'affiche ❌ pour cette habitude
> **Et** ses complétions réellement enregistrées continuent d'afficher ✅ (historique préservé, conformément à US-019 scénario 4)
> **Et** ses cellules non faites s'affichent dans un état neutre, non accusateur

**Scénario 9 — Habitude à cible chiffrée**
> **Étant donné** une habitude a une cible chiffrée (US-017/US-018)
> **Quand** j'affiche le résumé en vue semaine ou mois
> **Alors** elle utilise exactement les mêmes trois états ✅ / ⬜ / ❌ que les habitudes « case à cocher », dérivés du même statut binaire « cible atteinte ou non » déjà défini par US-019
> **Et** aucune quantité ni pourcentage n'est affiché dans la cellule (US-019 inchangée)

**Scénario 10 — Même langage visuel en vue mois**
> **Étant donné** je bascule le résumé sur la période « mois »
> **Quand** le tableau s'affiche
> **Alors** les cellules utilisent exactement les mêmes trois symboles ✅ / ⬜ / ❌ et la même cellule neutre que la vue semaine
> **Et** le défilement horizontal de la vue mois reste conservé (US-034 ne s'applique pas au mois)

**Scénario 11 — Vue année inchangée**
> **Étant donné** je bascule le résumé sur la période « année »
> **Quand** le tableau s'affiche
> **Alors** les cellules continuent d'afficher un pourcentage de complétion coloré selon les seuils configurés (US-005/US-006), sans symbole ✅ / ⬜ / ❌
> **Et** le comportement de cette vue est strictement inchangé

**Scénario 12 — Ligne « Tâches »**
> **Étant donné** la ligne « Tâches » affiche un pourcentage de tâches validées par jour
> **Quand** j'affiche le résumé en vue semaine ou mois
> **Alors** cette ligne continue d'afficher un pourcentage (et « — » les jours sans aucune tâche), et non un symbole ✅ / ⬜ / ❌ : un pourcentage porte plus d'information qu'un état binaire
> **Et** la cellule adopte néanmoins le même code de lecture à trois états en traitement visuel (fond ou teinte) : 100 % → traité comme « fait », jour non écoulé et inférieur à 100 % → traité comme « à faire », jour passé et inférieur à 100 % → traité comme « manqué », aucune tâche → neutre
> **Et** le pourcentage lui-même reste lisible dans tous les cas

**Scénario 13 — Accessibilité : l'emoji n'est jamais la seule information**
> **Étant donné** j'utilise un lecteur d'écran
> **Quand** je parcours une cellule du résumé
> **Alors** un libellé textuel explicite en français m'est restitué, du type « Yoga — lundi 11 août — fait / à faire / manqué / non prévu »
> **Et** le symbole graphique lui-même n'est pas restitué comme seule information (pas de lecture d'un nom d'emoji brut du type « coche blanche »)
> **Et** les trois états ne se distinguent pas uniquement par la couleur (forme du symbole et libellé textuel distincts également)

**Scénario 14 — Légende des symboles**
> **Étant donné** j'affiche le résumé en vue semaine ou mois pour la première fois
> **Quand** je regarde le tableau
> **Alors** une légende compacte m'indique la signification des trois symboles (fait / à faire / manqué)
> **Et** cette légende est elle-même accessible à un lecteur d'écran

**Scénario 15 — Mode sombre**
> **Étant donné** mon iPhone est en mode sombre (US-029)
> **Quand** j'affiche le résumé en vue semaine ou mois
> **Alors** les trois états restent immédiatement distinguables les uns des autres et du fond, avec un contraste suffisant
> **Et** si le symbole seul devient peu lisible sur fond sombre, la cellule porte un traitement complémentaire (fond, contour) garantissant la distinction
> **Et** le rendu est vérifié en mode clair comme en mode sombre

**Scénario 16 — Pas de retour du défilement horizontal en vue semaine**
> **Étant donné** les nouveaux symboles sont plus larges que le point « · » qu'ils remplacent
> **Quand** j'affiche le résumé de la semaine sur iPhone
> **Alors** les 7 colonnes tiennent toujours entièrement à l'écran, sans défilement horizontal (contrainte posée par US-034)

**Scénario 17 — Navigation vers une semaine passée ou future**
> **Étant donné** je navigue vers une semaine entièrement passée, puis vers une semaine entièrement future
> **Quand** j'affiche le résumé
> **Alors** dans la semaine passée, les jours prévus non faits affichent ❌ et les jours faits affichent ✅
> **Et** dans la semaine future, tous les jours prévus affichent ⬜ et aucun n'affiche ❌

**Scénario 18 — Cartes d'habitude inchangées**
> **Étant donné** l'écran « Habitudes » affiche l'indicateur de régularité en pastilles (US-024) et le signal « manquée hier » (US-025)
> **Quand** je le consulte après cette évolution
> **Alors** son rendu est strictement inchangé : aucun symbole ❌ n'y est introduit
> **Et** l'arbitrage de lecture apaisée reste en vigueur en dehors du résumé

### Priorité
Should — corrige un défaut de lisibilité explicitement remonté par l'utilisateur sur une vue qu'il consulte régulièrement ; sans impact sur le fonctionnement de l'app.

### Estimation
M — nouveau statut de cellule à quatre valeurs dérivé de l'existant (dont un nouvel axe « jour écoulé ou non » et deux garde-fous : date de création, statut de l'habitude), nouveau rendu et libellés accessibles, adaptation de la ligne « Tâches », légende, vérification en mode clair et sombre.

### Dépendances
- **US-005** : tableau du résumé et statut de cellule existant (fait / non fait / non prévu), à étendre.
- **US-019** : dérivation binaire du statut pour les habitudes à cible chiffrée, réutilisée telle quelle.
- **US-029** : palette sombre, dans laquelle les trois états doivent rester distinguables.
- **US-034** : contrainte de largeur en vue semaine, que les nouveaux symboles ne doivent pas faire sauter.
- **US-013 / US-015** : statuts « supprimée » / « en pause », qui neutralisent l'état « manqué » (scénario 8).

### Notes / hors périmètre
- **Révision assumée d'une décision produit antérieure** : l'arbitrage du 2026-08-12 « lecture neutre et apaisée de la régularité » (US-024/US-025) est **explicitement révisé pour le résumé** par la présente US. L'utilisateur a choisi en connaissance de cause de rendre le manqué visible et distinct. Cette décision est tracée ici et ne doit pas être rouverte. Elle reste **circonscrite au résumé** : les cartes d'habitude (US-024) et le signal « manquée hier » (US-025) conservent leur ton apaisé (scénario 18), et l'interdiction totale de toute mécanique de streak reste entière et non négociable.
- **Périmètre du nouveau langage tranché (décision PO)** : les trois symboles s'appliquent aux vues **semaine ET mois**, pour un langage visuel unique et cohérent partout où les colonnes sont des jours. La vue **année** reste sur son pourcentage coloré, sa granularité (agrégation mensuelle) n'étant pas un état binaire.
- **Ligne « Tâches » tranchée (décision PO)** : pourcentage conservé comme valeur affichée, avec le même code de lecture à trois états en traitement de cellule (scénario 12). Aucun emoji dans cette ligne, pour ne pas concurrencer visuellement les lignes d'habitudes.
- Les symboles exacts (✅ / ⬜ / ❌) sont ceux demandés par l'utilisateur. Si le rendu réel sur iPhone s'avère problématique (taille, alignement, lisibilité en mode sombre), un équivalent graphique portant les mêmes trois états et les mêmes libellés accessibles est acceptable — la contrainte non négociable est la distinction immédiate des trois états, pas le glyphe.
- Hors périmètre : toute action depuis le résumé (cocher une habitude directement dans une cellule), tout historique des périodes de pause, toute notification liée au manqué.
- **Point connexe signalé, hors périmètre** : le pourcentage de la vue année (US-005) compte aujourd'hui comme « prévus » des jours antérieurs à la création de l'habitude, ce qui peut minorer le taux du premier mois. Le scénario 7 corrige ce biais pour les cellules journalières uniquement ; l'aligner sur la vue année mériterait une correction dédiée.

---

## Résumé d'implémentation (2026-08-14)

**Tous les critères d'acceptation (scénarios 1 à 18) sont satisfaits.** Quality gate vert
(`npm run check` 0 erreur, `vitest run` 505 tests, `npm run build` OK, aucun avertissement).

### Fichiers modifiés
| Fichier | Nature |
|---|---|
| `src/lib/domain/summary.ts` | Nouveau type `HabitCellState` (4 valeurs), `CELL_STATE_LABELS`, fonctions pures `habitCellState()` et `taskDayState()` |
| `src/routes/resume/WeekMonthTable.svelte` | Symboles ✅ / ⬜ / ❌ + cellule neutre, libellés accessibles, teintes de fond par état, ligne « Tâches » à trois états, légende |
| `src/routes/resume/page.test.ts` | Adaptation du test d'intégration US-019 au nouveau libellé accessible |
| `src/lib/domain/summary.test.ts` | 14 tests unitaires (scénarios 1–9, 12, 17 + cas « jours du mois ») |
| `src/routes/resume/WeekMonthTable.test.ts` | 6 tests de rendu (symboles, cellule vide, accessibilité, légende, ligne Tâches, vue mois) |

### Décisions d'implémentation
- **Dérivation, pas duplication** : `habitCellState()` est construite **au-dessus** de
  `habitCellStatus()` (US-005), qui reste la source de vérité du binaire fait/non fait — et donc
  du statut binaire déjà dérivé pour les cibles chiffrées (US-019 scénario 9, inchangé). US-035
  n'ajoute que la **qualification du « non fait »** : deux garde-fous puis l'axe temporel.
- **Ordre des règles significatif** : complétion réelle > garde-fou statut (pause/suppression) >
  garde-fou antériorité (`createdAt`) > axe « journée écoulée ». Une habitude en pause ou
  supprimée affiche donc ses ✅ historiques et **rien d'autre** (cellule neutre), plutôt qu'un ⬜
  qui serait une injonction sans objet — lecture retenue de « état neutre, non accusateur »
  (scénario 8).
- **`today` injecté** (prop du composant, figé au montage de `/resume`) plutôt que lu depuis
  `new Date()` dans le domaine : `habitCellState` reste pure et testable de façon déterministe,
  conformément aux conventions du projet.
- **Trois canaux de distinction cumulés** (scénario 13) : forme du symbole, teinte de fond,
  libellé textuel français — jamais la couleur seule. Les symboles sont `aria-hidden`, chaque
  cellule porte un `aria-label` du type « Yoga — lundi 10 août — manqué ».
- **Mode sombre** (scénario 15) : les teintes réutilisent `--success-bg` / `--danger-bg` /
  `--surface` de la palette centralisée (US-009), qui possèdent déjà leur déclinaison sombre
  (US-029) — aucune variable nouvelle, aucun contraste à recalculer.
- **Ligne « Tâches » (scénario 12) : option principale du PO retenue**, pas le repli. Le
  pourcentage reste la valeur affichée (et « — » les jours sans tâche) et la cellule adopte la
  même teinte à trois états. Motif : les lignes d'habitudes portent déjà ces mêmes teintes, donc
  laisser la ligne « Tâches » sans traitement en aurait fait une exception visuelle *plus*
  bruyante que la cohérence demandée ; et la teinte est portée par le fond pastel, jamais par un
  emoji, donc elle ne concurrence pas les lignes d'habitudes. Le libellé accessible de cette
  ligne restitue explicitement le pourcentage (« Tâches — lundi 10 août — 50 % — manqué »),
  l'`aria-label` de la cellule masquant sinon son texte visible.
- **Pas de retour du défilement horizontal** (scénario 16) : garanti structurellement par
  `table-layout: fixed` (US-034) — les symboles, plus larges que le point « · », ne peuvent pas
  élargir le tableau.
- **Hors résumé, rien ne change** (scénario 18) : `HabitCard.svelte` (US-024/US-025) et
  `YearTable.svelte` (scénario 11) ne sont pas touchés.

### Test manuel
1. `/resume`, semaine en cours : les jours passés non faits affichent ❌, aujourd'hui ⬜ (même
   en soirée), les jours à venir ⬜, les jours faits ✅.
2. Cocher une habitude du jour depuis `/` puis revenir : la cellule passe de ⬜ à ✅ ; la
   décocher la ramène à ⬜, jamais à ❌.
3. Créer une habitude aujourd'hui avec une fréquence hebdomadaire : les jours prévus antérieurs
   à sa création restent neutres.
4. Mettre une habitude en pause : plus aucun ❌ sur ses cellules, ses ✅ restent.
5. Basculer en mode sombre : les trois états restent distinguables.
6. Vérifier que la vue année et les cartes d'habitude sont inchangées.
