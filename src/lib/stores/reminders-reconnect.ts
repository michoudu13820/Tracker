import { settingsStore } from './settings.store.svelte';
import { remindersStore } from './reminders.store.svelte';
import { resyncReminders } from './resync-reminders';
import { habitsStore } from './habits.store.svelte';
import { tasksStore } from './tasks.store.svelte';
import { completionsStore } from './completions.store.svelte';
import { onReconnect } from '$lib/offline/connectivity';

/**
 * Rejeu au retour du réseau des actions de rappel effectuées hors ligne (US-040 scénario 7).
 *
 * **Pourquoi il n'y a pas de file d'attente persistée.** On pourrait empiler les intentions
 * (« active », « passe à 8h », « passe à 9h », « désactive ») et les rejouer dans l'ordre. Ce
 * serait à la fois plus lourd et moins juste : le scénario 7 exige que **seul l'état final soit
 * appliqué**, jamais les étapes intermédiaires. Or l'état final est déjà connu — il est dans
 * `settingsStore` (préférence persistée localement, qui elle n'a jamais besoin du réseau) et dans
 * les stores de données. Réconcilier l'état serveur avec l'état local courant donne donc
 * gratuitement la déduplication demandée, sans structure à maintenir ni à purger.
 *
 * Corollaire utile : cette réconciliation est **idempotente**. La rejouer deux fois, ou après un
 * redémarrage de l'app, ne produit rien de différent — c'est pourquoi une intention en attente
 * survit à la fermeture de l'app sans être stockée nulle part.
 */

/**
 * Aligne l'état serveur sur l'intention locale courante. Sans effet si l'appareil est toujours
 * hors ligne : chaque action échoue alors à nouveau et se remet simplement en attente.
 */
export async function flushPendingReminders(): Promise<void> {
	const settings = settingsStore.reminder;
	if (!settings) return;

	// Intention : rappels coupés. Il reste une souscription à révoquer côté serveur si la
	// désactivation a été demandée hors ligne.
	if (!settings.enabled) {
		if (remindersStore.subscription) await remindersStore.disable();
		return;
	}

	// Intention : rappels actifs, mais la souscription n'a jamais pu être créée (activation
	// demandée hors ligne). On ne retente que si la permission est DÉJÀ accordée : demander une
	// permission sans geste de l'utilisateur serait rejeté par le navigateur, et surtout ce
	// serait une fenêtre surgissante non sollicitée.
	if (!remindersStore.subscription) {
		if (remindersStore.permission() !== 'granted') return;
		await remindersStore.enable(
			habitsStore.habits,
			settings,
			completionsStore.habitCompletions,
			tasksStore.tasks,
			completionsStore.taskCompletions,
			settingsStore.weeklyReview ?? undefined
		);
		return;
	}

	// Intention : rappels actifs et souscrits — il ne reste qu'à repousser les fenêtres
	// recalculées à partir de l'état courant (heure éventuellement modifiée hors ligne incluse).
	await resyncReminders();
}

/**
 * Branche le rejeu automatique sur le retour de la connexion. Retourne la fonction d'arrêt, à
 * appeler au démontage. « Sans aucune action de ma part » (scénario 7) : c'est cet abonnement qui
 * porte cette exigence, avec la resynchronisation déjà effectuée à chaque ouverture de l'app.
 */
export function watchReconnection(): () => void {
	return onReconnect(() => void flushPendingReminders());
}
