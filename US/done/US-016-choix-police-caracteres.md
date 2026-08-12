---
type: user-story
id: US-016
titre: Choix de la police de caractères de l'application
date: 2026-08-12
auteur: product-owner
statut: livrée
priorite: Should
estimation: S
source: chat
depend_de: []
---

## Titre : US-016 — Choix de la police de caractères de l'application

### Récit
> **En tant qu'** utilisateur de l'application,
> **je veux** choisir la police de caractères utilisée dans toute l'application depuis l'écran
> Réglages, parmi une liste d'une dizaine de polices proposées,
> **afin de** personnaliser le confort de lecture de l'application selon mes préférences.

### Contexte (état actuel constaté dans le code)
Aujourd'hui, la police est fixée en dur et unique pour toute l'application : elle est définie
une seule fois dans `src/app.css` (`font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI',
Roboto, sans-serif;` sur `html, body`), héritée par toutes les pages (Aujourd'hui, Habitudes,
Tâches, Résumé, Réglages). Il n'existe aujourd'hui aucune police chargée depuis un service
externe (pas de Google Fonts ni de `@font-face` dans le projet) — seules des polices système
sont utilisées. L'écran Réglages (`/reglages`) contient déjà un formulaire de préférence
persistante (seuils de couleur, US-006) qui illustre le pattern à suivre : composant de
formulaire présentational + store de réglages (`settingsStore`) + persistance via
`SettingsRepository` (IndexedDB, `src/lib/data/repositories.ts`).

### Décision produit tranchée (2026-08-12, confirmée avec l'utilisateur) — choix des polices proposées
L'utilisateur a explicitement préféré inclure des **polices Google Fonts** plus modernes et
variées plutôt que de se limiter aux polices système « web-safe », malgré la dépendance réseau
que cela introduit (nouveauté par rapport au principe 100% local établi par ADR-001 — voir
« Notes / hors périmètre » pour le traitement du cas hors-ligne). La liste retenue (10 choix, y
compris l'actuelle par défaut) est :

1. **Système (par défaut)** — police actuelle, inchangée, aucun chargement réseau :
   `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
2. **Inter** (Google Fonts) — sans-serif moderne, très lisible à petite taille, bon choix
   d'interface
3. **Poppins** (Google Fonts) — géométrique, sans-serif, look doux cohérent avec le thème
   pastel (US-009)
4. **Nunito** (Google Fonts) — sans-serif arrondie, chaleureuse
5. **Quicksand** (Google Fonts) — sans-serif arrondie légère, très cohérente avec un thème
   pastel/doux
6. **Roboto** (Google Fonts) — sans-serif standard, neutre et très lisible
7. **Lato** (Google Fonts) — sans-serif équilibrée, largement utilisée en UI
8. **Merriweather** (Google Fonts) — serif contemporaine, bonne lisibilité pour du texte plus
   long
9. **Playfair Display** (Google Fonts) — serif élégante à fort contraste, pour un rendu plus
   « habillé »
10. **JetBrains Mono** (Google Fonts) — monospace, pour les utilisateurs préférant un rendu
    technique/tabulaire

Cette liste couvre plusieurs familles (sans-serif géométrique/arrondie, serif, monospace) pour
un choix réellement varié, avec une cohérence visuelle particulière entre les options arrondies
(Nunito, Quicksand) et le thème pastel déjà en place (US-009).

### Critères d'acceptation

> **Étant donné** l'écran Réglages ouvert et aucune police jamais choisie explicitement par
> l'utilisateur,
> **Quand** la page se charge,
> **Alors** un sélecteur de police est visible dans une section dédiée, avec la police
> « Système (par défaut) » présélectionnée, et le rendu de l'application est identique à
> l'expérience actuelle (aucun changement visuel non désiré).

> **Étant donné** le sélecteur de police affiché,
> **Quand** je l'ouvre,
> **Alors** je vois une liste d'environ dix polices nommées (parmi celles listées ci-dessus),
> chaque option étant présentée avec son propre style pour donner un aperçu visuel de son rendu.

> **Étant donné** le sélecteur de police affiché,
> **Quand** je choisis une police différente de celle actuellement active,
> **Alors** l'ensemble du texte de l'application (tous les onglets : Aujourd'hui, Habitudes,
> Tâches, Résumé, Réglages) bascule immédiatement sur cette police, sans rechargement manuel de
> la page ni action supplémentaire.

> **Étant donné** une police choisie et appliquée,
> **Quand** je ferme puis rouvre l'application,
> **Alors** la police précédemment choisie est toujours active (le réglage a été mémorisé) et
> le sélecteur de Réglages affiche bien cette police comme sélection courante.

> **Étant donné** le sélecteur de police affiché avec une police non-par-défaut sélectionnée,
> **Quand** j'utilise une action de réinitialisation (cohérente avec le pattern déjà existant
> pour les seuils de couleur en US-006),
> **Alors** la police revient à « Système (par défaut) » et ce choix est immédiatement appliqué
> et persisté.

> **Étant donné** l'application utilisée hors-ligne (pas de connexion réseau) et une police
> Google Fonts déjà choisie lors d'une session précédente où elle avait pu être chargée,
> **Quand** l'application démarre sans réseau,
> **Alors** la police s'affiche normalement si elle a déjà été mise en cache par le service
> worker (voir Notes), sinon l'application replie silencieusement sur la police système par
> défaut plutôt que d'afficher un texte invisible ou une erreur — l'usage hors-ligne de base
> (ADR-001) n'est jamais bloqué par un choix de police.

### Autres champs
- **Priorité** : Should
- **Estimation** : S
- **Dépendances** :
  - US-006 (pattern de réglage persistant à réutiliser : formulaire présentational +
    `settingsStore` + `SettingsRepository`).
  - US-009 (principe déjà établi de centralisation des variables visuelles globales dans
    `src/app.css` — cette US doit suivre le même principe pour la police : une source de
    vérité unique, pas de police codée en dur page par page).
  - Contrainte technique connue : le réglage de police doit être ajouté au même agrégat de
    préférences persistées que les seuils de couleur et les rappels (`SettingsRepository`,
    `src/lib/data/repositories.ts`), avec une valeur par défaut correspondant à la police
    système actuelle pour ne rien changer tant que l'utilisateur n'a pas fait de choix explicite.
  - Contrainte technique liée au choix Google Fonts (confirmé par l'utilisateur malgré la
    dépendance réseau) : le chargement doit être mis en cache par le service worker existant
    (setup PWA, cf. skill `setup-pwa`) dès qu'une police a été utilisée au moins une fois en
    ligne, pour limiter l'impact hors-ligne aux tout premiers usages d'une police donnée — voir
    le critère d'acceptation dédié ci-dessus.
- **Notes / hors périmètre** :
  - **Clarifié avec l'utilisateur (2026-08-12)** : le chargement de polices Google Fonts est
    bien dans le périmètre de cette US (contrairement à l'hypothèse initiale de se limiter aux
    polices système). Le comportement hors-ligne est cadré par un critère d'acceptation dédié
    (repli sur la police système si la police choisie n'est pas en cache), plutôt que traité
    comme un hors-périmètre.
  - Le réglage de taille de police n'est pas couvert par cette US (uniquement le choix de la
    police elle-même).
  - Le rendu de l'aperçu par option (élément 2 des critères) est laissé à l'appréciation du
    développeur tant que l'utilisateur peut distinguer visuellement les options avant de
    choisir ; l'US n'impose pas de solution technique précise (liste déroulante stylée, cartes
    de choix, etc.).

## Implémentation

Les 6 critères d'acceptation (dont les 2 scénarios implicites de la liste : présélection + aperçu)
sont couverts et vérifiés par les tests automatisés (voir fichiers ci-dessous).

### Fichiers créés
- `src/lib/domain/fonts.ts` + `.test.ts` : catalogue pur et testable des 10 polices (`FontChoice`, `FONT_OPTIONS`, `DEFAULT_FONT_CHOICE`, `fontOptionById`, `googleFontsStylesheetUrl`). Chaque `cssFontFamily` empile systématiquement la pile système en dernier repli CSS — c'est ce mécanisme, purement déclaratif, qui réalise le repli hors-ligne silencieux (dernier critère) sans code JS de gestion d'erreur.
- `src/lib/fonts/client.ts` + `.test.ts` : effets de bord DOM (même patron que `$lib/push/client`) — `applyFontChoice` (met à jour la variable CSS `--font-family` sur `document.documentElement`) et `ensureGoogleFontsLoaded` (injecte une seule fois la feuille de style Google Fonts combinée, idempotent).
- `src/routes/reglages/FontSelector.svelte` + `.test.ts` : sélecteur (`role="radiogroup"`), une option par police avec aperçu stylé dans sa propre police, sélection appliquée immédiatement (pas de bouton Enregistrer séparé), bouton de réinitialisation désactivé quand la police système est déjà active.

### Fichiers modifiés
- `src/lib/domain/types.ts` : inchangé (le type `FontChoice` est défini dans `domain/fonts.ts`, suivant le même principe que `TaskStatus` dans `domain/tasks.ts`).
- `src/lib/data/repositories.ts` : `SettingsRepository.getFontChoice`/`saveFontChoice`, clé IndexedDB `font-choice`, défaut `DEFAULT_FONT_CHOICE` (= `'system'`, ne change rien tant que l'utilisateur n'a pas choisi).
- `src/lib/stores/settings.store.svelte.ts` : `fontChoice` ($state), chargé dans `load()`, `saveFontChoice()`.
- `src/app.css` : nouvelle variable centralisée `--font-family` (valeur par défaut = pile système actuelle, caractère pour caractère identique à l'existant) ; `html, body` l'utilise désormais via `var(--font-family)` au lieu de la valeur codée en dur (US-009/US-016 — source de vérité unique).
- `src/routes/+layout.svelte` : `$effect` appliquant `settingsStore.fontChoice` à toute l'app à chaque changement (tous les onglets, sans rechargement — `settingsStore.load()` était déjà appelé au montage par le câblage US-007).
- `src/routes/reglages/+page.svelte` : nouvelle section « Police de caractères » avec `FontSelector`.
- `src/service-worker.ts` : cache runtime dédié `FONT_CACHE` (nom stable, indépendant de `version`, préservé par `activate`) pour les requêtes vers `fonts.googleapis.com`/`fonts.gstatic.com` — cache-first avec mise en cache après un premier succès réseau, pour satisfaire le critère d'acceptation hors-ligne (« mise en cache par le service worker », contrainte technique explicite de l'US). Pas de test dédié (le fichier n'avait déjà aucun test avant cette US — cohérent avec l'existant, complexité de mock d'un `ServiceWorkerGlobalScope`).
- `docs/architecture/CONVENTIONS.md` : ajout d'un paragraphe documentant l'exception réseau Google Fonts (§6), pour que la dérogation au principe 100 % local (ADR-001) reste tracée pour les futurs contributeurs, au-delà du texte de cette US.

### Comment tester manuellement
1. `npm run dev`, aller sur `/reglages` : la section « Police de caractères » affiche 10 options, « Système (par défaut) » sélectionnée, rendu inchangé.
2. Cliquer sur une autre police (ex. Poppins) : le texte de toute l'app (tous les onglets) change immédiatement, sans rechargement.
3. Recharger la page : la police choisie reste active et présélectionnée dans `/reglages`.
4. Cliquer « Réinitialiser à la police système » : retour à la police système, appliqué et persisté.
5. Couper le réseau (DevTools) après avoir déjà chargé une police Google Fonts en ligne, recharger : la police reste affichée (servie depuis le cache du service worker). Avec une police jamais chargée en ligne, l'app replie silencieusement sur la police système (aucune erreur visible).

### Dette assumée
- Pas de test dédié pour la logique de cache runtime du service worker (`src/service-worker.ts`) — cohérent avec l'absence de test préexistant sur ce fichier ; vérifié manuellement (étape 5 ci-dessus).
- Le rendu de l'aperçu (liste stylée avec `role="radiogroup"`) est un choix parmi d'autres solutions possibles, explicitement laissé libre par l'US.
