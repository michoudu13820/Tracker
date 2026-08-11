# Icônes PWA — à fournir

Le manifest et `app.html` référencent des PNG qui doivent être déposés ici (tâche design,
hors périmètre du scaffold). Tailles requises :

| Fichier | Taille | Usage |
|---|---|---|
| `icon-192.png` | 192×192 | manifest (Android/desktop) + badge notification |
| `icon-512.png` | 512×512 | manifest (splash) |
| `icon-maskable-512.png` | 512×512 | manifest `purpose: maskable` |
| `apple-touch-icon.png` | 180×180 | écran d'accueil iPhone (référencé dans `app.html`) |

Génération rapide à partir de `../favicon.svg` (ex. via un outil comme `pwa-asset-generator`
ou un export manuel). Tant que ces PNG sont absents, l'installation iPhone affichera une
icône par défaut mais l'app reste fonctionnelle.
