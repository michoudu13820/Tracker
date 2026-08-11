---
name: add-route
description: >-
  Scaffolde une nouvelle route SvelteKit complète (+page.svelte, +page.ts ou +page.server.ts,
  actions) en respectant l'arbre de décision « où placer la logique » (universel vs serveur,
  offline/local via repository). À utiliser pour ajouter une page/route, ou quand l'utilisateur
  demande « crée une route », « ajoute une page », « nouvelle route SvelteKit ».
---

# Ajouter une route SvelteKit

Scaffolde une nouvelle route SvelteKit complète, en respectant l'arbre de décision « où placer la logique ? » de l'architecture du projet.

Argument attendu : le chemin de la route (ex : `/parametres`, `/journee/[date]`).

## Étapes
1. Détermine le dossier cible sous `src/routes/` d'après l'argument.
2. Pose (ou déduis) les questions clés :
   - Besoin de **données** ? Publiques (universel `+page.ts`) ou serveur/secret (`+page.server.ts`) ?
   - **Mutations** (formulaire) ? → `actions` dans `+page.server.ts` avec progressive enhancement.
   - App 100 % locale/offline ? → charge les données côté client via un repository de `lib/data`, pas de `+page.server.ts`.
3. Génère uniquement les fichiers nécessaires :
   - `+page.svelte` (UI, Svelte 5 runes)
   - `+page.ts` **ou** `+page.server.ts` seulement si un `load` est requis
   - `+layout.svelte` si la sous-section a besoin d'un layout propre
4. Câble l'accès aux données via un repository existant de `lib/data` (pas d'accès direct au stockage dans le composant).

## Règles
- Pas de `+page.server.ts` pour une app statique/offline sans backend.
- Types stricts pour `load` (`PageLoad` / `PageServerLoad`).
- Pas de logique métier dans le composant : délègue à `lib/domain`.
- Explique chaque fichier créé et le choix client/serveur retenu.
