---
type: user-story
id: US-034
titre: Résumé de la semaine entièrement visible sans défilement horizontal
date: 2026-08-14
auteur: product-owner
statut: livrée
priorite: Should
estimation: M
source: chat
depend_de: ["US-005"]
---

## Titre : US-034 — Résumé de la semaine entièrement visible sans défilement horizontal

### Récit
> **En tant qu'** utilisateur de l'app sur iPhone,
> **je veux** voir les 7 jours de la semaine d'un seul coup d'œil dans le résumé, sans avoir à faire défiler le tableau horizontalement,
> **afin de** juger ma semaine instantanément, sans manipulation ni risque de rater une colonne cachée hors de l'écran.

### Critères d'acceptation

**Scénario 1 — Les 7 jours tiennent à l'écran**
> **Étant donné** je consulte le résumé en période « semaine » sur un iPhone (largeur d'affichage à partir de 375 points, orientation portrait)
> **Quand** le tableau s'affiche
> **Alors** les 7 colonnes de jours sont visibles simultanément à l'écran
> **Et** aucun défilement horizontal n'est nécessaire ni possible sur ce tableau
> **Et** aucune colonne n'est coupée, tronquée par le bord de l'écran ni masquée derrière un débordement

**Scénario 2 — Identification de l'habitude conservée**
> **Étant donné** le tableau de la semaine est affiché sur iPhone
> **Quand** je parcours les lignes
> **Alors** chaque ligne reste rattachable sans ambiguïté à l'habitude qu'elle représente (a minima son emoji visible, et son nom lisible ou accessible d'une manière ou d'une autre : nom complet, nom tronqué avec indication de troncature, ou libellé accessible aux technologies d'assistance)
> **Et** le nom complet de l'habitude reste disponible pour un lecteur d'écran, même s'il est visuellement abrégé

**Scénario 3 — Identification du jour conservée**
> **Étant donné** le tableau de la semaine est affiché
> **Quand** je lis les en-têtes de colonnes
> **Alors** chaque colonne permet d'identifier sans ambiguïté le jour concerné (jour de la semaine et/ou quantième)
> **Et** la date complète de chaque colonne reste disponible pour un lecteur d'écran
> **Et** la colonne du jour courant est visuellement distinguée des autres

**Scénario 4 — Lisibilité et confort de lecture préservés**
> **Étant donné** le tableau de la semaine est resserré pour tenir sur 7 colonnes
> **Quand** je le consulte
> **Alors** le contenu des cellules reste lisible sans zoom (pas de texte réduit au point d'être illisible)
> **Et** les cellules restent alignées avec leur en-tête de colonne et leur ligne d'habitude, sans chevauchement

**Scénario 5 — Nombreuses habitudes**
> **Étant donné** j'ai une quinzaine d'habitudes
> **Quand** j'affiche le résumé de la semaine
> **Alors** les 7 colonnes tiennent toujours à l'écran sans défilement horizontal
> **Et** le défilement vertical reste possible pour parcourir toutes les lignes d'habitudes
> **Et** la ligne « Tâches » reste présente et atteignable

**Scénario 6 — Nom d'habitude très long**
> **Étant donné** une habitude a un nom très long (par exemple « Faire 20 minutes d'étirements du dos le soir »)
> **Quand** j'affiche le résumé de la semaine
> **Alors** ce nom ne provoque à lui seul aucun débordement horizontal du tableau
> **Et** les 7 colonnes restent visibles

**Scénario 7 — Périodes mois et année inchangées**
> **Étant donné** je bascule sur la période « mois » ou sur la période « année »
> **Quand** le tableau s'affiche
> **Alors** son comportement reste strictement identique à l'existant, défilement horizontal compris pour le mois
> **Et** aucune régression n'est introduite sur ces deux périodes par les ajustements faits pour la semaine

**Scénario 8 — Écran plus large**
> **Étant donné** je consulte le résumé sur un écran plus large (iPhone récent, mode paysage, ou navigateur de bureau)
> **Quand** j'affiche la période « semaine »
> **Alors** les 7 colonnes restent visibles et le tableau reste correctement présenté (pas de colonnes disproportionnées ni d'espace vide incohérent)

### Priorité
Should — corrige un défaut d'usage concret et quotidien du résumé sur le seul appareil cible du produit (iPhone), sans être bloquant pour le fonctionnement de l'app.

### Estimation
M — retravail de la mise en page du tableau semaine (largeur des colonnes, colonne d'en-tête de ligne, format des en-têtes de jours) sous une contrainte de largeur stricte, avec vérification sur appareil réel.

### Dépendances
- **US-005** : tableau du résumé existant (périodes semaine / mois / année).
- **US-035** : à livrer après celle-ci, ou à coordonner avec elle — les nouveaux symboles à trois états ne doivent pas réintroduire de débordement horizontal en vue semaine.
- Contrainte d'usage : appareil cible iPhone, PWA installée, orientation portrait.

### Notes / hors périmètre
- **Périmètre tranché par l'utilisateur** : seule la période « semaine » est concernée. Les périodes « mois » et « année » restent inchangées, le défilement horizontal étant conservé et assumé pour le mois (28 à 31 colonnes ne peuvent pas tenir à l'écran).
- Cette US porte uniquement sur la **mise en page** : le langage de symboles des cellules (✅ / ⬜ / ❌) fait l'objet d'US-035.
- Ne prescrit aucune solution technique : abréger le nom, réduire la colonne d'en-tête, changer le format des en-têtes de jours, ou toute autre approche sont acceptables tant que les critères ci-dessus sont satisfaits.
- Ne couvre pas l'ajout d'une vue alternative (liste, cartes) en remplacement du tableau : le tableau reste la forme retenue.
- La vérification finale « sans défilement horizontal » doit être faite sur un iPhone réel, la simulation navigateur pouvant masquer des différences de rendu (largeur des glyphes, barres de défilement).

---

## Résumé d'implémentation (2026-08-14)

**Tous les critères d'acceptation (scénarios 1 à 8) sont satisfaits.** Quality gate vert
(`npm run check` 0 erreur, `vitest run` 484 tests, `npm run build` OK).

### Fichiers modifiés
| Fichier | Nature |
|---|---|
| `src/routes/resume/WeekMonthTable.svelte` | Nouvelles props `period` / `today` ; en-têtes de jour compacts + date complète pour lecteur d'écran ; colonne d'en-tête de ligne bornée avec nom tronqué en CSS ; mise en évidence de la colonne du jour ; `table-layout: fixed` et `overflow-x: hidden` **uniquement** en vue semaine |
| `src/routes/resume/+page.svelte` | Transmet `period` et `today` (jour courant figé au montage, indépendant de la navigation) |
| `src/routes/resume/WeekMonthTable.test.ts` | 6 tests US-034 (7 colonnes, nom long, en-tête accessible, jour courant, 15 habitudes + ligne Tâches, non-régression du mois) |

### Solution technique retenue
- **`table-layout: fixed` + `width: 100%`** en vue semaine : la largeur du tableau ne dépend
  plus du contenu, donc un nom d'habitude très long (scénario 6) ne peut structurellement pas
  provoquer de débordement. `overflow-x: hidden` sur le conteneur rend le défilement horizontal
  non seulement inutile mais impossible (scénario 1).
- **Budget de largeur** (iPhone 375 pt, `main` avec 1,5 rem de marge de chaque côté → 327 px
  utiles) : colonne d'en-tête 5,5 rem (88 px), 7 colonnes de ~34 px chacune. Au-delà de 30 rem
  de large, la colonne d'en-tête passe à 9 rem pour éviter des colonnes disproportionnées
  (scénario 8).
- **En-tête de jour compact** : `Lun` (0,7 rem, atténué) au-dessus du quantième, remplaçant
  `JJ/MM`. La **date complète** (« lundi 10 août ») est fournie en texte masqué visuellement
  (`.visually-hidden`), qui devient le nom accessible de la colonne (scénario 3).
- **Nom d'habitude** : troncature purement **CSS** (`text-overflow: ellipsis`), donc le nom
  complet reste dans le DOM — lu par un lecteur d'écran et disponible en `title` (scénario 2).
- **Jour courant** : en-tête sur fond d'accent + liseré vertical `inset box-shadow` sur les
  cellules de la colonne — un traitement de bordure, choisi pour rester visible quel que soit
  le fond de cellule (y compris après l'arrivée des trois états d'US-035).
- **Vue mois strictement inchangée** (scénario 7) : tout le nouveau CSS est conditionné à
  `[data-period='week']`, et l'en-tête `JJ/MM` d'origine est conservé pour le mois. Un test
  dédié verrouille cette non-régression.

### Limite assumée
jsdom n'a pas de moteur de layout : les tests verrouillent les **décisions structurelles** qui
produisent l'absence de défilement, pas des largeurs mesurées. La vérification visuelle finale
sur iPhone réel reste à faire par l'utilisateur, conformément aux notes de l'US.

### Test manuel
1. `/resume`, période « Semaine » sur iPhone portrait : les 7 colonnes sont visibles, aucun
   défilement horizontal possible ; la colonne du jour est surlignée.
2. Créer une habitude au nom très long : le tableau ne s'élargit pas, le nom est tronqué par
   une ellipse.
3. Basculer sur « Mois » : le défilement horizontal et le format `JJ/MM` sont inchangés.
