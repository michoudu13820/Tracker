---
type: user-story
id: US-024
titre: Indicateur de régularité apaisé sur la carte d'habitude
date: 2026-08-12
auteur: product-owner
statut: livrée
priorite: Should
estimation: M
source: chat
depend_de: ["US-001", "US-004", "US-005"]
---

## Titre : US-024 — Indicateur de régularité apaisé sur la carte d'habitude

### Récit
> **En tant qu'** utilisateur de l'app,
> **je veux** voir sur la carte de chaque habitude un indicateur neutre de ma régularité récente,
> **afin de** avoir un repère visuel utile sur mes derniers jours, sans pression de performance ni logique de série à ne pas rompre.

### Critères d'acceptation

**Scénario 1 — Pastilles des 7 derniers jours**
> **Étant donné** une habitude « Yoga » a été faite lundi, mercredi et vendredi de la semaine passée
> **Quand** je consulte l'écran « Habitudes »
> **Alors** sa carte affiche une représentation visuelle neutre de ses 7 derniers jours (par exemple 7 pastilles, une par jour), chaque pastille indiquant si l'habitude a été faite ou non ce jour-là
> **Et** aucun chiffre de type « jours d'affilée » ni icône de flamme n'apparaît

**Scénario 2 — Compteur mensuel neutre**
> **Étant donné** une habitude a été faite 12 fois depuis le début du mois en cours
> **Quand** je consulte sa carte
> **Alors** un texte neutre du type « 12 fois ce mois-ci » est affiché
> **Et** aucune mention de série, de record personnel ou de rupture n'apparaît nulle part sur la carte

**Scénario 3 — Absence de toute mécanique de streak**
> **Étant donné** une habitude a été faite plusieurs jours d'affilée puis n'a pas été faite un jour où elle était due
> **Quand** je consulte sa carte le lendemain de cette absence
> **Alors** aucun compteur « 🔥 X jours d'affilée » n'est affiché
> **Et** aucun message de type « série brisée » ou « record battu/perdu » n'apparaît, ni sur cette carte ni ailleurs dans l'application

**Scénario 4 — Jours non dus distingués des jours manqués**
> **Étant donné** une habitude a une fréquence « lundi, mercredi, vendredi »
> **Quand** je consulte les pastilles des 7 derniers jours sur sa carte
> **Alors** les jours où l'habitude n'était pas due (ex : mardi, jeudi) sont visuellement distincts des jours où elle était due mais non faite (ex : pastille neutre/grisée « non concerné » vs pastille vide « manqué »)

### Priorité
Should — répond à un besoin explicitement exprimé par l'utilisateur (lecture apaisée de sa régularité) et s'inscrit dans la continuité du ton pastel déjà livré (US-009), sans être bloquant pour l'usage courant.

### Estimation
M — nouvel indicateur visuel sur la carte d'habitude (US-010), calcul de complétion sur une fenêtre de 7 jours et sur le mois en cours à partir de l'historique déjà existant (US-004/US-005), sans nouvelle donnée à stocker.

### Dépendances
US-001 (habitude existante), US-004/US-005 (historique de complétion déjà produit et disponible), US-009/US-010 (cohérence visuelle pastel et carte restylée à étendre).

### Notes / hors périmètre
- **Exclut explicitement toute mécanique de streak** (compteur de jours d'affilée, record personnel, notion de série à ne pas rompre) : refus exprès de l'utilisateur (arbitrage du 2026-08-12), à ne jamais réintroduire même sous une autre forme (ex : « série actuelle : 5 »).
- Le nombre de jours affichés en pastilles (7) et le libellé « X fois ce mois-ci » sont des choix par défaut raisonnables proposés dans cette US ; ajustables au moment de l'implémentation si le PO précise une autre préférence.
- Ne couvre pas d'historique détaillé au-delà de 7 jours sur la carte elle-même : la vue complète sur une période plus longue reste la responsabilité du résumé (US-005).
- Ne couvre pas le signal « manquée hier » (US-025), qui est une US distincte bien que visuellement complémentaire.

## Implémentation

Tous les scénarios sont satisfaits et couverts par des tests.

**Fichiers créés :**
- `src/lib/domain/regularity.ts` — `last7DaysRegularity(habit, completions, today, windowDays=7)`
  (7 jours en ordre chronologique croissant, statut `done`/`missed`/`not-due` par jour, jamais
  de champ de type série) et `monthlyCompletionCount(habit, completions, today)` (compteur
  neutre depuis le 1er du mois courant).
- `src/lib/domain/regularity.test.ts` — fenêtre de 7 jours, distinction `missed`/`not-due`
  (fréquence hebdomadaire), absence de tout champ streak, compteur mensuel.

**Fichiers modifiés :**
- `src/routes/habitudes/HabitCard.svelte` — nouvelles props `completions`/`today` ; affiche 7
  pastilles (`role="img"`, `aria-label` du type « Lun : fait/manqué/non concerné ») sous le nom
  de l'habitude, puis un texte neutre « N fois ce mois-ci ». Couleurs dérivées des variables
  pastel existantes (`--habit-border` pour « fait », contour `--muted` pour « manqué », fond
  `--surface-border` pour « non concerné ») — aucune couleur d'alerte (rouge/danger) pour rester
  apaisé, conformément à l'intention de l'US.
- `src/routes/habitudes/+page.svelte` — calcule `today` (jour réel) et transmet
  `completionsStore.habitCompletions` à chaque `HabitCard`.
- `src/routes/habitudes/HabitCard.test.ts` — `completions`/`today` ajoutés aux props par défaut
  (`baseProps`) pour ne pas casser les tests existants (US-013/US-015/US-017).

**Fichiers de test créés/modifiés :**
- `src/routes/habitudes/HabitCard.test.ts` — nouveau bloc US-024 : 7 pastilles affichées,
  compteur mensuel, absence de toute mention 🔥/série/record/jours d'affilée, distinction
  manqué/non concerné sur une habitude à fréquence hebdomadaire.

**Comment tester manuellement :** créer une habitude « Yoga » (lundi/mercredi/vendredi), cocher
quelques jours passés dans le planning `/`, puis consulter `/habitudes` : la carte affiche 7
pastilles (dont certaines grisées les jours non concernés) et « N fois ce mois-ci », sans aucun
chiffre de série.

**Dette / points assumés :** aucun écart avec la spécification. Choix par défaut assumés comme
suggéré par l'US (7 jours, libellé « N fois ce mois-ci ») — ajustables si le PO précise une
autre préférence. L'indicateur est affiché pour toute habitude visible (y compris en pause), son
calcul restant purement historique (fréquence à la date considérée), indépendant du statut
actif/en pause courant — non précisé explicitement par l'US, jugé cohérent avec une lecture
« régularité passée ».
