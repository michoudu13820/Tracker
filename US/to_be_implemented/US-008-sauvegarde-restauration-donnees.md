---
type: user-story
id: US-008
titre: Sauvegarde et restauration de mes données
date: 2026-08-12
auteur: product-owner
statut: prête
priorite: Should
estimation: M
source: chat
depend_de: ["US-001", "US-002", "US-004"]
---

## Titre : US-008 — Sauvegarde et restauration de mes données

### Récit
> **En tant qu'** utilisateur de l'app,
> **je veux** pouvoir exporter manuellement toutes mes données dans un fichier, et les restaurer depuis un fichier précédemment exporté,
> **afin de** ne pas perdre mon historique d'habitudes et de tâches en cas de suppression de l'application, de changement d'appareil, ou de purge du stockage local par le système.

### Critères d'acceptation

**Scénario 1 — Export manuel de mes données**
> **Étant donné** je suis dans les réglages de l'application, et j'ai au moins une habitude, une tâche et des jours cochés dans mon historique
> **Quand** je déclenche l'action « Exporter mes données »
> **Alors** l'application génère un fichier au format JSON contenant l'ensemble de mes données locales (habitudes, tâches, historique de complétion, réglages tels que les seuils de couleur et l'heure de rappel)
> **Et** ce fichier m'est proposé au téléchargement/à l'enregistrement sur mon appareil, avec un nom explicite incluant la date de l'export (ex : `tracker-export-2026-08-12.json`)

**Scénario 2 — Export possible même sans données**
> **Étant donné** je n'ai encore créé aucune habitude ni tâche
> **Quand** je déclenche l'action « Exporter mes données »
> **Alors** un fichier d'export est tout de même généré (structure valide mais vide), sans erreur bloquante

**Scénario 3 — Import réussi depuis un fichier valide**
> **Étant donné** je suis dans les réglages de l'application
> **Quand** je déclenche l'action « Importer mes données » et que je sélectionne un fichier JSON précédemment exporté par l'application
> **Alors** l'application me demande confirmation avant de procéder, en précisant que l'import va remplacer mes données actuelles
> **Et**, une fois confirmé, mes habitudes, tâches, historique de complétion et réglages sont restaurés tels qu'ils étaient dans le fichier
> **Et** un message de confirmation m'indique que l'import a réussi

**Scénario 4 — Import bloqué si fichier invalide ou corrompu**
> **Étant donné** je déclenche l'action « Importer mes données »
> **Quand** je sélectionne un fichier qui n'est pas un export valide de l'application (format JSON incorrect, structure inattendue, fichier corrompu)
> **Alors** l'import est bloqué
> **Et** un message m'indique clairement que le fichier n'est pas reconnu comme un export valide
> **Et** mes données actuelles ne sont pas modifiées

**Scénario 5 — Avertissement explicite avant écrasement des données existantes**
> **Étant donné** j'ai déjà des données existantes dans l'application (habitudes, tâches, historique)
> **Quand** je lance un import et que je n'ai pas encore confirmé l'action
> **Alors** l'application m'avertit explicitement que l'import va remplacer mes données actuelles par celles du fichier, avant toute confirmation
> **Et** si j'annule à ce stade, mes données actuelles restent inchangées

**Scénario 6 — Import annulé par l'utilisateur**
> **Étant donné** je suis à l'étape de confirmation d'un import
> **Quand** je choisis d'annuler plutôt que de confirmer
> **Alors** aucune donnée n'est modifiée
> **Et** je reviens à l'état précédent de l'application

### Priorité
Should — c'est un filet de sécurité contre la perte de données (risque assumé et documenté dans l'ADR-001 : purge du stockage local iOS), pas une fonctionnalité bloquante pour la première mise à disposition du MVP. L'app reste pleinement utilisable sans cette US ; elle réduit un risque plutôt qu'elle n'apporte une capacité quotidienne nouvelle.

### Estimation
M — sérialisation de l'ensemble du modèle de données (habitudes, tâches, complétions, réglages), gestion de fichier (téléchargement/sélection), validation de structure à l'import, et parcours de confirmation/annulation avant écrasement. Plus large qu'un simple CRUD (US-002, S) mais reste circonscrit à une seule capacité cohérente.

### Dépendances
US-001 (habitudes à exporter/importer), US-002 (tâches à exporter/importer), US-004 (historique de complétion produit par le planning quotidien — sans lui, l'export serait incomplet et peu utile en pratique).

### Notes / hors périmètre
- Pas de sauvegarde automatique périodique ni de synchronisation cloud dans cette US : l'export/import est une action manuelle explicite déclenchée par l'utilisateur, cohérent avec le principe « données 100 % locales » de l'ADR-001 (« presque zéro backend »).
- Pas de fusion intelligente (merge) entre les données actuelles et le fichier importé : l'import **remplace** intégralement les données actuelles par celles du fichier (stratégie « replace », pas « merge »). À raffiner si un besoin de fusion s'avère nécessaire par la suite.
- Ne couvre pas la sauvegarde/restauration de la souscription Web Push (état côté serveur, cf. ADR-001/US-007) : ce n'est pas une donnée métier, elle reste liée à l'appareil et au navigateur et devra être réactivée séparément après un import sur un nouvel appareil.
- Le mécanisme technique `navigator.storage.persist()` mentionné dans l'ADR-001 (demande de stockage persistant au navigateur) est une mitigation complémentaire au risque de purge, mais ne correspond à aucune action utilisateur visible : il est hors périmètre fonctionnel de cette US.
- Pas d'export partiel (par habitude, par période) : l'export couvre toujours l'intégralité des données.
