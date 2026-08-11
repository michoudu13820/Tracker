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

### Priorité
Must — priorité la plus haute du backlog après US-001. Le benchmark identifie les rappels par notification comme le point le plus critique et le plus discriminant du projet (25 % de sa pondération) et recommande explicitement de les valider **tôt dans le développement, pas en fin de projet**, car ils reposent sur des mécanismes système (permission, planification, comportement app fermée) qui ne se découvrent fiablement qu'en le testant tôt sur un appareil réel. C'est un risque technique avéré, pas une préférence produit : cette US est donc avancée devant US-002/003/004/005/006 dans l'ordre d'implémentation recommandé, alors même qu'elle n'apporte pas de valeur visible supplémentaire à un utilisateur qui n'a pas encore de planning (US-004) à consulter.

### Estimation
XL — cette US couvre un périmètre fonctionnel large (déclenchement selon fréquence, permission, activation/désactivation, réglage d'heure, fiabilité, passage à l'échelle). Elle est volontairement gardée en un seul bloc dans ce backlog car elle correspond à une seule capacité utilisateur cohérente (« être notifié pour ne pas oublier »), mais elle peut être redécoupée en plusieurs tickets techniques plus fins au moment de l'implémentation (par exemple : permission + activation globale d'un côté, fiabilité/planification de l'autre) sans que cela change le contrat fonctionnel décrit ici.

### Dépendances
- **US-001** : une habitude avec une fréquence définie (intervalle de jours ou jours de semaine) est le pré-requis minimal pour qu'il y ait quelque chose à rappeler. C'est la seule dépendance fonctionnelle stricte : cette US ne nécessite pas le planning quotidien (US-004) pour être livrée.
- **ADR-005 — Notifications locales iOS : plugin, fuseaux et fenêtre glissante** (`docs/architecture/ADR-005-notifications-locales-ios.md`) : cadre les contraintes techniques (limite système de notifications programmées, fenêtre glissante de planification, gestion des fuseaux horaires, re-planification). Cette US fait passer cet ADR du statut « proposé » à un statut justifié par un besoin utilisateur réel ; l'ADR ne doit pas être implémenté avant que cette US ne soit priorisée.

### Notes / hors périmètre
- **Granularité choisie pour le MVP : activation/désactivation globale des rappels**, pas de réglage par habitude individuelle. C'est un choix délibéré pour rester simple à ce stade : une granularité par habitude (pouvoir couper le rappel d'une habitude précise sans désactiver les autres) est une amélioration possible mais n'est pas couverte ici — à envisager comme US ultérieure si le besoin est confirmé à l'usage.
- **Heure de rappel** : cette US suppose une heure de rappel unique et globale (pas une heure différente par habitude), modifiable par l'utilisateur, avec une valeur par défaut raisonnable le matin. Ce choix est une hypothèse de simplicité à faire valider par l'équipe lors du raffinement ; il ne remet pas en cause le reste de l'US.
- **Contenu exact de la notification** (texte affiché, action au tap) n'est pas spécifié précisément ici : au minimum le nom de l'habitude concernée doit être identifiable dans la notification.
- La **validation complète de la fiabilité** (Scénarios 9 et 10, notamment application fermée / téléphone verrouillé) ne peut être observée de façon certaine qu'en conditions réelles sur un appareil physique, pas sur un simulateur/émulateur de développement. Cette contrainte de validation est actée dans l'ADR-005 et doit être anticipée dans le plan de développement (accès à un appareil réel dès cette US, pas en fin de projet).
- Cette US ne couvre pas la remontée d'un historique des notifications envoyées, ni de statistiques sur les rappels (ouverts, ignorés, etc.).
- Le nombre exact de notifications que le système peut programmer simultanément est une contrainte technique documentée dans l'ADR-005, pas un critère fonctionnel de cette US : le Scénario 10 exprime volontairement l'exigence de fiabilité sans exposer ce chiffre.
