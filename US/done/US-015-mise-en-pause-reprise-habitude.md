---
type: user-story
id: US-015
titre: Mise en pause et reprise d'une habitude
date: 2026-08-12
auteur: product-owner
statut: livrée
priorite: Should
estimation: M
source: chat
depend_de: ["US-001", "US-004", "US-005"]
---

## Titre : US-015 — Mise en pause et reprise d'une habitude

### Récit
> **En tant qu'** utilisateur de l'app,
> **je veux** pouvoir mettre une habitude en pause plutôt que la supprimer, puis la réactiver plus tard,
> **afin de** arrêter temporairement de suivre une habitude (vacances, blessure, période creuse…) sans perdre l'historique déjà accompli ni devoir la recréer de zéro.

### Critères d'acceptation

**Scénario 1 — Mise en pause depuis l'écran Habitudes**
> **Étant donné** je suis sur l'écran « Habitudes » et une habitude « Yoga » est active
> **Quand** je déclenche l'action « Mettre en pause » sur cette habitude
> **Alors** l'habitude est marquée comme « en pause »
> **Et** elle est visuellement distinguée des habitudes actives dans la liste (par exemple un badge « En pause »)

**Scénario 2 — Disparition du planning des jours suivants**
> **Étant donné** une habitude est en pause
> **Quand** je consulte le planning d'un jour (aujourd'hui ou un jour futur) où elle aurait normalement dû apparaître selon sa fréquence
> **Alors** cette habitude n'apparaît pas dans le planning de ce jour

**Scénario 3 — Conservation de l'historique déjà enregistré**
> **Étant donné** une habitude avait des jours cochés comme faits avant sa mise en pause
> **Quand** je mets cette habitude en pause
> **Alors** l'historique de complétion déjà enregistré pour les jours passés n'est ni supprimé ni modifié
> **Et** cet historique reste visible et pris en compte dans le résumé « Habit tracker » (US-005) sur les périodes concernées

**Scénario 4 — Réactivation d'une habitude en pause**
> **Étant donné** une habitude est actuellement en pause
> **Quand** je déclenche l'action « Réactiver » (ou « Reprendre ») sur cette habitude
> **Alors** l'habitude redevient active
> **Et** elle réapparaît dans le planning des jours suivants dès qu'elle est due selon sa fréquence
> **Et** elle n'est plus distinguée visuellement comme « en pause » dans la liste

**Scénario 5 — Absence de mise en pause pour les tâches ponctuelles**
> **Étant donné** je suis sur l'écran « Tâches »
> **Quand** je consulte les actions disponibles sur une tâche
> **Alors** aucune action de « mise en pause » ne m'est proposée : les tâches ponctuelles n'ont pas de récurrence à interrompre — seule la suppression (US-014) s'applique aux tâches

### Priorité
Should — alternative de confort à la suppression, réduit un frein réel (peur de perdre l'historique en supprimant) mais n'est pas bloquant pour le MVP déjà livré.

### Estimation
M — ajout d'un statut actif/en pause sur l'habitude, filtrage du planning (`habitsDueOn`), actions de bascule pause/reprise sur l'écran « Habitudes », badge visuel, vérification de non-régression sur le résumé (US-005), tests domain + store.

### Dépendances
US-001 (habitude à mettre en pause), US-004 (planning quotidien — dont le filtrage doit exclure les habitudes en pause), US-005 (résumé — doit continuer d'inclure l'historique des habitudes en pause sur les périodes où elles étaient actives).

### Notes / hors périmètre
- **Interprétation assumée du besoin** : cette US regroupe volontairement la mise en pause *et* sa reprise (« réactiver ») en un seul livrable. Une mise en pause qui ne pourrait pas être annulée depuis l'interface n'aurait pas de valeur autonome pour l'utilisateur : il faudrait alors supprimer l'habitude et en recréer une nouvelle, ce qui viderait le mécanisme de son intérêt par rapport à la suppression (US-013). Si l'équipe préfère néanmoins livrer en deux temps (mise en pause seule, puis reprise), cette US peut être scindée en US-015a/US-015b sans perte de cohérence fonctionnelle.
- Le comportement du planning pour un **jour passé** antérieur à la mise en pause (par exemple en naviguant dans le passé via la frise de dates, US-011) n'est **pas spécifié** par cette US — seul le comportement pour les « jours suivants » (US-004) est un critère testable ici. À clarifier avec le PO si un cas d'usage réel l'exige.
- N'introduit pas de notion de pause programmée dans le temps (type « en pause jusqu'au … ») : la pause est un état binaire actif/en pause, déclenché et levé manuellement par l'utilisateur, sans date de reprise automatique.
- Ne couvre pas la suppression (US-013) : les deux actions (supprimer / mettre en pause) restent distinctes et coexistent sur l'écran « Habitudes ».
- Le statut « en pause » est propre aux habitudes ; il n'a pas d'équivalent pour les tâches ponctuelles (scénario 5).

## Implémentation

**Note sur l'ordre de traitement** : conformément à la demande explicite de traiter les US dans
l'ordre 013 → 014 → 015 → 016, le mécanisme de statut (`HabitStatus` = `active`/`paused`/`deleted`)
avait déjà été construit en intégralité lors de l'implémentation d'US-013 (voir sa section
Implémentation), précisément pour que cette US-015 n'ait plus qu'à ajouter les actions et le badge
UI sur un mécanisme déjà en place, sans créer un second système de statut. Le point « pas spécifié »
concernant un jour passé antérieur à la mise en pause a été tranché de façon simple et uniforme :
`habitsDueOn` (utilisée par le planning quel que soit le jour affiché, y compris en navigant dans le
passé via la frise US-011) exclut les habitudes non actives, sans distinction passé/futur — cohérent
avec la lettre des critères testables (jours suivants) et le plus simple à raisonner.

Les 5 scénarios sont couverts et vérifiés par les tests automatisés (voir fichiers ci-dessous). Le
mécanisme de statut, le filtrage du planning et la non-régression du résumé étaient déjà en place et
testés depuis US-013 ; cette US ajoute l'UI d'action et son test dédié de non-régression résumé.

### Fichiers modifiés
- `src/routes/habitudes/HabitCard.svelte` : badge « En pause » (visible uniquement si `isHabitPaused`), bloc d'actions secondaires avec bascule « Mettre en pause » / « Réactiver » selon le statut courant.
- `src/routes/habitudes/+page.svelte` : `handlePause` / `handleResume`, tous deux basés sur `habitsStore.setStatus` (même méthode que la suppression US-013), câblés vers `HabitCard`.
- Tests étendus : `src/routes/habitudes/HabitCard.test.ts` (badge + bascule d'action), `src/routes/habitudes/page.test.ts` (intégration store réel, pause → badge → réactivation), `src/lib/domain/summary.test.ts` (non-régression : l'historique d'une habitude en pause/supprimée reste compté), `src/lib/components/TaskItem.test.ts` (scénario 5 : aucune action de pause sur les tâches — déjà garanti par construction, l'action n'a jamais existé sur `TaskItem`).
- Le filtrage du planning (`habitsDueOn` exclut les habitudes non actives) et `HabitsStore.setStatus` avaient déjà été livrés avec US-013 ; aucune modification supplémentaire nécessaire ici.

### Comment tester manuellement
1. `npm run dev`, aller sur `/habitudes` avec au moins une habitude « Yoga ».
2. Cliquer « Mettre en pause » sous sa carte → un badge « En pause » apparaît, l'action devient « Réactiver ».
3. Aller sur `/` (planning) un jour où Yoga serait normalement due → elle n'apparaît plus.
4. Aller sur `/resume` → l'historique de Yoga (jours cochés avant la pause) reste visible et compté.
5. Revenir sur `/habitudes`, cliquer « Réactiver » → le badge disparaît, Yoga réapparaît dans le planning dès qu'elle est due.
6. Sur `/taches`, vérifier qu'aucune action de mise en pause n'est jamais proposée sur une tâche.

### Dette assumée
- Le comportement du planning pour un jour **passé** antérieur à la mise en pause suit la même règle uniforme que les jours futurs (habitude non active toujours exclue) — un choix assumé faute de critère testable explicite sur ce point (voir Notes de l'US).
