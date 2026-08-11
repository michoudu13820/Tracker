# habit_tracker

Suivi d'habitudes personnel, 100% local (iPhone).

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Learn Flutter](https://docs.flutter.dev/get-started/learn-flutter)
- [Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Flutter learning resources](https://docs.flutter.dev/reference/learning-resources)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.

Agent "Scaffold Flutter app + CI GitHub iOS sideload" finished · 14m 36s

La CI est en place et validée avec de vrais runs verts. Voici le résumé :

C'est fait

Dépôt : https://github.com/michoudu13820/Tracker (public)

Deux workflows opérationnels :
- ci.yml — tests automatiques à chaque push (analyse + 9 tests, ~2 min) → run vert (https://github.com/michoudu13820/Tracker/actions/runs/31522855126)
- build-ios.yml — build iOS manuel, produit un .ipa non signé (~3-5 min) → run vert (https://github.com/michoudu13820/Tracker/actions/runs/31523077544)

Comment obtenir et installer l'app sur ton iPhone

1. Déclencher un build :
Va sur la page du workflow (https://github.com/michoudu13820/Tracker/actions/workflows/build-ios.yml) → Run workflow → attends ~3-5 min.

2. Télécharger l'artefact :
Ouvre le run terminé → section Artifacts en bas de page → télécharge habit_tracker-unsigned-ipa (nécessite d'être connecté à ton compte GitHub, même en repo public).

3. Installer via AltStore ou SideStore :
- Installe AltServer sur ton PC Windows (altstore.io) — pas besoin de Mac.
- iPhone sur le même Wi-Fi que le PC.
- Dézippe l'artefact, puis dans AltServer : Install .ipa → sélectionne le fichier → connecte-toi avec ton Apple ID gratuit quand demandé.
- AltServer signe et installe l'app à ce moment-là (c'est lui qui gère la signature, pas la CI — aucun identifiant Apple n'est stocké sur GitHub).
- Le certificat expire tous les 7 jours ; AltServer le renouvelle automatiquement tant que ton iPhone reste sur le même réseau que le PC (ou en Wi-Fi permanent avec SideStore).

À savoir

- Le repo est public : le code est visible par tous (mais aucun secret dedans). Repassable en privé plus tard si tu changes d'avis.
- Seule étape non testée par l'agent : l'installation réelle via AltStore sur ton iPhone physique (nécessite ton action).
- L'app actuelle est encore le squelette Flutter par défaut (compteur de démo) — l'implémentation du tracker d'habitudes reste à faire.

Prochaine étape naturelle : lancer le développement des fonctionnalités (liste d'habitudes, fréquences, rappels) avec l'agent flutter-senior-dev. Tu veux qu'on enchaîne dessus ?

