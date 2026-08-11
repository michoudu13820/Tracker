import type { Config } from '@netlify/functions';
import { sendDueReminders } from './_shared/send-due';

/**
 * FONCTION PLANIFIÉE (cron) — le seul « moteur » du backend.
 * S'exécute périodiquement, lit tous les abonnements et envoie un push pour chaque
 * rappel dont l'instant `sendAt` est arrivé mais pas encore envoyé.
 *
 * Le serveur ne connaît QUE des instants d'envoi : le contenu est un rappel générique.
 * L'app affiche la liste réelle des habitudes localement quand l'utilisateur l'ouvre.
 * Voir docs/architecture/ADR-001.
 *
 * Granularité cron : toutes les 15 min. Le rappel est donc au pire 15 min « en retard »
 * sur l'heure choisie — acceptable pour un rappel quotidien. Réduire à `*\/5 * * * *`
 * si besoin de plus de précision. Pour un test immédiat sans attendre le cron, voir
 * `trigger-send.ts` qui exécute la même logique à la demande.
 */
export default async function handler(): Promise<Response> {
	await sendDueReminders();
	return new Response('ok');
}

/** Planification cron : toutes les 15 minutes. */
export const config: Config = {
	schedule: '*/15 * * * *'
};
