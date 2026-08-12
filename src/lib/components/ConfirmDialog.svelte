<script lang="ts">
	/**
	 * Boîte de confirmation générique pour une action définitive (US-013 suppression
	 * d'habitude, US-014 suppression de tâche) : rappelle le message d'action et exige un
	 * clic explicite avant de déclencher `onConfirm`. Partagé entre ≥ 2 écrans (Habitudes,
	 * Tâches) → placé dans `lib/components` (voir CONVENTIONS.md §7). Composant présentational :
	 * ne connaît rien du domaine, ne parle à aucun store.
	 */
	interface Props {
		/** Message complet affiché à l'utilisateur (ex. nom de l'élément + rappel du caractère définitif). */
		message: string;
		confirmLabel?: string;
		cancelLabel?: string;
		onConfirm: () => void;
		onCancel: () => void;
	}

	let { message, confirmLabel = 'Supprimer', cancelLabel = 'Annuler', onConfirm, onCancel }: Props = $props();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onCancel();
	}
</script>

<div class="backdrop" role="presentation" onclick={onCancel}>
	<div
		class="dialog"
		role="alertdialog"
		aria-modal="true"
		aria-label={message}
		tabindex="-1"
		onclick={(e) => e.stopPropagation()}
		onkeydown={handleKeydown}
	>
		<p class="message">{message}</p>
		<div class="actions">
			<button type="button" class="secondary" onclick={onCancel}>{cancelLabel}</button>
			<button type="button" class="danger" onclick={onConfirm}>{confirmLabel}</button>
		</div>
	</div>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(74, 53, 64, 0.35);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		z-index: 20;
	}
	.dialog {
		background: var(--surface);
		border: 1px solid var(--surface-border);
		border-radius: var(--card-radius);
		box-shadow: var(--surface-shadow);
		padding: 1.25rem;
		max-width: 24rem;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.message {
		margin: 0;
		color: var(--text);
	}
	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}
	.actions button {
		min-height: 44px;
		padding: 0.5rem 1rem;
		border-radius: 0.35rem;
		font-weight: 600;
	}
	.actions button.secondary {
		background: transparent;
		color: var(--text);
		border: 1px solid var(--muted);
	}
	.actions button.danger {
		background: var(--danger-bg);
		color: var(--danger-text);
		border: 1px solid var(--danger-border);
	}
</style>
