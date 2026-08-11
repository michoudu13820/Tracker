---
name: architecture-review
description: >-
  Audite l'architecture d'un projet (surtout SvelteKit) : frontières et règles de dépendances,
  placement de la logique (load universel vs serveur, runes Svelte 5), sur/sous-ingénierie,
  testabilité ; produit un rapport persisté et hiérarchisé dans docs/audits/. Skill de l'agent
  code-auditor. À utiliser pour « audite l'architecture », « revue d'archi », « dette technique ».
---

# Revue d'architecture

Audite l'architecture du code existant et produit un rapport persisté. Skill rattaché à l'agent `code-auditor`.

## Périmètre de l'audit

### 1. Frontières & dépendances
- `lib/domain` bien framework-agnostique (aucun import de `svelte`/`$app`) ?
- Composants accédant au stockage/réseau directement au lieu de passer par `lib/data` ?
- Cycles de dépendances entre modules ?
- Respect de la règle : UI → stores/domain → data (pas l'inverse).

### 2. Placement de la logique (SvelteKit)
- `load` universel vs serveur cohérent (secrets côté serveur uniquement) ?
- Logique métier dans les composants au lieu de `lib/domain` ?
- Usage correct des runes Svelte 5 (`$derived` vs `$effect` mal employé) ?

### 3. Sur-ingénierie / sous-ingénierie
- Couches, abstractions ou dépendances non justifiées par la taille du projet.
- À l'inverse : logique dupliquée, absence de séparation là où c'est nécessaire.

### 4. Testabilité
- Le domaine est-il testable sans DOM ? Les repositories mockables ?

## Livrable (OBLIGATOIRE — persisté)
Écris le rapport dans `docs/audits/architecture-review-<AAAA-MM-JJ>.md` (crée le dossier si besoin), avec en-tête :

```markdown
---
type: audit-architecture
date: <AAAA-MM-JJ>
auteur: code-auditor
statut: proposition   # proposition | traité | obsolète
severite_max: <info | mineur | majeur | critique>
---
```

Structure : Résumé → Constats classés par sévérité (Critique / Majeur / Mineur / Info), chacun avec `fichier:ligne`, explication, recommandation concrète → Quick wins → Section `## Suivi` (cases à cocher).

Ne signale pas de faux positifs : contextualise chaque constat par la taille réelle du projet (pas de reproche de « sur-simplicité » sur une petite app perso). Indique le chemin du rapport créé.
