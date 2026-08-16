---
type: bug
id: BUG-003
titre: Sur iPhone, taper dans un champ de saisie déclenche un zoom automatique de la page
date: 2026-08-16
auteur: qa
statut: corrigé
severite: majeur
us_liee: []
reproductible: toujours
---

# BUG-003 — Sur iPhone, taper dans un champ de saisie déclenche un zoom automatique de la page

## Résumé
Sur iPhone, appuyer sur **n'importe quel champ de saisie** de l'application ouvre bien le clavier,
mais provoque **en plus un zoom automatique** de la page sur le champ ciblé. Ce zoom **ne se retire
pas à la fermeture du clavier** : l'application reste zoomée et l'utilisateur doit dézoomer à la
main. L'application donne l'impression d'un site web consulté dans un navigateur plutôt que d'une
application mobile.

## US / critère concerné
**Aucune US ne formalise ce comportement** — `us_liee: []`.

Aucun critère Given/When/Then du backlog ne décrit le comportement attendu au focus d'un champ :
les US qui touchent aux formulaires (US-001, US-002, US-017, US-021, US-026, US-039) spécifient le
*contenu* et la *validation* des champs, jamais l'ergonomie de la saisie. Le seul standard
d'ergonomie tactile écrit dans le backlog est la **taille de cible de 44 px** (US-013 scénario 3,
US-014), qui est respectée ici et ne couvre pas ce défaut.

C'est donc **un trou de couverture, pas une régression** : la promesse « application iPhone » vit
dans l'ADR-001 (« habit tracker personnel, solo, **iPhone-only** », PWA installée sur l'écran
d'accueil), qui ne se teste pas. Situation strictement analogue à celle de BUG-002 / US-040, où
l'engagement « offline-first » n'était acté que dans un ADR : **à signaler au Product Owner**, qui
décidera si le comportement attendu mérite d'être posé en critère d'acceptation (US d'ergonomie de
saisie) plutôt que corrigé silencieusement.

## Environnement
- **Appareil** : iPhone (Safari / WebKit).
- **Mode** : signalé sur l'application installée sur l'écran d'accueil (PWA standalone) ; à
  confirmer en onglet Safari standard, le comportement étant a priori identique.
- **Version** : production `https://tracker-habit-pwa.netlify.app`, déploiement du 2026-08-16
  (commit `4acbb52`, US-041).
- **Thème / police** : sans influence apparente (le défaut est signalé « sur n'importe quel champ »).

## Étapes de reproduction
1. Ouvrir l'application sur iPhone.
2. Aller sur l'onglet **Tâches** → « Ajouter une tâche ».
3. Appuyer sur le champ **Nom**.

Le défaut est **général, pas propre à un écran** — il se reproduit à l'identique sur :
- le formulaire d'habitude (nom, intervalle en jours, cible chiffrée) — écran Habitudes ;
- le formulaire de tâche (nom, date, heure limite) — écran Tâches ;
- l'ajout rapide depuis le planning (US-026), qui réutilise ces mêmes formulaires ;
- la saisie de progression d'une habitude à cible chiffrée dans le planning (US-018) ;
- les champs des **Réglages** : seuils de couleur, heure de rappel, revue hebdomadaire.

## Résultat observé
Le clavier s'ouvre (attendu), **et** la page zoome automatiquement sur le champ touché : la mise en
page grossit, le reste de l'écran sort du cadre. Le rendu évoque une page web dans un navigateur,
pas une application mobile.

**Le zoom ne se retire pas tout seul** (confirmé sur l'appareil par l'utilisateur le 2026-08-16) :
une fois le clavier refermé, l'application **reste zoomée**, et c'est à l'utilisateur de dézoomer
au pincement. La gêne n'est donc pas transitoire — elle persiste sur toute la navigation qui suit
la saisie, sur tous les écrans, jusqu'à correction manuelle.

## Résultat attendu
Appuyer sur un champ de saisie ouvre le clavier **sans aucun changement de niveau de zoom** : la
mise en page reste strictement identique avant, pendant et après la saisie, sur tous les champs de
l'application, comme dans une application iOS native.

Exigence explicite de l'utilisateur (2026-08-16) : **aucun zoom automatique, jamais, sur aucun
champ.** Un correctif qui ne ferait que « rendre le zoom moins fréquent » ou qui laisserait
subsister quelques champs zoomants ne satisfait pas ce bug.

Corollaire à ne pas casser en corrigeant : **le zoom manuel de l'utilisateur (pincement) doit rester
possible** — c'est une fonction d'accessibilité, et c'est aujourd'hui le seul moyen dont dispose
l'utilisateur pour réparer le défaut. Seul le zoom *automatique et subi* au focus est visé.

## Sévérité & impact
**Majeur.** Relevé de `mineur` à `majeur` le 2026-08-16, après vérification sur l'appareil : le
zoom **persiste après la fermeture du clavier**. L'hypothèse basse (gêne transitoire, auto-annulée)
est donc écartée.

Conséquences :
- l'application est laissée dans un état d'affichage dégradé **après chaque saisie**, écrans
  suivants compris, et non pendant la seule saisie ;
- le retour à un affichage correct exige une **action manuelle de l'utilisateur** (pincement) à
  chaque fois — il n'existe aucun contournement automatique ;
- le défaut touche 100 % des saisies, sur tous les écrans, à chaque usage, et dégrade directement
  la perception « vraie app » recherchée par le projet.

Aucune donnée n'est en jeu et l'application reste fonctionnelle : ce n'est pas `bloquant`.

## Notes / pistes
Constat factuel relevé dans le code, sans valeur prescriptive — le correctif reste à l'appréciation
du développeur :

- `src/app.html:6` déclare `<meta name="viewport" content="width=device-width, initial-scale=1,
  viewport-fit=cover" />` : ni `maximum-scale` ni `user-scalable=no`, donc **rien ne bloque le zoom
  côté viewport** (et c'est tant mieux, cf. le corollaire d'accessibilité ci-dessus).
- **Aucun des champs de saisie de l'application ne déclare de `font-size`.** Vérifié sur
  `TaskForm.svelte:147-155` (`input[type='text']`, `input[type='date']`),
  `ColorThresholdsForm.svelte:90` (`input[type='number']`), et `HabitForm.svelte` où les seules
  tailles déclarées à proximité des champs valent `0.85rem`. `src/app.css` ne contient **aucune**
  règle visant `input`, `select` ou `textarea` : les contrôles de formulaire n'héritent donc pas de
  la taille de texte du `body` et retombent sur la taille par défaut de WebKit.
- Sur iOS, Safari zoome automatiquement au focus d'un champ dont le texte fait **moins de 16 px** —
  hypothèse de cause la plus directe, cohérente avec le caractère « n'importe quel champ » du
  symptôme.

**Attente de recette** : la correction devra être vérifiée **sur iPhone réel**, aucun test
automatisé du projet ne pouvant observer le zoom natif de WebKit (même limite que US-040). Deux
choses à contrôler, pas une : (1) **aucun zoom au focus** sur chacun des champs listés plus haut,
et (2) **le niveau de zoom est identique avant et après la saisie** — c'est ce second point qui
fait la sévérité `majeur`. Rappel
opérationnel issu d'US-040 : sans `skipWaiting()`, une nouvelle version exige **deux ouvertures en
ligne successives entrecoupées d'une fermeture complète de l'app** avant de prendre la main — sous
peine de tester l'ancienne version en croyant tester la nouvelle.

**Périmètre à couvrir sans oubli** : `input[type='text' | 'date' | 'time' | 'number']`, `select`, et
tout `textarea`, sur les formulaires **comme** sur les Réglages. Un correctif partiel laisserait le
défaut visible sur les champs oubliés.

---

## Résumé de correction (2026-08-16)

> **Validé sur iPhone réel le 2026-08-16** par l'utilisateur, sur la version déployée en
> production : plus aucun zoom au focus d'un champ. C'est la preuve de clôture exigée pour tout
> défaut observable seulement sur l'appareil (même règle que US-040), les tests automatisés ne
> pouvant pas observer le zoom natif de WebKit.

### Cause racine
Les contrôles de formulaire **n'héritent pas** de la taille de texte du `body` : c'est une règle des
navigateurs, pas une particularité du projet. Or `src/app.css` ne contenait **aucune** règle visant
`input` / `select` / `textarea`, et aucun composant n'en déclarait la taille non plus. Tous les
champs de l'application retombaient donc sur la taille par défaut de WebKit (~13 px), **sous le
seuil de 16 px** en dessous duquel Safari iOS zoome au focus — d'où un défaut uniforme sur tous les
écrans, et non localisé à un formulaire.

### Correctif
Une règle globale unique dans la source de vérité visuelle du projet (`src/app.css`, US-009), qui
fixe le plancher de 16 px pour les trois éléments de saisie. Aucun composant n'a eu besoin d'être
touché : la vérification a montré qu'aucune règle scopée ne déclarait de `font-size` sur un champ,
donc rien ne pouvait neutraliser la règle globale par spécificité.

`user-scalable=no` et `maximum-scale` ont été **volontairement écartés** : ils supprimeraient aussi
le zoom manuel au pincement, qui est une fonction d'accessibilité et le seul recours de
l'utilisateur en cas de défaut d'affichage. Seul le zoom subi est corrigé.

### Fichiers modifiés
| Fichier | Changement |
|---|---|
| `src/app.css` | Règle `input, select, textarea { font-size: 16px }` + commentaire expliquant que 16 px est une contrainte du moteur WebKit, pas un choix typographique (d'où l'unité `px`, qui ne doit pas suivre une mise à l'échelle des `rem`) |
| `src/app.css.test.ts` | 3 tests de non-régression (voir ci-dessous) |

### Tests de non-régression ajoutés
Trois tests, dans le style déjà établi par US-029/US-036 (analyse de la source CSS — le zoom natif
de WebKit n'étant pas observable en jsdom) :

1. **`app.css` impose un plancher >= 16 px** à `input`, `select` et `textarea` — c'est le test qui
   était **rouge avant correction** (« aucune règle globale ne fixe la taille de texte de
   `<input>` ») et vert après.
2. **Aucun composant ne repasse sous ce plancher** : balayage des blocs `<style>` de tous les
   `.svelte` du projet. Une règle scopée Svelte étant plus spécifique que la règle globale, elle
   rouvrirait le défaut sur son seul écran — le cas le plus probable de réintroduction, et
   invisible à la relecture. Les `input` sans clavier (`checkbox`, `radio`, `range`, `color`,
   `file`) sont exclus : ils ne déclenchent aucun zoom et sont dimensionnés à la main dans l'app.
3. **Le viewport n'interdit pas le pincement** : verrouille le corollaire d'accessibilité en
   interdisant `user-scalable=no` et `maximum-scale` dans `src/app.html`.

### Comment tester manuellement
Sur iPhone, application installée (rappel d'US-040 : **deux ouvertures en ligne successives
entrecoupées d'une fermeture complète** avant que la nouvelle version prenne la main) :
1. Onglet Tâches → ajouter une tâche → toucher le champ **Nom** : le clavier s'ouvre, **la page ne
   zoome pas**.
2. Refermer le clavier : **le niveau de zoom est identique à avant la saisie** — c'est ce point qui
   portait la sévérité `majeur`.
3. Refaire sur les champs date, heure limite, sur le formulaire d'habitude (nom, intervalle, cible),
   sur la saisie de progression d'une habitude à cible chiffrée, et dans les Réglages (seuils de
   couleur, heure de rappel, revue hebdomadaire).
4. Pincer pour zoomer volontairement : **doit toujours fonctionner**.

### Effet de bord visuel assumé
Le texte des champs passe d'environ 13 px à 16 px : les champs sont un peu plus grands qu'avant.
C'est inhérent au correctif — le seuil de 16 px n'est pas négociable côté WebKit — et rapproche le
rendu de celui d'un formulaire iOS natif (17 px).

### Point adjacent relevé, NON corrigé (signalé au QA / PO)
Les champs de saisie n'héritent pas non plus de `--font-family` : ils s'affichent dans la police par
défaut du navigateur, et **ne suivent donc pas la police choisie dans les Réglages** (US-016 /
US-020). C'est visible, indépendant de ce bug, et hors de son périmètre — à formaliser séparément
si le comportement attendu est bien que la police choisie s'applique aussi aux champs.
