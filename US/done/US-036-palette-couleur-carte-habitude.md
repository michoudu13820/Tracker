---
type: user-story
id: US-036
titre: Palette de couleurs de carte et couleur choisie par habitude
date: 2026-08-14
auteur: product-owner
statut: livrée
priorite: Should
estimation: M
source: chat
depend_de: ["US-001", "US-009", "US-010", "US-026", "US-029"]
---

## Titre : US-036 — Palette de couleurs de carte et couleur choisie par habitude

### Récit
> **En tant qu'** utilisateur de l'app,
> **je veux** choisir, habitude par habitude, la couleur de sa carte parmi une palette pastel proposée,
> **afin de** repérer d'un coup d'œil mes habitudes dans mes listes et de les regrouper visuellement selon mes propres repères (sport, maison, santé…).

### Contexte (état constaté dans le code)
Toutes les cartes ont aujourd'hui exactement le même habillage, centralisé dans `src/app.css`
(US-009/US-029) : fond `--surface`, bordure `--surface-border`, **liseré gauche de 4 px** en
`--habit-border` pour les habitudes (`/habitudes`, planning) et en `--accent` pour les tâches —
soit, en pratique, **la même teinte violette `#c9a6e6` dans les deux cas**. La distinction
habitude/tâche n'est donc **pas** portée par la couleur du liseré mais par les sections séparées
et les icônes (🔁 / ✅) — point à ne pas régresser. Le thème sombre (US-029) décline exactement
les mêmes noms de variables, sans qu'aucun composant ne code de couleur en dur.

Cette US porte **la palette partagée** (créée ici, réutilisée telle quelle par US-037) **et son
application aux habitudes**.

### Critères d'acceptation

**Scénario 1 — Palette fermée proposée à la création**
> **Étant donné** je suis sur l'écran de création d'une habitude
> **Quand** j'arrive sur le champ de couleur
> **Alors** un choix de 6 à 8 teintes pastel prédéfinies m'est proposé, et aucune autre
> **Et** aucun sélecteur de couleur libre, roue chromatique ou saisie de code hexadécimal n'est proposé
> **Et** chaque teinte proposée est identifiable autrement que par sa seule pastille colorée (nom lisible ou libellé accessible du type « Menthe »)

**Scénario 2 — Création avec une couleur choisie**
> **Étant donné** je crée une habitude « Yoga » 🧘
> **Quand** je sélectionne la teinte « Menthe » et je valide
> **Alors** l'habitude est enregistrée avec cette couleur
> **Et** sa carte s'affiche dans cette teinte sur l'écran « Habitudes » **et** dans le planning du jour, à l'identique

**Scénario 3 — Couleur non choisie : couleur par défaut, aucune régression visuelle**
> **Étant donné** je crée une habitude sans toucher au choix de couleur
> **Quand** je valide
> **Alors** l'habitude est créée avec la couleur par défaut
> **Et** sa carte s'affiche **exactement** comme avant cette évolution (liseré violet lavande actuel, fond de carte inchangé)

**Scénario 4 — Habitudes déjà enregistrées avant cette évolution**
> **Étant donné** des habitudes ont été créées avant cette évolution et ne portent donc aucune couleur
> **Quand** j'ouvre l'application après la mise à jour
> **Alors** elles s'affichent toutes avec la couleur par défaut, sans aucune erreur ni écran vide
> **Et** aucune de leurs données existantes (nom, emoji, fréquence, cible, statut, date de reprise, historique de complétion) n'est perdue ni modifiée
> **Et** aucune étape de migration ou de ressaisie ne m'est demandée

**Scénario 5 — Changement de couleur en édition**
> **Étant donné** une habitude « Yoga » est en « Menthe »
> **Quand** je l'édite, sélectionne « Ciel » et valide
> **Alors** sa carte passe en « Ciel » immédiatement, sur tous les écrans où elle apparaît
> **Et** ses autres champs et son historique de complétion sont inchangés

**Scénario 6 — Retour à la couleur par défaut**
> **Étant donné** une habitude a une couleur autre que la couleur par défaut
> **Quand** je l'édite et sélectionne à nouveau la teinte par défaut
> **Alors** sa carte revient au rendu par défaut, identique à celui d'une habitude n'ayant jamais eu de couleur

**Scénario 7 — Ajout rapide depuis le planning**
> **Étant donné** j'utilise l'ajout rapide « Nouvelle habitude » depuis le planning (US-026), qui réutilise le formulaire complet de création
> **Quand** le formulaire s'ouvre
> **Alors** le même choix de couleur y est disponible, avec les mêmes teintes et la même valeur par défaut
> **Et** si je ne choisis rien, l'habitude créée porte la couleur par défaut

**Scénario 8 — Mode clair et mode sombre**
> **Étant donné** j'ai des habitudes de plusieurs teintes différentes
> **Quand** mon téléphone est en mode clair, puis en mode sombre (US-029)
> **Alors** chaque teinte dispose d'une déclinaison adaptée au thème en cours (jamais la même valeur brute dans les deux thèmes)
> **Et** le nom de l'habitude, sa fréquence et ses badges restent lisibles sur la carte dans les deux thèmes (contraste texte/fond d'au moins 4,5:1)
> **Et** la carte reste visuellement distincte du fond de l'écran dans les deux thèmes

**Scénario 9 — Deux teintes voisines restent distinguables**
> **Étant donné** deux habitudes de teintes différentes se suivent dans la liste
> **Quand** j'affiche l'écran
> **Alors** je distingue les deux cartes l'une de l'autre, et chacune reste identifiable comme une carte distincte du fond

**Scénario 10 — La couleur ne porte jamais seule une information**
> **Étant donné** j'utilise un lecteur d'écran, ou je consulte l'app en niveaux de gris
> **Quand** je parcours une carte d'habitude colorée
> **Alors** toutes les informations de la carte (nom, emoji, fréquence, cible, état fait/non fait, badges « En pause » / « Supprimée » / « manquée hier », pastilles de régularité) restent restituées et compréhensibles sans percevoir la couleur
> **Et** la couleur de carte n'est jamais utilisée pour signifier un état, un statut ou une priorité : elle est un repère personnel choisi par moi

**Scénario 11 — Cohabitation avec les couleurs déjà porteuses de sens**
> **Étant donné** une habitude colorée affiche un badge d'état (« En pause » en ambre, « Supprimée » en rouge, « manquée hier ») et ses pastilles de régularité (US-024/US-025)
> **Quand** sa carte est affichée dans n'importe quelle teinte de la palette
> **Alors** ces badges et pastilles restent parfaitement lisibles et gardent leur sémantique (ambre = en pause, rouge = supprimée), sans se fondre dans la teinte de la carte
> **Et** une carte de teinte verte (« Menthe ») ne peut jamais être confondue avec un état « fait », ni une carte de teinte rosée avec un état « en retard » : la teinte de carte est appliquée avec une intensité nettement plus faible que les teintes de statut

**Scénario 12 — Le résumé n'est pas coloré par les couleurs de carte**
> **Étant donné** mes habitudes portent des couleurs personnalisées
> **Quand** j'ouvre l'écran « Résumé » (US-005/US-034/US-035)
> **Alors** son rendu est strictement inchangé : les trois états ✅ / ⬜ / ❌ et leurs teintes de cellule ne sont ni teintés, ni concurrencés par les couleurs de carte
> **Et** aucune couleur de carte n'y apparaît

**Scénario 13 — Aucun réglage global**
> **Étant donné** je souhaite changer la couleur d'une seule habitude
> **Quand** je modifie sa couleur
> **Alors** aucune autre habitude ni aucune tâche n'est affectée
> **Et** aucun réglage global de couleur n'existe dans l'écran « Réglages »

### Priorité
Should — confort de lecture et d'organisation demandé explicitement par l'utilisateur, sans impact sur le fonctionnement de l'app ni sur les données existantes.

### Estimation
M — introduit une palette fermée centralisée (6 à 8 teintes × 2 thèmes) dans `app.css` dans l'esprit d'US-009/US-029, un nouveau champ optionnel sur l'habitude, un contrôle de sélection dans le formulaire partagé (US-001/US-026) et l'application de la teinte aux trois rendus de carte d'habitude (`/habitudes`, planning « case à cocher », planning « cible chiffrée »).

### Dépendances
- **US-001** : formulaire de création/édition d'habitude, à étendre d'un champ.
- **US-009** : centralisation des couleurs en variables CSS — la palette doit être ajoutée à cette source de vérité unique, jamais codée en dur dans un composant.
- **US-029** : chaque teinte doit avoir sa déclinaison sombre, déclarée dans le bloc `prefers-color-scheme: dark` existant, avec les mêmes noms de variables (parité déjà testée par `src/app.css.test.ts`).
- **US-010** : habillage de carte partagé (`--card-radius`/`--card-padding`, liseré gauche) sur lequel la teinte se greffe.
- **US-026** : l'ajout rapide réutilise le formulaire complet — le champ y est donc disponible sans travail spécifique (scénario 7 = non-régression à vérifier, pas fonctionnalité à construire).
- **Contrainte non négociable** : champ **optionnel** en persistance, `undefined` = couleur par défaut, **aucune migration** de l'IndexedDB existante — même principe que `Habit.status` (US-013/US-015) et `Task.dueTime` (US-021).

### Notes / hors périmètre
- **Arbitrages déjà tranchés avec l'utilisateur, non renégociables** : palette **fermée** (pas de sélecteur libre), choix **par élément** (pas de réglage global), **couleur par défaut** appliquée aux éléments existants comme aux nouveaux, rétro-compatibilité totale.
- **Décision PO — surface d'application de la teinte** : la couleur habille le **liseré latéral** de la carte et, au plus, un **fond de carte très légèrement teinté**. Elle ne teinte **jamais** les badges de statut, la case à cocher, la barre de progression d'une cible chiffrée, ni les pastilles de régularité. C'est ce qui garantit les scénarios 10 et 11.
- **Décision PO — couleur par défaut** : la teinte par défaut est le **violet lavande actuel** (`--habit-border`/`--accent`), afin qu'une habitude sans couleur choisie soit **strictement identique** à aujourd'hui. Elle fait partie des teintes sélectionnables ; la sélectionner explicitement produit le même rendu que ne rien choisir (l'implémentation est libre de persister ou non la valeur dans ce cas).
- **Teintes indicatives, à valider visuellement** (même principe qu'US-009 qui n'a pas figé ses teintes) : Lavande (défaut), Rose, Pêche, Sable, Menthe, Ciel, Bleu, Gris. Ce qui est figé : le **caractère fermé** de la liste, son **cardinal (6 à 8)**, l'existence d'une **déclinaison claire ET sombre** par teinte, et le **contraste** du scénario 8.
- Hors périmètre : couleur des tâches ponctuelles (**US-037**, qui réutilise strictement la palette introduite ici), tout tri ou filtre par couleur, toute notion de catégorie/tag, toute couleur dans les notifications push, toute couleur dans le résumé.
- Cette US **ne modifie aucune couleur sémantique existante** (`--success-*`, `--danger-*`, `--warning-*`, états ✅/⬜/❌ du résumé livrés par US-035) : elle ajoute des variables, elle n'en réaffecte aucune.

---

## Résumé d'implémentation (2026-08-14)

**Tous les critères d'acceptation sont satisfaits.** Quality gate vert (`npm run check` 0 erreur,
548 tests Vitest, `npm run build` OK).

### Palette retenue (8 teintes, liste fermée)

Nommage des variables : `--tint-<teinte>-bg` (fond de carte) et `--tint-<teinte>-border` (liseré
gauche de 4 px d'US-010), déclarées deux fois dans `src/app.css` — `:root` et
`@media (prefers-color-scheme: dark)`.

| Teinte | Clair `-bg` / `-border` | Sombre `-bg` / `-border` |
|---|---|---|
| Lavande (défaut) | `#fffbfc` / `#c9a6e6` | `#2e222a` / `#c9a6e6` |
| Rose | `#fdf1f6` / `#e79ac0` | `#3a2028` / `#e08bb0` |
| Pêche | `#fdf2eb` / `#f0a97c` | `#3a2a1e` / `#dda06f` |
| Sable | `#fcf5e4` / `#d9b871` | `#372f1c` / `#cfb069` |
| Menthe | `#edf8f1` / `#84c79c` | `#1e3328` / `#74b993` |
| Ciel | `#eaf6fb` / `#7cc0da` | `#1c2f36` / `#6bb2cd` |
| Bleu | `#eff0fc` / `#93a1df` | `#232739` / `#8b9ada` |
| Gris | `#f3f2f4` / `#aea5ac` | `#2c2a2e` / `#a49aa2` |

Contrastes WCAG mesurés **par test automatique** (`src/app.css.test.ts` calcule la luminance
relative depuis le CSS réel) : `--text` sur chaque fond ≥ 9,89:1 en clair et ≥ 10,95:1 en sombre ;
`--muted` ≥ 4,77:1 en clair et ≥ 5,17:1 en sombre — au-dessus du seuil de 4,5:1 du scénario 8 dans
les deux thèmes, pour les 8 teintes.

**Arbitrage tracé** : `--tint-lavande-border` est volontairement identique en clair et en sombre
(`#c9a6e6`), seule exception à la règle « jamais la même valeur brute dans les deux thèmes » du
scénario 8. Motif : le scénario 3 exige que le défaut soit *strictement* identique au rendu actuel,
et `--habit-border`/`--accent` sont eux-mêmes déjà invariants par thème depuis US-029. Les 7 autres
teintes ont bien deux valeurs distinctes (fond **et** liseré), ce qui est vérifié par test.

### Fichiers créés
- `src/lib/domain/card-colors.ts` — palette fermée : identifiants, libellés, teinte par défaut,
  `resolveCardColor` (`undefined`/valeur inconnue → défaut), `cardColorStyle` (branche les
  variables CSS, **aucune couleur en dur**), `cardColorToPersist` (le défaut n'est pas persisté).
- `src/lib/domain/card-colors.test.ts`
- `src/lib/components/CardColorPicker.svelte` — groupe de boutons radio, un par teinte, avec
  libellé texte visible ; partagé avec US-037. Exporté par le barrel.
- `src/lib/components/CardColorPicker.test.ts`

### Fichiers modifiés
- `src/app.css` — 16 variables de teinte en clair, 16 en sombre.
- `src/app.css.test.ts` — parité clair/sombre étendue au préfixe `--tint`, contrôle du cardinal
  (6–8) et de l'alignement avec le domaine, calcul WCAG des contrastes, unicité des teintes,
  égalité stricte Lavande = `--surface`/`--habit-border`, non-régression des couleurs sémantiques.
- `src/lib/domain/types.ts` — `Habit.color?: CardColor` (optionnel).
- `src/lib/domain/habits.ts` — `HabitDraft.color`, `colorToDraft`, `draftToColor`.
- `src/lib/components/HabitForm.svelte` — champ couleur + **correction de non-régression** : le
  formulaire repartait d'un objet neuf et perdait `status`/`resumeAt` en édition (scénario 5) ;
  il reprend désormais l'habitude existante par étalement.
- `src/routes/habitudes/HabitCard.svelte`, `src/routes/HabitCheckItem.svelte`,
  `src/routes/HabitProgressItem.svelte` — fond + liseré teintés via `--card-tint`/`--card-accent`,
  avec repli sur le rendu d'avant US-036 ; badges, pastilles de régularité, case à cocher et barre
  de progression restent inchangés (scénarios 10/11).
- Tests : `HabitForm.test.ts`, `HabitCard.test.ts`, `HabitCheckItem.test.ts`,
  `habits.store.svelte.test.ts` (rétro-compatibilité IndexedDB : relecture à l'identique, aucun
  champ ajouté, aucune réécriture au chargement).

### Comment tester manuellement
1. `/habitudes` → « + Nouvelle habitude » : le bloc « Couleur de la carte » propose 8 pastilles
   **nommées**, aucun sélecteur libre. Créer sans y toucher → carte identique à avant.
2. Éditer une habitude, choisir « Menthe » → la carte change immédiatement sur `/habitudes` **et**
   dans le planning `/`. Rechoisir « Lavande » → retour au rendu par défaut.
3. Planning `/` → « + Ajouter » → « Nouvelle habitude » : le même champ couleur est présent (US-026).
4. Basculer l'iPhone en mode sombre (Réglages → Luminosité) : chaque teinte doit rester lisible.
5. Les habitudes créées avant la mise à jour s'affichent normalement, sans écran vide ni ressaisie.

### Reste ouvert
- Validation **visuelle sur iPhone** (mode clair et sombre, luminosité basse, True Tone) : les
  contrastes sont garantis par calcul, mais l'agrément des teintes et la distinguabilité perçue de
  la paire la plus proche (Ciel / Bleu, 30° d'écart de teinte) ne se jugent que sur l'appareil.
