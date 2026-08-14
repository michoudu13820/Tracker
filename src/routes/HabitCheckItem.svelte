<script lang="ts">
	/**
	 * Ligne d'habitude cochable dans le planning quotidien (US-004). Colocalisée : utilisée
	 * uniquement par la route « Aujourd'hui » (`/`) — la liste des habitudes (`/habitudes`)
	 * a un besoin différent (édition au clic, pas de cochage).
	 */
	import type { Habit } from '$lib/domain/types';
	import { cardColorStyle, resolveCardColor } from '$lib/domain/card-colors';

	interface Props {
		habit: Habit;
		done: boolean;
		onToggle: (habitId: string, done: boolean) => void;
		/** Signal doux « manquée hier » (US-025) — informatif uniquement, aucune action de
		 * reprogrammation associée. */
		missedYesterday?: boolean;
	}

	let { habit, done, onToggle, missedYesterday = false }: Props = $props();

	/** Teinte de carte choisie (US-036 scénario 2 : rendu identique sur `/habitudes` et ici). */
	const cardColor = $derived(resolveCardColor(habit.color));
</script>

<li class="habit-item" data-card-color={cardColor} style={cardColorStyle(habit.color)}>
	<label class="row">
		<input
			type="checkbox"
			checked={done}
			onchange={(e) => onToggle(habit.id, (e.currentTarget as HTMLInputElement).checked)}
			aria-label={`Marquer « ${habit.name} » comme faite`}
		/>
		<span class="emoji" aria-hidden="true">{habit.emoji}</span>
		<span class="name" class:done>{habit.name}</span>
		{#if missedYesterday}
			<span class="badge" data-status="missed-yesterday">manquée hier</span>
		{/if}
	</label>
</li>

<style>
	/* Teinte de carte (US-036) : fond légèrement teinté + liseré, branchés par `cardColorStyle`.
	   Les valeurs de repli reproduisent le rendu d'avant US-036. */
	.habit-item {
		background: var(--card-tint, var(--surface));
		border: 1px solid var(--surface-border);
		border-left: 4px solid var(--card-accent, var(--habit-border));
		border-radius: var(--card-radius);
		box-shadow: var(--surface-shadow);
		padding: var(--card-padding);
		width: 100%;
	}
	.row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		min-height: 44px;
	}
	.emoji {
		font-size: 1.3rem;
	}
	.name {
		font-weight: 600;
		flex: 1;
		min-width: 0;
		overflow-wrap: anywhere;
	}
	.name.done {
		text-decoration: line-through;
		color: var(--muted);
	}
	.badge {
		font-size: 0.7rem;
		padding: 0.15rem 0.6rem;
		border-radius: 1rem;
		white-space: nowrap;
		font-weight: 600;
	}
	.badge[data-status='missed-yesterday'] {
		color: var(--habit-text);
		background: var(--surface);
		border: 1px solid var(--habit-border);
	}
</style>
