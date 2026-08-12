---
type: user-story
id: US-020
titre: Ajout de la police Dancing Script et changement de la police par défaut de l'application
date: 2026-08-12
auteur: product-owner
statut: livrée
priorite: Should
estimation: S
source: chat
depend_de: [US-016]
---

## Titre : US-020 — Ajout de la police Dancing Script et changement de la police par défaut de l'application

### Récit
> **En tant qu'** utilisateur de l'application,
> **je veux** que la police « Dancing Script » (police manuscrite/cursive de Google Fonts) soit
> disponible dans le sélecteur de police des Réglages et devienne la police affichée par défaut
> dans toute l'application,
> **afin de** bénéficier d'une identité visuelle plus personnelle et chaleureuse dès la première
> utilisation, tout en gardant la liberté de revenir à une police plus classique si je le
> souhaite.

### Contexte (état actuel constaté dans le code, US-016 livrée)
US-016 a livré un catalogue de 10 polices sélectionnables (`src/lib/domain/fonts.ts`,
`FONT_OPTIONS`), avec « Système (par défaut) » comme valeur par défaut (`DEFAULT_FONT_CHOICE =
'system'`), une application globale à toute l'app via une variable CSS centralisée
(`--font-family` dans `src/app.css`, consommée par `html, body`), un chargement Google Fonts
avec repli automatique sur la pile système en cas d'échec réseau (empilage CSS, pas de logique
JS de détection d'erreur), un cache runtime dédié dans le service worker
(`FONT_CACHE`, `src/service-worker.ts`) pour les polices Google Fonts déjà utilisées au moins
une fois en ligne, et une persistance du choix via `SettingsRepository.getFontChoice` /
`saveFontChoice` (clé IndexedDB `font-choice`) : si aucune valeur n'est stockée, le repository
retourne `DEFAULT_FONT_CHOICE` — ce qui signifie qu'aujourd'hui, en pratique, un utilisateur qui
n'a **jamais ouvert le sélecteur ni fait de choix explicite** ne laisse aucune trace en base :
son affichage dépend uniquement de la constante `DEFAULT_FONT_CHOICE`, recalculée à chaque
démarrage. C'est ce mécanisme déjà en place, et lui seul, que cette US exploite pour changer la
police par défaut sans casser les choix déjà faits (voir critères d'acceptation ci-dessous).

Aucun distinguo n'existe dans le code entre « police appliquée à tout le texte de l'app » et
« police appliquée à une partie de l'interface » : la variable `--font-family` est unique et
globale. Cette US suit donc le même principe que US-016 : le mot « par défaut » dans cette US
désigne bien la police de **toute l'application** (tous les onglets : Aujourd'hui, Habitudes,
Tâches, Résumé, Réglages), pas une police réservée à certains éléments — hypothèse assumée
explicitement, cf. « Notes / hors périmètre ».

### Décision produit tranchée — Dancing Script comme nouvelle police par défaut
L'utilisateur souhaite ajouter [Dancing Script](https://fonts.google.com/specimen/Dancing+Script)
(police manuscrite/cursive) au catalogue existant et en faire la **nouvelle police par défaut**
de l'application, à la place de la police système actuelle. Cette décision est assumée alors que
Dancing Script tranche fortement avec les 10 polices déjà au catalogue (principalement des
sans-serif d'interface lisibles — Inter, Poppins, Nunito, Quicksand, Roboto, Lato — et deux
serif/monospace de confort de lecture — Merriweather, Playfair Display, JetBrains Mono) : une
police cursive est par nature moins lisible qu'une police d'interface classique, en particulier
à petite taille ou pour du texte dense (ex. tableau du Résumé, US-005). Ce compromis de
lisibilité est un choix produit assumé et volontaire, pas un oubli — il n'est pas dans le
périmètre de cette US de le limiter à certains écrans ou d'introduire une police d'interface
distincte d'une police de contenu (voir « Notes / hors périmètre »). L'utilisateur garde à tout
moment la liberté de changer de police (dont revenir à « Système ») depuis les Réglages, exactement
comme pour les 10 polices existantes.

### Critères d'acceptation

> **Étant donné** le catalogue de polices existant (10 options, US-016),
> **Quand** le catalogue est étendu par cette US,
> **Alors** une 11ᵉ option « Dancing Script » apparaît dans le sélecteur de police des Réglages,
> chargée depuis Google Fonts (même mécanisme que les autres polices Google Fonts du catalogue :
> même famille de repli CSS système en dernier recours, même URL de feuille de style combinée),
> présentée avec un aperçu visuel dans son propre rendu cursif comme les autres options.

> **Étant donné** un utilisateur qui n'a **jamais fait de choix de police explicite** (aucune
> valeur stockée pour `font-choice`, que ce soit un utilisateur tout nouveau ou un utilisateur
> déjà installé avant cette US mais n'ayant jamais ouvert/modifié le sélecteur de police),
> **Quand** il ouvre l'application (n'importe quel onglet) après le déploiement de cette US,
> **Alors** le texte de toute l'application s'affiche avec la police Dancing Script, sans action
> de sa part.

> **Étant donné** l'écran Réglages ouvert par un utilisateur n'ayant jamais fait de choix
> explicite,
> **Quand** la page se charge,
> **Alors** le sélecteur de police affiche « Dancing Script » comme option présélectionnée
> (marquée comme la police par défaut), à la place de « Système » qui n'est plus présélectionnée
> par défaut.

> **Étant donné** un utilisateur ayant **déjà fait un choix de police explicite** avant le
> déploiement de cette US (une valeur est stockée pour `font-choice`, quelle que soit cette
> valeur — y compris s'il avait explicitement choisi « Système »),
> **Quand** il ouvre l'application après le déploiement de cette US,
> **Alors** sa police précédemment choisie reste active et affichée telle quelle, sans
> bascule automatique vers Dancing Script ni vers aucune autre police — son choix explicite
> n'est jamais écrasé silencieusement par le changement de valeur par défaut.

> **Étant donné** le sélecteur de police affiché avec une police autre que Dancing Script
> sélectionnée,
> **Quand** j'utilise l'action de réinitialisation à la police par défaut,
> **Alors** la police revient à Dancing Script (nouvelle valeur par défaut) et ce choix est
> immédiatement appliqué et persisté comme un choix explicite — l'action et son libellé ne
> doivent plus faire référence spécifiquement à la « police système », puisque la police système
> n'est plus la police par défaut.

> **Étant donné** l'application utilisée hors-ligne (pas de connexion réseau),
> **Quand** Dancing Script a déjà été chargée au moins une fois en ligne lors d'une session
> précédente,
> **Alors** elle s'affiche normalement, servie depuis le cache du service worker (même mécanisme
> `FONT_CACHE` que les autres polices Google Fonts, aucun traitement spécial pour Dancing
> Script).

> **Étant donné** une toute première utilisation de l'application, sans connexion réseau dès le
> premier lancement (aucune police Google Fonts n'a donc jamais pu être mise en cache),
> **Quand** l'application démarre,
> **Alors** l'application reste pleinement utilisable et lisible : le texte s'affiche replié
> silencieusement sur la police système par défaut (dernier maillon de la pile CSS), sans texte
> invisible ni erreur, en attendant qu'une connexion permette de charger Dancing Script — l'usage
> hors-ligne de base (ADR-001) n'est jamais bloqué par le nouveau choix de police par défaut.

### Autres champs
- **Priorité** : Should
- **Estimation** : S
- **Dépendances** :
  - US-016 (livrée) — réutilise strictement le catalogue de polices, le mécanisme d'application
    globale via `--font-family`, la persistance du réglage (`SettingsRepository` /
    `settingsStore`), le cache runtime du service worker (`FONT_CACHE`) et le mécanisme de repli
    CSS sur la pile système. Cette US n'introduit aucun nouveau mécanisme technique, uniquement
    une nouvelle entrée de catalogue et un changement de valeur par défaut.
  - Aucune dépendance vis-à-vis du lot US-017/US-018/US-019 (cibles chiffrées d'habitudes),
    sujet indépendant.
  - Point d'attention pour l'implémentation (non prescriptif sur la solution) : le libellé et
    l'action du bouton de réinitialisation actuel (« Réinitialiser à la police système ») sont
    couplés dans US-016 à la police système en tant que défaut ; cette US requiert que l'action
    de réinitialisation cible désormais la nouvelle police par défaut (Dancing Script), ce qui
    implique très probablement un ajustement du libellé et/ou de la logique de « police par
    défaut » pour plus la coupler en dur à `'system'`.
- **Notes / hors périmètre** :
  - **Hypothèse assumée explicitement** : « par défaut » signifie la police de **toute
    l'application** (tous les onglets), pas une police réservée à certains éléments ou écrans —
    aucune distinction de ce type n'existe dans le code existant (US-016), et cette US n'en
    introduit pas.
  - **Compromis de lisibilité assumé** : Dancing Script est une police cursive, moins lisible
    qu'une police d'interface classique pour du texte dense (ex. tableau du Résumé, US-005) ou à
    petite taille. Ce choix esthétique est délibéré et assumé par l'utilisateur ; cette US ne
    prévoit pas de mécanisme de police différenciée par contexte (ex. police cursive pour les
    titres uniquement, police lisible pour le contenu) — un utilisateur gêné par la lisibilité
    peut changer de police à tout moment depuis les Réglages, exactement comme pour les 10
    polices existantes.
  - **Règle de non-écrasement des choix existants** : seule la valeur par défaut utilisée en
    l'absence de choix explicite change. Aucune migration de données n'est nécessaire ni
    souhaitée : le mécanisme déjà existant de `SettingsRepository.getFontChoice` (absence de clé
    stockée = valeur par défaut) suffit à distinguer nativement « jamais choisi » de « choisi
    explicitement », y compris pour un choix explicite de « Système » fait avant cette US.
  - Le nombre total de polices proposées passe de 10 à 11 ; l'US-016 mentionnait « une
    dizaine » de polices, ce qui reste cohérent avec cet ajout.
  - Le réglage de taille de police reste hors périmètre (inchangé depuis US-016).

### Résumé d'implémentation

Tous les critères d'acceptation sont satisfaits. Aucun nouveau mécanisme technique introduit :
strictement une 11ᵉ entrée de catalogue + un changement de constante par défaut + un ajustement
de libellés, comme prévu par l'US.

**Fichiers modifiés :**
- `src/lib/domain/fonts.ts` — ajout du type `'dancing-script'` à `FontChoice`, ajout de l'option
  `googleOption('dancing-script', 'Dancing Script (par défaut)', 'Dancing Script')` en 11ᵉ et
  dernière position du catalogue (même mécanisme `googleOption` que les 9 autres polices Google
  Fonts, même repli CSS système en dernier maillon), `DEFAULT_FONT_CHOICE` passé de `'system'` à
  `'dancing-script'`, libellé de l'option système passé de `'Système (par défaut)'` à
  `'Système'` (elle n'est plus la police par défaut).
- `src/routes/reglages/FontSelector.svelte` — libellé du bouton de réinitialisation passé de
  « Réinitialiser à la police système » à « Réinitialiser à la police par défaut » (la logique,
  déjà générique via la comparaison à `DEFAULT_FONT_CHOICE`, n'a pas eu besoin de changer).
- `src/routes/reglages/+page.svelte`, `src/lib/stores/settings.store.svelte.ts` — commentaires
  mis à jour (aucun changement de logique : `handleResetFont`, `SettingsStore.fontChoice` et
  `SettingsRepository.getFontChoice`/`saveFontChoice` étaient déjà génériques vis-à-vis de
  `DEFAULT_FONT_CHOICE`, donc automatiquement corrects avec la nouvelle valeur).
- `src/service-worker.ts` — aucune modification : le cache `FONT_CACHE` fonctionne déjà par nom
  d'hôte (`fonts.googleapis.com`/`fonts.gstatic.com`), pas par police, donc Dancing Script en
  bénéficie nativement dès son premier chargement en ligne.

**Fichiers de tests modifiés :**
- `src/lib/domain/fonts.test.ts` — catalogue à 11 options, nouveau libellé de l'option système,
  Dancing Script en 11ᵉ position avec son libellé « (par défaut) », `DEFAULT_FONT_CHOICE` ===
  `'dancing-script'`, présence de `family=Dancing+Script` dans l'URL Google Fonts combinée.
- `src/lib/fonts/client.test.ts` — `applyFontChoice('dancing-script')` applique la pile CSS
  attendue et charge la feuille de style Google Fonts (même comportement que les autres polices).
- `src/routes/reglages/FontSelector.test.ts` — présélection de Dancing Script, non-présélection
  de Système, 11 options rendues chacune avec son propre style, nouveau libellé du bouton de
  réinitialisation (et absence du terme « police système » dans ce libellé), activation/
  désactivation du bouton selon que la police par défaut est déjà active.
- `src/lib/stores/settings.store.svelte.ts` (test) — état initial en mémoire (avant `load()`)
  égal à `DEFAULT_FONT_CHOICE` (`'dancing-script'`), et scénario de réinitialisation explicite
  vers `DEFAULT_FONT_CHOICE`.

**Comportement de non-régression (critère « non-écrasement ») :** aucune migration de données
n'a été ajoutée, conformément à l'US — `SettingsRepository.getFontChoice` retourne la valeur
stockée si elle existe (choix explicite passé, y compris `'system'`), sinon
`DEFAULT_FONT_CHOICE` (désormais Dancing Script). Ce mécanisme était déjà en place avant cette US
et n'a pas été modifié.

**Comment tester manuellement :**
1. Ouvrir `/reglages` sur un profil IndexedDB n'ayant jamais enregistré de choix de police (ou
   après avoir vidé le stockage local) : le texte de toute l'app (tous les onglets) s'affiche en
   Dancing Script, et l'option « Dancing Script (par défaut) » est présélectionnée dans le
   sélecteur.
2. Choisir une autre police (ex. Inter) : bascule immédiate, persistée ; recharger la page — le
   choix explicite reste actif (pas de retour à Dancing Script).
3. Cliquer sur « Réinitialiser à la police par défaut » : retour à Dancing Script, action
   persistée comme un choix explicite, bouton désactivé une fois Dancing Script actif.
4. Couper le réseau après un premier chargement en ligne de Dancing Script, recharger l'app :
   Dancing Script reste affichée (servie par le cache `FONT_CACHE` du service worker).
5. Simuler un tout premier lancement hors-ligne (jamais de cache Google Fonts) : le texte reste
   lisible, replié silencieusement sur la pile système (dernier maillon CSS), sans erreur.
