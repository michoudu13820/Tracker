---
name: formalize-bug
description: >-
  Transforme un bug décrit en langage libre en fiche de bug structurée, reproductible et
  reliée à l'US existante concernée, puis la persiste dans bug/to_be_resolved/ et met à jour
  l'index bug/BUGS.md. À utiliser pour « formalise ce bug », « note ce bug », « crée un ticket
  de bug », « ça ne marche pas quand… », ou après un test qui révèle une régression.
---

# Formaliser un bug (QA)

Transforme la description d'un dysfonctionnement en **fiche de bug exploitable par un développeur** :
reproductible, observable, priorisée et **rattachée à l'US dont elle viole un critère d'acceptation**.

## Étape 1 — Rattachement à une US (obligatoire)

Avant d'écrire, identifie la/les US concernée(s) :
- Liste les US (`Glob` sur `US/**/US-*.md`) et lis celles qui matchent le comportement décrit.
- Le bug viole en général un **critère d'acceptation Given/When/Then précis** : cite-le.
- Si aucune US ne couvre le comportement, note `us_liee: []` et signale que c'est peut-être une
  évolution manquante (à remonter au Product Owner) plutôt qu'un bug.
- Si la description est trop floue pour être reproduite, **pose des questions** (étapes, appareil,
  fréquence) plutôt que d'inventer.

## Étape 2 — Numérotation

Numéro incrémental `BUG-<NNN>` : `Glob` sur `bug/**/BUG-*.md`, prends le max + 1 (jamais réutiliser
un numéro, même pour un bug corrigé ou rejeté).

## Étape 3 — Fiche de bug

Fichier : `bug/to_be_resolved/BUG-<NNN>-<slug>.md`. En-tête de traçabilité :

```markdown
---
type: bug
id: BUG-<NNN>
titre: <titre court et factuel>
date: <AAAA-MM-JJ>
auteur: qa
statut: à corriger        # à corriger | en cours | corrigé | rejeté | dupliqué
severite: majeur          # bloquant | majeur | mineur | cosmétique
us_liee: [US-XXX]         # US dont un critère est violé (ou [] si aucune)
reproductible: toujours   # toujours | souvent | intermittent | une fois
---
```

Corps :

```markdown
# BUG-<NNN> — <titre>

## Résumé
<Une phrase : quoi, où, impact utilisateur.>

## US / critère concerné
- **US-XXX — <titre de l'US>** : cite le scénario Given/When/Then violé (verbatim si possible).

## Environnement
- Appareil / navigateur, mode (PWA installée ou onglet), thème/langue si pertinents, version/déploiement.

## Étapes de reproduction
1. …
2. …
3. …

## Résultat observé
<Ce qui se passe réellement — le comportement fautif, observable.>

## Résultat attendu
<Ce qui devrait se passer, idéalement recopié du critère d'acceptation de l'US.>

## Sévérité & impact
<Pourquoi ce niveau de sévérité : combien d'utilisateurs, contournement possible ou non.>

## Notes / pistes
<Captures, logs, hypothèses de cause, US/BUG liés. Aucune obligation de proposer un correctif —
c'est le rôle du développeur.>
```

## Étape 4 — Index

Mets à jour `bug/BUGS.md` (crée-le si absent) : un tableau
`ID | Titre | Sévérité | Statut | US liée | Chemin`, trié par sévérité (bloquant en premier).

## Règles

1. **Factuel, pas d'accusation** : décris le comportement observable, pas une supposition de cause non vérifiée.
2. **Reproductible avant tout** : un bug sans étapes de repro claires n'est pas exploitable — demande-les.
3. **Toujours relier à une US** quand c'est possible ; sinon signaler l'absence de couverture.
4. **QA formalise, ne corrige pas** : pas de modification du code applicatif, seulement la fiche de bug.
5. **Ne réécris pas les US** : tu cites leurs critères, tu ne les modifies pas.
