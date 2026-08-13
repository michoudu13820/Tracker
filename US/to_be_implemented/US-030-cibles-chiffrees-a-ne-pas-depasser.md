---
type: user-story
id: US-030
titre: Cibles chiffrées « à ne pas dépasser »
date: 2026-08-12
auteur: product-owner
statut: prête
priorite: Could
estimation: L
source: chat
depend_de: ["US-017", "US-018", "US-019"]
---

## Titre : US-030 — Cibles chiffrées « à ne pas dépasser »

### Récit
> **En tant qu'** utilisateur de l'app,
> **je veux** pouvoir définir, pour une habitude à cible chiffrée, une limite maximale à ne pas dépasser plutôt qu'un minimum à atteindre,
> **afin de** pouvoir aussi suivre des habitudes que je cherche à réduire (ex : nombre de cafés), pas seulement des habitudes que je cherche à augmenter.

### Critères d'acceptation

**Scénario 1 — Choix du sens de la cible à la création**
> **Étant donné** je crée une habitude à cible chiffrée (US-017)
> **Quand** je renseigne sa cible
> **Alors** je peux choisir si elle représente un minimum « à atteindre » (comportement actuel d'US-017) ou un maximum « à ne pas dépasser »

**Scénario 2 — Suivi quotidien d'une cible « à ne pas dépasser »**
> **Étant donné** une habitude a une cible « à ne pas dépasser » fixée à 2 (ex : « Cafés », maximum 2/jour)
> **Quand** je saisis une progression dans le planning (US-018) qui dépasse cette limite (ex : 3)
> **Alors** l'élément est signalé visuellement comme ayant dépassé sa limite, et non comme « fait » au sens d'un objectif atteint

**Scénario 3 — Élément conforme quand la limite n'est pas dépassée**
> **Étant donné** une habitude a une cible « à ne pas dépasser » fixée à 2
> **Quand** je saisis une progression du jour égale ou inférieure à 2
> **Alors** l'élément est signalé comme conforme (statut positif), de façon visuellement cohérente avec le traitement des cibles « minimum » déjà livré par US-018

**Scénario 4 — Compatibilité avec le résumé existant**
> **Étant donné** une habitude à cible « à ne pas dépasser » a un historique de progressions quotidiennes
> **Quand** je consulte le résumé « Habit tracker » (US-005/US-019)
> **Alors** le code couleur du résumé reflète correctement, pour chaque jour, le respect ou le dépassement de la limite
> **Et** l'affichage des habitudes à cible minimum déjà existantes n'est pas modifié ni régressé

### Priorité
Could — non planifiée : aucune date ni version cible n'est fixée pour l'instant (arbitrage produit du 2026-08-12). US rédigée pour mémoire.

### Estimation
L — étend le mécanisme de cible chiffrée (US-017), son suivi quotidien (US-018) et sa compatibilité avec le résumé (US-019) pour un second sens de cible, avec un impact potentiel sur le calcul de couleur du résumé.

### Dépendances
US-017 (mécanisme de cible chiffrée à étendre), US-018 (suivi quotidien à adapter au sens « maximum »), US-019 (compatibilité résumé à étendre au nouveau sens de cible).

### Notes / hors périmètre
- **Priorisée basse et explicitement NON PLANIFIÉE** (arbitrage utilisateur du 2026-08-12) : rédigée pour mémoire dans le backlog, à ne pas engager sans nouvelle priorisation explicite du PO.
- Ne couvre pas de changement rétroactif du sens d'une cible existante (une habitude déjà créée avec une cible « minimum » resterait « minimum » sauf modification manuelle explicite) — comportement de migration à préciser si cette US est un jour engagée.
