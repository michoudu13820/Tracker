<script lang="ts">
	/**
	 * Sélecteur de teinte de carte (US-036) — **palette fermée** : un groupe de boutons radio,
	 * un par teinte de `$lib/domain/card-colors`, et rien d'autre (aucun `input type="color"`,
	 * aucune saisie hexadécimale, aucune roue chromatique).
	 *
	 * Chaque option porte son **libellé texte visible** à côté de sa pastille : la couleur n'est
	 * jamais le seul vecteur d'identification (scénario 1), et le contrôle reste utilisable au
	 * lecteur d'écran comme en niveaux de gris. Partagé par `HabitForm` (US-036) et `TaskForm`
	 * (US-037) → `$lib/components` (CONVENTIONS.md §7).
	 */
	import {
		CARD_COLORS,
		cardColorLabel,
		cardColorStyle,
		type CardColor
	} from '$lib/domain/card-colors';

	interface Props {
		value: CardColor;
		onChange: (color: CardColor) => void;
		/** Préfixe des `name`/`id` — distingue plusieurs sélecteurs rendus sur la même page. */
		idPrefix?: string;
		legend?: string;
	}

	let { value, onChange, idPrefix = 'card-color', legend = 'Couleur de la carte' }: Props =
		$props();
</script>

<fieldset class="card-color-picker">
	<legend>{legend}</legend>
	<div class="swatches">
		{#each CARD_COLORS as color (color)}
			<label class="swatch-option" data-card-color={color}>
				<input
					type="radio"
					name={idPrefix}
					value={color}
					checked={value === color}
					onchange={() => onChange(color)}
				/>
				<span class="swatch" style={cardColorStyle(color)} aria-hidden="true"></span>
				<span class="swatch-label">{cardColorLabel(color)}</span>
			</label>
		{/each}
	</div>
</fieldset>

<style>
	.card-color-picker {
		border: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	legend {
		padding: 0;
		font-weight: 600;
	}
	.swatches {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
		gap: 0.4rem;
	}
	.swatch-option {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		min-height: 44px;
		padding: 0.25rem 0.5rem;
		border: 1px solid var(--surface-border);
		border-radius: 0.35rem;
		background: var(--bg);
		color: var(--text);
		font-size: 0.85rem;
	}
	/* La sélection est portée par la bordure ET la graisse du libellé, jamais par la seule
	   couleur de la pastille (US-036 scénario 10). */
	.swatch-option:has(input:checked) {
		border-color: var(--accent);
		box-shadow: inset 0 0 0 1px var(--accent);
		font-weight: 700;
	}
	.swatch-option:has(input:focus-visible) {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.swatch-option input {
		margin: 0;
	}
	.swatch {
		width: 1.1rem;
		height: 1.1rem;
		flex: none;
		border-radius: 0.25rem;
		background: var(--card-tint);
		border-left: 4px solid var(--card-accent);
		border-top: 1px solid var(--surface-border);
		border-right: 1px solid var(--surface-border);
		border-bottom: 1px solid var(--surface-border);
	}
	.swatch-label {
		overflow-wrap: anywhere;
	}
</style>
