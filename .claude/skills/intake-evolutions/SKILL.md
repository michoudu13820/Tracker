---
name: intake-evolutions
description: >-
  Lit le fichier evolutions/evolution_to_be_implemented.md, en extrait les évolutions
  distinctes non encore traitées, et les prépare pour transformation en User Stories.
  Marque chaque évolution traitée en la reliant à l'US générée (sans la supprimer).
  À utiliser au démarrage d'une session Product Owner, ou quand l'utilisateur demande
  de « traiter les évolutions » / « vider le fichier des évolutions » / « faire le point sur les besoins en attente ».
---

# Prise en charge des évolutions

Ingère les besoins depuis le fichier de backlog brut et les prépare pour la rédaction d'US.

## Étapes

### 1. Localiser & lire
- Vérifie l'existence de `evolutions/evolution_to_be_implemented.md` (Glob/Read).
- S'il n'existe pas : signale-le et propose soit de le créer (dossier `evolutions/`), soit de travailler à partir d'un besoin donné dans le chat.

### 2. Extraire les évolutions distinctes
- Découpe le contenu en **items d'évolution distincts** (une idée = un item), même s'ils sont rédigés en vrac.
- Ignore les items déjà marqués comme **traités** (voir convention ci-dessous).
- Pour chaque item, résume : intitulé, besoin sous-jacent, persona probable, valeur attendue.

### 3. Analyser
- Repère les doublons, les items trop gros (épopées à découper), les dépendances entre items.
- Signale les items ambigus qui nécessiteront une clarification avant rédaction d'US.

### 4. Enchaîner vers la rédaction
- Pour chaque évolution retenue, prépare l'entrée et transmets-la au skill **`write-user-story`** (ou rédige directement l'US si tu enchaînes).

### 5. Marquer comme traité (NE PAS supprimer)
Après génération de l'US correspondante, édite `evolutions/evolution_to_be_implemented.md` pour tracer le traitement, par exemple :

```markdown
- [x] ~~<intitulé de l'évolution>~~ → US-<NNN> (US/to_be_implemented/US-<NNN>-<slug>.md)
```

Conserve ainsi l'historique. Les évolutions non traitées restent en `- [ ]`.

## Règles
- **Ne perds aucune évolution** : si tu as un doute sur la découpe, liste tous les items et demande confirmation.
- **Ne supprime jamais** le contenu source ; marque-le comme traité.
- Respecte l'ordre de priorité si le fichier en indique un.
- À la fin, fais un **récapitulatif** : X évolutions lues, Y transformées en US, Z en attente de clarification.
