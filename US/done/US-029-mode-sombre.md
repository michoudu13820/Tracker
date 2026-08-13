---
type: user-story
id: US-029
titre: Mode sombre / respect de prefers-color-scheme
date: 2026-08-12
auteur: product-owner
statut: livrée
priorite: Could
estimation: S
source: chat
depend_de: ["US-009"]
---

## Titre : US-029 — Mode sombre / respect de prefers-color-scheme

### Récit
> **En tant qu'** utilisateur de l'app,
> **je veux** que l'application respecte automatiquement le thème clair/sombre configuré sur mon téléphone,
> **afin de** avoir un confort visuel cohérent avec mes réglages système, notamment en soirée.

### Critères d'acceptation

**Scénario 1 — Application du thème sombre système**
> **Étant donné** mon iPhone est réglé en mode sombre (préférence système)
> **Quand** j'ouvre l'application
> **Alors** l'interface s'affiche avec une palette sombre adaptée, conservant l'esprit de la charte pastel déjà livrée (US-009) dans une version assombrie

**Scénario 2 — Application du thème clair système**
> **Étant donné** mon iPhone est réglé en mode clair
> **Quand** j'ouvre l'application
> **Alors** l'interface s'affiche avec la palette claire actuelle (US-009), inchangée

**Scénario 3 — Prise en compte d'un changement de réglage système**
> **Étant donné** l'application est ouverte en mode clair
> **Quand** je bascule mon iPhone en mode sombre (pendant que l'app reste ouverte, ou à sa prochaine ouverture selon la faisabilité technique)
> **Alors** l'interface reflète le nouveau mode sans que je doive désinstaller/réinstaller l'application

### Priorité
Could — confort visuel, priorisé bas (Lot 3), non planifié à court terme.

### Estimation
S — déclinaison des variables de couleurs déjà centralisées par US-009 en une seconde palette pilotée par `prefers-color-scheme`, sans nouvelle logique métier.

### Dépendances
US-009 (thème pastel de référence et centralisation des variables visuelles globales, à décliner en version sombre).

### Notes / hors périmètre
- Priorisée basse (Lot 3) : rédigée pour mémoire, non planifiée dans l'ordre d'implémentation recommandé à ce stade.
- Pas de bouton de bascule manuelle dans le périmètre de cette US : elle suit uniquement la préférence système. Un réglage manuel indépendant du système pourrait faire l'objet d'une extension ultérieure si le besoin est exprimé explicitement.
- Ne couvre pas de personnalisation de la palette sombre au-delà d'une déclinaison cohérente de la charte existante (pas de nouveau choix de couleurs par l'utilisateur).

## Implémentation

Tous les scénarios sont satisfaits et couverts par des tests (dans la limite de ce qui est
automatisable : `prefers-color-scheme` reflète un réglage OS, non simulable en jsdom/Vitest —
la validation visuelle réelle reste à faire manuellement, voir ci-dessous).

**Fichiers modifiés :**
- `src/app.css` — nouveau bloc `@media (prefers-color-scheme: dark) { :root { ... } }` déclinant
  **exactement les mêmes noms de variables** que la palette claire (US-009) en teintes sombres
  (fond/surface rose-brun très foncé, texte clair, mêmes teintes d'accent/statut assombries),
  plus `color-scheme: dark` pour les contrôles natifs (dates, cases à cocher). Aucun composant
  `.svelte` n'a été modifié : la charte est déjà 100 % centralisée en variables CSS (US-009),
  confirmé en scannant tout `src/` (aucune couleur codée en dur, tout passe par `var(--...)`).

**Fichiers créés :**
- `src/app.css.test.ts` — vérifie la présence du bloc `@media`, la **parité** des variables de
  couleur entre thème clair et sombre (aucune oubliée), la non-régression de la palette claire
  (US-009 inchangée), et `color-scheme: dark`.

**Comment tester manuellement :** sur iPhone (Réglages → Écran et luminosité → Sombre), ouvrir
la PWA installée : l'interface doit apparaître dans la palette sombre. Repasser en mode clair
(sans fermer/rouvrir l'app si possible) : l'interface doit refléter le changement dès que le
navigateur réévalue le media query (généralement immédiat, propre à `prefers-color-scheme`).

**Dette / points assumés :** aucun écart avec la spécification. Pas de bouton de bascule manuelle
(explicitement hors périmètre). La validation visuelle réelle sur iPhone (contraste, lisibilité
de la palette sombre choisie) n'a pas pu être effectuée dans cet environnement de développement
(pas d'iPhone disponible) — à vérifier au premier déploiement, les teintes pouvant être ajustées
sans impact structurel (une seule source de vérité, le bloc `@media` de `app.css`).
