---
name: setup-pwa
description: >-
  Configure ou finalise le support PWA d'un projet SvelteKit orienté iPhone : manifest,
  service worker offline, icônes, balises iOS, persistance du stockage (navigator.storage.persist,
  exemption de purge via install écran d'accueil), export/import de secours. À utiliser pour
  rendre l'app installable/offline, ou quand l'utilisateur demande « configure la PWA »,
  « rends l'app installable sur iPhone », « active le offline ».
---

# Configurer la PWA (SvelteKit, orienté iPhone)

Configure ou finalise le support PWA d'un projet SvelteKit, orienté installation sur iPhone (écran d'accueil) et fonctionnement offline avec stockage local persistant.

## Éléments à mettre en place

### 1. Manifest (`static/manifest.webmanifest` ou via `vite-plugin-pwa`)
- `name`, `short_name`
- `display: "standalone"`, `start_url`, `scope`
- `background_color`, `theme_color`
- `icons` : au minimum 192×192 et 512×512 (PNG) + une icône `maskable`
- `orientation` si portrait-only
- Lien du manifest dans `app.html` + balises iOS (`apple-mobile-web-app-capable`, `apple-touch-icon`)

### 2. Service worker (offline)
- Via `vite-plugin-pwa` (Workbox) ou `src/service-worker.ts` natif SvelteKit.
- Stratégie : precache de l'app shell, cache des assets, offline complet pour une app locale.

### 3. Persistance du stockage (important sur iOS)
- Appeler `navigator.storage.persist()` au premier lancement.
- Rappeler que **l'installation sur l'écran d'accueil** exempte la PWA de la purge des 7 jours de Safari.
- Si l'app stocke des données : prévoir un **export/import JSON** comme filet de sécurité.

### 4. Vérifications
- Manifest valide (onglet Application des DevTools).
- HTTPS requis en prod (GitHub Pages / Netlify / Cloudflare Pages).
- Icônes présentes aux bonnes tailles.

## Étapes
1. Détecte si `vite-plugin-pwa` est présent ; sinon propose de l'ajouter ou d'utiliser le `service-worker.ts` natif.
2. Génère/complète le manifest, les balises `<head>` iOS, le service worker, l'appel `storage.persist()`.
3. Rappelle la procédure d'installation iPhone : Safari → Partager → « Ajouter à l'écran d'accueil ».
4. Note les limites iOS connues (notifications PWA depuis iOS 16.4 uniquement si installée ; vérifier le statut UE le cas échéant).
