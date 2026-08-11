---
name: generate-adr
description: >-
  Génère un Architecture Decision Record (ADR) numéroté et persisté dans docs/architecture/,
  à partir d'une décision d'architecture prise dans la conversation (contexte, décision,
  alternatives, conséquences). À utiliser quand une décision structurante est prise, ou quand
  l'utilisateur demande « documente ce choix », « crée un ADR », « trace cette décision ».
---

# Générer un ADR

Génère un Architecture Decision Record (ADR) à partir d'une décision d'architecture prise dans la conversation en cours, et le persiste dans le projet.

## Emplacement & nommage
- Dossier : `docs/architecture/` (crée-le s'il n'existe pas).
- Détecte le prochain numéro incrémental : liste les fichiers `ADR-*.md` (Glob), prends le max + 1 (format `NNN` sur 3 chiffres).
- Nom : `ADR-<NNN>-<slug-kebab-case>.md`.

## Contenu à générer

```markdown
---
type: adr
numero: <NNN>
titre: <titre lisible>
date: <AAAA-MM-JJ>
auteur: <agent ou utilisateur>
statut: proposé   # proposé | accepté | remplacé | déprécié
remplace: <numéro ADR remplacé, si applicable>
---

# ADR-<NNN> — <titre>

## Contexte
[Problème, forces en présence, contraintes. Lier les rapports source si la décision en découle.]

## Décision
[La décision, formulée sans ambiguïté.]

## Alternatives considérées
| Option | Avantages | Inconvénients | Retenue ? |
|--------|-----------|---------------|-----------|

## Conséquences
**Positives :**
**Négatives / compromis acceptés :**

## Liens
- [Rapport / benchmark source](chemin)
```

## Règles
- Si aucune décision claire n'a été discutée, demande laquelle documenter.
- Si un ADR existant traite le même sujet, propose de le **remplacer** (nouvel ADR avec `remplace:` + ancien passé à `statut: remplacé`) plutôt que d'éditer l'historique.
- Le fichier doit être auto-suffisant et lisible par un autre agent.
- Après création, affiche le chemin exact et mets à jour (ou crée) `docs/architecture/ARCHITECTURE.md` avec une ligne par ADR.
