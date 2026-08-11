---
type: user-story
id: US-006
titre: Paramétrage des seuils de couleur du résumé annuel
date: 2026-08-09
auteur: product-owner
statut: prête
priorite: Should
estimation: XS
source: chat
depend_de: ["US-005"]
---

## Titre : US-006 — Paramétrage des seuils de couleur du résumé annuel

### Récit
> **En tant qu'** utilisateur de l'app,
> **je veux** pouvoir définir mes propres seuils de pourcentage pour les couleurs vert / jaune / rouge utilisées dans le résumé annuel,
> **afin d'** adapter la lecture visuelle de mes performances à mon niveau d'exigence personnel plutôt que de subir des seuils fixes.

### Critères d'acceptation

**Scénario 1 — Valeurs par défaut au premier accès**
> **Étant donné** je n'ai jamais modifié les seuils de couleur
> **Quand** j'accède à l'écran/section de réglages dédié aux seuils de couleur du résumé
> **Alors** je vois deux valeurs pré-remplies : seuil « vert » à 80 % et seuil « jaune » à 40 %
> **Et** ces valeurs correspondent à celles effectivement utilisées dans la vue résumé annuel (US-005)

**Scénario 2 — Modification des seuils**
> **Étant donné** je suis sur l'écran de réglages des seuils de couleur
> **Quand** je modifie le seuil « vert » à 90 % et le seuil « jaune » à 50 %
> **Et** je valide/enregistre
> **Alors** les nouveaux seuils sont enregistrés
> **Et** la vue résumé annuel applique immédiatement ces nouveaux seuils au code couleur des cellules « habitude x mois » (vert ≥ 90 %, jaune entre 50 % inclus et 90 % exclus, rouge < 50 %)

**Scénario 3 — Validation de cohérence des seuils**
> **Étant donné** je suis sur l'écran de réglages des seuils de couleur
> **Quand** je saisis un seuil « jaune » supérieur ou égal au seuil « vert » (ex : jaune = 85 %, vert = 80 %), ou une valeur hors de l'intervalle 0-100 %
> **Alors** l'enregistrement est bloqué
> **Et** un message m'indique que le seuil jaune doit être strictement inférieur au seuil vert, et que les valeurs doivent être comprises entre 0 et 100 %

**Scénario 4 — Réinitialisation aux valeurs par défaut**
> **Étant donné** j'ai personnalisé mes seuils (ex : vert = 90 %, jaune = 50 %)
> **Quand** je déclenche l'action « réinitialiser aux valeurs par défaut »
> **Alors** les seuils reviennent à vert = 80 % et jaune = 40 %
> **Et** la vue résumé annuel applique de nouveau ces valeurs par défaut

### Priorité
Should (améliore US-005, non bloquant pour la première mise à disposition du résumé qui fonctionne avec les seuils par défaut 80 %/40 %)

### Estimation
XS

### Dépendances
US-005 (le paramétrage n'a de sens que si la vue résumé annuel avec code couleur existe)

### Notes / hors périmètre
- Le seuil "rouge" n'est pas un champ distinct : il correspond implicitement à tout pourcentage strictement inférieur au seuil jaune. Seuls les seuils « vert » et « jaune » sont configurables.
- Pas de personnalisation des couleurs elles-mêmes (teintes) dans cette US, uniquement des seuils numériques associés aux 3 couleurs fixes (vert/jaune/rouge).
- Pas de seuils différents par habitude : le réglage est global à l'application, appliqué uniformément à toutes les cellules du résumé annuel.
