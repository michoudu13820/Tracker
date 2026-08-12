<script lang="ts">
	/**
	 * Formulaire des seuils de couleur du résumé annuel (US-006). Colocalisé (usage unique
	 * dans `/reglages`). Composant présentational : reçoit les seuils actuels et des
	 * callbacks, ne parle pas au store directement (voir CONVENTIONS.md — la route orchestre).
	 * Validation déléguée à `$lib/domain/summary` (`areThresholdsValid`, déjà existant).
	 */
	import type { ColorThresholds } from '$lib/domain/types';
	import { DEFAULT_THRESHOLDS, areThresholdsValid } from '$lib/domain/summary';

	interface Props {
		/** Seuils actuellement persistés (US-006 scénario 1 : préremplissage). */
		thresholds: ColorThresholds;
		onSave: (thresholds: ColorThresholds) => void;
		onReset: () => void;
	}

	let { thresholds, onSave, onReset }: Props = $props();

	function initialDraft(): ColorThresholds {
		return { ...thresholds };
	}

	let draft = $state<ColorThresholds>(initialDraft());
	let error = $state<string | null>(null);

	const VALIDATION_MESSAGE =
		'Le seuil jaune doit être strictement inférieur au seuil vert, et les valeurs doivent être comprises entre 0 et 100 %.';

	function submit(e: Event) {
		e.preventDefault();
		if (!areThresholdsValid(draft)) {
			error = VALIDATION_MESSAGE;
			return;
		}
		error = null;
		onSave({ ...draft });
	}

	function resetToDefault() {
		draft = { ...DEFAULT_THRESHOLDS };
		error = null;
		onReset();
	}
</script>

<form onsubmit={submit} novalidate aria-label="Seuils de couleur du résumé annuel">
	<div class="field">
		<label for="threshold-green">Seuil vert (%)</label>
		<input id="threshold-green" type="number" min="0" max="100" bind:value={draft.green} />
	</div>

	<div class="field">
		<label for="threshold-yellow">Seuil jaune (%)</label>
		<input id="threshold-yellow" type="number" min="0" max="100" bind:value={draft.yellow} />
	</div>

	{#if error}
		<p class="error" role="alert">{error}</p>
	{/if}

	<div class="actions">
		<button type="button" class="secondary" onclick={resetToDefault}>
			Réinitialiser aux valeurs par défaut
		</button>
		<button type="submit">Enregistrer</button>
	</div>
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		background: var(--surface);
		border: 1px solid var(--surface-border);
		box-shadow: var(--surface-shadow);
		padding: 1rem;
		border-radius: 0.75rem;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	label {
		font-size: 0.85rem;
		color: var(--muted);
	}
	input[type='number'] {
		background: var(--bg);
		border: 1px solid var(--surface-border);
		border-radius: 0.35rem;
		color: var(--text);
		padding: 0.5rem;
		min-height: 44px;
	}
	.error {
		color: var(--danger-text);
		margin: 0;
		font-size: 0.85rem;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 0.5rem;
	}
	.actions button {
		min-height: 44px;
		padding: 0.5rem 1rem;
		border-radius: 0.35rem;
		border: 1px solid var(--accent);
		background: var(--accent);
		color: var(--accent-text);
		font-weight: 600;
	}
	.actions button.secondary {
		background: transparent;
		color: var(--text);
		border-color: var(--muted);
	}
</style>
