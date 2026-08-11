---
name: create-flutter-screen
description: >-
  Crée la couche presentation d'une feature Flutter : état Riverpod (Notifier/AsyncNotifier)
  consommant des use cases, écran routé, widgets réutilisables, avec gestion explicite des états
  chargement/vide/erreur/nominal et tests de widgets. À utiliser pour ajouter un écran ou un
  composant d'UI, ou quand l'utilisateur demande « crée l'écran », « ajoute une page »,
  « nouveau widget Flutter », « branche l'UI ».
---

# Créer un écran / un widget (couche presentation)

Crée l'UI dans `lib/features/<feature>/presentation/`. C'est la seule couche qui connaît Flutter et Riverpod.

Argument attendu : l'écran ou le widget à créer (ex : `planning du jour`, `formulaire de création d'habitude`, `tableau du résumé annuel`).

## Prérequis

Les use cases dont l'écran a besoin doivent exister dans le domaine. Sinon, commence par `create-usecase` : l'UI se branche sur un contrat métier, elle ne l'invente pas.

## Contenu généré

```
lib/features/<feature>/presentation/
├── state/<screen>_state.dart       # état immuable de l'écran (sealed ou classe + copyWith)
├── state/<screen>_notifier.dart    # Notifier/AsyncNotifier : appelle les use cases
├── pages/<screen>_page.dart        # écran routé, assemble les widgets
└── widgets/<widget>.dart           # widgets réutilisables de la feature
test/features/<feature>/presentation/
└── pages/<screen>_page_test.dart   # testWidgets avec ProviderContainer(overrides: …)
```

## Principes

- **Zéro règle métier dans la presentation.** Un calcul de retard, de série, de taux ou de seuil appartient au domaine. Si un `Notifier` se met à calculer, le calcul descend d'une couche.
- **Le Notifier orchestre** : il appelle un use case, déballe le `Result` par `switch` et traduit la `Failure` en état d'erreur affichable. Il ne connaît ni Drift ni repository concret.
- **Quatre états obligatoires** par écran : chargement, **vide**, erreur, nominal. L'état vide est le plus souvent oublié et c'est le premier que verra l'utilisateur d'une app neuve (aucune habitude créée).
- **État immuable** : classe `final` + `copyWith`, ou `sealed class` d'états si les cas s'excluent — le `switch` exhaustif interdit alors d'oublier un rendu.
- **Widgets** : `StatelessWidget` par défaut, `const` dès que possible, pas d'appel base/réseau dans `build()`, découpe en **sous-widgets nommés** plutôt qu'en méthodes `_buildXxx()`.
- **Réutilisation** : un widget utilisé par ≥ 2 features remonte dans `core/theme/` ou `core/widgets/`.
- `Key` explicite sur les éléments interactifs qui seront testés ; `mounted` vérifié après tout `await`.

## Documentation (obligatoire)

- En-tête de fichier : couche + rôle de l'écran/widget.
- Dartdoc `///` sur la page, le notifier, l'état et chaque widget public : ce qu'il affiche, quels états il gère, quelles interactions il déclenche.
- Commentaire inline sur les subtilités d'UI : contrainte d'accessibilité, comportement au clavier, cas d'affichage particulier (emoji multi-graphème, période sans données).
- Commentaires en français, identifiants en anglais.

## Étapes

1. Repère les critères d'acceptation de l'US qui décrivent l'UI et les messages attendus.
2. Définis l'**état** avant le rendu : quelles données, quels états d'erreur, quel état vide.
3. Écris le notifier (appels de use cases + traduction des `Failure`), puis la page, puis les widgets.
4. Expose les dépendances via des providers ; en test, remplace-les par `ProviderContainer(overrides: […])`.
5. Écris les tests de widgets avec `write-flutter-tests` (rendu, interactions, les quatre états).
6. Lance `flutter-quality-gate`.
