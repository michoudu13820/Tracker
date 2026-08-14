---
type: user-story
id: US-032
titre: Fréquence « certains jours du mois » pour une habitude
date: 2026-08-14
auteur: product-owner
statut: livrée
priorite: Should
estimation: M
source: chat
depend_de: ["US-001", "US-004"]
---

## Titre : US-032 — Fréquence « certains jours du mois » pour une habitude

### Récit
> **En tant qu'** utilisateur de l'app,
> **je veux** pouvoir définir qu'une habitude revient à certains jours précis du mois (par exemple le 1 et le 15), en plus des fréquences « tous les N jours » et « jours de la semaine » déjà existantes,
> **afin de** suivre mes routines calées sur le calendrier mensuel (relevés, paiements, ménage de fond, sauvegardes…) sans devoir les recréer manuellement chaque mois.

### Critères d'acceptation

**Scénario 1 — Création avec un seul jour du mois**
> **Étant donné** je suis sur l'écran de création d'une habitude
> **Quand** je saisis un nom « Relevé de compteur », un emoji « 📊 », que je choisis le mode de fréquence « jours du mois » et que je sélectionne le 1
> **Et** je valide la création
> **Alors** l'habitude est enregistrée avec la fréquence « le 1 de chaque mois »
> **Et** elle apparaît dans la liste des habitudes avec un libellé lisible indiquant ce jour du mois

**Scénario 2 — Sélection multiple de jours du mois**
> **Étant donné** je suis sur l'écran de création d'une habitude en mode « jours du mois »
> **Quand** je sélectionne à la fois le 1 et le 15
> **Et** je valide la création
> **Alors** l'habitude est enregistrée avec ces deux jours du mois
> **Et** son libellé lisible mentionne les deux jours, dans l'ordre croissant, quel que soit l'ordre dans lequel je les ai cochés

**Scénario 3 — Choix offert de 1 à 31**
> **Étant donné** je suis sur l'écran de création d'une habitude en mode « jours du mois »
> **Alors** je peux sélectionner n'importe quel jour de 1 à 31 inclus
> **Et** la sélection fonctionne par bascule (cocher / décocher) comme la sélection multiple des jours de la semaine déjà existante
> **Et** aucune valeur hors de l'intervalle 1–31 n'est proposée ni acceptée

**Scénario 4 — Exclusivité des trois modes de fréquence**
> **Étant donné** je suis en train de créer une habitude et j'ai déjà renseigné le mode « intervalle en jours » ou « jours de la semaine »
> **Quand** je bascule vers le mode « jours du mois »
> **Alors** les valeurs précédemment saisies pour l'autre mode sont réinitialisées ou masquées
> **Et** un seul mode de fréquence est actif à la fois : il est impossible d'enregistrer une habitude avec plusieurs modes renseignés simultanément
> **Et** la réciproque est vraie : quitter le mode « jours du mois » pour un autre mode réinitialise la sélection de jours du mois

**Scénario 5 — Aucun jour du mois sélectionné**
> **Étant donné** je suis sur l'écran de création d'une habitude, mode « jours du mois » choisi
> **Quand** je tente de valider sans avoir sélectionné aucun jour
> **Alors** la création est bloquée
> **Et** un message m'indique qu'il faut sélectionner au moins un jour du mois

**Scénario 6 — Jour inexistant dans le mois : repli sur le dernier jour du mois**
> **Étant donné** une habitude « Sauvegarde » est prévue le 31 de chaque mois
> **Quand** je consulte le mois d'avril (30 jours)
> **Alors** l'occurrence de ce mois-là tombe le 30 avril (dernier jour du mois)
> **Et** en février d'une année non bissextile, elle tombe le 28 février
> **Et** en février d'une année bissextile, elle tombe le 29 février
> **Et** dans un mois de 31 jours, elle tombe bien le 31

**Scénario 7 — Deux jours sélectionnés se repliant sur la même date : une seule occurrence**
> **Étant donné** une habitude est prévue le 30 **et** le 31 de chaque mois
> **Quand** je consulte février d'une année non bissextile
> **Alors** une seule occurrence est prévue ce mois-là, le 28 février
> **Et** cette journée n'affiche pas deux fois la même habitude dans le planning
> **Et** cocher cette occurrence une fois la marque comme faite pour ce jour-là (pas de double comptage dans les statistiques)

**Scénario 8 — Cas limite du 29 février**
> **Étant donné** une habitude est prévue le 29 de chaque mois
> **Quand** je consulte février d'une année non bissextile
> **Alors** l'occurrence tombe le 28 février (dernier jour du mois)
> **Et** en février d'une année bissextile, elle tombe le 29 février
> **Et** aucun mois n'est jamais laissé sans occurrence à cause de ce repli

**Scénario 9 — Apparition dans le planning quotidien**
> **Étant donné** une habitude est prévue le 1 et le 15 de chaque mois
> **Quand** je navigue dans le planning quotidien jusqu'au 1 ou jusqu'au 15
> **Alors** l'habitude apparaît dans la liste des habitudes du jour, au même titre qu'une habitude à fréquence par intervalle ou par jours de semaine
> **Et** elle n'apparaît aucun autre jour du mois
> **Et** je peux la cocher / décocher exactement comme les autres habitudes

**Scénario 10 — Édition d'une habitude vers ou depuis le mode « jours du mois »**
> **Étant donné** une habitude « Ménage de fond » existe avec une fréquence « jours de la semaine »
> **Quand** je l'édite pour passer en mode « jours du mois » avec le 1 et le 15, puis je valide
> **Alors** la nouvelle fréquence remplace l'ancienne
> **Et** les jours déjà cochés dans le passé pour cette habitude restent inchangés dans l'historique
> **Et** en rouvrant le formulaire d'édition, le mode « jours du mois » est bien pré-sélectionné avec le 1 et le 15 cochés

**Scénario 11 — Rétro-compatibilité totale des habitudes existantes**
> **Étant donné** des habitudes ont été créées avant cette évolution et sont déjà enregistrées sur mon téléphone, avec une fréquence par intervalle ou par jours de semaine
> **Quand** j'ouvre l'application après la mise à jour
> **Alors** toutes ces habitudes sont toujours présentes, avec exactement la même fréquence, le même historique et le même comportement qu'avant
> **Et** aucune donnée n'est effacée, réécrite ni convertie
> **Et** je ne suis à aucun moment invité à réaliser une migration ou une action de reprise

**Scénario 12 — Habitude à jours du mois avec cible chiffrée, en pause ou supprimée**
> **Étant donné** une habitude à fréquence « jours du mois » a une cible chiffrée (US-017/US-018), ou est mise en pause (US-015), ou est supprimée (US-013)
> **Quand** je consulte le planning
> **Alors** elle se comporte exactement comme une habitude des autres fréquences dans ces mêmes situations (suivi de la quantité, disparition du planning en pause/supprimée, conservation de l'historique)
> **Et** aucune règle spécifique à la fréquence mensuelle ne vient contredire ces comportements déjà livrés

### Priorité
Should — nouveau mode de récurrence explicitement demandé par l'utilisateur, qui complète les deux modes existants et débloque un type de routine aujourd'hui impossible à suivre correctement. Non bloquant pour l'usage courant de l'app, donc pas `Must`.

### Estimation
M — nouveau variant de fréquence dans le modèle, nouvelle règle d'occurrence avec repli fin de mois et déduplication, extension du formulaire de création/édition (sélection multiple 1–31) et du libellé lisible de fréquence. Le calcul « une habitude est-elle prévue ce jour ? » est déjà centralisé en un seul point du domaine, ce qui limite fortement la diffusion du changement.

### Dépendances
- **US-001** : formulaire de création/édition d'habitude et modèle de fréquence existants, à étendre d'un troisième mode.
- **US-004** : planning quotidien, qui doit afficher les occurrences mensuelles au bon jour.
- **US-033** : US complémentaire (et non pré-requis) qui garantit la cohérence des vues de suivi et des rappels avec ce nouveau mode — à livrer immédiatement après celle-ci.
- Contrainte technique connue : la persistance locale (IndexedDB) ne doit subir **aucune migration destructive** ; le nouveau mode doit s'ajouter aux fréquences existantes sans réécrire les habitudes déjà enregistrées.

### Notes / hors périmètre
- **Règle de repli tranchée par l'utilisateur, non renégociable** : un jour sélectionné qui n'existe pas dans un mois donné (31 en avril, 29/30/31 en février) déclenche l'occurrence le **dernier jour du mois**. L'option « pas d'occurrence ce mois-là » a été explicitement écartée.
- **Déduplication tranchée** : si plusieurs jours sélectionnés se replient sur la même date, il n'y a **qu'une seule occurrence** ce jour-là (scénario 7).
- **Sélection multiple assumée** : le mode est symétrique du multi-jours de la semaine existant, pas un simple « tous les X du mois » à valeur unique.
- Pas d'option dédiée « dernier jour du mois » dans cette US : sélectionner le 31 produit déjà ce comportement grâce à la règle de repli. Une option nommée explicitement pourrait faire l'objet d'une évolution ultérieure si le libellé « 31 » s'avère peu clair à l'usage.
- Pas de récurrence « le 2ᵉ mardi du mois », ni « tous les N mois », ni de récurrence annuelle : hors périmètre, non demandé.
- **Occurrences antérieures à la création de l'habitude** : le comportement reste identique à celui déjà en place pour le mode « jours de la semaine » (les jours passés correspondant à la fréquence sont considérés comme prévus même avant la création de l'habitude). Cette US ne change pas cette règle ; son effet visible sur le résumé est traité par US-035 (scénario dédié).
- Le rendu visuel exact du sélecteur de jours 1–31 (grille, taille des cibles tactiles) relève du design ; seule contrainte fonctionnelle : rester utilisable au pouce sur iPhone, cohérent avec le sélecteur de jours de la semaine existant.

---

## Résumé d'implémentation (2026-08-14)

**Tous les critères d'acceptation (scénarios 1 à 12) sont satisfaits.** Quality gate vert
(`npm run check` 0 erreur, `vitest run` 453 tests, `npm run build` OK).

### Fichiers modifiés
| Fichier | Nature |
|---|---|
| `src/lib/domain/types.ts` | Nouveau variant `{ kind: 'monthdays'; monthdays: MonthDay[] }` **ajouté** à l'union `Frequency` (aucun champ existant touché) + type `MonthDay` |
| `src/lib/domain/occurrences.ts` | Nouvelle fonction pure `resolveMonthDays()` (repli fin de mois + déduplication) ; `isDueOn()` gère le 3ᵉ variant |
| `src/lib/domain/habits.ts` | `HabitDraft.monthdays`, type `FrequencyMode`, validation du mode, `draftToFrequency` / `frequencyToDraft`, `describeFrequency`, helpers `MONTH_DAY_ORDER` / `isValidMonthDay` / `sortedUniqueMonthDays` / `monthDayLabel` |
| `src/lib/components/HabitForm.svelte` | 3ᵉ bouton de mode + grille de sélection 1–31 (7 colonnes, cibles ≥ 40 px) + note d'aide sur la règle de repli |
| `src/lib/domain/occurrences.test.ts`, `habits.test.ts`, `HabitForm.test.ts`, `habits.store.svelte.test.ts` | Tests des 12 scénarios, dont repli 31→30/28/29, déduplication 30+31, rétro-compatibilité |

### Choix d'implémentation
- **Un seul point de vérité** : la règle de repli et la déduplication vivent dans
  `resolveMonthDays()`, consommée par `isDueOn()`. Comme `isDueOn()` est déjà le point unique
  interrogé par le planning, le résumé, la régularité, les rappels et le badge, la
  déduplication est **structurellement gratuite** (une date est due ou non, jamais « due deux
  fois ») — scénario 7 garanti par construction, pas par un traitement ad hoc.
- **Rétro-compatibilité** : aucune migration, aucun code de conversion, aucun champ ajouté aux
  habitudes existantes. Un test dédié (`habits.store.svelte.test.ts`) verrouille cette absence
  en vérifiant l'égalité stricte après `load()` et l'absence d'écriture au chargement.
- **Libellé** : « Le 1er de chaque mois », « Les 1er et 15 de chaque mois », « Les 3, 15 et 28
  de chaque mois » — toujours en ordre croissant, tri/déduplication faits à l'enregistrement.

### Test manuel
1. `/habitudes` → « Nouvelle habitude » → mode « Jours du mois » → cocher 1 et 15 → Créer.
2. Vérifier le libellé de la carte : « Les 1er et 15 de chaque mois ».
3. Sur `/` (planning), naviguer dans la frise jusqu'au 1 ou au 15 : l'habitude apparaît et se
   coche normalement ; les autres jours, elle est absente.
4. Créer une habitude sur le 30 **et** le 31, puis naviguer jusqu'au 28 février : une seule
   ligne s'affiche.
