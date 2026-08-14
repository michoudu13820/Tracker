---
type: user-story
id: US-039
titre: Marquer une tâche comme urgente et la faire remonter en tête du jour
date: 2026-08-14
auteur: product-owner
statut: livrée
priorite: Should
estimation: M
source: chat
depend_de: ["US-002", "US-038"]
---

## Titre : US-039 — Marquer une tâche comme urgente et la faire remonter en tête du jour

### Récit
> **En tant qu'** utilisateur de l'app,
> **je veux** marquer moi-même certaines tâches comme urgentes, les voir remonter en tête de la liste du jour et les repérer d'un coup d'œil,
> **afin de** savoir par quoi commencer ma journée sans relire toute la liste.

### Critères d'acceptation

**Scénario 1 — Marquer une tâche urgente à la création**
> **Étant donné** je suis sur l'écran de création d'une tâche
> **Quand** je saisis un nom, une date, que j'active le marquage « Urgente » et que je valide
> **Alors** la tâche est enregistrée comme urgente
> **Et** elle apparaît comme urgente dans le planning et sur l'écran « Tâches »

**Scénario 2 — Marquage optionnel : rien ne change si je ne l'active pas**
> **Étant donné** je crée une tâche sans activer « Urgente »
> **Quand** je valide
> **Alors** la tâche est créée non urgente
> **Et** son affichage et sa position sont strictement ceux d'avant cette évolution (US-002/US-021/US-038 non régressées)

**Scénario 3 — Tâches déjà enregistrées avant cette évolution**
> **Étant donné** des tâches existent déjà et ne portent aucune information d'urgence
> **Quand** j'ouvre l'application après la mise à jour
> **Alors** elles sont toutes considérées comme non urgentes, sans erreur ni écran vide
> **Et** aucune de leurs données (nom, date, heure limite, couleur, statut, complétion) n'est perdue ni modifiée
> **Et** aucune migration ni ressaisie ne m'est demandée

**Scénario 4 — Ajouter et retirer l'urgence en édition**
> **Étant donné** une tâche existante non urgente
> **Quand** je l'édite, active « Urgente » et enregistre
> **Alors** elle devient urgente et remonte immédiatement dans la liste du jour, sans recharger l'application
> **Et quand** je l'édite à nouveau pour désactiver « Urgente »
> **Alors** elle redevient une tâche ordinaire, reprend sa place dans l'ordre d'US-038 et perd son signal d'urgence

**Scénario 5 — Ordre complet des tâches d'un même jour**
> **Étant donné** le planning d'un jour contient : A (urgente, sans heure limite), B (urgente, 15:00), C (urgente, 08:00), D (non urgente, sans heure limite), E (non urgente, 09:00), F (non urgente, 17:00)
> **Quand** j'affiche ce jour
> **Alors** l'ordre affiché est exactement : **A, C, B, E, F, D**
> **Et** ce qui est vérifié par cet ordre est : (1) toutes les urgentes avant toutes les non urgentes ; (2) au sein des urgentes, **celles sans heure limite d'abord**, puis les autres par heure croissante ; (3) au sein des non urgentes, les tâches à heure limite par heure croissante, puis **celles sans heure limite à la fin**

**Scénario 6 — Égalités et stabilité de l'ordre**
> **Étant donné** deux tâches urgentes ont la même heure limite (ou n'en ont toutes deux pas)
> **Quand** j'affiche le jour, change de jour et reviens, puis ferme et rouvre l'application
> **Alors** leur ordre relatif est toujours le même, et correspond à leur ordre de création — même règle de départage qu'US-038

**Scénario 7 — Signal visuel sur la carte, jamais porté par le seul emoji**
> **Étant donné** une tâche urgente s'affiche dans le planning ou sur l'écran « Tâches »
> **Quand** je consulte sa carte
> **Alors** elle porte le signal ‼️ **et** un libellé textuel « Urgente » lisible à l'écran
> **Et** un lecteur d'écran m'annonce l'urgence sous forme de mot (« Urgente »), jamais sous forme de nom d'emoji brut
> **Et** en niveaux de gris, l'urgence reste identifiable sans percevoir aucune couleur

**Scénario 8 — Cohabitation avec l'icône de type et le badge de statut**
> **Étant donné** une tâche urgente est également « En retard » (jour passé consulté)
> **Quand** j'affiche sa carte
> **Alors** l'icône ✅ qui identifie la carte comme une **tâche** (et non une habitude) est conservée : le signal ‼️ ne la remplace pas
> **Et** le badge de statut (« Faite » / « À faire » / « En retard ») reste affiché et lisible **en plus** du signal d'urgence
> **Et** le signal d'urgence n'utilise pas la teinte rouge déjà porteuse du statut « En retard », pour ne pas créer d'ambiguïté entre « urgente » et « en retard »
> **Et** la mise en page de la carte ne se casse pas quand nom long, heure limite, badge de statut et signal d'urgence sont présents en même temps (US-010 scénario « nom long » non régressé)

**Scénario 9 — Une tâche urgente cochée ne bouge pas et reste marquée**
> **Étant donné** une tâche urgente en tête de liste
> **Quand** je la coche comme faite
> **Alors** elle reste **exactement à la même position** (règle d'US-038 scénario 5, inchangée)
> **Et** elle conserve son signal d'urgence, avec l'affichage « faite » habituel (case cochée, texte barré, badge « Faite »)

**Scénario 10 — L'urgence n'impose ni n'écrase la couleur de la carte**
> **Étant donné** une tâche est en teinte « Menthe » (US-037) et je la marque urgente
> **Quand** j'affiche sa carte
> **Alors** elle **reste en « Menthe »** : aucune teinte n'est imposée, ni forcée, ni substituée par l'urgence
> **Et** ma couleur choisie reste modifiable normalement pendant que la tâche est urgente
> **Et** l'urgence reste portée uniquement par le signal ‼️ + « Urgente » et par la position en tête de liste

**Scénario 11 — Ajout rapide depuis le planning**
> **Étant donné** j'utilise l'ajout rapide « Nouvelle tâche » depuis le planning (US-026), qui réutilise le formulaire complet de création
> **Quand** le formulaire s'ouvre
> **Alors** le marquage « Urgente » y est disponible, désactivé par défaut
> **Et** si je l'active, la tâche créée apparaît immédiatement en tête de la liste du jour affiché, sans navigation supplémentaire

**Scénario 12 — Aucune notification supplémentaire, aucune escalade**
> **Étant donné** une tâche urgente **avec** une heure limite et les rappels activés
> **Quand** son heure limite survient
> **Alors** je reçois exactement le même rappel push nominatif qu'aujourd'hui (US-022), avec le même contenu, ni plus tôt, ni répété
> **Et étant donné** une tâche urgente **sans** heure limite
> **Quand** la journée s'écoule
> **Alors** elle ne déclenche **aucune** notification supplémentaire
> **Et** aucune tâche ne devient jamais urgente d'elle-même : ni à l'approche de son heure limite, ni en passant « en retard », ni au fil des jours
> **Et** aucun décompte, compte à rebours, badge chiffré d'urgences ou message d'alerte n'est introduit nulle part dans l'application

**Scénario 13 — Les habitudes ne sont pas concernées**
> **Étant donné** je crée ou j'édite une habitude
> **Quand** j'ouvre son formulaire
> **Alors** aucun marquage « Urgente » n'y est proposé
> **Et** aucune carte d'habitude n'affiche jamais le signal ‼️, ni dans le planning ni sur l'écran « Habitudes »

**Scénario 14 — Toutes les tâches urgentes**
> **Étant donné** toutes les tâches d'un jour sont marquées urgentes
> **Quand** j'affiche ce jour
> **Alors** la liste reste lisible et ordonnée selon la règle interne du groupe urgent (sans heure d'abord, puis heure croissante)
> **Et** aucun message ni avertissement ne me reproche le nombre de tâches urgentes

**Scénario 15 — Mode sombre**
> **Étant donné** mon téléphone est en mode sombre (US-029)
> **Quand** j'affiche une tâche urgente
> **Alors** son signal d'urgence (glyphe et libellé) reste lisible et distinct du badge de statut, avec un contraste suffisant

**Scénario 16 — Le résumé est inchangé**
> **Étant donné** j'ai des tâches urgentes
> **Quand** j'ouvre l'écran « Résumé »
> **Alors** son rendu et ses pourcentages sont strictement inchangés : l'urgence n'y apparaît pas et ne pondère aucun calcul

### Priorité
Should — outil de priorisation demandé explicitement, à forte valeur d'usage quotidienne, sans impact sur les données existantes ni sur l'infrastructure de rappels.

### Estimation
M — champ optionnel supplémentaire sur la tâche, contrôle dans le formulaire partagé (US-002/US-026), signal accessible sur la carte partagée `TaskItem`, et extension de la fonction de tri d'US-038 d'un critère de groupe prioritaire avec règle interne propre.

### Dépendances
- **US-002** : formulaire de création/édition de tâche, à étendre d'un marquage.
- **US-038** : règle d'ordre des tâches d'un même jour, **étendue** ici d'un critère de groupe placé avant tous les autres. À livrer après elle (sinon l'ordre complet devrait être écrit deux fois).
- **US-021 / US-022** : heure limite et rappel push nominatif — consommés en lecture, **strictement non modifiés** (scénario 12).
- **US-037** (si livrée) : couleur de carte, que l'urgence ne doit ni imposer ni écraser (scénario 10). Les deux US sont livrables dans n'importe quel ordre ; si US-037 n'est pas encore livrée, le scénario 10 se vérifie simplement par l'absence de toute teinte imposée par l'urgence.
- **Contrainte non négociable** : champ **optionnel** en persistance, `undefined` = non urgente, **aucune migration** de l'IndexedDB existante — même principe que `Task.status` (US-014) et `Task.dueTime` (US-021).

### Notes / hors périmètre
- **Arbitrages déjà tranchés avec l'utilisateur, non renégociables** : ordre « urgent d'abord, puis heure limite » ; au sein des urgentes, **celles sans heure limite en premier** ; au sein des non urgentes, **celles sans heure limite à la fin** ; urgence réservée aux **tâches ponctuelles**.
- **Asymétrie assumée du traitement des « sans heure limite »** (scénario 5) : chez les urgentes, l'absence d'heure signifie « à faire dès que possible » et justifie la tête de liste ; chez les non urgentes, elle signifie « pas de contrainte horaire » et justifie la fin de liste. Cette asymétrie est voulue par l'utilisateur et ne doit pas être « harmonisée » à l'implémentation.
- **Décision PO — le contenu des notifications est inchangé** (scénario 12). Motifs : (1) une tâche urgente sans heure limite n'a aucun instant d'envoi, il faudrait inventer un créneau, donc une pression non demandée ; (2) l'infrastructure push ne connaît que `sendAt` + libellé déjà composé (ADR-001 amendé le 2026-08-12), et ajouter un canal ou une donnée d'urgence étendrait la dérogation « données métier côté serveur » sans nécessité ; (3) l'urgence est un **outil de priorisation choisi par l'utilisateur**, pas un mécanisme d'insistance. Si le besoin d'un préfixe « ‼️ » dans le libellé du push apparaît plus tard, il fera l'objet d'une US dédiée et assumée.
- **Décision PO — l'urgence est purement manuelle et sans escalade** (scénario 12) : aucune promotion automatique, aucun décompte, aucune répétition, aucun compteur d'urgences — cohérent avec l'arbitrage de lecture apaisée du 2026-08-12 (pas de streak, pas de record) qui reste entier hors du résumé (US-035 note).
- **Décision PO — l'urgence ne teinte pas la carte** (scénario 10) : elle ne peut pas être portée par une couleur, puisque la couleur de carte appartient à l'utilisateur (US-037) et que le rouge est déjà pris par le statut « En retard ». Le signal d'urgence est donc un **badge dédié** (glyphe ‼️ + mot « Urgente »), voisin du badge de statut, dans une teinte de la palette existante distincte de `--danger-*` (l'ambre `--warning-*` est le candidat naturel, à valider visuellement).
- **Cohabitation avec « l'emoji éventuel de la tâche » — constat** : une tâche ponctuelle n'a **pas** d'emoji personnalisable (contrairement aux habitudes, US-001) ; le seul glyphe présent sur sa carte est l'icône de type ✅, qui porte la distinction habitude/tâche (US-002 scénario 2). Le scénario 8 protège cette icône. Si un emoji personnalisé de tâche était introduit plus tard, la règle à respecter serait la même : ‼️ ne remplace jamais un autre glyphe, il s'ajoute.
- Hors périmètre : niveaux d'urgence multiples (haute/moyenne/basse), urgence sur les habitudes, filtre « n'afficher que les urgentes », section dédiée aux urgentes, tri manuel par glisser-déposer, urgence dans le résumé ou dans le badge d'icône PWA (US-031).

---

## Résumé d'implémentation (2026-08-14)

**Tous les critères d'acceptation sont satisfaits.** Quality gate vert (`npm run check` 0 erreur,
632 tests Vitest, `npm run build` OK).

### Teinte du badge « Urgente » — arbitrage tranché
Le badge utilise **l'ambre `--warning-*`** (déjà présent dans la charte, déclinée clair/sombre par
US-029), volontairement **distinct de `--danger-*`** qui porte « En retard ». Justification :
- c'est le seul couple sémantique libre : vert = « Faite », rouge = « En retard », violet = habitude ;
- aucune collision sur une carte de tâche — l'ambre y sert uniquement à l'urgence, le badge
  « En pause » qui l'utilise aussi étant **propre aux habitudes** ;
- contraste texte/fond vérifié : 5,47:1 en clair, 8,09:1 en sombre (scénario 15).

Les fonds ambre et rouge sont proches en **luminance** (1,10:1), donc peu distinguables en niveaux
de gris — c'est précisément pourquoi l'information n'y repose pas : chaque badge porte son **mot**
(« Urgente » / « En retard ») et l'urgence ajoute le glyphe ‼️. Les deux badges sont d'ailleurs
affichés côte à côte, jamais l'un à la place de l'autre.

### Règle d'ordre (extension d'US-038)
`compareTasksSameDay` gagne un critère de groupe **avant tous les autres** : urgentes d'abord ;
au sein des urgentes, **sans heure limite en tête** puis heure croissante ; au sein des non
urgentes, heure croissante puis **sans heure limite à la fin**. L'asymétrie voulue par
l'utilisateur est explicitement commentée dans le code pour ne pas être « harmonisée » plus tard.
L'ordre exact du scénario 5 (**A, C, B, E, F, D**) est testé tel quel, à la fois sur la fonction
pure et sur `tasksStore.onDate()`.

### Fichiers modifiés
- `src/lib/domain/types.ts` — `Task.urgent?: boolean` (optionnel, aucune migration).
- `src/lib/domain/tasks.ts` — `isTaskUrgent`, `draftToUrgent`, `TaskDraft.urgent`, extension de
  `compareTasksSameDay`.
- `src/lib/components/TaskForm.svelte` — case à cocher « Urgente », désactivée par défaut.
- `src/lib/components/TaskItem.svelte` — badge `‼️ Urgente` (glyphe `aria-hidden`, le mot porte
  l'information), regroupé avec le badge de statut dans un conteneur qui passe à la ligne si la
  carte est étroite ; l'icône ✅ de type et le badge de statut sont conservés.
- Tests : `tasks.test.ts` (12 cas : ordre complet, asymétrie des deux groupes, égalités,
  stabilité, jour 100 % urgent, non-régression d'US-038), `tasks.store.svelte.test.ts`
  (rétro-compatibilité, remontée/retrait immédiats, aucune promotion automatique),
  `TaskForm.test.ts`, `TaskItem.test.ts` (accessibilité, cohabitation retard/urgence, couleur non
  écrasée, absence de décompte), `HabitForm.test.ts` / `HabitCard.test.ts` /
  `HabitCheckItem.test.ts` (scénario 13 : jamais d'urgence côté habitudes), `reminders.test.ts`
  (scénario 12 : push bit à bit identique, aucune donnée d'urgence transmise, aucun rappel inventé
  pour une urgente sans heure limite), `summary.test.ts` (scénario 16 : pourcentages et états de
  cellule strictement inchangés), `routes/page.test.ts` (ajout rapide urgent en tête, cochage sans
  déplacement).

### Comment tester manuellement
1. `/taches` → « + Nouvelle tâche », cocher « Urgente » → la carte porte `‼️ Urgente` **en plus**
   de son badge de statut et de son icône ✅.
2. Créer, le même jour : A (urgente, sans heure), B (urgente 15:00), C (urgente 08:00),
   D (sans heure), E (09:00), F (17:00) → le planning doit afficher **A, C, B, E, F, D**.
3. Cocher A → elle ne bouge pas et garde son signal.
4. Éditer une tâche ordinaire pour l'activer/désactiver → elle remonte / reprend sa place
   immédiatement, sans recharger.
5. Marquer urgente une tâche « Menthe » → elle reste « Menthe ».
6. Formulaire d'habitude : aucun marquage « Urgente ».

### Reste ouvert
- Validation **visuelle sur iPhone** : lisibilité de l'ambre à côté du rouge sur une carte étroite,
  et rendu du glyphe ‼️ (emoji système, taille variable selon la police choisie en US-016/US-020).
- Comportement en **niveaux de gris réels** (Réglages iOS → Accessibilité → Filtres de couleur) :
  garanti par construction (mots + glyphe), mais à confirmer une fois.
