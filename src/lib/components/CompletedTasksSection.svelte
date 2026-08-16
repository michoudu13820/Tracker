<script lang="ts">
	/**
	 * Section « Tâches accomplies » repliable (US-041), partagée par le planning (`/`) et l'écran
	 * Tâches (`/taches`) — d'où sa présence dans `$lib/components` plutôt que colocalisée.
	 *
	 * Conteneur pur : il ne sait pas ce qu'il replie. L'appelant garde la main sur le rendu des
	 * tâches (via `children`) et sur leur câblage, qui diffère d'un écran à l'autre.
	 *
	 * Deux règles portées ici :
	 *  - **repliée par défaut à chaque affichage** (scénarios 1/5) : l'état vit dans le composant,
	 *    donc il repart replié à chaque montage. Le mémoriser annulerait l'intention même de l'US,
	 *    qui est de rendre les tâches faites moins visibles (arbitrage 2026-08-16) ;
	 *  - **aucune section vide** (scénario 4) : rien n'est rendu quand il n'y a rien à replier.
	 */
	import type { Snippet } from 'svelte';

	interface Props {
		/** Nombre de tâches accomplies contenues, lisible sans déplier (scénario 1). */
		count: number;
		/** Rendu des tâches accomplies, fourni par l'écran appelant. */
		children: Snippet;
	}

	let { count, children }: Props = $props();

	let expanded = $state(false);
</script>

{#if count > 0}
	<div class="completed">
		<button
			type="button"
			class="toggle"
			aria-expanded={expanded}
			onclick={() => (expanded = !expanded)}
		>
			<span class="sign" aria-hidden="true">{expanded ? '−' : '+'}</span>
			<span class="label">Tâches accomplies</span>
			<span class="count">{count}</span>
		</button>

		{#if expanded}
			{@render children()}
		{/if}
	</div>
{/if}

<style>
	.completed {
		margin-top: 0.75rem;
	}
	.toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		/* 44px : même cible tactile que les autres contrôles de l'app. */
		min-height: 44px;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--surface-border);
		border-radius: 0.5rem;
		background: var(--surface);
		color: var(--muted);
		font-size: 0.85rem;
		text-align: left;
	}
	.sign {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		font-size: 1.1rem;
		line-height: 1;
	}
	.label {
		flex: 1;
	}
	.count {
		font-variant-numeric: tabular-nums;
	}
</style>
