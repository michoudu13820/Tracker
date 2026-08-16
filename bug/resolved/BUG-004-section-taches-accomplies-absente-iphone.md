---
type: bug
id: BUG-004
titre: Sur iPhone, la section « Tâches accomplies » n'apparaît pas — les tâches cochées restent dans la liste
date: 2026-08-16
auteur: qa
statut: rejeté
severite: majeur
us_liee: [US-041]
reproductible: toujours
---

# BUG-004 — Sur iPhone, la section « Tâches accomplies » n'apparaît pas

## Résumé
Sur iPhone, cocher une tâche la laisse **en place dans la liste, simplement cochée** : elle ne
quitte pas les tâches à faire et **aucune section « Tâches accomplies »** n'apparaît. Le même
parcours, dans un navigateur de bureau, se comporte correctement. La fonctionnalité livrée par
US-041 est donc inobservable sur **le seul appareil cible du projet** (ADR-001 : « iPhone-only »).

## US / critère concerné
**US-041 — Tâches accomplies regroupées dans une section repliée** (livrée le 2026-08-16,
commit `4acbb52`). Trois scénarios sont violés d'un coup sur iPhone :

- **Scénario 3 — Cocher une tâche la fait rejoindre la section accomplies** :
  > **Quand** je la coche comme faite
  > **Alors** elle quitte la liste des tâches à faire et rejoint la section « Tâches accomplies »
  > **Et** le compteur de la section est mis à jour

- **Scénario 1** (planning) et **Scénario 5** (onglet Tâches) : la section distincte, repliée par
  défaut et affichant son compteur, n'apparaît pas du tout.

## Environnement
- **Appareil en défaut** : iPhone, application installée sur l'écran d'accueil (PWA standalone).
- **Appareil de référence (comportement correct)** : navigateur de bureau, même version déployée.
- **Version attendue en production** : commit `4acbb52` (US-041), déployé le 2026-08-16 via le run
  CI `31940458184` (vert).
- **Écrans concernés** : à préciser — la remontée mentionne « une tâche » sans distinguer le
  planning (`/`) de l'onglet Tâches (`/taches`).

## Étapes de reproduction
1. Sur iPhone, ouvrir l'application installée sur l'écran d'accueil.
2. Aller sur l'onglet **Tâches** (et refaire l'essai sur le **planning**).
3. Cocher une tâche à faire.

## Résultat observé
La tâche **reste dans la liste**, affichée cochée. Aucune section « Tâches accomplies » n'apparaît,
ni compteur, ni contrôle de dépliage. Comportement identique à celui d'**avant** US-041.

## Résultat attendu
La tâche cochée quitte la liste des tâches à faire et rejoint une section « Tâches accomplies »
repliée par défaut, dont le compteur est lisible sans déplier (US-041, scénarios 1, 3 et 5).

## Sévérité & impact
**Majeur.** Une US livrée et déclarée conforme est en réalité **sans effet sur le seul appareil
cible**. Aucune donnée n'est en jeu et l'application reste utilisable — ce n'est pas `bloquant` —
mais la valeur d'US-041 est nulle là où elle comptait.

Sévérité à **réviser en `rejeté` (non-défaut)** si la vérification préalable ci-dessous montre que
l'iPhone exécutait simplement une version antérieure de l'application.

## Notes / pistes

### Vérification préalable obligatoire — l'iPhone exécute-t-il bien la nouvelle version ?
**À faire avant tout diagnostic de code.** Cette hypothèse est de loin la plus probable et elle est
**documentée d'avance** dans le projet (`docs/JOURNAL.md`, entrée US-040 du 2026-08-16, section
« Conséquence opérationnelle à retenir ») :

> Sans `skipWaiting()`, une nouvelle version exige désormais **deux ouvertures en ligne
> successives, entrecoupées d'une fermeture complète de l'app**, avant de prendre la main. C'est le
> prix assumé du « pas de rechargement subi » — à garder en tête pour toute future validation sur
> appareil, sous peine de **tester l'ancienne version en croyant tester la nouvelle**.

Ce comportement a été **choisi délibérément** lors d'US-040 (arbitrage « mise à jour silencieuse
différée au prochain lancement »), il n'est pas un défaut en soi.

Deux éléments corroborent l'hypothèse :
1. **Le symptôme est exactement le comportement d'avant US-041** — la tâche cochée restait dans la
   liste. Ce n'est pas un rendu cassé ou partiel, c'est *l'ancienne fonctionnalité*, intacte.
2. **Le navigateur de bureau, qui n'a pas de service worker installé de longue date, est correct.**
   La ligne de partage entre les deux appareils est le cache, pas le code.

**Procédure de vérification** : iPhone connecté au réseau → fermer complètement l'application
(balayage dans le sélecteur d'apps, pas seulement la mettre en arrière-plan) → la rouvrir → la
refermer complètement → la rouvrir. Puis refaire les étapes de reproduction.

### Si le défaut persiste après cette procédure
Alors il s'agit d'un vrai défaut de code et les pistes changent de nature. Éléments de contexte
relevés, sans valeur prescriptive :
- `src/lib/components/CompletedTasksSection.svelte` n'utilise **aucune API récente ni sélecteur CSS
  moderne** (pas de `:has()`, pas de `<details>`) : simple `{#if count > 0}` et `$state` — rien qui
  puisse échouer sur WebKit tout en fonctionnant ailleurs.
- La décision d'appartenance à la section vit dans `$lib/domain/tasks`
  (`partitionByCompletion`, `recentlyCompletedTasks`, `COMPLETED_TASKS_VISIBLE_DAYS`), couverte par
  24 tests verts. Une divergence de comportement entre navigateurs y serait surprenante, **sauf sur
  le calcul de date** : `recentlyCompletedTasks` compare des dates d'accomplissement, et le
  fuseau/format de date est un point de divergence classique entre WebKit et les autres moteurs.
- **Piste à écarter en premier dans ce cas** : le filtre des 7 jours de l'onglet Tâches
  (scénario 6). S'il se comportait mal sur WebKit, une tâche fraîchement cochée pourrait être
  jugée « ancienne » et donc masquée — mais le symptôme décrit (« la tâche reste cochée dans la
  liste ») ne correspond pas à un masquage : il correspond à une absence de regroupement. À
  confirmer par l'observation.

### Précision utile à obtenir de l'utilisateur
Le défaut se produit-il sur **le planning**, sur **l'onglet Tâches**, ou sur **les deux** ? Les deux
écrans partagent la même fonction de partition mais ne composent pas le même filtrage : la réponse
oriente fortement le diagnostic.

---

## Clôture — `rejeté` (non-défaut), 2026-08-16

**La vérification préalable a suffi.** Après fermeture complète de l'application **à deux
reprises**, la section « Tâches accomplies » s'affiche correctement sur l'iPhone (confirmé par
l'utilisateur le 2026-08-16). Aucun code n'a été modifié.

L'hypothèse principale de cette fiche est donc confirmée : l'iPhone exécutait encore une version
antérieure à US-041. Le comportement observé n'était pas un défaut mais **l'ancienne version,
intacte** — ce que le symptôme laissait déjà entendre (les tâches cochées restaient dans la liste,
exactement comme avant US-041), et ce que corroborait le bon fonctionnement sur navigateur de
bureau, sans service worker installé de longue date.

Contrôles effectués sur la production pendant l'instruction, qui écartaient un défaut de
déploiement :
- la chaîne « accomplies » est bien présente dans le bundle servi
  (`_app/immutable/chunks/UsK0TPIG.js`), ainsi qu'un asset dédié
  `CompletedTasksSection.*.css` — US-041 était donc bien en ligne ;
- le correctif de BUG-003 (`input,select,textarea{font-size:16px}`) l'était également.

### Ce que ce faux positif apprend, et qui n'est pas rien
C'est la **deuxième fois** que la mise à jour différée d'US-040 (`skipWaiting()` retiré, arbitrage
« pas de rechargement subi ») coûte un aller-retour de diagnostic — la première étant la validation
d'US-040 elle-même, qui avait déjà motivé la note « Conséquence opérationnelle à retenir » du
journal. Le prix de cet arbitrage n'est donc pas théorique : il se paie en **temps de recette**, à
chaque validation sur appareil, et il se paiera à nouveau.

Piste à soumettre au Product Owner (aucune US ouverte, ce n'est pas une décision QA) : rendre la
version exécutée **observable dans l'application** — par exemple un numéro de version ou de commit
discret dans l'écran Réglages. Un tel repère aurait tranché cette fiche en dix secondes, sans
instruction ni aller-retour, et servirait à toutes les validations futures.
