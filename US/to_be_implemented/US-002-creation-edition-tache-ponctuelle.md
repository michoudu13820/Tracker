---
type: user-story
id: US-002
titre: Création et édition d'une tâche ponctuelle
date: 2026-08-09
auteur: product-owner
statut: prête
priorite: Must
estimation: S
source: chat
depend_de: []
---

## Titre : US-002 — Création et édition d'une tâche ponctuelle

### Récit
> **En tant qu'** utilisateur de l'app,
> **je veux** créer et modifier une tâche ponctuelle avec un nom et une date,
> **afin de** suivre les choses à faire non récurrentes, séparément de mes habitudes.

### Critères d'acceptation

**Scénario 1 — Création nominale**
> **Étant donné** je suis sur l'écran de création d'une tâche
> **Quand** je saisis un nom « Prendre rendez-vous dentiste » et une date « 15/08/2026 »
> **Et** je valide la création
> **Alors** la tâche est enregistrée avec ce nom et cette date
> **Et** elle apparaît dans la liste des tâches

**Scénario 2 — Distinction visuelle avec les habitudes**
> **Étant donné** j'ai au moins une habitude et une tâche ponctuelle existantes
> **Quand** j'affiche un écran où les deux catégories apparaissent ensemble
> **Alors** je peux distinguer immédiatement, sans lire le contenu textuel, si un élément est une habitude ou une tâche (ex : section séparée, icône ou style différent)
> **Et** les tâches sont regroupées dans une liste distincte de la liste des habitudes

**Scénario 3 — Champs obligatoires manquants**
> **Étant donné** je suis sur l'écran de création d'une tâche
> **Quand** je tente de valider sans avoir renseigné de nom ou sans avoir choisi de date
> **Alors** la création est bloquée
> **Et** un message m'indique le ou les champs manquants

**Scénario 4 — Édition d'une tâche existante**
> **Étant donné** une tâche « Prendre rendez-vous dentiste » existe avec une date au 15/08/2026
> **Quand** je modifie son nom et/ou sa date
> **Et** je valide les modifications
> **Alors** les nouvelles valeurs remplacent les anciennes
> **Et** la tâche apparaît désormais à la date mise à jour dans les vues qui en dépendent (planning, listes)

### Priorité
Must (socle du MVP)

### Estimation
S

### Dépendances
Aucune fonctionnelle. Partage des conventions visuelles de distinction habitude/tâche avec US-001.

### Notes / hors périmètre
- La suppression d'une tâche n'est pas couverte par cette US.
- La gestion des tâches en retard et leur reprogrammation font l'objet d'une US dédiée (US-003).
- Pas de notion de récurrence pour une tâche (par définition, une tâche est ponctuelle) : toute récurrence relève d'une habitude (US-001).
