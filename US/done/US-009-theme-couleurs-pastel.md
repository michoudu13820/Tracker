---
type: user-story
id: US-009
titre: Thème de couleurs pastel appliqué à l'ensemble de l'application
date: 2026-08-12
auteur: product-owner
statut: livrée
priorite: Should
estimation: S
source: chat
depend_de: []
---

## Titre : US-009 — Thème de couleurs pastel appliqué à l'ensemble de l'application

### Récit
> **En tant qu'** utilisateur de l'application,
> **je veux** que l'interface utilise une palette de couleurs pastel, avec un fond rose pâle
> presque blanc (très peu saturé), à la place du thème sombre actuel,
> **afin de** bénéficier d'une expérience visuelle plus douce et cohérente à travers toute
> l'application.

### Contexte (état actuel constaté dans le code)
Le thème actuel est sombre et centralisé via des variables CSS globales déclarées une seule
fois (`--bg` très foncé, `--surface`, `--text`, `--muted`, `--accent`, `color-scheme: dark`),
appliquées au `<html>`/`<body>`. Toutes les pages (Aujourd'hui, Habitudes, Tâches, Résumé,
Réglages) ainsi que la barre de navigation basse en héritent. Certains éléments utilisent en
plus des couleurs codées en dur localement (ex. badges de statut vert/rouge sur les tâches,
bordure violette des habitudes) en dehors de ce jeu de variables.

### Critères d'acceptation

> **Étant donné** l'application ouverte, quel que soit l'onglet (Aujourd'hui, Habitudes,
> Tâches, Résumé, Réglages),
> **Quand** la page se charge,
> **Alors** le fond de l'écran est une couleur pastel rose pâle, proche du blanc (forte
> luminosité, faible saturation), et non plus le fond sombre actuel.

> **Étant donné** que je navigue d'un onglet à l'autre via la barre de navigation basse,
> **Quand** j'arrive sur une nouvelle page,
> **Alors** elle utilise la même palette pastel (fond, texte, surfaces de cartes/formulaires)
> — aucune page ne conserve le thème sombre actuel ou n'affiche un fond différent des autres.

> **Étant donné** le nouveau fond clair,
> **Quand** du texte ou des éléments interactifs (boutons, libellés, badges, icônes) s'affichent
> dessus,
> **Alors** leur contraste reste suffisant pour rester lisible (le texte ne se fond pas dans le
> fond ni dans les cartes).

> **Étant donné** les surfaces distinctes du fond (cartes de tâches/habitudes, formulaires,
> barre de navigation),
> **Quand** elles s'affichent sur le nouveau fond pastel,
> **Alors** elles restent visuellement identifiables comme des éléments distincts du fond (par
> exemple une teinte légèrement différente et/ou une légère ombre/bordure), pour ne pas se
> fondre visuellement dans l'arrière-plan.

> **Étant donné** les couleurs de statut codées en dur (badge « en retard » en rouge, badge
> « faite » en vert, bordure violette des habitudes),
> **Quand** le nouveau thème pastel est appliqué,
> **Alors** ces couleurs sont elles aussi repensées en teintes pastel douces cohérentes avec le
> reste de la palette, tout en conservant leur sémantique actuelle (rouge = retard,
> vert = fait, violet = habitude) et un contraste suffisant pour rester lisibles.

- **Priorité** : Should
- **Estimation** : S
- **Dépendances** : Aucune US bloquante. Contrainte technique existante à respecter : le thème
  est aujourd'hui centralisé dans un jeu de variables CSS global — cette US doit conserver ce
  principe de centralisation (une seule source de vérité pour les couleurs) plutôt que
  d'introduire des couleurs codées en dur page par page, pour rester cohérente et facilement
  ajustable dans le futur.
- **Notes / hors périmètre** :
  - **Clarifié avec l'utilisateur (2026-08-12)** : les couleurs de statut (badges vert/rouge,
    bordure violette des habitudes) sont bien dans le périmètre de cette US et doivent être
    repensées en pastel, pas laissées telles quelles.
  - Le choix précis des teintes pastel complémentaires (au-delà du rose pâle du fond) n'est pas
    figé par cette US ; il devra être validé visuellement (maquette ou aller-retour rapide)
    lors du développement.

## Implémentation

Tous les critères d'acceptation sont couverts. La palette est entièrement centralisée dans
`src/app.css` (`:root`), aucune couleur codée en dur ne subsiste dans les composants (vérifié
par recherche globale des `#hex` dans `src/`, seules les définitions de variables dans
`app.css`/`app.html` en contiennent encore).

### Fichiers modifiés
- `src/app.css` — nouvelle palette pastel (`--bg` rose pâle `#fdf2f6`, `--surface`/`--surface-border`/
  `--surface-shadow` pour distinguer les surfaces du fond, `--text`/`--muted` retravaillés pour un
  contraste suffisant, `--accent`/`--accent-text` pour les actions principales, et les couleurs de
  statut pastel `--success-*` (vert = fait), `--danger-*` (rouge = retard), `--warning-*` (jaune,
  résumé annuel), `--habit-border`/`--habit-text` (violet = habitude) ; `color-scheme: light`.
  Ajout de `--card-radius`/`--card-padding` (US-010, cartes cohérentes).
- `src/app.html` — `theme-color` et `apple-mobile-web-app-status-bar-style` alignés sur le thème
  clair (barre de statut iOS lisible sur fond clair).
- `src/lib/components/TabBar.svelte`, `src/lib/components/TaskItem.svelte`,
  `src/routes/HabitCheckItem.svelte`, `src/routes/habitudes/+page.svelte`,
  `src/routes/habitudes/HabitForm.svelte`, `src/routes/taches/+page.svelte`,
  `src/routes/taches/TaskForm.svelte`, `src/routes/reglages/ColorThresholdsForm.svelte`,
  `src/routes/resume/+page.svelte`, `src/routes/resume/WeekMonthTable.svelte`,
  `src/routes/resume/YearTable.svelte` — remplacement de toutes les couleurs codées en dur
  (`#4ade80`, `#f87171`, `#a78bfa`, `#166534`/`#854d0e`/`#7f1d1d`, etc.) par les variables
  centralisées ; correction des boutons/badges qui utilisaient `color: var(--bg)` comme texte sur
  fond `--accent` (fonctionnait sur l'ancien thème sombre car `--bg` était foncé, cassait le
  contraste avec le nouveau `--bg` clair) — remplacés par `--accent-text` (foncé, dédié).

### Comment tester manuellement
1. `npm run dev`, ouvrir `/` : fond rose pâle presque blanc, cartes/formulaire clairement
   distincts (fond blanc cassé + bordure + ombre légère).
2. Naviguer sur `/habitudes`, `/taches`, `/resume`, `/reglages` : même palette partout.
3. Vérifier une tâche « en retard » (badge rouge pastel), une tâche « faite » (badge vert
   pastel), et la bordure gauche violette pastel des habitudes : lisibles, sémantique inchangée.
4. Vérifier les boutons pleins (Créer, Enregistrer, Ajouter) : texte foncé lisible sur fond
   accent pastel.

### Hypothèses produit tranchées
- Teintes précises non figées par le PO : choix d'un rose très pâle (`#fdf2f6`) pour le fond, et
  d'un violet pastel (`#c9a6e6`) comme accent principal (réutilisé pour la bordure des
  habitudes, cohérent avec le violet déjà utilisé avant cette US). Ajustable facilement via les
  variables si le rendu ne convient pas visuellement.
- Contrastes vérifiés au calcul (WCAG, luminance relative) pour les paires texte/fond
  critiques (`--muted` sur `--bg` ≈ 4.9:1, `--accent-text` sur `--accent` ≈ 6:1, badges de
  statut ≈ 5:1+), toutes ≥ 4.5:1 (seuil AA texte normal).
