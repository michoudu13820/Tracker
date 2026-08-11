---
name: fetch-framework-pulse
description: >-
  Recherche et agrège les métriques live des frameworks mobiles (GitHub stars/issues,
  téléchargements npm/pub.dev/NuGet, questions Stack Overflow, tendances emploi, actualités
  et breaking changes). À utiliser lors d'un benchmark mobile pour disposer de données
  récentes et objectives, ou quand l'utilisateur demande « où en sont les frameworks »,
  « métriques Flutter vs React Native », « popularité / santé d'un framework ».
---

# Pulse des frameworks mobiles

Recherche et agrège les métriques live pour les frameworks mobiles passés en argument (ou Flutter, React Native, Ionic, .NET MAUI et KMM par défaut si aucun argument).

Pour chaque framework, récupère via WebSearch et WebFetch :

1. **GitHub** : stars, forks, issues ouvertes, dernière release, fréquence des commits (6 derniers mois)
   - Recherche : `"[framework] github stars {current_year}" site:github.com OR site:star-history.com`

2. **npm / pub.dev / NuGet** : téléchargements hebdomadaires
   - npm : `"[framework] npm weekly downloads {current_year}"`
   - pub.dev pour Flutter/Dart
   - NuGet pour .NET MAUI

3. **Stack Overflow** : nombre de questions avec le tag, ratio questions/réponses
   - `site:stackoverflow.com/questions/tagged/[framework] {current_year}`

4. **Tendances** : Google Trends (score relatif), mentions dans les offres d'emploi
   - `"[framework] developer jobs {current_year}"`
   - `"[framework] job market demand {current_year}"`

5. **Dernières actualités** : breaking changes, dépréciations, annonces majeures (6 derniers mois)
   - `"[framework] release notes {current_year}"`
   - `"[framework] deprecation OR breaking change {current_year}"`

Présente les résultats sous forme de tableau synthétique :

```
## Pulse des frameworks — [date du jour]

| Métrique              | Flutter | React Native | Ionic | .NET MAUI | KMM |
|----------------------|---------|--------------|-------|-----------|-----|
| GitHub Stars         |         |              |       |           |     |
| Issues ouvertes      |         |              |       |           |     |
| Dernière release     |         |              |       |           |     |
| DL hebdo (packages)  |         |              |       |           |     |
| SO questions (1 an)  |         |              |       |           |     |
| Tendance emploi      |         |              |       |           |     |
| Alertes majeures     |         |              |       |           |     |
```

Termine par une section **Signaux d'alerte** listant tout changement notable (fin de support, fork, rachat, pivot majeur) détecté.

Indique systématiquement la source et la date de chaque donnée.
