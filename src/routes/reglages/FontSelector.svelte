<script lang="ts">
	/**
	 * Sélecteur de police de caractères (US-016, libellés ajustés par US-020). Colocalisé
	 * (usage unique dans `/reglages`). Composant présentational : reçoit la police actuellement
	 * choisie et des callbacks, ne parle pas au store directement (voir CONVENTIONS.md — la
	 * route orchestre). Applique immédiatement la sélection (pas de bouton "Enregistrer" séparé,
	 * US-016 scénario 3), réutilise le pattern de réinitialisation déjà en place pour les seuils
	 * de couleur (US-006).
	 *
	 * Le bouton de réinitialisation cible générique `DEFAULT_FONT_CHOICE` (pas de valeur
	 * `'system'` codée en dur) : il reste correct quelle que soit la police par défaut de l'app
	 * (US-016 : « Système » ; US-020 : « Dancing Script »), sans modification de logique requise
	 * ici pour US-020 — seul le libellé change pour ne plus mentionner spécifiquement la police
	 * système, qui n'est plus la police par défaut (US-020, critère « réinitialisation »).
	 */
	import { onMount } from 'svelte';
	import { DEFAULT_FONT_CHOICE, FONT_OPTIONS, type FontChoice } from '$lib/domain/fonts';
	import { ensureGoogleFontsLoaded } from '$lib/fonts/client';

	interface Props {
		selected: FontChoice;
		onSave: (choice: FontChoice) => void;
		onReset: () => void;
	}

	let { selected, onSave, onReset }: Props = $props();

	// Charge toutes les polices Google Fonts du catalogue pour que chaque option de la liste
	// s'affiche avec son propre rendu (US-016 scénario « liste » — aperçu visuel par option).
	onMount(() => {
		ensureGoogleFontsLoaded();
	});

	function selectFont(choice: FontChoice) {
		if (choice === selected) return;
		onSave(choice);
	}

	function resetToDefault() {
		onReset();
	}
</script>

<div class="font-selector">
	<ul class="font-list" role="radiogroup" aria-label="Police de caractères">
		{#each FONT_OPTIONS as option (option.id)}
			<li>
				<button
					type="button"
					class="font-option"
					role="radio"
					aria-checked={option.id === selected}
					style={`font-family: ${option.cssFontFamily}`}
					onclick={() => selectFont(option.id)}
				>
					<span class="label">{option.label}</span>
					<span class="preview" aria-hidden="true">Aa</span>
				</button>
			</li>
		{/each}
	</ul>

	<div class="actions">
		<button
			type="button"
			class="secondary"
			onclick={resetToDefault}
			disabled={selected === DEFAULT_FONT_CHOICE}
		>
			Réinitialiser à la police par défaut
		</button>
	</div>
</div>

<style>
	.font-selector {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.font-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.font-option {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		width: 100%;
		min-height: 44px;
		padding: var(--card-padding);
		background: var(--surface);
		border: 1px solid var(--surface-border);
		border-radius: var(--card-radius);
		box-shadow: var(--surface-shadow);
		color: var(--text);
		text-align: left;
	}
	.font-option[aria-checked='true'] {
		border-color: var(--accent);
		background: var(--bg);
	}
	.label {
		flex: 1;
		min-width: 0;
		overflow-wrap: anywhere;
	}
	.preview {
		font-size: 1.1rem;
		color: var(--muted);
	}
	.actions {
		display: flex;
		justify-content: flex-end;
	}
	.actions button {
		min-height: 44px;
		padding: 0.5rem 1rem;
		border-radius: 0.35rem;
		background: transparent;
		color: var(--text);
		border: 1px solid var(--muted);
	}
	.actions button:disabled {
		opacity: 0.5;
	}
</style>
