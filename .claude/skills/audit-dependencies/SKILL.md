---
name: audit-dependencies
description: >-
  Audite les dépendances du projet : justification vs primitives natives, poids/bundle, santé
  et sécurité (libs non maintenues, dépréciées, CVE), doublons et dépendances inutiles ; produit
  un rapport persisté dans docs/audits/. Skill de l'agent code-auditor. À utiliser pour
  « audite les dépendances », « allège le bundle », « vérifie la sécurité des libs ».
---

# Audit des dépendances

Audite les dépendances du projet : justification, poids, sécurité, fraîcheur. Skill rattaché à l'agent `code-auditor`.

## Analyse à mener

### 1. Inventaire
- Lis `package.json` : sépare `dependencies` / `devDependencies`.
- Pour chaque dépendance de production : **est-elle justifiée** ou remplaçable par une primitive native de la plateforme / de SvelteKit ?

### 2. Poids & impact bundle
- Signale les dépendances lourdes pour une app qui se veut légère (surtout PWA).
- Propose des alternatives plus légères quand pertinent (ex : `idb-keyval` vs solution lourde).

### 3. Santé & sécurité
- Dépendances non maintenues (release ancienne), dépréciées, ou avec vulnérabilités connues.
- Utilise WebSearch pour vérifier le statut d'une lib douteuse.
- Suggère `npm audit` et interprète le résultat si fourni.

### 4. Doublons & inutiles
- Deux libs qui font la même chose.
- Dépendances déclarées mais non importées (repère via Grep).

## Livrable (OBLIGATOIRE — persisté)
Écris le rapport dans `docs/audits/dependencies-<AAAA-MM-JJ>.md` (crée le dossier si besoin), avec en-tête :

```markdown
---
type: audit-dependances
date: <AAAA-MM-JJ>
auteur: code-auditor
statut: proposition
---
```

Structure : tableau `dépendance | version | rôle | justifiée ? | poids | recommandation`, puis « À retirer / remplacer », puis « Alertes sécurité », puis `## Suivi` (cases à cocher).

Contextualise par le projet : une petite PWA perso doit tendre vers le minimum de dépendances. Indique le chemin du rapport créé.
