# Benchmark framework mobile — Habit Tracker iOS (perso, offline, notifications locales)

## Contexte du besoin

Application personnelle de suivi d'habitudes ("habit tracker") :

**Fonctionnalités v0 (MVP)**
- Créer/gérer une liste d'habitudes.
- Définir une fréquence par habitude (ex: quotidienne, X fois/semaine, jours spécifiques...).
- Recevoir une notification push locale sur le téléphone quand l'échéance d'une habitude approche/expire (rappel).
- Vue "aujourd'hui" : les habitudes à faire aujourd'hui.
- Vue "prochains jours" : ce qui arrive dans les jours suivants.
- Rapport mensuel : bilan/statistiques des habitudes sur le mois (taux de complétion, historique...).
- Persistance strictement locale sur l'appareil en v0 : pas de compte utilisateur, pas de synchronisation multi-appareil/multi-compte, pas de backend.

**Contraintes clés**
- Cible : iPhone (iOS) uniquement — pas besoin de cross-platform Android pour l'instant, mais ne pas fermer la porte à une éventuelle extension future si cela ne coûte rien.
- Priorité : application légère (poids, simplicité, rapidité de dev et de maintenance) plutôt que riche en fonctionnalités.
- Le profil/niveau technique du développeur n'est pas un critère de choix.
- Point technique critique : capacité à déclencher des notifications push locales fiables (rappels programmés) sur iOS.
- Projet personnel/solo.

## Résumé exécutif

Pour une app perso **iOS-only**, **légère**, **sans backend**, dont le point critique est la **fiabilité des notifications locales programmées**, le classement pondéré donne :

| Rang | Option | Score global |
|------|--------|--------------|
| 1 | **Swift / SwiftUI (natif)** | **4.60 / 5** |
| 2 | Flutter | 4.35 / 5 |
| 3 | React Native / Expo | 4.00 / 5 |
| 3 | SvelteKit + Capacitor | 4.00 / 5 |
| 5 | .NET MAUI | 3.25 / 5 |
| 6 | PWA pure (Safari/Home Screen) | 2.95 / 5 |

**Recommandation : Swift / SwiftUI.** C'est l'option la plus légère, la plus fiable sur les notifications (accès direct à `UNUserNotificationCenter`), la mieux outillée pour la persistance locale (SwiftData/Core Data) et la moins coûteuse en maintenance solo pour un périmètre iOS-only. **Alternative sérieuse : Flutter**, si tu veux garder la porte Android ouverte sans surcoût. **À éviter : la PWA pure**, bloquante sur le critère notifications.

## Verdict sur le point critique : notifications locales programmées sur iOS

C'est le facteur discriminant. Statut par option :

| Option | Faisabilité notifs locales programmées iOS | Fiabilité | Détails |
|--------|-------------------------------------------|-----------|---------|
| **Swift/SwiftUI** | Oui, natif | Excellente | `UNUserNotificationCenter` + triggers `UNCalendarNotificationTrigger`/`UNTimeIntervalNotificationTrigger`. Référence du marché. Limite système : **64 notifications programmées max par app** — à gérer avec une file de priorité (pertinent pour du multi-habitudes récurrentes). |
| **Flutter** | Oui, via plugin | Excellente | `flutter_local_notifications` (+ `timezone` obligatoire) encapsule directement `UNUserNotificationCenter`. Même API sous-jacente que le natif. Piège classique : conversion timezone, sinon tirs à mauvaise heure. Même limite des 64. |
| **React Native / Expo** | Oui, via `expo-notifications` | Bonne | Encapsule l'API native. Quelques pièges : handler foreground (`setNotificationHandler`), comportement non reproductible sous Expo Go/simulateur — tests device obligatoires. |
| **SvelteKit + Capacitor** | Oui, via `@capacitor/local-notifications` | Bonne | Le shell natif Capacitor appelle `UNUserNotificationCenter`. C'est ce qui sauve l'approche "web" — l'app doit être empaquetée et publiée comme app native (pas une PWA Safari). |
| **.NET MAUI** | Oui, via `Plugin.LocalNotification` ou `INotificationManagerService` | Bonne | Wrap natif, fonctionne sans backend. Écosystème plus étroit. |
| **PWA pure (Home Screen)** | **NON** | Bloquant | Safari/iOS **ne supporte pas les notifications locales programmées**. Seul le **Web Push serveur** existe (iOS 16.4+, app installée sur l'écran d'accueil) — ce qui **impose un backend**, en contradiction directe avec la contrainte "pas de backend, tout local". De plus, risque d'éviction des données (IndexedDB) et incertitudes réglementaires PWA dans l'UE (DMA). |

Conclusion clé : toute approche qui n'embarque pas de shell natif est éliminée par la contrainte "notifications locales fiables + zéro backend". La PWA pure ne passe pas ; Capacitor passe uniquement parce qu'il produit une vraie app native publiée sur l'App Store.

## Pondération retenue

| Critère | Poids | Justification du poids |
|---------|-------|------------------------|
| Notifications locales fiables iOS | 25% | Point bloquant explicite du projet |
| Légèreté (poids binaire + simplicité stack) | 20% | Priorité produit affichée |
| Rapidité de dev MVP | 20% | Projet solo, périmètre v0 restreint |
| Maintenabilité solo / pérennité | 15% | Un seul mainteneur sur la durée |
| Persistance locale sans backend | 10% | Contrainte forte v0 |
| Portabilité Android future "gratuite" | 5% | "Ne pas fermer la porte" mais non prioritaire |
| Accès natif iOS day-one (widgets, Live Activities…) | 5% | Bonus, pas requis en v0 |

## Matrice de scoring pondérée

| Critère | Poids | Swift/SwiftUI | Flutter | RN/Expo | SvelteKit+Capacitor | .NET MAUI | PWA pure |
|---------|-------|:---:|:---:|:---:|:---:|:---:|:---:|
| Notifs locales iOS | 25% | 5 | 5 | 4 | 4 | 4 | 1 |
| Légèreté | 20% | 5 | 3 | 3 | 4 | 2 | 5 |
| Rapidité dev MVP | 20% | 4 | 5 | 5 | 4 | 3 | 4 |
| Maintenabilité solo | 15% | 5 | 4 | 4 | 4 | 3 | 2 |
| Persistance locale | 10% | 5 | 5 | 4 | 4 | 4 | 3 |
| Portabilité Android | 5% | 1 | 5 | 5 | 5 | 5 | 4 |
| Accès natif day-one | 5% | 5 | 3 | 3 | 3 | 3 | 2 |
| **Score global** | 100% | **4.60** | **4.35** | **4.00** | **4.00** | **3.25** | **2.95** |

Notes de justification synthétiques :
- **Swift** : gagne sur légèreté (binaire minimal, pas de runtime embarqué), notifs (API directe), persistance (SwiftData), pérennité (first-party Apple, features OS day-one). Perd seulement sur la portabilité Android (0 partage de code).
- **Flutter** : égalité sur notifs, excellent time-to-market (hot reload) et persistance (Isar/Drift/sqflite), mais binaire ~18 Mo (moteur Impeller embarqué) qui pèse sur la "légèreté".
- **RN/Expo** : time-to-market top, mais binaire ~20 Mo, quelques pièges notifs et churn d'écosystème/upgrades.
- **Capacitor** : bon compromis web + légèreté relative, mais UX webview et étape d'intégration native supplémentaire.
- **MAUI** : fonctionne mais binaire lourd, écosystème plus étroit, cadence de suivi Xcode/iOS parfois en retard.
- **PWA pure** : la plus légère mais **disqualifiée** par les notifications.

## Recommandation

### Choix principal : Swift / SwiftUI — 4.60/5
Le meilleur alignement avec les priorités : légèreté, fiabilité des rappels, faible coût de maintenance sur iOS-only. La stack v0 idéale :
- **UI** : SwiftUI (vues "Aujourd'hui", "Prochains jours", rapport mensuel avec `Charts`).
- **Persistance locale** : SwiftData (ou Core Data) — zéro backend, chiffrement disque iOS natif.
- **Rappels** : `UNUserNotificationCenter` + `UNCalendarNotificationTrigger` (récurrence quotidienne / jours spécifiques / X fois par semaine).

### Alternative sérieuse : Flutter — 4.35/5
Écart de seulement 0.25 (< 0.5). À privilégier si et seulement si une extension Android à moyen terme est probable : dans ce cas Flutter récupère 100% du code UI+logique, là où Swift imposerait une réécriture. Sur les notifications, Flutter est à parité (5/5). Le seul vrai prix à payer : un binaire plus lourd et une dépendance à des plugins tiers.

### À éviter pour ce cas
- **PWA pure** : bloquante sur les notifications locales sans backend (rédhibitoire ici).
- **.NET MAUI** : aucun avantage décisif pour ce périmètre, plus lourd et écosystème iOS moins réactif.

## Risques et points de vigilance (option Swift retenue)

| Risque | Impact | Mitigation |
|--------|--------|-----------|
| **Limite des 64 notifications programmées/app** | Élevé si beaucoup d'habitudes récurrentes | Ne pas pré-programmer tous les rappels à l'infini : programmer une fenêtre glissante (ex. 7-14 jours à l'avance) et re-planifier au lancement de l'app / via un rafraîchissement. Prioriser les échéances les plus proches. |
| **Rappels "à l'expiration" de l'échéance** | Moyen | iOS ne réveille pas l'app en arrière-plan à heure arbitraire pour recalculer ; s'appuyer sur des triggers calendaires pré-programmés, pas sur du calcul background. |
| **Permission notifications refusée par l'utilisateur** | Moyen | Gérer le refus proprement (état, écran d'explication, deep-link vers Réglages). |
| **Porte Android fermée** | Faible/Moyen selon la stratégie | Isoler la logique métier (modèle habitudes, calcul de fréquence, stats) dans des types Swift purs et testables, pour limiter le coût d'un futur portage (ou d'un pivot Flutter/KMM). |
| **Fuseaux horaires / heure d'été** | Moyen | Utiliser des triggers calendaires basés sur `DateComponents` locaux, tester les transitions DST. |

## Plan de validation (PoC — 2 à 3 jours)

L'écart Swift/Flutter étant < 0.5, un mini-PoC lève le doute. Comme le critère bloquant est identique (notifications), un PoC ciblé notifications+persistance en Swift est recommandé (l'option n°1), avec bascule Flutter seulement si un point dur apparaît.

Fonctionnalités à implémenter :
1. Création d'une habitude avec fréquence (quotidienne + "jours spécifiques" + "X fois/semaine").
2. Programmation des rappels correspondants via `UNCalendarNotificationTrigger`.
3. Persistance locale SwiftData (création, complétion du jour, historique).
4. Vue "Aujourd'hui" + calcul du taux de complétion mensuel.

Métriques à mesurer :
- Déclenchement effectif des rappels **app fermée / device verrouillé** (test sur iPhone réel, pas simulateur).
- Comportement au-delà de **64 rappels programmés** (stratégie de fenêtre glissante validée ?).
- Exactitude des rappels autour d'un **changement de fuseau / heure d'été**.
- Poids du binaire (.ipa) et cold start.

Critères de succès / échec :
- **Succès** : 100% des rappels programmés se déclenchent à l'heure attendue app fermée, sur 3 jours de test, avec la fenêtre glissante gérant > 64 échéances.
- **Échec / bascule** : si la gestion des 64 ou des récurrences complexes devient ingérable → réévaluer Flutter (même API sous-jacente, tooling stats/UI plus rapide).

## Addendum — contrainte de déploiement (2026-08-09)

Contrainte confirmée en aval du benchmark initial : **pas de compte Apple Developer Program payant (99$/an)**, **pas de publication sur l'App Store**, et **aucun accès à un Mac** (ni personnel, ni ponctuel), avec un **budget de 0€** pour une location de Mac cloud.

### Impact sur le classement

Le benchmark initial partait du principe implicite d'un accès Xcode confortable. Sans Mac, ce n'est pas seulement l'installation qui est affectée mais **tout le cycle de développement** : Apple impose Xcode pour toute compilation/signature iOS, quel que soit le framework. Cela dégrade fortement l'itération de dev pour **Swift/SwiftUI**, qui dépend entièrement d'Xcode (simulateur, SwiftUI Previews, debug local) — sans Mac, chaque test devient un aller-retour via build cloud.

**Flutter**, en revanche, permet de développer et itérer sur ~90% du périmètre (UI, logique métier, stockage local SwiftData→remplacé par Isar/Drift/sqflite) directement sur **Windows via l'émulateur Android**, en ne recourant à un build iOS cloud que ponctuellement, pour valider les comportements spécifiques iOS (notamment les notifications).

**Nouvelle recommandation : Flutter**, qui devient le meilleur compromis réel compte tenu des contraintes de tooling, à égalité de fiabilité sur les notifications avec Swift (5/5 sur ce critère dans les deux cas).

### Pipeline de déploiement retenu (0€, sans Mac)

1. **Développement** : Flutter sur Windows, itération via l'émulateur Android pour l'UI/logique/stockage.
2. **Build iOS** : CI cloud gratuit — GitHub Actions (runner macOS, illimité si repo public) ou Codemagic (free tier ~500 min/mois, workflows dédiés à la signature avec un Apple ID gratuit).
3. **Signature** : Apple ID gratuit ("Personal Team"), sans abonnement Developer Program.
4. **Installation** : AltStore ou SideStore ; le composant AltServer tourne sur Windows (aucune étape ne nécessite un Mac physique).
5. **Renouvellement** : certificat valable 7 jours, renouvelé automatiquement par AltServer/SideStore via le même réseau WiFi que l'iPhone.
6. **Mises à jour** : nouveau build CI → nouveau `.ipa` → réinstallation via AltStore.

### Point de vigilance

Le comportement réel des notifications programmées (critère le plus important du benchmark) ne peut être validé que sur l'iPhone physique, via ce pipeline complet (CI → AltStore). À tester dès les premières itérations du PoC, pas en fin de projet, pour éviter une mauvaise surprise tardive sur le point bloquant du projet.

## Sources

- [PWA iOS Limitations and Safari Support 2026 — MagicBell](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [PWA Push Notifications on iOS in 2026 — Webscraft](https://webscraft.org/blog/pwa-pushspovischennya-na-ios-u-2026-scho-realno-pratsyuye?lang=en)
- [Do PWAs Work on iOS? 2026 Guide — Mobiloud](https://www.mobiloud.com/blog/progressive-web-apps-ios)
- [Upcoming Support for Background Notifications in PWAs on Safari? — Apple Developer Forums](https://developer.apple.com/forums/thread/735402)
- [Expo Local Notifications in 2026 — Codes of Phoenix](https://www.codesofphoenix.com/articles/expo/local-notifications-expo)
- [Notifications — Expo Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [flutter_local_notifications — pub.dev](https://pub.dev/packages/flutter_local_notifications)
- [Flutter Local Notifications Scheduling Guide (2026) — ASOasis](https://asoasis.tech/articles/2026-03-19-2054-flutter-local-notifications-scheduling-guide/)
- [Local notifications — .NET MAUI, Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/maui/platform-integration/local-notifications?view=net-maui-10.0)
- [Plugin.LocalNotification — NuGet](https://www.nuget.org/packages/Plugin.LocalNotification)
- [Scheduling Local Notifications with UNUserNotificationCenter — BleepingSwift](https://bleepingswift.com/blog/local-notifications-unusernotificationcenter)
- [iOS Notifications in 2026 Complete Guide — Medium (N. Kumar)](https://medium.com/@thakurneeshu280/the-complete-guide-to-ios-notifications-from-basics-to-advanced-2026-edition-48cdcba8c18c)
- [Flutter vs React Native binary size 2026 — DEV Community](https://dev.to/prateekshaweb/flutter-vs-react-native-which-is-better-for-cross-platform-app-development-in-2026-1e5f)
