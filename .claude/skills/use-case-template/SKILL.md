---
name: use-case-template
description: >-
  Formulaire interactif de qualification d'un cas d'usage avant de choisir un framework mobile :
  produit, utilisateurs, exigences techniques, équipe/ressources, contexte décisionnel. À utiliser
  au démarrage d'un benchmark mobile pour cadrer le besoin, ou quand l'utilisateur veut
  « cadrer mon projet », « définir mon besoin mobile » avant de comparer des frameworks.
---

# Qualification du cas d'usage (mobile)

Affiche un formulaire interactif de qualification de cas d'usage pour le choix d'un framework mobile, puis collecte les réponses avant de passer la main à l'agent `mobile-framework-architect`.

Pose les questions suivantes **une section à la fois**, attends la réponse, puis passe à la suivante. Si l'utilisateur répond "je ne sais pas" ou laisse vide, note [Non défini] et continue.

## Section 1 — Le produit
1. **Nom du projet** (ou nom de code) ?
2. **Type d'application** ? (B2C grand public / B2B métier / interne / MVP-prototype / autre)
3. **Description en une phrase** : que fait l'application ?
4. **3 fonctionnalités clés** que l'app doit absolument avoir :
5. **Intégrations matérielles ou système** requises ? (BLE/NFC, caméra, biométrie, GPS, capteurs, push, paiement…)

## Section 2 — Les utilisateurs
6. **Plateformes cibles** ? (iOS seul / Android seul / iOS+Android / +Web)
7. **Volume d'utilisateurs estimé** au lancement ? Dans 2 ans ?
8. **Profil utilisateur** (grand public, techniciens terrain, cadres…) ?
9. **Zones géographiques** (France, Europe, monde, appareils d'entrée de gamme ?) ?

## Section 3 — Les exigences techniques
10. **Niveau de performance requis** ? (standard / élevé 60fps / critique temps réel-3D)
11. **Fonctionnement offline** nécessaire ?
12. **Contraintes de sécurité** (données sensibles, RGPD/HIPAA/PCI, MDM, chiffrement) ?
13. **APIs ou SDK tiers imposés** ?

## Section 4 — L'équipe et les ressources
14. **Taille de l'équipe mobile** ?
15. **Compétences actuelles** ? (JS/TS, Dart, Swift, Kotlin/Java, C#/.NET, autre)
16. **Codebase web existante** (React, Angular, Vue…) à réutiliser ?
17. **Budget et timeline** ? (date cible, budget approximatif)
18. **Stratégie long terme** : maintenue en interne ? externalisée ? reprise par une autre équipe ?

## Section 5 — Contexte décisionnel
19. **Framework déjà en tête** ? Lequel et pourquoi ?
20. **Contraintes politiques/organisationnelles** (standard SI imposé, contrat prestataire, choix validé en COMEX) ?
21. **Principal critère de décision** ? (time-to-market / perf / coût / maintenabilité / compétences équipe)

Une fois toutes les réponses collectées, génère un résumé structuré du cas d'usage et propose de lancer le benchmark complet avec l'agent `mobile-framework-architect` en lui transmettant ce contexte.
