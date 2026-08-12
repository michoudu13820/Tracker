---
type: user-story
id: US-002
titre: Création et édition d'une tâche ponctuelle
date: 2026-08-09
auteur: product-owner
statut: livrée
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

## Implémentation

Scénarios 1, 3, 4 couverts et testés directement dans cette US. Scénario 2 (distinction visuelle
habitude/tâche quand les deux catégories apparaissent **ensemble** sur un même écran) est posé
ici via une convention visuelle (icône ✅ + liseré distinctif) mais ne peut être vérifié en situation
réelle qu'une fois l'écran combiné livré par US-004 (planning quotidien) — c'est là qu'il sera
testé de bout en bout.

### Fichiers créés
- `src/lib/domain/tasks.ts` (complété) — `validateTaskDraft` (nom + date obligatoires, scénario 3) et `validateReschedule` (réservé à US-003, ajouté ici car colocalisé avec le reste de la validation des tâches).
- `src/routes/taches/TaskForm.svelte` — formulaire de création/édition (colocalisé) : nom, date, messages d'erreur.
- `src/routes/taches/TaskForm.test.ts` — tests de composant couvrant les scénarios 1, 3, 4.

### Fichiers modifiés
- `src/lib/domain/tasks.test.ts` — ajout des tests `validateTaskDraft` / `validateReschedule`.
- `src/routes/taches/+page.svelte` — remplace le placeholder : liste des tâches triée par date, badge ✅ + liseré distinctif (convention réutilisée en US-004), bouton de création, clic pour éditer. Utilise `tasksStore` existant sans modification nécessaire.

### Comment tester manuellement
1. `npm run dev`, aller sur `/taches`.
2. Créer « Prendre rendez-vous dentiste » à la date 15/08/2026 → apparaît dans la liste triée par date.
3. Essayer de valider sans nom ou sans date → message d'erreur, rien n'est créé.
4. Cliquer sur la tâche → formulaire pré-rempli ; changer le nom et/ou la date ; enregistrer → la liste reflète les nouvelles valeurs et le nouveau tri par date.

### Hypothèses produit tranchées
- Aucune ambiguïté bloquante rencontrée ; les seuls points laissés ouverts (distinction visuelle
  en contexte combiné, cf. scénario 2) sont explicitement de la responsabilité de US-004 selon
  la note de dépendances de US-002 elle-même.
