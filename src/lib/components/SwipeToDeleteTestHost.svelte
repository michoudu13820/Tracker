<script lang="ts">
	/**
	 * Hôte de test pour `SwipeToDelete.svelte` : fournit un contenu enfant (snippet) cliquable
	 * et instrumenté, `SwipeToDelete` n'étant pas testable seul via `render()` sans enfant.
	 * Utilisé uniquement par `SwipeToDelete.test.ts`, jamais importé par l'app (non exporté
	 * du barrel `index.ts`).
	 */
	import SwipeToDelete from './SwipeToDelete.svelte';

	interface Props {
		revealed: boolean;
		onReveal: () => void;
		onCloseReveal: () => void;
		onDeleteClick: () => void;
		onContentClick?: () => void;
	}

	let { revealed, onReveal, onCloseReveal, onDeleteClick, onContentClick }: Props = $props();
</script>

<SwipeToDelete {revealed} {onReveal} {onCloseReveal} {onDeleteClick} deleteLabel="Supprimer « Yoga »">
	<button type="button" data-testid="content" onclick={() => onContentClick?.()}>Yoga</button>
</SwipeToDelete>
