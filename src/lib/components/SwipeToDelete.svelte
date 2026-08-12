<script lang="ts">
	/**
	 * Enveloppe de geste « glisser pour révéler un bouton de suppression » (US-013 habitudes,
	 * US-014 tâches) : glisser la carte enfant révèle un bouton poubelle à sa droite ; cliquer
	 * ailleurs sur la carte quand il est révélé le referme sans action (scénario 5 des deux US).
	 * Partagé entre ≥ 2 écrans → `lib/components` (voir CONVENTIONS.md §7), pour garder un geste
	 * et un comportement de fermeture cohérents entre Habitudes et Tâches (demandé par les US).
	 *
	 * Composant contrôlé : l'état "révélé" est piloté par le parent (`revealed` + callbacks),
	 * pour permettre au parent de n'avoir qu'une seule carte révélée à la fois dans une liste.
	 *
	 * Détection du geste : delta horizontal entre `pointerdown` et `pointerup` (pas de suivi
	 * pixel-par-pixel du doigt — comportement volontairement simple, le détail exact du geste
	 * étant laissé au développeur par les US). Utilise les Pointer Events (unifiés souris/tactile,
	 * supportés par Safari iOS >= 13, cible principale de l'app — cf. ADR-002).
	 */
	import type { Snippet } from 'svelte';

	interface Props {
		revealed: boolean;
		onReveal: () => void;
		onCloseReveal: () => void;
		onDeleteClick: () => void;
		/** Libellé accessible du bouton poubelle, ex. `Supprimer « Yoga »`. */
		deleteLabel: string;
		children: Snippet;
	}

	let { revealed, onReveal, onCloseReveal, onDeleteClick, deleteLabel, children }: Props = $props();

	/** Distance minimale (px) pour considérer le geste comme un glissement volontaire. */
	const SWIPE_THRESHOLD = 40;

	let startX: number | null = null;

	function handlePointerDown(e: PointerEvent) {
		startX = e.clientX;
	}

	function handlePointerUp(e: PointerEvent) {
		if (startX === null) return;
		const delta = e.clientX - startX;
		startX = null;
		if (delta < -SWIPE_THRESHOLD) {
			onReveal();
		} else if (delta > SWIPE_THRESHOLD && revealed) {
			onCloseReveal();
		}
	}

	/**
	 * Intercepte en phase de capture les clics sur le contenu glissé pendant qu'il est révélé,
	 * pour empêcher son action normale (ex. ouvrir l'édition) et refermer le bouton poubelle à
	 * la place (scénario 5 : interagir ailleurs sur la carte referme sans supprimer).
	 */
	function handleContentClickCapture(e: MouseEvent) {
		if (!revealed) return;
		e.preventDefault();
		e.stopPropagation();
		onCloseReveal();
	}
</script>

<div class="swipe-wrapper">
	<div
		class="swipe-content"
		class:revealed
		role="presentation"
		onpointerdown={handlePointerDown}
		onpointerup={handlePointerUp}
		onclickcapture={handleContentClickCapture}
	>
		{@render children()}
	</div>
	{#if revealed}
		<button type="button" class="delete-trigger" aria-label={deleteLabel} onclick={onDeleteClick}>
			🗑️
		</button>
	{/if}
</div>

<style>
	.swipe-wrapper {
		position: relative;
		overflow: hidden;
		border-radius: var(--card-radius);
	}
	.swipe-content {
		transition: transform 0.15s ease-out;
		touch-action: pan-y;
	}
	.swipe-content.revealed {
		transform: translateX(-4.25rem);
	}
	.delete-trigger {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		width: 4.25rem;
		min-height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--danger-bg);
		border: 1px solid var(--danger-border);
		border-radius: 0 var(--card-radius) var(--card-radius) 0;
		color: var(--danger-text);
		font-size: 1.3rem;
	}
</style>
