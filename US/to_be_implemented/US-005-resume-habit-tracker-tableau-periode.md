---
type: user-story
id: US-005
titre: Résumé "Habit tracker" en tableau sur une période
date: 2026-08-09
auteur: product-owner
statut: prête
priorite: Should
estimation: L
source: chat
depend_de: ["US-001", "US-002", "US-004"]
---

## Titre : US-005 — Résumé « Habit tracker » en tableau sur une période

### Récit
> **En tant qu'** utilisateur de l'app,
> **je veux** consulter un résumé sous forme de tableau de mes habitudes sur une période (semaine, mois ou année) ainsi que le pourcentage de tâches ponctuelles réalisées, avec des colonnes en jours pour les périodes semaine et mois (cellule binaire coché/non coché), et des colonnes en mois pour la période année (cellule affichant un pourcentage de complétion coloré selon des seuils),
> **afin d'** évaluer ma régularité et ma progression dans le temps, avec une lecture rapide grâce au code couleur sur la vue longue durée.

### Critères d'acceptation

**Scénario 1 — Affichage par défaut sur la semaine (cellule binaire)**
> **Étant donné** j'accède à la vue résumé « Habit tracker »
> **Alors** la période affichée par défaut est la semaine en cours
> **Et** le tableau affiche les jours de la semaine en colonnes et une ligne par habitude
> **Et** chaque cellule indique de façon binaire si l'habitude a été cochée ce jour-là (coché / non coché), uniquement pour les jours où l'habitude était prévue selon sa fréquence
> **Et** cette cellule journalière n'affiche ni pourcentage ni code couleur graduel (elle n'a que deux états : fait / non fait)

**Scénario 2 — Bascule vers la période mois (cellule binaire, comme la semaine)**
> **Étant donné** je suis sur la vue résumé en période « semaine »
> **Quand** je bascule sur la période « mois »
> **Alors** le tableau affiche les jours du mois en cours en colonnes, avec les mêmes lignes d'habitudes et le même rendu binaire par jour (coché / non coché) que pour la vue semaine

**Scénario 3 — Bascule vers la période année : agrégation par mois avec pourcentage et code couleur (colonnes = mois)**
> **Étant donné** je suis sur la vue résumé
> **Quand** je bascule sur la période « année »
> **Alors** le tableau affiche les 12 mois de l'année en cours en colonnes (et non les jours), avec une ligne par habitude
> **Et** chaque cellule « habitude x mois » affiche le pourcentage de complétion de cette habitude sur ce mois, calculé comme (nombre de jours cochés ce mois-là / nombre de jours où l'habitude était prévue ce mois-là selon sa fréquence)
> **Et** la cellule est colorée selon ce pourcentage à l'aide d'un code couleur à 3 niveaux (vert / jaune / rouge)

**Scénario 3ter — Seuils de couleur par défaut**
> **Étant donné** aucun seuil personnalisé n'a été configuré par l'utilisateur (valeurs par défaut de l'application)
> **Quand** j'affiche une cellule « habitude x mois » en vue année
> **Alors** la cellule est colorée en vert si le pourcentage de complétion est supérieur ou égal à 80 %
> **Et** elle est colorée en jaune si le pourcentage est supérieur ou égal à 40 % et strictement inférieur à 80 %
> **Et** elle est colorée en rouge si le pourcentage est strictement inférieur à 40 %

**Scénario 3quater — Utilisation des seuils personnalisés s'ils existent**
> **Étant donné** l'utilisateur a configuré des seuils de couleur personnalisés (cf. US dédiée au paramétrage des seuils)
> **Quand** j'affiche une cellule « habitude x mois » en vue année
> **Alors** le code couleur appliqué à la cellule respecte les seuils personnalisés configurés, et non les valeurs par défaut 80 %/40 %

**Scénario 3bis — Seule la vue « année » agrège par mois**
> **Étant donné** je suis sur la vue résumé
> **Quand** je sélectionne la période « semaine » ou la période « mois »
> **Alors** le tableau conserve des colonnes en jours (comme décrit au scénario 1 pour la semaine et au scénario 2 pour le mois)
> **Et** seule la période « année » bascule l'affichage en colonnes mensuelles

**Scénario 4 — Indicateur de pourcentage de tâches réalisées par jour (périodes semaine et mois)**
> **Étant donné** la période affichée est « semaine » ou « mois » et contient des jours ayant au moins une tâche ponctuelle programmée
> **Alors** pour chaque jour concerné, un indicateur distinct des lignes d'habitudes affiche le pourcentage de tâches ponctuelles de ce jour qui ont été validées (ex : 2 tâches faites sur 3 = 67 %)

**Scénario 4bis — Indicateur de pourcentage de tâches réalisées par mois (période année)**
> **Étant donné** la période affichée est « année » et qu'au moins un mois contient des tâches ponctuelles programmées
> **Alors** pour chaque mois concerné, un indicateur distinct des lignes d'habitudes affiche le pourcentage de tâches ponctuelles de ce mois qui ont été validées, agrégé sur l'ensemble des tâches du mois

**Scénario 5 — Jour (ou mois) sans tâche programmée**
> **Étant donné** un jour de la période « semaine »/« mois », ou un mois de la période « année », n'a aucune tâche ponctuelle programmée
> **Alors** l'indicateur de pourcentage de tâches pour cette colonne affiche une valeur neutre explicite (ex : « — » ou « aucune tâche »), et non un pourcentage trompeur comme 0 % ou 100 %

**Scénario 6 — Jour sans occurrence d'habitude prévue (périodes semaine et mois)**
> **Étant donné** une habitude n'était pas prévue un jour donné de la période « semaine » ou « mois » (ce jour ne correspond pas à sa fréquence)
> **Alors** la cellule de ce jour pour cette habitude est visuellement neutre, distincte d'une cellule « non faite »

**Scénario 6bis — Mois sans aucune occurrence d'habitude prévue (période année)**
> **Étant donné** une habitude n'avait aucune occurrence prévue sur un mois donné de l'année (ce mois ne contient aucun jour correspondant à sa fréquence)
> **Alors** la cellule de ce mois pour cette habitude est visuellement neutre, distincte d'une cellule indiquant un taux de complétion de 0 %

**Scénario 7 — Navigation entre périodes**
> **Étant donné** j'affiche le résumé pour la semaine en cours
> **Quand** je navigue vers la période précédente ou suivante (semaine, mois ou année selon le mode actif)
> **Alors** le tableau se met à jour avec les données de la période sélectionnée

### Priorité
Should (vient après le socle MVP : création d'habitudes/tâches et planning quotidien)

### Estimation
L

### Dépendances
US-001 (habitudes à synthétiser), US-002 (tâches à synthétiser), US-004 (source des états de complétion quotidiens)

### Notes / hors périmètre
- Le calcul de statistiques avancées (taux de complétion global, séries/streaks, tendances) n'est pas couvert par cette US : elle se limite à l'affichage brut du tableau et de l'indicateur de % de tâches par jour/mois.
- L'export ou le partage du résumé n'est pas couvert.
- Granularité tranchée : périodes « semaine » et « mois » → colonnes en jours, cellule binaire (coché/non coché) sans pourcentage ni couleur graduelle ; période « année » → colonnes en mois, cellule affichant un pourcentage de complétion coloré (vert ≥ 80 %, jaune [40 % ; 80 %[, rouge < 40 % par défaut).
- Cette US livre le rendu avec les **seuils par défaut (80 % / 40 %) codés en dur**, sans exposer de réglage à l'utilisateur. Le **paramétrage de ces seuils par l'utilisateur** (écran de réglages) fait l'objet d'une US dédiée séparée (voir US-006), afin que US-005 reste livrable indépendamment.
- Le rendu visuel exact des couleurs (nuances précises, accessibilité daltonisme) n'est pas spécifié ici et relève d'un détail UI à trancher avec le design.
