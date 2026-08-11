---
type: adr
numero: 005
titre: Notifications locales iOS — plugin, fuseaux et fenêtre glissante
date: 2026-08-09
auteur: flutter-architect
statut: proposé
remplace: —
---

# ADR-005 — Notifications locales iOS : plugin, fuseaux et fenêtre glissante

> **Statut : proposé, par anticipation.** Aucune User Story du backlog actuel (US-001 à US-006) ne couvre les notifications. Cet ADR existe parce que le benchmark en fait **le critère le plus discriminant du projet** (25 % de la pondération) et recommande de le valider **dès les premières itérations, pas en fin de projet**. Il passera `accepté` quand une US de rappels sera écrite et implémentée. **Ne pas implémenter de notifications sans US** : ce serait du scope creep.

## Contexte

Le benchmark identifie les rappels locaux programmés comme le point bloquant du projet, et relève trois pièges :

1. **Limite système iOS : 64 notifications programmées par application.** Une app multi-habitudes récurrentes dépasse ce plafond si l'on pré-programme naïvement toutes les échéances.
2. **Fuseaux horaires et heure d'été** : sans gestion explicite, les rappels se déclenchent à la mauvaise heure — piège classique documenté de `flutter_local_notifications`.
3. **iOS ne réveille pas l'app en arrière-plan** à heure arbitraire pour recalculer : il faut s'appuyer sur des déclencheurs calendaires pré-programmés, pas sur du calcul en tâche de fond.

S'ajoute la contrainte de validation : le comportement réel (app fermée, device verrouillé) **n'est observable que sur un iPhone physique via le pipeline CI → AltStore**, jamais sur l'émulateur Android de développement.

## Décision (proposée)

1. **Plugin** : `flutter_local_notifications` + `timezone`, qui encapsulent directement `UNUserNotificationCenter` — même API sous-jacente que le natif, d'où la parité 5/5 avec Swift dans le benchmark.
2. **Fenêtre glissante** : ne jamais programmer plus de **~50 notifications** (marge sous la limite de 64). On programme les échéances des **7 à 14 prochains jours**, par ordre de proximité, et on **re-planifie à chaque lancement de l'app** et après toute modification d'habitude.
3. **Fuseaux** : utiliser `zonedSchedule` avec un `tz.TZDateTime` construit sur le fuseau **local de l'appareil**, jamais un `DateTime` UTC brut. Initialiser la base timezone au démarrage.
4. **Placement architectural** :
   - La **décision métier** « quelles échéances tombent dans les N prochains jours, dans quel ordre de priorité » est un **use case du domaine** (`ComputeUpcomingReminders`), testable sans Flutter ni plugin, avec horloge injectée (ADR-004).
   - La **programmation effective** est une infrastructure : `core/notifications/` expose une interface `ReminderScheduler` implémentée par le plugin. Le domaine ne connaît que l'interface.
   - Conséquence : la logique de fenêtre glissante et de priorisation est testable **sur Windows**, seule la couche plugin exige un iPhone.
5. **Permission refusée** : état de premier ordre dans l'app (écran d'explication + lien vers les Réglages), pas un échec silencieux.

## Alternatives considérées

| Option | Avantages | Inconvénients | Retenue ? |
|--------|-----------|---------------|-----------|
| **`flutter_local_notifications` + `timezone`, fenêtre glissante** | Accès à l'API native ; contourne la limite des 64 ; logique de planification testable sur Windows | Re-planification à gérer à chaque lancement et à chaque édition d'habitude | ✅ Proposé |
| Pré-programmer toutes les récurrences via `matchDateTimeComponents` | Simple, iOS gère la récurrence | Une notification récurrente par habitude consomme un slot, et les fréquences « tous les 2 jours » (US-001) ne se traduisent pas en récurrence calendaire native | ⚠️ Complément partiel (jours de semaine) |
| Calcul en tâche de fond (`BGTaskScheduler`) | Recalcul « à l'expiration » | iOS ne garantit aucun réveil à heure précise ; le benchmark l'écarte explicitement | ❌ Non |
| Web Push via backend | Contourne les limites locales | Impose un backend, contradiction directe avec la contrainte « zéro backend » | ❌ Non |

## Conséquences

**Positives :**
- Le plafond des 64 est traité par conception plutôt que découvert en production.
- L'essentiel de la logique de rappel est testable sans iPhone.

**Négatives / compromis acceptés :**
- La re-planification à chaque lancement est un coût de complexité permanent, et un rappel peut manquer si l'app n'est pas ouverte pendant plus longtemps que la fenêtre. Fenêtre de 14 jours plutôt que 7 pour réduire ce risque.
- La validation finale reste dépendante du pipeline CI → AltStore et d'un iPhone physique : prévoir cette boucle **avant** d'écrire une US de rappels.

## Liens

- [Benchmark — verdict sur les notifications locales](../../benchmarks/benchmark-habit-tracker-ios-2026-08-09.md)
- [ADR-004 — Result/Failure et horloge injectée](ADR-004-result-failure-horloge-injectee.md)
