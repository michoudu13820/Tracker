---
name: write-user-story
description: >-
  Rédige une ou plusieurs User Stories au format « En tant que / je veux / afin de »
  avec des critères d'acceptation en Given/When/Then (Étant donné / Quand / Alors),
  puis les persiste dans docs/user-stories/ et met à jour le backlog. À utiliser dès
  qu'un besoin, une fonctionnalité ou une évolution doit être transformé en User Story,
  ou pour reformuler/découper une US existante.
---

# Rédiger une User Story

Transforme un besoin (fourni dans le contexte, le chat, ou issu de `intake-evolutions`) en une ou plusieurs User Stories formatées et persistées.

## Format imposé (STRICT)

### Récit
> **En tant que** <rôle / persona réel du produit>,
> **je veux** <capacité souhaitée>,
> **afin de** <bénéfice / valeur métier>.

### Critères d'acceptation — Given / When / Then
Un ou plusieurs scénarios testables :

> **Étant donné** (Given) <contexte / état initial>
> **Quand** (When) <action>
> **Alors** (Then) <résultat observable>

Utilise **Et** (And) pour enchaîner. Couvre les cas nominaux ET les cas limites/erreurs pertinents.

## Champs complémentaires
- **Priorité** (MoSCoW) : Must / Should / Could / Won't
- **Estimation** indicative : XS / S / M / L / XL
- **Dépendances** : US, ADR, contraintes techniques
- **Hors périmètre** : ce que l'US ne couvre pas

## Règles
1. Applique **INVEST**. Si le besoin est une épopée, découpe en plusieurs US reliées et signale-le.
2. **Aucune solution technique** dans le récit (pas de nom de composant/lib/table). Les contraintes vont dans « Dépendances ».
3. Critères **objectivement vérifiables** (éviter le flou : préférer un seuil mesurable).
4. Ancre le persona dans les vrais utilisateurs : lis `benchmarks/` et `docs/` pour le contexte.
5. Si le besoin est ambigu (persona / valeur / périmètre), **pose des questions** avant de rédiger.

## Persistance (obligatoire)
1. Dossier cible : `US/to_be_implemented/` (crée-le si absent).
2. Numéro incrémental : liste `US/**/US-*.md` (Glob, en incluant `US/in_progress/` et `US/done/`), prends le max + 1 en `NNN` (3 chiffres) — ne réutilise jamais un numéro d'US existante, quel que soit son état.
3. Un fichier par US : `US-<NNN>-<slug-kebab>.md` avec l'en-tête :

```markdown
---
type: user-story
id: US-<NNN>
titre: <titre>
date: <AAAA-MM-JJ>
auteur: product-owner
statut: à affiner
priorite: Must
estimation: M
source: <chat | evolutions/evolution_to_be_implemented.md>
depend_de: []
---
```

4. Mets à jour `US/BACKLOG.md` (tableau `ID | Titre | Priorité | Statut | Estimation | Chemin`, trié par priorité). Crée-le s'il n'existe pas. Cycle de vie géré par l'agent dev : `US/to_be_implemented/` → `US/in_progress/` → `US/done/`.
5. Affiche les chemins créés et les points restant à clarifier.
