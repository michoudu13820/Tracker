---
name: fix-bug
description: >-
  Corrige un bug formalisé par le QA de bout en bout en gérant son cycle de vie : sélection dans
  bug/to_be_resolved, déplacement vers bug/in_progress, reproduction par un test rouge, correctif
  minimal conforme à l'architecture, quality gate vert, puis déplacement vers bug/resolved et mise
  à jour de l'index bug/BUGS.md. À utiliser pour « corrige ce bug », « prends le prochain bug »,
  « traite les bugs de bug/to_be_resolved », « fix the bug ».
---

# Corriger un bug (cycle de vie complet)

Réalise la correction d'une fiche de bug de bout en bout, avec la même rigueur qu'une US : un bug
n'est `corrigé` que lorsqu'un **test de non-régression prouve la correction** ET que le **quality
gate est vert**.

## Sobriété de communication (important — coût en tokens)

Ce cycle enchaîne beaucoup d'appels d'outils (lecture, tests, correctif, quality gate). **Ne
raconte pas chaque étape au fil de l'eau** : pas de narration « je lis / je modifie / j'ajoute »,
pas de code ni de diff collé dans les messages pendant que le travail avance. Exécute les étapes
silencieusement ; le seul message substantiel est le **rapport final** (voir plus bas), compact et
sans code.

## Cycle de vie (obligatoire, symétrique aux US)

```
bug/to_be_resolved/   →   bug/in_progress/   →   bug/resolved/
```

Déplace **physiquement** le fichier à chaque transition (PowerShell `Move-Item`), mets à jour le
champ `statut` de l'en-tête (`à corriger` → `en cours` → `corrigé`) ET l'index `bug/BUGS.md`.
Ne perds jamais le contenu de la fiche (déplacement, pas recréation).

## Étape 1 — Sélection & prise en charge
- `Glob` sur `bug/to_be_resolved/BUG-*.md`. Choisis par **sévérité** (bloquant → majeur → mineur →
  cosmétique), sauf bug explicitement demandé.
- Lis la fiche en entier + l'US référencée dans `us_liee` (son critère d'acceptation Given/When/Then
  violé fait foi pour définir le comportement correct attendu).
- `Move-Item` vers `bug/in_progress/`, passe `statut: en cours`, mets à jour `bug/BUGS.md`.
- **Un seul bug en `in_progress` à la fois** par défaut.

## Étape 2 — Reproduction (test rouge d'abord)
- Écris un **test de non-régression qui échoue** reproduisant le bug : il encode le « Résultat
  attendu » de la fiche (= le critère de l'US violé). Utilise le skill `write-svelte-tests`
  (domaine → Vitest, composant → `@testing-library/svelte`, parcours → Playwright si pertinent).
- Lance ce test et **confirme qu'il est rouge** (sinon le bug n'est pas capturé — réajuste).
- Si le bug **n'est pas reproductible** ou la fiche est **ambiguë/incomplète** : ne devine pas.
  Renvoie-le au QA — repasse la fiche en `bug/to_be_resolved/` avec une note « non reproductible :
  … » (ou pose la question à l'utilisateur). Ne clôture pas un bug non reproduit.

## Étape 3 — Correction (minimale, dans la bonne couche)
- Implémente le **correctif minimal** qui fait passer le test au vert, placé selon les frontières
  de l'architecture (ADR) : `lib/domain` (logique pure) / `lib/data` (repositories) /
  `lib/stores` (état, runes Svelte 5) / `lib/components` & `routes/` (UI).
- **Pas de scope creep** : corrige le comportement fautif décrit, rien de plus. Toute autre anomalie
  repérée en chemin est signalée (au QA), pas corrigée en douce ici.
- Réutilise les skills existants si la correction touche une couche dédiée (`create-store`,
  `create-data-repository`, `add-component`, `add-route`).

## Étape 4 — Vérification (bloquante)
- Le test de non-régression passe désormais au **vert**.
- Lance le skill `run-quality-gate` (typecheck + lint + tests + build) : **verdict `PASS` obligatoire**.
  Corrige jusqu'au vert (aucune régression sur les tests existants).
- Vérifie que le critère d'acceptation de l'US qui était violé est de nouveau satisfait.

## Étape 5 — Clôture
- `Move-Item` vers `bug/resolved/`, passe `statut: corrigé`.
- Ajoute à la fiche une section **« Résumé de correction »** :
  cause racine · fichiers modifiés · test de non-régression ajouté · comment tester manuellement.
- Mets à jour `bug/BUGS.md` (statut `corrigé` + nouveau chemin).

## Rapport final
Un seul message, compact, **sans code ni diff** :
- ID du bug, US liée, sévérité.
- Cause racine (1-3 phrases).
- Fichiers touchés : liste à puces, une ligne d'explication chacun.
- Résultat du quality gate (tableau PASS/FAIL par étape).
- Confirmation que le test de non-régression est vert et que le critère de l'US est de nouveau tenu.

## Règles
1. **Jamais `corrigé` sans test de non-régression vert ET quality gate PASS.**
2. **Un bug à la fois** en `in_progress` (sauf demande explicite).
3. **Correctif minimal** ; pas de refonte opportuniste.
4. **Ne réécris ni les US ni la fiche de bug** (hors ajout du « Résumé de correction »).
5. **Bug non reproductible → retour QA**, jamais de clôture à l'aveugle.
6. **Traçabilité** : chaque transition se reflète dans le fichier ET dans `bug/BUGS.md`.
