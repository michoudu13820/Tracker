---
name: deploy-netlify
description: >-
  Déploie l'app SvelteKit (adapter-static) en production sur Netlify de bout en bout, sans
  intervention manuelle : quality gate, build, `netlify deploy --prod`, puis vérification que
  l'URL de production répond (HTTP 200) et rapport final avec l'URL. À utiliser pour « déploie
  l'app », « mets en prod », « publie sur Netlify », « redéploie », ou après la clôture d'une US.
---

# Déployer sur Netlify (SvelteKit + adapter-static)

Publie l'app en production sur Netlify **de façon autonome** : aucune action manuelle attendue de l'utilisateur une fois lancé. Le projet est déjà lié au site Netlify `appliproprete` (dossier `.netlify/` présent) et l'authentification CLI est persistée sur la machine.

## Pré-requis (vérifier, ne pas redemander à l'utilisateur)

- Le CLI s'invoque via `npx netlify-cli <cmd>` (pas d'installation globale requise).
- Site lié : `appliproprete` → https://appliproprete.netlify.app
- Si `npx netlify-cli status` renvoie **« Not logged in »**, c'est le SEUL cas où une action humaine est nécessaire : demande à l'utilisateur de lancer `! npx netlify-cli login` (auth navigateur), puis reprends. Sinon, ne bloque jamais.
- Si le lien au site est perdu (« No project linked »), relie avec `npx netlify-cli link --name appliproprete`.

## Mode rapide (gate déjà vérifié)

Si celui qui invoque ce skill (l'orchestrateur/l'utilisateur) indique explicitement que le quality gate vient d'être validé vert **sur ce même code, dans la même session**, par exemple juste après qu'un agent dev/bug-fixer a clôturé une US ou un bug avec gate vert — **saute l'étape 1** et repars directement du build. Dans tous les autres cas (déploiement demandé « à froid », sans mention explicite d'une vérification récente), exécute l'étape 1 : c'est le filet de sécurité par défaut.

## Étapes (dans l'ordre, PowerShell)

1. **Quality gate** (bloquant, sauf mode rapide ci-dessus) : lance le skill `run-quality-gate` (typecheck, lint, tests, build — ce gate inclut déjà `npm run build`, ne pas le refaire à l'étape suivante). **Ne déploie jamais un gate rouge.** Si échec, s'arrêter et rapporter `FAIL` sans déployer.
2. **Build de production** : si le gate de l'étape 1 vient de tourner, son build (étape 6 de `run-quality-gate`) suffit — ne relance PAS `npm run build`. En mode rapide (étape 1 sautée), lance `npm run build` ici. Confirme dans tous les cas que `build/` a bien été écrit et est à jour.
3. **Déploiement production** : `npx netlify-cli deploy --prod --dir build`
   - `--prod` publie directement sur l'URL de production (pas de deploy preview).
   - Capture l'URL de production et l'URL unique du déploiement dans la sortie.
4. **Vérification post-déploiement** : `(Invoke-WebRequest -Uri "https://appliproprete.netlify.app" -UseBasicParsing).StatusCode` doit renvoyer **200**. Si ce n'est pas 200, rapporte un échec de déploiement avec le code obtenu.

## Rapport final

```
| Étape            | Résultat |
|------------------|----------|
| Quality gate     | ✅ / ❌   |
| Build            | ✅ / ❌   |
| Deploy --prod    | ✅ / ❌   |
| Vérif HTTP 200   | ✅ / ❌   |
```

- Termine par l'URL de production cliquable : **https://appliproprete.netlify.app**
- Verdict `DÉPLOYÉ` seulement si les 4 étapes sont vertes ; sinon `ÉCHEC` avec l'étape fautive et sa sortie.
- Ne déclare jamais un déploiement réussi sans avoir réellement exécuté les commandes et lu leur sortie (URL live + HTTP 200).

## Règles

1. **Autonomie** : n'interromps pas pour demander confirmation de déploiement — l'utilisateur a explicitement délégué la validation. Le seul blocage légitime est l'absence de session Netlify (login).
2. **Gate d'abord** : jamais de prod sans quality gate vert.
3. **Idempotent** : un redéploiement se fait avec la même commande ; le lien au site persiste via `.netlify/`.
