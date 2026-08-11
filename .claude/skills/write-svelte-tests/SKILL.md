---
name: write-svelte-tests
description: >-
  Écrit ou complète les tests d'un projet SvelteKit : unitaires du domaine et des repositories
  (Vitest), tests de composants (@testing-library/svelte), et parcours critiques end-to-end
  (Playwright), en traduisant les critères d'acceptation Given/When/Then en cas de test. À utiliser
  pendant l'implémentation d'une US, ou quand l'utilisateur demande « écris les tests », « couvre
  cette fonctionnalité », « ajoute des tests ».
---

# Écrire des tests SvelteKit

Écrit/complète les tests en respectant la pyramide et en traduisant les critères d'acceptation.

## Stratégie (pyramide)
- **Domaine & data** (`lib/domain`, `lib/data`) : tests unitaires **Vitest** sans DOM. Beaucoup de tests, rapides.
- **Composants** (`lib/components`) : **@testing-library/svelte** + Vitest (jsdom). Rendu, interactions, callbacks.
- **Stores** (`lib/stores`) : Vitest avec repository mocké/en mémoire.
- **Parcours critiques** : **Playwright** (e2e) sur les flux clés seulement.

## Traduction des critères d'acceptation
Chaque scénario **Given/When/Then** d'une US devient un cas de test :
- **Étant donné (Given)** → arrange (état initial, mocks, rendu)
- **Quand (When)** → act (interaction, appel de fonction)
- **Alors (Then)** → assert (résultat observable)

Nomme les tests d'après le critère (`it('affiche l'activité cochée quand on tape dessus')`).

## Bonnes pratiques
- Teste le **comportement observable**, pas les détails d'implémentation.
- Couvre le nominal ET les cas limites/erreurs mentionnés dans l'US.
- Isole : mocke les repositories pour tester stores et composants.
- Pour IndexedDB en test : `fake-indexeddb` ou une implémentation de repository en mémoire.
- Accessibilité : privilégie les requêtes par rôle/label (`getByRole`, `getByLabelText`).

## Étapes
1. Repère les critères d'acceptation de l'US en cours (dans `US/in_progress/`).
2. Détecte la config de test existante (Vitest/Playwright) ; propose de l'ajouter si absente.
3. Écris les tests au bon niveau de la pyramide.
4. Lance-les (`npm run test`) et rends compte ; renvoie vers `run-quality-gate` pour la vérif complète.
