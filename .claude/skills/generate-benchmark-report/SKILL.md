---
name: generate-benchmark-report
description: >-
  Génère un rapport de benchmark mobile complet, formaté et exportable (résumé exécutif,
  matrice de scoring pondérée, recommandation, risques, plan de PoC, sources) à partir du
  contexte de la conversation, et l'écrit dans benchmarks/. À utiliser après une analyse de
  l'agent mobile-framework-architect, ou quand l'utilisateur demande « exporte le benchmark »,
  « génère le rapport de comparaison », « mets ça dans un fichier ».
---

# Générer un rapport de benchmark mobile

Génère un rapport de benchmark mobile complet et exportable à partir du contexte de la conversation en cours (résultats d'analyse, matrices de scoring, recommandations).

Si aucun benchmark n'a encore été réalisé dans la conversation, demande d'abord de lancer l'agent `mobile-framework-architect`.

Le rapport est écrit dans `benchmarks/benchmark-<slug>-<AAAA-MM-JJ>.md` avec l'en-tête de traçabilité :

```markdown
---
type: benchmark-framework-mobile
cas_usage: <titre lisible>
date: <AAAA-MM-JJ>
auteur: mobile-framework-architect
statut: proposition
frameworks_evalues: [<liste>]
recommandation: <framework retenu>
score: <score global>
---
```

## Structure du rapport
1. **Résumé exécutif** (framework recommandé, score, raison, prochaine étape)
2. **Contexte et périmètre** (cas d'usage, contraintes, frameworks évalués)
3. **Matrice de scoring** pondérée (critères × frameworks, notes 1-5, score global) + justifications
4. **Recommandation** (choix + alternative + écartés avec raisons)
5. **Risques et mitigations** (tableau prob./impact/mitigation)
6. **Plan de Proof of Concept** (durée, features, métriques, Go/No-Go) si applicable
7. **Sources** (donnée / source / date)
8. **Prochaines étapes** (cases à cocher)
9. **Challenges & révisions** (section vide pour contestation ultérieure)

Après avoir généré le fichier, affiche le chemin complet et indique combien de critères ont pu être remplis depuis le contexte vs. ceux laissés vides (à compléter manuellement).
