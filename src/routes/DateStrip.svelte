<script lang="ts">
	/**
	 * Frise horizontale de jours en haut du planning (US-011), remplace la navigation par
	 * flèches précédent/suivant de US-004. Colocalisée : utilisée uniquement par la route
	 * « Aujourd'hui » (`/`). Composant présentational (dates + jour sélectionné en props,
	 * callback de sélection) — la génération de la plage de dates et les libellés français
	 * sont délégués à `$lib/domain/dates` (pur, testé séparément).
	 */
	import type { IsoDate } from '$lib/domain/types';
	import { weekdayShortLabelFr, formatIsoDateLongFr } from '$lib/domain/dates';

	interface Props {
		/** Plage de dates à afficher, en ordre chronologique croissant (US-011 scénario 6). */
		dates: IsoDate[];
		selected: IsoDate;
		onSelect: (date: IsoDate) => void;
	}

	let { dates, selected, onSelect }: Props = $props();

	function dayNumber(iso: IsoDate): string {
		return String(Number(iso.split('-')[2]));
	}

	let container = $state<HTMLElement | undefined>(undefined);

	// Centre le jour sélectionné dans la frise scrollable au chargement et à chaque changement
	// (US-011 scénario 6/7 : la frise couvre plusieurs semaines, il faut retrouver le jour
	// sélectionné sans défiler à l'aveugle). `scrollIntoView` n'est pas implémenté par jsdom :
	// simplement absent en environnement de test, sans effet (pas d'erreur, cf. optional chaining).
	$effect(() => {
		selected; // dépendance explicite : re-centrer si le jour sélectionné change
		container?.querySelector<HTMLElement>('[aria-current="date"]')?.scrollIntoView?.({
			behavior: 'auto',
			inline: 'center',
			block: 'nearest'
		});
	});
</script>

<nav class="date-strip" aria-label="Navigation par jour" bind:this={container}>
	<ul>
		{#each dates as date (date)}
			<li>
				<button
					type="button"
					class="day"
					class:selected={date === selected}
					aria-current={date === selected ? 'date' : undefined}
					aria-label={formatIsoDateLongFr(date)}
					onclick={() => onSelect(date)}
				>
					<span class="weekday" aria-hidden="true">{weekdayShortLabelFr(date)}</span>
					<span class="day-number" aria-hidden="true">{dayNumber(date)}</span>
				</button>
			</li>
		{/each}
	</ul>
</nav>

<style>
	.date-strip {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		margin: 0 -1.5rem 1.5rem;
		padding: 0 1.5rem;
	}
	ul {
		list-style: none;
		display: flex;
		gap: 0.4rem;
		padding: 0;
		margin: 0;
	}
	li {
		flex: 0 0 auto;
	}
	.day {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		min-width: 44px;
		min-height: 56px;
		padding: 0.35rem 0.5rem;
		border: 1px solid transparent;
		border-radius: 0.9rem;
		background: transparent;
		color: var(--text);
	}
	.weekday {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--muted);
		text-transform: capitalize;
	}
	.day-number {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: var(--surface);
		border: 1px solid var(--surface-border);
		font-weight: 600;
	}
	.day.selected .day-number {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--accent-text);
	}
	.day.selected .weekday {
		color: var(--accent-text);
	}
</style>
