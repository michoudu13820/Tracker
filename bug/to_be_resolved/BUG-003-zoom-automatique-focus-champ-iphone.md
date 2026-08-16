---
type: bug
id: BUG-003
titre: Sur iPhone, taper dans un champ de saisie déclenche un zoom automatique de la page
date: 2026-08-16
auteur: qa
statut: à corriger
severite: mineur
us_liee: []
reproductible: toujours
---

# BUG-003 — Sur iPhone, taper dans un champ de saisie déclenche un zoom automatique de la page

## Résumé
Sur iPhone, appuyer sur **n'importe quel champ de saisie** de l'application ouvre bien le clavier,
mais provoque **en plus un zoom automatique** de la page sur le champ ciblé. L'application donne
alors l'impression d'un site web consulté dans un navigateur plutôt que d'une application mobile.

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

## Résultat attendu
Appuyer sur un champ de saisie ouvre le clavier **sans aucun changement de niveau de zoom** : la
mise en page reste strictement identique avant, pendant et après la saisie, sur tous les champs de
l'application, comme dans une application iOS native.

Corollaire à ne pas casser en corrigeant : **le zoom manuel de l'utilisateur (pincement) doit rester
possible** — c'est une fonction d'accessibilité. Seul le zoom *automatique et subi* au focus est en
cause.

## Sévérité & impact
**Mineur.** L'application reste pleinement utilisable, aucune donnée n'est en jeu et l'utilisateur
peut dézoomer au pincement. Mais l'impact est **permanent et transverse** : il touche 100 % des
saisies, sur tous les écrans, à chaque usage, et dégrade directement la perception « vraie app »
recherchée par le projet — c'est d'ailleurs à ce titre que l'utilisateur le remonte.

Ne pas monter en `majeur` sans avoir tranché le point ouvert ci-dessous.

### Point ouvert à vérifier sur l'appareil (conditionne la sévérité)
**Le zoom se dé-zoome-t-il tout seul une fois le clavier refermé ?** Non observé à ce jour.
- Si oui → `mineur`, la gêne est transitoire (sévérité retenue par défaut).
- Si non (la page reste zoomée après la saisie, obligeant à dézoomer à la main) → **`majeur`**, car
  la gêne persiste alors sur toute la navigation qui suit.

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
automatisé du projet ne pouvant observer le zoom natif de WebKit (même limite que US-040). Rappel
opérationnel issu d'US-040 : sans `skipWaiting()`, une nouvelle version exige **deux ouvertures en
ligne successives entrecoupées d'une fermeture complète de l'app** avant de prendre la main — sous
peine de tester l'ancienne version en croyant tester la nouvelle.

**Périmètre à couvrir sans oubli** : `input[type='text' | 'date' | 'time' | 'number']`, `select`, et
tout `textarea`, sur les formulaires **comme** sur les Réglages. Un correctif partiel laisserait le
défaut visible sur les champs oubliés.
