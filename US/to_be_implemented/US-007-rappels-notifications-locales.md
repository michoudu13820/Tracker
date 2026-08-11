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
> **Alors** je reçois une notification de rappel pour cette habitude ce jour-là

**Scénario 2 — Rappel pour une habitude à fréquence par jours de la semaine**
> **Étant donné** une habitude « Yoga » a une fréquence « lundi, mercredi, vendredi » et les rappels sont activés
> **Quand** on est un mercredi
> **Alors** je reçois une notification de rappel pour cette habitude ce jour-là

**Scénario 3 — Aucun rappel un jour où l'habitude n'est pas prévue**
> **Étant donné** une habitude « Yoga » a une fréquence « lundi, mercredi, vendredi » et les rappels sont activés
> **Quand** on est un mardi
> **Alors** je ne reçois aucune notification de rappel pour cette habitude ce jour-là

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
> **Étant donné** les rappels sont activés, avec une heure de rappel par défaut le matin
> **Quand** je choisis une autre heure dans les réglages de rappel
> **Alors** les prochaines notifications de rappel pour mes habitudes du jour sont envoyées à cette nouvelle heure choisie

**Scénario 8 — Pas de rappel pour une habitude déjà faite**
> **Étant donné** une habitude prévue aujourd'hui a déjà été cochée comme faite
> **Quand** l'heure du rappel survient
> **Alors** je ne reçois pas de notification de rappel pour cette habitude ce jour-là

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
> **PWA SvelteKit + Web Push** avec un micro-scheduler serveur (voir ADR-001). Le contrat
> fonctionnel ci-dessus (scénarios Given/When/Then) **reste valable tel quel** : l'utilisateur
> reçoit toujours un rappel au bon moment, même app fermée. Seules les **notes techniques**
> plus bas ont été adaptées au nouveau mécanisme.

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
  sur l'écran d'accueil** (iOS 16.4+ ; France/UE OK depuis iOS 17.4). Le Scénario 4 (permission)
  doit donc, en amont, guider l'utilisateur à **installer l'app** avant même de demander la
  permission notifications. Une PWA ouverte en simple onglet Safari **ne peut pas** recevoir
  de push : à gérer comme un état explicite (pas d'échec silencieux, cf. Scénario 5).
- **La limite des 64 notifications programmées n'existe plus** (elle était propre à
  `UNUserNotificationCenter` natif). Le Scénario 10 (fiabilité à l'échelle) reste pertinent
  mais son risque se déplace : ce n'est plus un plafond OS, c'est la **taille de la fenêtre
  glissante uploadée** et la bonne exécution du scheduler.
- **NOUVEAU RISQUE — la fiabilité dépend désormais du scheduler serveur** (Scénarios 9 et 10).
  Avec le natif, l'OS garantissait le tir même app fermée. Désormais : si la fonction cron
  Netlify ne s'exécute pas (incident, quota, mauvais déploiement), **aucun rappel ne part**,
  sans que l'appareil le détecte. À surveiller (monitoring du cron) et à documenter comme
  limite de fiabilité. La **latence** est aussi bornée par la granularité cron (≈15 min).
- **Scénario 8 (pas de rappel si déjà fait) devient best-effort** : le serveur ne connaît
  pas l'état de complétion (données 100 % locales). Un rappel peut partir même si l'habitude
  est déjà cochée, **sauf si l'app a re-synchronisé sa fenêtre** (donc annulé le rappel du jour)
  avant l'heure d'envoi. Comme le cas d'usage est justement « app fermée », cette suppression
  ne peut être garantie. À trancher au raffinement : accepter ce best-effort pour le MVP, ou
  formuler le rappel de façon neutre (« pense à tes habitudes du jour ») pour qu'il reste
  pertinent même si une partie est faite.
- **Identifiant sans compte** : la souscription Web Push (son `endpoint`) sert d'identifiant
  implicite côté serveur (hash SHA-256 comme clé). Aucun email, aucun login, aucune donnée
  métier ne remonte — seulement la souscription et des horodatages d'envoi (cf. ADR-001).
- **Granularité choisie pour le MVP : activation/désactivation globale des rappels**, pas de
  réglage par habitude individuelle. Choix délibéré de simplicité ; granularité par habitude =
  amélioration ultérieure éventuelle.
- **Heure de rappel** : heure unique et globale, modifiable, valeur par défaut le matin.
- **Contenu de la notification** : volontairement **générique** dans cette architecture (ex.
  « Tu as des habitudes prévues aujourd'hui »), car le détail des habitudes ne transite pas par
  le serveur ; l'utilisateur ouvre l'app pour voir la liste locale. Au raffinement, décider si
  un compteur non nominatif (ex. « 3 habitudes ») est acceptable côté vie privée.
- La **validation complète de la fiabilité** (Scénarios 9 et 10, app fermée / verrouillée) ne
  peut être observée que sur **iPhone réel avec la PWA installée** (pas en simulateur ni en
  onglet Safari). Contrainte actée dans l'ADR-001, à anticiper dès cette US.
- Cette US ne couvre pas l'historique des notifications envoyées ni de statistiques sur les
  rappels (ouverts, ignorés, etc.).
