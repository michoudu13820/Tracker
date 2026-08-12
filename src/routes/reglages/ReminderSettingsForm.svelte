<script lang="ts">
	/**
	 * Formulaire des rappels par notification (US-007). Colocalisé (usage unique dans
	 * `/reglages`). Composant présentational : reçoit l'état courant et des callbacks, ne
	 * parle pas aux stores directement (voir CONVENTIONS.md — la route orchestre).
	 *
	 * Trois états d'affichage selon `availability` (US-007 scénario 3bis) :
	 *  - `unsupported`   : navigateur sans Web Push → message informatif, aucun contrôle.
	 *  - `needs-install` : PWA pas installée sur l'écran d'accueil → message + marche à
	 *                      suivre, AUCUNE action ne doit pouvoir déclencher une demande de
	 *                      permission (pas de case à cocher rendue dans cet état).
	 *  - `available`     : case à cocher (active/désactive, scénarios 4/5/6) + heure
	 *                      (scénario 7).
	 */
	import type { PushAvailability } from '$lib/stores/reminders.store.svelte';
	import type { ReminderSettings } from '$lib/domain/types';

	interface Props {
		availability: PushAvailability;
		/** Permission notifications du navigateur ('default' | 'granted' | 'denied' | 'unsupported'). */
		permission: NotificationPermission | 'unsupported';
		/** Réglages persistés actuels (null tant que non chargés). */
		settings: ReminderSettings | null;
		/** Vrai pendant la demande de permission / la souscription (US-007 scénario 4). */
		enabling: boolean;
		/** Message d'erreur explicite si l'activation a échoué (scénario 5), sinon null. */
		enableError: string | null;
		onToggle: (nextEnabled: boolean) => void;
		onTimeChange: (time: string) => void;
	}

	let { availability, permission, settings, enabling, enableError, onToggle, onTimeChange }: Props =
		$props();

	function handleToggle(e: Event) {
		onToggle((e.target as HTMLInputElement).checked);
	}

	function handleTimeChange(e: Event) {
		onTimeChange((e.target as HTMLInputElement).value);
	}
</script>

{#if availability === 'needs-install'}
	<div class="notice" role="status">
		<p>
			Les rappels ne peuvent fonctionner que si l'application est installée sur l'écran
			d'accueil de ton iPhone.
		</p>
		<p>
			Pour l'installer : appuie sur <strong>Partager</strong> dans Safari, puis
			<strong>« Ajouter à l'écran d'accueil »</strong>. Ouvre ensuite l'app depuis cette icône
			pour activer les rappels.
		</p>
	</div>
{:else if availability === 'unsupported'}
	<div class="notice" role="status">
		<p>Les notifications de rappel ne sont pas disponibles sur ce navigateur.</p>
	</div>
{:else if settings}
	<div class="field toggle-field">
		<label for="reminders-enabled">Recevoir un rappel quotidien</label>
		<input
			id="reminders-enabled"
			type="checkbox"
			role="switch"
			checked={settings.enabled}
			disabled={enabling}
			onchange={handleToggle}
		/>
	</div>

	{#if permission === 'denied'}
		<p class="error" role="alert">
			L'autorisation de notifications a été refusée : les rappels ne peuvent pas fonctionner
			tant qu'elle n'est pas accordée. Pour l'activer : Réglages de l'iPhone → Tracker →
			Notifications → « Autoriser les notifications ».
		</p>
	{:else if enableError}
		<p class="error" role="alert">{enableError}</p>
	{/if}

	<div class="field">
		<label for="reminders-time">Heure du rappel</label>
		<input
			id="reminders-time"
			type="time"
			value={settings.time}
			onchange={handleTimeChange}
		/>
		<p class="hint">
			Envoi autour de l'heure choisie, avec une latence possible jusqu'à ~15 minutes.
		</p>
	</div>
{/if}

<style>
	.notice {
		background: var(--surface);
		border: 1px solid var(--surface-border);
		border-radius: 0.75rem;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.notice p {
		margin: 0;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		margin-bottom: 0.75rem;
	}
	.toggle-field {
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
	}
	label {
		font-size: 0.85rem;
		color: var(--muted);
	}
	input[type='time'] {
		background: var(--bg);
		border: 1px solid var(--surface-border);
		border-radius: 0.35rem;
		color: var(--text);
		padding: 0.5rem;
		min-height: 44px;
	}
	input[type='checkbox'] {
		width: 2.5rem;
		height: 1.5rem;
	}
	.hint {
		color: var(--muted);
		font-size: 0.8rem;
	}
	.error {
		color: var(--danger-text);
		margin: 0 0 0.75rem;
		font-size: 0.85rem;
	}
</style>
