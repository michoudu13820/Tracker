---
type: user-story
id: US-033
titre: Cohérence du suivi et des rappels avec la fréquence « jours du mois »
date: 2026-08-14
auteur: product-owner
statut: livrée
priorite: Should
estimation: S
source: chat
depend_de: ["US-032", "US-005", "US-007", "US-023", "US-024", "US-031"]
---

## Titre : US-033 — Cohérence du suivi et des rappels avec la fréquence « jours du mois »

### Récit
> **En tant qu'** utilisateur de l'app,
> **je veux** que mes habitudes récurrentes à certains jours du mois soient prises en compte partout où l'application parle de mes habitudes (résumé, indicateur de régularité, rappels, badge d'icône),
> **afin de** avoir un suivi fiable et cohérent de ces habitudes, sans zone de l'application qui les ignore ou les compte de travers.

### Critères d'acceptation

**Scénario 1 — Résumé, vues semaine et mois**
> **Étant donné** une habitude « Sauvegarde » est prévue le 1 et le 15 de chaque mois
> **Quand** j'affiche le résumé en vue semaine ou en vue mois
> **Alors** seules les colonnes correspondant au 1 et au 15 sont considérées comme « prévues » pour cette habitude
> **Et** toutes les autres colonnes affichent une cellule neutre « non prévu », distincte d'une cellule « non fait »

**Scénario 2 — Résumé, vue année**
> **Étant donné** une habitude est prévue le 1 et le 15 de chaque mois et que je l'ai faite une seule fois en mars (le 1er)
> **Quand** j'affiche le résumé en vue année
> **Alors** la cellule du mois de mars affiche 50 % (1 jour fait sur 2 jours prévus)
> **Et** le code couleur des seuils configurés (US-006) s'applique à cette cellule comme pour n'importe quelle autre habitude

**Scénario 3 — Résumé, mois où deux jours sélectionnés se replient sur la même date**
> **Étant donné** une habitude est prévue le 30 et le 31 de chaque mois
> **Quand** j'affiche le résumé du mois de février d'une année non bissextile, puis la vue année
> **Alors** un seul jour prévu est compté pour février (le 28), pas deux
> **Et** si ce jour a été fait, la cellule de février en vue année affiche 100 % (et non 50 %)

**Scénario 4 — Indicateur de régularité sur la carte d'habitude**
> **Étant donné** une habitude est prévue le 1 et le 15 de chaque mois
> **Quand** je consulte sa carte sur l'écran « Habitudes »
> **Alors** les pastilles des 7 derniers jours distinguent correctement les jours « non concernés » (la très grande majorité) des jours où l'habitude était réellement due
> **Et** le compteur neutre « N fois ce mois-ci » reflète le nombre réel de complétions du mois en cours
> **Et** aucune mécanique de série n'est introduite (arbitrage US-024 inchangé)

**Scénario 5 — Signal « manquée hier »**
> **Étant donné** une habitude prévue le 15 de chaque mois n'a pas été faite le 15
> **Quand** je consulte l'application le 16
> **Alors** le signal doux « manquée hier » (US-025) s'affiche pour cette habitude
> **Et** ce signal ne s'affiche pas les autres jours du mois, où l'habitude n'était pas due

**Scénario 6 — Récap matinal / rappels**
> **Étant donné** les rappels sont activés (US-007) et une habitude est prévue le 1 de chaque mois
> **Quand** le créneau de rappel du 1 du mois arrive et que l'habitude n'est pas cochée
> **Alors** cette habitude est bien comptée parmi les habitudes dues du jour dans le rappel
> **Et** les autres jours du mois, elle n'est jamais comptée comme due

**Scénario 7 — Resynchronisation de la fenêtre d'échéances**
> **Étant donné** une habitude à fréquence « jours du mois » est due aujourd'hui
> **Quand** je la coche ou la décoche depuis le planning
> **Alors** la fenêtre d'échéances est resynchronisée exactement comme pour les autres fréquences (US-023), sans cas particulier ni oubli
> **Et** la limite best-effort déjà documentée (ADR-001, US-023 scénario 3) reste inchangée

**Scénario 8 — Badge d'icône PWA**
> **Étant donné** une habitude à fréquence « jours du mois » est due aujourd'hui et non faite
> **Quand** le badge d'icône est calculé (US-031)
> **Alors** elle est comptée dans les éléments restants du jour
> **Et** elle n'est comptée aucun autre jour du mois

**Scénario 9 — Non-régression des fréquences existantes**
> **Étant donné** des habitudes à fréquence « intervalle en jours » ou « jours de la semaine » existent avec leur historique
> **Quand** je consulte le résumé (semaine, mois, année), les cartes d'habitude, les rappels et le badge
> **Alors** leur comportement et leurs chiffres sont strictement identiques à avant l'introduction de la fréquence mensuelle
> **Et** aucun écart de calcul n'apparaît sur les périodes déjà consultées auparavant

### Priorité
Should — sans cette US, la fréquence mensuelle livrée par US-032 serait visible dans le planning mais mal ou pas comptabilisée dans le suivi et les rappels, ce qui produirait des chiffres faux (plus dommageable qu'une absence de fonctionnalité).

### Estimation
S — aucune nouvelle interface : il s'agit de garantir, et de prouver par les tests, que toutes les vues et tous les calculs qui répondent déjà à la question « cette habitude est-elle prévue ce jour ? » traitent correctement le nouveau mode, y compris ses cas de repli et de déduplication. Même nature que US-019 (compatibilité du résumé avec les cibles chiffrées).

### Dépendances
- **US-032** : introduit la fréquence « jours du mois » que cette US rend cohérente partout ailleurs.
- **US-005 / US-006** : résumé et seuils de couleur, à ne pas régresser.
- **US-007 / US-023** : rappels et resynchronisation de la fenêtre d'échéances.
- **US-024 / US-025** : indicateur de régularité et signal « manquée hier ».
- **US-031** : badge d'icône PWA (nombre d'éléments restants du jour).

### Notes / hors périmètre
- Cette US ne modifie **aucune règle produit existante** : elle garantit uniquement que le nouveau mode de fréquence est traité comme les deux modes historiques partout. Toute divergence constatée est un défaut, pas une décision.
- Ne couvre pas le nouveau langage visuel du résumé (✅ / ⬜ / ❌), qui fait l'objet d'US-035 : les deux sujets sont indépendants et peuvent être livrés dans n'importe quel ordre.
- Ne couvre pas la mise en page du résumé sur 7 colonnes (US-034).
- La limite best-effort des rappels (le serveur ignore ce qui a été fait hors de l'app, ADR-001) n'est ni levée ni aggravée par cette US.

---

## Résumé d'implémentation (2026-08-14)

**Tous les critères d'acceptation (scénarios 1 à 9) sont satisfaits.** Quality gate vert
(`npm run check` 0 erreur, `vitest run` 478 tests, `npm run build` OK).

### Constat principal : aucun code de production à modifier

Toutes les vues et tous les calculs concernés (résumé US-005/US-006, régularité US-024, signal
« manquée hier » US-025, récap matinal US-007, resynchronisation US-023, badge US-031) posent
déjà la question « cette habitude est-elle prévue ce jour ? » via **le point unique**
`isDueOn()` / `habitsDueOn()` de `$lib/domain/occurrences`, étendu par US-032. La cohérence
demandée est donc **structurelle** et non ajoutée après coup. Conformément à l'estimation `S` et
à la note « toute divergence constatée est un défaut », cette US consiste à **prouver par les
tests** cette cohérence, sur tous les points d'entrée et sur les cas de repli/déduplication.

Chaîne d'appel vérifiée point par point :

| Point d'entrée | Chemin vers `isDueOn` | Scénario |
|---|---|---|
| `summary.habitCellStatus` | direct | 1 |
| `summary.habitMonthPercent` | direct (boucle jour par jour → déduplication gratuite) | 2, 3 |
| `regularity.last7DaysRegularity` | direct | 4 |
| `regularity.missedYesterday` | direct | 5 |
| `reminders.computeReminderWindow` | via `habitsDueOn` | 6 |
| `resync-reminders.resyncReminders` | transmet les habitudes telles quelles → `remindersStore.sync` | 7 |
| `badge.remainingCount` | via `habitsDueOn` | 8 |

### Fichiers modifiés (tests uniquement)
| Fichier | Couverture ajoutée |
|---|---|
| `src/lib/domain/summary.test.ts` | Scénarios 1, 2, 3, 9 — cellules neutres hors 1/15, 50 % en mars, 100 % en février pour 30+31, non-régression des deux modes historiques |
| `src/lib/domain/regularity.test.ts` | Scénarios 4, 5 — pastilles `not-due`/`missed`/`done`, compteur mensuel, « manquée hier » y compris via repli fin de mois |
| `src/lib/domain/reminders.test.ts` | Scénario 6 — rappel le 1 uniquement, repli au 30 avril, best-effort inchangé, habitude en pause ignorée |
| `src/lib/domain/badge.test.ts` | Scénario 8 — comptée le jour dû seulement, une seule fois en cas de repli commun |
| `src/lib/stores/resync-reminders.test.ts` | Scénario 7 — resynchronisation identique, sans cas particulier |
| `src/routes/resume/WeekMonthTable.test.ts` | Scénario 1 — câblage de bout en bout dans le tableau du résumé |

### Test manuel
1. Créer une habitude « Sauvegarde » sur le 1 et le 15 (US-032).
2. `/resume` semaine/mois : seules les colonnes du 1 et du 15 sont non neutres ; vue année :
   le mois affiche 50 % après une seule complétion sur deux occurrences.
3. `/habitudes` : les pastilles des 7 derniers jours ne marquent que le jour réellement dû.
4. Cocher/décocher l'habitude le jour dû : la fenêtre d'échéances est repoussée comme pour les
   autres fréquences (aucun traitement spécifique).
