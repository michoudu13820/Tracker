---
type: user-story
id: US-007
titre: Rappels par notification pour les habitudes du jour
date: 2026-08-09
auteur: product-owner
statut: prête
priorite: Must
estimation: XL
source: chat
depend_de: ["US-001"]
---

## Titre : US-007 — Rappels par notification pour les habitudes du jour

### Récit
> **En tant qu'** utilisateur de l'app,
> **je veux** recevoir une notification de rappel sur mon téléphone lorsque j'ai une habitude à faire aujourd'hui,
> **afin de** ne pas oublier de la réaliser, même si je n'ai pas ouvert l'application ce jour-là.

### Critères d'acceptation

**Scénario 1 — Rappel pour une habitude à fréquence par intervalle de jours**
> **Étant donné** une habitude « Boire de l'eau » a une fréquence « tous les 2 jours » et les rappels sont activés
> **Quand** le jour correspond à une occurrence prévue de cette habitude
> **Alors** je reçois une notification de rappel ce jour-là
> **Et** le contenu de la notification ne nomme jamais « Boire de l'eau » ni aucune autre habitude/tâche : il est soit totalement générique (ex : « Tu as des habitudes prévues aujourd'hui »), soit assorti d'un compteur non nominatif du nombre d'habitudes/tâches dues (ex : « 1 habitude à faire aujourd'hui ») — je dois ouvrir l'application pour voir le détail (quelles habitudes précisément)

**Scénario 2 — Rappel pour une habitude à fréquence par jours de la semaine**
> **Étant donné** une habitude « Yoga » a une fréquence « lundi, mercredi, vendredi » et les rappels sont activés
> **Quand** on est un mercredi
> **Alors** je reçois une notification de rappel ce jour-là, générique ou avec un compteur non nominatif (ex : « 3 habitudes à faire aujourd'hui »), sans que son contenu mentionne « Yoga » ou toute autre habitude par son nom

**Scénario 3 — Aucun rappel un jour où l'habitude n'est pas prévue**
> **Étant donné** une habitude « Yoga » a une fréquence « lundi, mercredi, vendredi » et les rappels sont activés, et c'est la seule habitude existante
> **Quand** on est un mardi
> **Alors** je ne reçois aucune notification de rappel ce jour-là
> **Et** si une autre habitude que je possède a, elle, une occurrence ce mardi-là, je reçois quand même un rappel ce jour-là (générique ou avec compteur non nominatif incluant cette autre occurrence), sans lien ni mention nominative avec « Yoga »

**Scénario 3bis — Rappels indisponibles si la PWA n'est pas installée sur l'écran d'accueil**
> **Étant donné** j'utilise l'application dans un onglet Safari standard, sans l'avoir installée sur l'écran d'accueil de mon iPhone
> **Quand** j'essaie d'activer les rappels depuis les réglages de l'application
> **Alors** l'application ne déclenche aucune demande d'autorisation de notifications
> **Et** elle m'indique clairement que les rappels ne peuvent fonctionner que si l'app est installée sur l'écran d'accueil
> **Et** elle m'explique comment procéder (Partager → Ajouter à l'écran d'accueil)

**Scénario 4 — Première activation des rappels et demande d'autorisation**
> **Étant donné** je n'ai jamais activé les rappels auparavant
> **Quand** j'active les rappels pour la première fois depuis les réglages de l'application
> **Alors** le système me demande explicitement l'autorisation d'envoyer des notifications
> **Et** si j'accepte, les rappels sont activés et programmés pour mes habitudes à venir

**Scénario 5 — Autorisation refusée : état visible, pas d'échec silencieux**
> **Étant donné** j'active les rappels pour la première fois
> **Quand** je refuse l'autorisation demandée par le système
> **Alors** l'application m'affiche clairement que les rappels ne peuvent pas fonctionner tant que l'autorisation n'est pas accordée
> **Et** elle m'explique comment activer cette autorisation depuis les réglages de mon téléphone
> **Et** aucun rappel n'est silencieusement programmé ou perdu sans que j'en sois informé

**Scénario 6 — Désactivation globale des rappels**
> **Étant donné** les rappels sont actuellement activés et autorisés
> **Quand** je désactive les rappels depuis les réglages de l'application
> **Alors** je ne reçois plus aucune notification de rappel pour aucune habitude, tant que je ne les réactive pas

**Scénario 7 — Réglage de l'heure d'envoi des rappels**
> **Étant donné** les rappels sont activés, avec une heure de rappel par défaut fixée à **8h00**
> **Quand** je n'ai jamais modifié ce réglage
> **Alors** mon rappel du jour est envoyé autour de 8h00, avec une latence possible due au scheduler serveur pouvant retarder l'envoi jusqu'à **8h15**
> **Quand** je choisis une autre heure dans les réglages de rappel
> **Alors** les prochaines notifications de rappel pour mes habitudes du jour sont envoyées à cette nouvelle heure choisie, avec la même latence possible (jusqu'à ~15 minutes après l'heure choisie)

**Scénario 8 — Pas de rappel si déjà fait, à condition d'une resynchronisation préalable (best-effort)**
> **Étant donné** j'ai coché comme faites toutes les habitudes prévues aujourd'hui, et j'ai rouvert l'application au moins une fois après ce cochage et avant l'heure du rappel (ce qui resynchronise la fenêtre de rappels côté serveur)
> **Quand** l'heure du rappel survient
> **Alors** je ne reçois pas de notification de rappel ce jour-là

> **Étant donné** j'ai coché comme faites toutes les habitudes prévues aujourd'hui, mais je n'ai PAS rouvert l'application depuis (le serveur ignore encore que tout est fait)
> **Quand** l'heure du rappel survient
> **Alors** je peux quand même recevoir la notification de rappel générique, malgré les habitudes déjà faites
> **Et** ce comportement est un compromis assumé (best-effort) de l'architecture : aucune garantie d'annulation du rappel n'est possible sans que l'app ait resynchronisé sa fenêtre avant l'heure d'envoi

**Scénario 9 — Fiabilité même application fermée ou téléphone verrouillé**
> **Étant donné** les rappels sont activés et autorisés, et l'application n'est pas ouverte
> **Quand** l'heure du rappel arrive, y compris avec le téléphone verrouillé
> **Alors** je reçois quand même la notification de rappel, sans avoir besoin d'ouvrir l'application au préalable

**Scénario 10 — Fiabilité à l'échelle avec de nombreuses habitudes actives**
> **Étant donné** j'ai un grand nombre d'habitudes récurrentes actives (par exemple plusieurs dizaines)
> **Quand** les jours passent et que de nouvelles occurrences deviennent dues
> **Alors** je continue à recevoir de façon fiable les rappels des habitudes prévues dans les prochains jours
> **Et** aucun rappel n'est perdu silencieusement du fait du nombre d'habitudes actives

> **Note (2026-08-11) — pivot d'architecture** : cette US a été rédigée pour des
> notifications **locales natives** (approche Flutter). Depuis, le projet a pivoté vers une
> **PWA SvelteKit + Web Push** avec un micro-scheduler serveur (voir ADR-001).
>
> **Révision (2026-08-12)** : le premier passage (2026-08-11) laissait le contrat fonctionnel
> inchangé et renvoyait les nuances vers les seules notes techniques plus bas. Après relecture
> à la lumière de l'ADR-001, plusieurs scénarios ci-dessus portaient des hypothèses désormais
> fausses et ont été **directement corrigés** :
> - Le rappel envoyé est un **message générique unique par jour concerné** (« Tu as des habitudes
>   prévues aujourd'hui »), jamais un message nommant une habitude précise. Les scénarios 1, 2 et 3
>   sont reformulés en ce sens.
> - Un nouveau scénario (**3bis**) couvre explicitement l'état « PWA non installée » : sans
>   installation sur l'écran d'accueil, les rappels sont indisponibles, ce qui doit être signalé
>   clairement à l'utilisateur plutôt que d'échouer silencieusement.
> - Le scénario 8 (pas de rappel si déjà fait) est reformulé en **best-effort**, conditionné à une
>   resynchronisation préalable de l'app, car le serveur ne connaît pas l'état de complétion.
> - Le scénario 10 (fiabilité à l'échelle) ne référençait déjà aucune limite système chiffrée
>   (type « 64 notifications ») et n'a pas eu besoin d'être modifié dans son texte Given/When/Then.
>
> **Arbitrages produit (2026-08-12)** — décisions rendues sur les points laissés ouverts lors de
> la révision précédente :
> - **Heure de rappel par défaut fixée à 8h00** (Scénario 7), avec latence assumée jusqu'à 8h15
>   du fait de la granularité du scheduler (~15 min).
> - **Compteur non nominatif autorisé** dans le contenu du push (ex. « 3 habitudes à faire
>   aujourd'hui ») : le message peut indiquer un nombre d'habitudes/tâches dues, mais ne doit
>   **jamais** citer leur nom (Scénarios 1, 2, 3 mis à jour en ce sens).
> - **Pas de nouvelle US pour l'onboarding d'installation** : le message contextuel du
>   Scénario 3bis (« PWA non installée → rappels indisponibles ») est jugé suffisant.
> - **Nouvelle US-008 — Sauvegarde et restauration de mes données** créée séparément pour couvrir
>   le risque de purge du stockage local mentionné dans l'ADR-001 (export/import JSON manuel).

### Priorité
Must — priorité la plus haute du backlog après US-001. Le benchmark identifie les rappels par notification comme le point le plus critique et le plus discriminant du projet (25 % de sa pondération) et recommande explicitement de les valider **tôt dans le développement, pas en fin de projet**, car ils reposent sur des mécanismes système (permission, planification, comportement app fermée) qui ne se découvrent fiablement qu'en le testant tôt sur un appareil réel. C'est un risque technique avéré, pas une préférence produit : cette US est donc avancée devant US-002/003/004/005/006 dans l'ordre d'implémentation recommandé, alors même qu'elle n'apporte pas de valeur visible supplémentaire à un utilisateur qui n'a pas encore de planning (US-004) à consulter.

### Estimation
XL — cette US couvre un périmètre fonctionnel large (déclenchement selon fréquence, permission, activation/désactivation, réglage d'heure, fiabilité, passage à l'échelle). Elle est volontairement gardée en un seul bloc dans ce backlog car elle correspond à une seule capacité utilisateur cohérente (« être notifié pour ne pas oublier »), mais elle peut être redécoupée en plusieurs tickets techniques plus fins au moment de l'implémentation (par exemple : permission + activation globale d'un côté, fiabilité/planification de l'autre) sans que cela change le contrat fonctionnel décrit ici.

### Dépendances
- **US-001** : une habitude avec une fréquence définie (intervalle de jours ou jours de semaine) est le pré-requis minimal pour qu'il y ait quelque chose à rappeler. C'est la seule dépendance fonctionnelle stricte : cette US ne nécessite pas le planning quotidien (US-004) pour être livrée.
- **ADR-001 — PWA SvelteKit + Web Push avec micro-scheduler serveur** (`docs/architecture/ADR-001-pwa-sveltekit-web-push-scheduler.md`) : cadre le mécanisme technique des rappels (Web Push iOS, souscription servant d'identifiant sans compte, fenêtre glissante calculée côté client et re-poussée au serveur, scheduler cron Netlify). Cette US fait passer cet ADR du statut « proposé » à un statut justifié par un besoin utilisateur réel ; le micro-scheduler ne doit pas être implémenté avant que cette US ne soit priorisée. *(Remplace la dépendance à l'ancien ADR-005 « Notifications locales iOS », supprimé lors du pivot Flutter → PWA.)*

### Notes / hors périmètre

> Notes techniques **mises à jour** pour le mécanisme Web Push (ADR-001). Ce qui suit
> remplace les hypothèses de l'ancienne approche « notifications locales natives ».

- **Mécanisme (rappel) : Web Push, pas de notification locale programmée.** iOS ne permet
  pas de programmer une notification locale future. Le rappel repose sur : (1) le client
  calcule localement les instants d'envoi (jours à occurrence × heure choisie) sur une
  **fenêtre glissante** et les pousse au serveur ; (2) un **scheduler cron (Netlify)** envoie
  le push au bon moment ; (3) le **service worker** affiche la notification, même app fermée.
- **Pré-requis d'installation** : le Web Push iOS ne fonctionne que si la PWA est **installée
  sur l'écran d'accueil** (iOS 16.4+ ; France/UE OK depuis iOS 17.4). Le **Scénario 3bis** couvre
  désormais explicitement cet état : une PWA ouverte en simple onglet Safari **ne peut pas**
  recevoir de push, et l'application doit le signaler clairement avant même de proposer la
  demande de permission notifications (Scénario 4), sans échec silencieux (cf. aussi Scénario 5).
- **La limite des 64 notifications programmées n'existe plus** (elle était propre à
  `UNUserNotificationCenter` natif). Le Scénario 10 (fiabilité à l'échelle) reste pertinent
  mais son risque se déplace : ce n'est plus un plafond OS, c'est la **taille de la fenêtre
  glissante uploadée** et la bonne exécution du scheduler.
- **NOUVEAU RISQUE — la fiabilité dépend désormais du scheduler serveur** (Scénarios 9 et 10).
  Avec le natif, l'OS garantissait le tir même app fermée. Désormais : si la fonction cron
  Netlify ne s'exécute pas (incident, quota, mauvais déploiement), **aucun rappel ne part**,
  sans que l'appareil le détecte. À surveiller (monitoring du cron) et à documenter comme
  limite de fiabilité. La **latence** est aussi bornée par la granularité cron (≈15 min).
- **Scénario 8 (pas de rappel si déjà fait) est best-effort, décision actée** : le serveur ne
  connaît pas l'état de complétion (données 100 % locales). Le contenu générique du rappel
  (« Tu as des habitudes prévues aujourd'hui ») reste pertinent même si une partie des habitudes
  est déjà faite, ce qui limite l'impact produit de ce compromis. Le scénario 8 ci-dessus formalise
  la règle : suppression garantie uniquement si l'app a resynchronisé sa fenêtre avant l'heure
  d'envoi ; sinon, réception possible malgré la complétion (best-effort assumé pour le MVP).
- **Identifiant sans compte** : la souscription Web Push (son `endpoint`) sert d'identifiant
  implicite côté serveur (hash SHA-256 comme clé). Aucun email, aucun login, aucune donnée
  métier ne remonte — seulement la souscription et des horodatages d'envoi (cf. ADR-001).
- **Granularité choisie pour le MVP : activation/désactivation globale des rappels**, pas de
  réglage par habitude individuelle. Choix délibéré de simplicité ; granularité par habitude =
  amélioration ultérieure éventuelle.
- **Heure de rappel** : heure unique et globale, modifiable, **valeur par défaut 8h00**. Avec la
  latence du scheduler (~15 min), l'envoi effectif peut survenir jusqu'à ~8h15 par défaut (ou
  jusqu'à 15 min après toute autre heure choisie).
- **Contenu de la notification** : le détail des habitudes (noms) ne transite jamais par le
  serveur et n'apparaît jamais dans le push ; l'utilisateur ouvre l'app pour voir sa liste
  réelle. Le message est soit totalement générique (« Tu as des habitudes prévues aujourd'hui »),
  soit assorti d'un **compteur non nominatif** du nombre d'habitudes/tâches dues (« 3 habitudes
  à faire aujourd'hui ») — les deux formulations sont autorisées, décision actée le 2026-08-12
  (cf. scénarios 1, 2, 3 ci-dessus).
- La **validation complète de la fiabilité** (Scénarios 9 et 10, app fermée / verrouillée) ne
  peut être observée que sur **iPhone réel avec la PWA installée** (pas en simulateur ni en
  onglet Safari). Contrainte actée dans l'ADR-001, à anticiper dès cette US.
- Cette US ne couvre pas l'historique des notifications envoyées ni de statistiques sur les
  rappels (ouverts, ignorés, etc.).
