---
name: implement-user-story
description: >-
  Orchestre l'implémentation d'une User Story de bout en bout en gérant son cycle de vie :
  sélection dans US/to_be_implemented, déplacement vers US/in_progress pendant le codage,
  implémentation conforme à l'architecture, tests reflétant les critères Given/When/Then,
  quality gate, puis déplacement vers US/done et mise à jour du backlog. À utiliser quand
  l'utilisateur demande « implémente l'US », « développe cette story », « prends la prochaine US ».
---

# Implémenter une User Story

Réalise une US de bout en bout en respectant son cycle de vie et l'architecture du projet.

## Cycle de vie (obligatoire)
```
US/to_be_implemented/ → US/in_progress/ → US/done/
```
Déplace physiquement le fichier de l'US à chaque transition (Windows : `Move-Item`) et mets à jour son `statut` + l'index `US/BACKLOG.md`.

## Étapes

### 1. Sélection & prise en charge
- Liste `US/to_be_implemented/` (Glob). Choisis l'US par priorité MoSCoW (ou celle demandée par l'utilisateur).
- Lis l'US entière : récit, critères d'acceptation Given/When/Then, `depend_de`.
- Si une dépendance n'est pas en `US/done/`, signale le blocage avant de continuer.
- **Déplace** l'US vers `US/in_progress/`, passe `statut: en cours`, mets à jour le backlog.

### 2. Conception locale
- Lis `docs/architecture/CONVENTIONS.md` (pense-bête condensé, lecture par défaut). Ne va lire une ADR complète (`docs/architecture/ADR-*.md`) que si un point précis n'y est pas couvert.
- Décide où placer chaque morceau : `lib/domain` (métier pur), `lib/data` (repository), `lib/stores` (runes), `lib/components` / `routes/` (UI).
- Si une décision d'architecture manque, sollicite `sveltekit-architect` / un ADR — ne tranche pas seul un choix majeur.

### 3. Implémentation (test-first quand possible)
- Code couche par couche : domaine → data → store → UI.
- Réutilise les skills `create-data-repository`, `create-store`, `add-route`, `add-component`.
- Écris les tests avec `write-svelte-tests`, un test par critère d'acceptation.

### 4. Vérification
- Lance `run-quality-gate` (typecheck + lint + tests + build). Corrige jusqu'au vert.
- Coche chaque critère d'acceptation satisfait dans le fichier US.

### 5. Clôture
- **Déplace** l'US vers `US/done/`, `statut: livrée`.
- Ajoute une section `## Implémentation` dans l'US : fichiers créés/modifiés, comment tester manuellement, dette éventuelle assumée.
- Mets à jour `US/BACKLOG.md` (statut + chemin).

## Règles
- **Pas de `done`** sans quality gate vert ni sans tous les critères satisfaits.
- **Périmètre = l'US** : ni scope creep, ni critère oublié.
- Critère ambigu → demande clarification, ne devine pas.
- Ne modifie pas le récit ni les critères rédigés par le PO (tu coches et ajoutes un résumé).
