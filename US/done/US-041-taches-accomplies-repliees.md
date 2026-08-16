---
type: user-story
id: US-041
titre: Tâches accomplies regroupées dans une section repliée, avec horizon de 7 jours sur l'onglet Tâches
date: 2026-08-16
auteur: product-owner
statut: livrée
priorite: Should
estimation: M
source: chat
depend_de: ["US-002", "US-004", "US-014", "US-038"]
---

## Titre : US-041 — Tâches accomplies regroupées dans une section repliée, avec horizon de 7 jours sur l'onglet Tâches

### Récit
> **En tant qu'** utilisateur qui consulte son planning et sa liste de tâches plusieurs fois par jour,
> **je veux** que les tâches déjà accomplies soient regroupées à part, repliées par défaut et
> dépliables à la demande, et que l'onglet Tâches cesse d'afficher celles accomplies il y a plus
> d'une semaine,
> **afin de** garder sous les yeux ce qu'il me reste à faire plutôt qu'une liste qui s'allonge
> indéfiniment, tout en pouvant retrouver ce que j'ai fait quand j'en ai besoin.

### Critères d'acceptation

**Scénario 1 — Sur le planning, les tâches accomplies du jour sont regroupées et repliées**
> **Étant donné** le planning d'un jour affiche des tâches, dont certaines sont cochées comme faites
> **Quand** j'ouvre cet écran
> **Alors** les tâches restant à faire sont affichées directement, dans leur ordre habituel
> **Et** les tâches accomplies n'apparaissent pas dans cette liste : elles sont regroupées dans une
> section distincte « Tâches accomplies », **repliée par défaut**
> **Et** cette section indique combien de tâches elle contient, sans que j'aie besoin de la déplier

**Scénario 2 — Déplier et replier la section**
> **Étant donné** la section « Tâches accomplies » est repliée
> **Quand** j'appuie sur son contrôle de dépliage
> **Alors** toutes les tâches accomplies concernées s'affichent, avec les mêmes informations et les
> mêmes actions que d'habitude (décocher, modifier, supprimer)
> **Et quand** j'appuie à nouveau sur ce contrôle
> **Alors** la section se replie

**Scénario 3 — Cocher une tâche la fait rejoindre la section accomplies**
> **Étant donné** une tâche est affichée parmi les tâches à faire
> **Quand** je la coche comme faite
> **Alors** elle quitte la liste des tâches à faire et rejoint la section « Tâches accomplies »
> **Et** le compteur de la section est mis à jour
> **Et** l'opération inverse fonctionne : décocher une tâche accomplie la fait réapparaître parmi
> les tâches à faire, à sa place habituelle dans l'ordre

**Scénario 4 — Aucune tâche accomplie : aucune section vide**
> **Étant donné** aucune tâche accomplie n'est à afficher sur l'écran consulté
> **Quand** j'ouvre cet écran
> **Alors** la section « Tâches accomplies » n'apparaît pas du tout — ni titre, ni contrôle de
> dépliage, ni section vide

**Scénario 5 — Même regroupement sur l'onglet Tâches**
> **Étant donné** j'ouvre l'onglet Tâches, qui liste les tâches de toutes dates
> **Quand** l'écran s'affiche
> **Alors** les tâches à faire sont listées directement, dans leur ordre chronologique habituel
> **Et** les tâches accomplies sont regroupées dans une section « Tâches accomplies » repliée par
> défaut, se comportant exactement comme sur le planning (scénarios 1 à 4)

**Scénario 6 — Sur l'onglet Tâches, les tâches accomplies depuis plus de 7 jours ne sont plus affichées**
> **Étant donné** j'ai des tâches accomplies à différentes dates, certaines il y a moins de 7 jours,
> d'autres il y a plus de 7 jours
> **Quand** je déplie la section « Tâches accomplies » de l'onglet Tâches
> **Alors** seules celles accomplies au cours des 7 derniers jours y figurent
> **Et** celles accomplies il y a plus de 7 jours n'apparaissent nulle part sur cet écran, ni
> dépliées ni repliées, et ne sont pas comptées dans le compteur de la section

**Scénario 7 — Les tâches masquées sont conservées, jamais supprimées**
> **Étant donné** des tâches accomplies il y a plus de 7 jours ont cessé d'être affichées
> **Quand** j'exporte mes données, ou que je consulte le résumé, ou que je réinstalle l'application
> depuis une sauvegarde
> **Alors** ces tâches et leur accomplissement sont toujours présents, intacts
> **Et** rien n'a été effacé : le masquage est un choix d'affichage, jamais une suppression

**Scénario 8 — Le planning d'un jour passé reste consultable en entier**
> **Étant donné** je navigue sur le planning vers un jour d'il y a plus de 7 jours
> **Quand** je déplie la section « Tâches accomplies » de ce jour
> **Alors** j'y vois bien les tâches accomplies ce jour-là
> **Et** l'horizon de 7 jours ne s'applique pas ici : il ne concerne que l'onglet Tâches, qui
> agrège toutes les dates, alors que le planning montre un jour précis que j'ai explicitement choisi

**Scénario 9 — Tâche accomplie dont la date d'accomplissement est inconnue**
> **Étant donné** une tâche a été cochée à une époque où l'application n'enregistrait pas encore la
> date d'accomplissement
> **Quand** j'ouvre l'onglet Tâches
> **Alors** cette tâche est traitée comme ancienne : elle n'apparaît pas dans la section
> « Tâches accomplies » de cet écran
> **Et** elle reste conservée et intacte, comme toute tâche masquée (scénario 7)
> **Et** elle reste consultable sur le planning du jour où elle était prévue (scénario 8), qui
> n'applique aucun horizon — c'est ce qui rend ce masquage acceptable : rien ne devient
> introuvable

### Priorité
**Should** — gêne de lecture réelle et croissante (la liste des tâches ne fait que s'allonger, et
le poids visuel des tâches faites augmente avec l'usage), mais l'application reste pleinement
utilisable en l'état. À traiter après les défauts bloquants, avant les extensions fonctionnelles.

### Estimation
**M** — la mécanique de repli est simple, mais l'US touche **deux écrans** (planning et onglet
Tâches) qui partagent le même rendu de tâche, introduit une **règle de filtrage temporel** avec son
cas limite (date d'accomplissement absente), et doit préserver sans régression l'ordre d'affichage
établi par US-038/US-039 sur la liste des tâches restantes.

### Dépendances
- **US-002** (tâches ponctuelles) et **US-004** (planning quotidien) : les deux écrans concernés.
- **US-014** (suppression par glisser, soft-delete) : les tâches supprimées restent exclues de
  l'affichage indépendamment de cette US ; les deux filtrages se cumulent sans se contredire.
- **US-038 / US-039** (ordre des tâches du jour, tâches urgentes) : l'ordre de la liste des tâches
  **à faire** doit rester strictement celui déjà livré. Cette US retire des éléments de la liste,
  elle ne réordonne rien.
- **US-008** (sauvegarde / restauration, non encore livrée) : c'est le moyen le plus direct de
  vérifier le scénario 7. Tant qu'US-008 n'est pas livrée, la conservation se vérifie autrement
  (par exemple en décochant une tâche masquée, qui doit réapparaître intacte).
- Contrainte technique à connaître, sans valeur prescriptive : la date d'accomplissement d'une
  tâche existe déjà dans le modèle de données mais elle est **optionnelle** — d'où le scénario 9.

### Notes / hors périmètre
- **Hors périmètre : les habitudes.** Cette US ne concerne que les tâches ponctuelles. Le
  traitement visuel des habitudes faites (planning, résumé) reste inchangé.
- **Hors périmètre : toute suppression automatique.** Rien n'est jamais effacé. La demande est
  explicite sur ce point : masquer, conserver — « on ne sait jamais ».
- **Hors périmètre : un réglage configurable du seuil.** Les 7 jours sont une valeur fixe, non
  paramétrable dans les réglages. Si le besoin d'ajuster ce seuil apparaît à l'usage, il fera
  l'objet d'une US distincte.
- **Hors périmètre : un écran d'historique complet des tâches accomplies.** Cette US masque
  au-delà de 7 jours sur l'onglet Tâches ; elle ne crée aucun nouvel écran pour retrouver
  l'intégralité de l'historique. Le planning d'un jour donné reste le moyen de revoir ce qui a été
  fait ce jour-là (scénario 8).
### Implémentation

**Livrée le 2026-08-16.** Quality gate vert : `npm run check` → 507 fichiers, 0 erreur ;
`npm test` → **684 tests au vert** (dont 24 ajoutés par cette US) ; `npm run build` → OK.

#### Fichiers créés
| Fichier | Rôle |
|---|---|
| `src/lib/components/CompletedTasksSection.svelte` | Conteneur repliable partagé par les deux écrans. Porte deux règles : repliée à chaque montage (scénarios 1/5), et rien rendu du tout quand le compteur est à zéro (scénario 4) |

#### Fichiers modifiés
| Fichier | Changement |
|---|---|
| `src/lib/domain/tasks.ts` | `partitionByCompletion`, `isRecentCompletion`, `recentlyCompletedTasks`, constante `COMPLETED_TASKS_VISIBLE_DAYS` |
| `src/lib/domain/tasks.test.ts` | 13 tests sur ces fonctions, dont la préservation de l'ordre et les trois cas du seuil |
| `src/lib/components/index.ts` | Export du nouveau composant |
| `src/routes/+page.svelte` | Tâches du jour réparties, section accomplies sans horizon (scénario 8) |
| `src/routes/page.test.ts` | 4 tests d'assemblage (scénarios 1, 3, 4, 8) + 2 tests d'US-038/US-039 amendés |
| `src/routes/taches/+page.svelte` | Même répartition, plus le filtre des 7 jours |
| `src/routes/taches/page.test.ts` | 7 tests d'assemblage (scénarios 1, 2, 4, 5, 6, 7, 9) + 1 test d'US-023 amendé |

#### Conception
Toute la décision vit dans `$lib/domain/tasks` en fonctions pures ; les écrans ne font que les
appeler. La séparation planning / onglet Tâches tient à une seule différence : `/taches` compose
`partitionByCompletion` **puis** `recentlyCompletedTasks`, le planning s'arrête à la première.

`partitionByCompletion` conserve strictement l'ordre reçu dans chacun des deux groupes. C'est ce
qui garantit sans effort que le tri d'US-038/US-039 survit au regroupement : la fonction retire des
éléments, elle n'en réordonne aucun.

#### Amendement de deux critères déjà livrés — à connaître
US-038 scénario 5 et US-039 scénario 9 posaient que **cocher une tâche ne la déplace pas**, pour
éviter qu'un élément ne bouge sous le doigt. Cette US les contredit sur un point : la tâche cochée
quitte désormais la liste des tâches à faire, puisque c'est très exactement ce qui est demandé ici
(scénario 3). Les tests correspondants ont été amendés, pas supprimés : ils vérifient maintenant ce
que ces critères garantissaient réellement — **aucune des tâches restantes ne bouge**, et une tâche
décochée revient exactement à sa place d'origine.

Conséquence d'usage à surveiller : sur l'onglet Tâches, une tâche cochée par erreur disparaît
immédiatement, et la récupérer suppose de déplier la section. C'est le prix du besoin exprimé, pas
un défaut — mais c'est le point le plus susceptible de déplaire à l'usage.

#### Comment tester manuellement
1. `npm run dev`, écran Tâches : cocher une tâche → elle disparaît, la section « Tâches
   accomplies » apparaît avec son compteur.
2. Déplier : la tâche est là, avec ses actions habituelles. Replier : elle disparaît à nouveau.
3. Changer d'onglet puis revenir : la section est de nouveau repliée.
4. Tout décocher : la section disparaît entièrement, sans laisser d'en-tête vide.
5. Sur le planning, cocher une tâche du jour : même comportement, sans aucun filtre de date.

#### Limites assumées
- **Scénario 7 vérifié indirectement.** L'export de données relève d'US-008, non livrée. La
  conservation est prouvée par un test qui contrôle l'état du stockage après masquage, et par le
  fait qu'une tâche masquée de l'onglet Tâches reste consultable sur le planning de son jour.
- **Aucun test de composant isolé pour `CompletedTasksSection`.** Son comportement est couvert par
  les tests d'assemblage des deux écrans, qui valident ce qui compte vraiment : l'interaction avec
  des tâches réelles. Un test isolé aurait exigé un composant hôte pour le `Snippet`, sans rien
  prouver de plus.

### Arbitrages produit (2026-08-16)
Trois points ouverts ont été tranchés avec l'utilisateur avant le passage de l'US en `prête` :

| Point | Décision retenue | Traduction dans l'US |
|-------|------------------|----------------------|
| État de la section entre deux affichages | **Toujours repliée** — le dépliage n'est pas mémorisé | Scénarios 1 et 5 |
| Point de départ des 7 jours | **La date d'accomplissement**, pas la date prévue de la tâche — une tâche en retard cochée hier reste visible | Scénario 6 |
| Tâches accomplies sans date d'accomplissement | **Masquées d'office** sur l'onglet Tâches, mais conservées et toujours consultables depuis le planning de leur jour | Scénario 9 |

Le troisième arbitrage mérite d'être explicité, car il va à l'encontre de la prudence habituelle :
masquer une donnée dont on ignore l'âge est acceptable **ici précisément parce que le planning ne
filtre rien**. Une tâche masquée de l'onglet Tâches reste atteignable sur le planning de son jour,
et rien n'est supprimé. Le nombre de tâches concernées est par ailleurs fini et ne peut que
diminuer : aucune nouvelle complétion n'est enregistrée sans date.
