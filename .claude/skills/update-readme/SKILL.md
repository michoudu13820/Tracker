---
name: update-readme
description: >-
  Met à jour le README.md du projet à partir de la réalité du code : une section technique (stack,
  prérequis, installation, scripts npm, dev/build/preview, tests, déploiement) et une section
  fonctionnelle listant les fonctionnalités RÉELLEMENT implémentées, dérivées des US livrées
  (US/done) et du code. À utiliser pour « mets à jour le README », « documente l'app », « génère la
  doc utilisateur », après la livraison d'une US ou d'un lot de fonctionnalités.
---

# Mettre à jour le README

Produit un `README.md` fidèle à l'état réel du projet : **comment utiliser l'app techniquement** +
**les fonctionnalités réellement présentes**. Zéro fonctionnalité inventée ou « prévue » : on
documente ce qui est **implémenté**.

## Étape 1 — Rassembler les sources de vérité (lire avant d'écrire)

1. **Stack & scripts** : `package.json` (nom, scripts `dev`/`build`/`preview`/`check`/`lint`/`test`,
   dépendances, gestionnaire de paquets), config (`svelte.config.js`, `vite.config.ts`).
2. **Décisions techniques** : `docs/architecture/ADR-*.md` et `docs/architecture/ARCHITECTURE.md`
   (adapter statique, stockage IndexedDB, i18n, theming, PWA…). Résume-les, ne les recopie pas.
3. **Fonctionnalités implémentées** (source primaire) : `US/done/US-*.md` — chaque US livrée = une
   ou plusieurs fonctionnalités visibles. Croise avec le code (`src/lib/components`, `src/lib/stores`,
   `src/routes`) pour confirmer qu'elles sont réellement câblées.
4. **Déploiement** : présence d'un pipeline/skill (`deploy-netlify`, dossier `.netlify/`) → documenter
   la commande réelle de mise en ligne.

> Règle d'or : une fonctionnalité n'entre dans le README que si elle est **présente dans le code**
> (US en `done` ET composant/store correspondant). Une US encore dans `to_be_implemented` /
> `in_progress` ne doit PAS être présentée comme disponible.

## Étape 2 — Rédiger le README

Structure cible (adapter au projet, en français, ton clair) :

```markdown
# <Nom de l'app>
<Pitch en 1–2 phrases : à quoi sert l'app, pour qui.>

## Fonctionnalités
<Liste des fonctionnalités RÉELLEMENT implémentées, groupées par thème, dérivées des US/done.
Formuler côté utilisateur (ce que l'app permet), pas côté technique. Optionnel : référence
« (US-0xx) » entre parenthèses pour la traçabilité.>

## Stack technique
<Svelte 5 (runes) + SvelteKit 2, TypeScript, adapter-static, stockage local IndexedDB, PWA…
Renvoyer aux ADR pour le détail : `docs/architecture/`.>

## Prérequis
<Node version, npm.>

## Installation
```sh
npm install
```

## Utilisation (développement)
<`npm run dev`, URL locale, `-- --open`.>

## Scripts disponibles
<Tableau : script | commande | rôle — repris tel quel de package.json.>

## Tests & qualité
<`npm run check` (typecheck), `npm run lint`, `npm run test` (Vitest). Mentionner le quality gate.>

## Build & déploiement
<`npm run build` (sortie `build/`), `npm run preview`. Si Netlify configuré : commande de déploiement
réelle + URL de production.>

## Structure du projet
<Arborescence commentée courte : lib/domain, lib/data, lib/stores, lib/components, routes, docs, US.>

## PWA / installation
<Si applicable : comment installer sur iPhone/Android, fonctionnement offline.>
```

## Étape 3 — Vérifier

- Chaque fonctionnalité listée est **traçable** à une US `done` + un artefact de code.
- Chaque commande citée existe réellement dans `package.json`.
- Aucun reliquat du template par défaut (`# sv`, texte générique `npx sv create`).
- Restituer : ce qui a été (ré)écrit, les fonctionnalités listées, et les éventuelles US `done` sans
  trace de code (à signaler comme incohérence, pas à documenter).

## Règles
1. **Fidélité au code** : on documente l'implémenté, jamais le prévu ou le « bientôt ».
2. **Deux axes obligatoires** : usage technique **et** fonctionnalités.
3. **Français, orienté utilisateur** pour les fonctionnalités ; précis et copiable pour la technique.
4. **Pas de doublon avec les ADR** : résumer et pointer vers `docs/architecture/`, pas recopier.
