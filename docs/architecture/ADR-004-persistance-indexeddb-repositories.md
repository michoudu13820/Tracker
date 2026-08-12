---
type: adr
numero: 004
titre: Couche de persistance — repositories par agrégat sur IndexedDB (idb-keyval)
date: 2026-08-12
auteur: sveltekit-architect
statut: accepté
remplace: null
---

# ADR-004 — Couche de persistance : repositories par agrégat sur IndexedDB (idb-keyval)

## Contexte

L'ADR-001 impose des **données métier 100 % locales** (IndexedDB via `idb-keyval`), aucune
donnée métier ne quittant l'appareil. L'embryon fournit `src/lib/data/repositories.ts` :
quatre interfaces de repository (habits, tasks, completions, settings) + une implémentation
IndexedDB, chaque agrégat étant sérialisé **en un seul tableau** sous une clé (`get`/`set`
de `idb-keyval`). Il restait à : (1) trancher formellement la granularité de persistance,
(2) donner un point d'extension propre à la sauvegarde/restauration (US-008), (3) confirmer
la stratégie de test de cette couche.

## Décision

**Conserver le patron « un repository par agrégat », chacun lisant/écrivant tout son tableau**
(pas de persistance par enregistrement individuel). Formaliser trois points :

1. **Granularité = agrégat entier.** Un repository lit tout son tableau (`getAll`) et le
   réécrit entier (`saveAll`). À l'échelle d'un usage personnel (dizaines d'habitudes/tâches,
   quelques milliers de complétions sur plusieurs années), le coût lecture/écriture complète
   est négligeable et le code reste trivial. On **n'introduit pas** de store IndexedDB par
   enregistrement ni d'index tant qu'aucun problème de perf réel n'est mesuré.

2. **Repositories séparés par agrégat** (habits, tasks, completions, settings), exposés en
   interfaces → les stores dépendent des interfaces, jamais de `idb-keyval` directement. Cela
   permet une implémentation en mémoire pour les tests (`domain` et stores testables sans DOM).

3. **Sauvegarde/restauration = concern isolé** dans `src/lib/data/backup.ts` (US-008), et non
   dans `repositories.ts`. Le backup connaît l'**enveloppe versionnée complète** (`BackupData`,
   `version` + tous les agrégats + réglages) ; chaque repository ne connaît que son agrégat.
   L'import applique une stratégie **REPLACE** (écrase tout, pas de merge — décision US-008) et
   valide la structure du fichier avant d'écrire (`isValidBackup` / `parseBackup`).

**Clés IndexedDB** (constante `KEYS` dans `repositories.ts`) : `habits`, `tasks`,
`habit-completions`, `task-completions`, `reminder-settings`, `color-thresholds`.

## Alternatives considérées

| Option | Avantages | Inconvénients | Retenue ? |
|--------|-----------|---------------|-----------|
| **Repositories par agrégat, tableau entier (retenue)** | Simplissime, testable, suffisant à l'échelle perso, aligné sur l'embryon | Réécrit tout le tableau à chaque mutation (non problématique ici) | **Oui** |
| **Repository générique unique** (`get<T>(key)` / `set<T>(key, v)` paramétré) | Moins de code | Perd le typage fort par agrégat et les frontières explicites ; gain marginal | Non — les interfaces typées valent leur coût |
| **IndexedDB par enregistrement** (`idb` bas niveau, object stores + index) | Écritures/relectures granulaires, requêtes indexées | Complexité (migrations, curseurs) injustifiée à cette échelle ; `idb-keyval` suffit (choix ADR-001) | Non — sur-ingénierie |
| **`localStorage`** | API synchrone triviale | Quota ~5 Mo, synchrone (bloque), moins robuste que IndexedDB pour l'historique | Non — IndexedDB déjà acté |
| **Export/import dans `repositories.ts`** | Un fichier de moins | Couple le module repo à la forme complète du modèle ; mélange les concerns | Non — isolé dans `backup.ts` |

## Conséquences

**Positives :**
- Couche data minimale, entièrement typée, mockable → tests unitaires rapides sans navigateur.
- Point d'extension US-008 net (`backup.ts`) avec enveloppe versionnée (`version`) prête pour
  d'éventuelles migrations futures.
- Respecte strictement ADR-001 : rien ne sort de l'appareil.

**Négatives / limites :**
- **Écriture concurrente naïve** : `saveAll` réécrit le tableau complet chargé en mémoire par le
  store. Comme l'app est mono-utilisateur, mono-onglet en usage normal, le risque de perte
  d'écriture concurrente est négligeable et **non traité** (pas de verrou, pas de merge). À
  revoir seulement si un usage multi-onglets réel apparaît.
- La **complétion des habitudes** est un tableau plat `{habitId, date, done}` : lookups en O(n).
  Acceptable à l'échelle visée ; si le résumé annuel (US-005) sur de gros historiques devenait
  lent, on pourra indexer par (habitId, mois) **dans le domaine** sans changer le format de
  stockage.
- Migration de schéma non implémentée : `BackupData.version` existe mais aucune montée de version
  n'est encore gérée (v1 seulement). À traiter le jour où le modèle évolue.

## Liens

- [ADR-001 — PWA SvelteKit + Web Push](./ADR-001-pwa-sveltekit-web-push-scheduler.md)
- [ADR-003 — State management](./ADR-003-state-management-store-par-domaine.md)
- US-008 — Sauvegarde et restauration — `US/to_be_implemented/US-008-sauvegarde-restauration-donnees.md`
