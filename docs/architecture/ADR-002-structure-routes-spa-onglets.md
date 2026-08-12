---
type: adr
numero: 002
titre: Structure des routes SPA et navigation par onglets
date: 2026-08-12
auteur: sveltekit-architect
statut: accepté
remplace: null
---

# ADR-002 — Structure des routes SPA et navigation par onglets

## Contexte

L'ADR-001 fige l'app comme **PWA SvelteKit 100 % statique** (`adapter-static`,
`fallback: '200.html'`, `ssr = false`, `prerender = true`) : aucun rendu ni endpoint
serveur, routage entièrement côté client. Le backlog (8 US) décrit désormais plusieurs
surfaces fonctionnelles distinctes : planning quotidien (US-004), gestion des habitudes
(US-001), gestion des tâches (US-002/US-003), résumé (US-005), et un ensemble de réglages
(rappels US-007, seuils US-006, sauvegarde US-008).

À l'arrivée de cet ADR, une seule route existait (`/`), contenant un bouton de test push
temporaire (cf. `docs/JOURNAL.md`). Il faut une structure de routes stable, alignée sur les
US, sur laquelle `sveltekit-senior-dev` puisse brancher chaque écran.

## Décision

Adopter une **navigation par onglets** (barre inférieure façon iOS, `$lib/components/TabBar.svelte`
montée dans `+layout.svelte`) avec **cinq routes de premier niveau**, en français, sans
apostrophe dans les URLs :

| Route | Onglet | US couvertes |
|-------|--------|--------------|
| `/` | Aujourd'hui | US-004 (planning quotidien) |
| `/habitudes` | Habitudes | US-001 (création/édition habitude) |
| `/taches` | Tâches | US-002 (tâche ponctuelle), US-003 (reprogrammation retard) |
| `/resume` | Résumé | US-005 (tableau période), US-006 (couleurs, via réglages) |
| `/reglages` | Réglages | US-007 (rappels), US-006 (seuils), US-008 (sauvegarde/restauration) |

Chaque route reçoit un `+page.svelte` **placeholder** (titre + renvoi à l'US) déjà câblé aux
stores concernés, prêt à être implémenté US par US.

**Règles associées :**
- `/` est la route d'atterrissage = le planning du jour (US-004) : c'est l'usage quotidien
  principal.
- Les **réglages sont regroupés** sous une seule route `/reglages` (rappels + seuils +
  sauvegarde), plutôt qu'une route par réglage : ce sont des préférences de faible fréquence
  d'usage, les éclater créerait des écrans quasi vides. Des sous-routes (`/reglages/rappels`…)
  pourront être introduites plus tard si un écran devient trop chargé, sans casser la structure.
- Un composant est **colocalisé** dans le dossier de sa route s'il n'est utilisé que là ;
  il migre vers `$lib/components/` dès qu'il est partagé (voir CONVENTIONS.md).
- `ssr = false` / `prerender = true` restent portés par `src/routes/+layout.ts` (hérité par
  toutes les routes) : chaque route est un chemin statique, pré-rendu en coquille puis hydraté.
  Aucune route dynamique paramétrée n'est nécessaire pour les 8 US (la date du planning est un
  **état client**, pas un segment d'URL — voir Conséquences).

## Alternatives considérées

| Option | Avantages | Inconvénients | Retenue ? |
|--------|-----------|---------------|-----------|
| **Onglets + 5 routes (retenue)** | Modèle mental iOS familier, URLs claires, chaque US a un point d'ancrage évident | Un peu plus de fichiers qu'une SPA mono-page | **Oui** |
| **Application mono-page** (tout dans `/`, sections conditionnelles) | Le moins de fichiers | Écran monolithique, navigation « maison », mauvaise séparation par US | Non — nuit à la maintenabilité et à la répartition du travail par US |
| **Date du planning dans l'URL** (`/jour/2026-08-12`) | URL partageable, historique navigateur | Aucune valeur pour une app perso locale ; complexifie le routage et le pré-rendu | Non — la date reste un état client |
| **Une route par réglage** | Écrans très focalisés | Écrans quasi vides, sur-découpage pour des réglages rares | Non — regroupés sous `/reglages` |

## Conséquences

**Positives :**
- Structure lisible : chaque US sait exactement où elle atterrit.
- La navigation (coquille) est une décision figée, indépendante du contenu des écrans →
  `sveltekit-senior-dev` implémente les US sans rediscuter la navigation.
- Reste 100 % compatible `adapter-static` (chemins statiques, pré-rendables).

**Négatives / limites :**
- La **date affichée du planning** (US-004, navigation jour précédent/suivant) est un **état
  client** (rune `$state` dans l'écran ou un store), non reflété dans l'URL : pas de deep-link
  vers un jour précis, pas de bouton « précédent » navigateur pour changer de jour. Choix
  assumé (app perso, pas de partage d'URL).
- Les libellés/emojis d'onglets de `TabBar.svelte` sont provisoires (à affiner avec l'UI).

## Liens

- [ADR-001 — PWA SvelteKit + Web Push](./ADR-001-pwa-sveltekit-web-push-scheduler.md)
- [ADR-003 — State management : un store par domaine](./ADR-003-state-management-store-par-domaine.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- US-004 (planning), US-006/US-007/US-008 (réglages) — `US/to_be_implemented/`
