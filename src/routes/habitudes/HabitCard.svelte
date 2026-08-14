<script lang="ts">
	/**
	 * Carte d'une habitude sur l'écran « Habitudes » (US-010 carte pleine largeur) : ouvre
	 * l'édition au clic, propose la suppression par glisser + confirmation (US-013) via
	 * `SwipeToDelete` + `ConfirmDialog` (partagés, `lib/components`), et la mise en pause /
	 * reprise (US-015) via un badge + une action contextuelle sous la carte, sur le même
	 * mécanisme de statut que la suppression. Une habitude **supprimée** (US-013) est rendue en
	 * lecture seule (US-027 scénario 1/2 : visible dans la section « En pause / Supprimées »,
	 * sans aucune action — pas de restauration couverte par cette US). Une habitude **en pause**
	 * expose en plus un contrôle de date de reprise automatique optionnelle (US-027 scénarios
	 * 3/5). Colocalisé : usage unique dans cette route (voir CONVENTIONS.md §7).
	 */
	import type { Habit, HabitCompletion, IsoDate } from '$lib/domain/types';
	import { cardColorStyle, resolveCardColor } from '$lib/domain/card-colors';
	import { describeFrequency, describeTarget, habitStatus } from '$lib/domain/habits';
	import { last7DaysRegularity, missedYesterday, monthlyCompletionCount } from '$lib/domain/regularity';
	import { weekdayShortLabelFr, formatIsoDateFr } from '$lib/domain/dates';
	import { SwipeToDelete, ConfirmDialog } from '$lib/components';

	interface Props {
		habit: Habit;
		/** Le bouton de suppression de cette carte est-il révélé (glissement) ? Piloté par le parent
		 * pour n'avoir qu'une seule carte révélée à la fois dans la liste. */
		revealed: boolean;
		onReveal: () => void;
		onCloseReveal: () => void;
		onEdit: (habit: Habit) => void;
		/** Appelé uniquement après confirmation explicite (US-013 scénario 3). */
		onDelete: (habit: Habit) => void;
		/** Met l'habitude en pause (US-015 scénario 1). */
		onPause: (habit: Habit) => void;
		/** Réactive une habitude en pause (US-015 scénario 4). */
		onResume: (habit: Habit) => void;
		/** Définit ou retire (`undefined`) la date de reprise automatique d'une habitude en
		 * pause (US-027 scénarios 3/5). */
		onSetResumeAt: (habit: Habit, resumeAt: IsoDate | undefined) => void;
		/** Historique de complétion de l'habitude, pour l'indicateur de régularité apaisé
		 * (US-024) — jamais de mécanique de streak, voir `$lib/domain/regularity`. */
		completions: HabitCompletion[];
		/** Jour de référence ("aujourd'hui" réel) pour la fenêtre des 7 derniers jours (US-024). */
		today: IsoDate;
	}

	let {
		habit,
		revealed,
		onReveal,
		onCloseReveal,
		onEdit,
		onDelete,
		onPause,
		onResume,
		onSetResumeAt,
		completions,
		today
	}: Props = $props();

	/** Teinte de carte choisie (US-036 scénario 2 : identique ici et dans le planning). */
	const cardColor = $derived(resolveCardColor(habit.color));

	const status = $derived(habitStatus(habit));
	const paused = $derived(status === 'paused');
	const deleted = $derived(status === 'deleted');

	const regularity = $derived(last7DaysRegularity(habit, completions, today));
	const monthlyCount = $derived(monthlyCompletionCount(habit, completions, today));
	/** Signal doux « manquée hier » (US-025) — informatif uniquement, aucune action de
	 * reprogrammation proposée (scénario 5 : une habitude reste récurrente). */
	const missedYday = $derived(missedYesterday(habit, completions, today));

	const STATUS_LABEL: Record<'done' | 'missed' | 'not-due', string> = {
		done: 'fait',
		missed: 'manqué',
		'not-due': 'non concerné'
	};

	function dotLabel(date: IsoDate, status: 'done' | 'missed' | 'not-due'): string {
		return `${weekdayShortLabelFr(date)} : ${STATUS_LABEL[status]}`;
	}

	let confirmOpen = $state(false);

	function openConfirm() {
		confirmOpen = true;
	}

	function cancelConfirm() {
		confirmOpen = false;
	}

	function confirmDelete() {
		confirmOpen = false;
		onCloseReveal();
		onDelete(habit);
	}

	/** Contrôle de reprise automatique (US-027 scénarios 3/5) — ouvert soit depuis « Mettre en
	 * pause » (première programmation), soit depuis le badge de reprise déjà programmée
	 * (modification/retrait, scénario 5). */
	let resumeFormOpen = $state(false);
	let resumeDateInput = $state('');

	function openResumeForm() {
		resumeDateInput = habit.resumeAt ?? '';
		resumeFormOpen = true;
	}

	function cancelResumeForm() {
		resumeFormOpen = false;
	}

	function submitResumeForm(e: Event) {
		e.preventDefault();
		onSetResumeAt(habit, resumeDateInput || undefined);
		resumeFormOpen = false;
	}
</script>

<li class="habit-card-item" data-card-color={cardColor} style={cardColorStyle(habit.color)}>
	{#if deleted}
		<div class="habit-row deleted-row">
			<span class="emoji" aria-hidden="true">{habit.emoji}</span>
			<span class="info">
				<span class="name">{habit.name}</span>
				<span class="frequency">{describeFrequency(habit.frequency)}</span>
			</span>
			<span class="badge" data-status="deleted">Supprimée</span>
		</div>
	{:else}
		<SwipeToDelete
			{revealed}
			{onReveal}
			{onCloseReveal}
			onDeleteClick={openConfirm}
			deleteLabel={`Supprimer « ${habit.name} »`}
		>
			<button class="habit-row" type="button" onclick={() => onEdit(habit)}>
				<span class="emoji" aria-hidden="true">{habit.emoji}</span>
				<span class="info">
					<span class="name">{habit.name}</span>
					<span class="frequency">{describeFrequency(habit.frequency)}</span>
					{#if habit.target}
						<span class="target">🎯 {describeTarget(habit.target)}</span>
					{/if}
				</span>
				{#if paused}
					<span class="badge" data-status="paused">En pause</span>
				{/if}
				{#if missedYday}
					<span class="badge" data-status="missed-yesterday">manquée hier</span>
				{/if}
			</button>
		</SwipeToDelete>

		<div class="regularity" aria-label="Régularité des 7 derniers jours">
			{#each regularity as day (day.date)}
				<span
					class="dot"
					data-status={day.status}
					role="img"
					aria-label={dotLabel(day.date, day.status)}
				></span>
			{/each}
		</div>
		<p class="monthly-count">{monthlyCount} fois ce mois-ci</p>

		<div class="secondary-actions">
			{#if paused}
				<button type="button" class="resume-btn" onclick={() => onResume(habit)}>Réactiver</button>
			{:else}
				<button type="button" class="pause-btn" onclick={() => onPause(habit)}>Mettre en pause</button>
			{/if}
		</div>

		{#if paused}
			<div class="resume-auto">
				{#if resumeFormOpen}
					<form
						class="resume-form"
						onsubmit={submitResumeForm}
						aria-label="Date de reprise automatique"
					>
						<label for={`resume-at-${habit.id}`}>Date de reprise automatique (optionnel)</label>
						<input id={`resume-at-${habit.id}`} type="date" bind:value={resumeDateInput} />
						<div class="actions">
							<button type="button" class="secondary" onclick={cancelResumeForm}>Annuler</button>
							<button type="submit">Valider</button>
						</div>
					</form>
				{:else if habit.resumeAt}
					<button type="button" class="resume-at-btn" onclick={openResumeForm}>
						🔁 Reprise auto : {formatIsoDateFr(habit.resumeAt)}
					</button>
				{:else}
					<button type="button" class="resume-at-btn" onclick={openResumeForm}>
						+ Date de reprise automatique
					</button>
				{/if}
			</div>
		{/if}
	{/if}
</li>

{#if confirmOpen}
	<ConfirmDialog
		message={`Supprimer « ${habit.name} » ? Cette action est définitive.`}
		onConfirm={confirmDelete}
		onCancel={cancelConfirm}
	/>
{/if}

<style>
	.habit-card-item {
		list-style: none;
	}
	.habit-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		min-height: 44px;
		padding: var(--card-padding);
		/* Teinte de carte (US-036) : fond légèrement teinté + liseré. Les badges de statut, les
		   pastilles de régularité et le compteur mensuel gardent leurs propres couleurs. */
		background: var(--card-tint, var(--surface));
		border: 1px solid var(--surface-border);
		border-left: 4px solid var(--card-accent, var(--habit-border));
		border-radius: var(--card-radius);
		box-shadow: var(--surface-shadow);
		color: var(--text);
		text-align: left;
	}
	.emoji {
		font-size: 1.5rem;
	}
	.info {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
	}
	.name {
		font-weight: 600;
		overflow-wrap: anywhere;
	}
	.frequency {
		font-size: 0.8rem;
		color: var(--muted);
	}
	.target {
		font-size: 0.8rem;
		color: var(--habit-text);
	}
	.badge {
		font-size: 0.7rem;
		padding: 0.15rem 0.6rem;
		border-radius: 1rem;
		white-space: nowrap;
		font-weight: 600;
	}
	.badge[data-status='paused'] {
		color: var(--warning-text);
		background: var(--warning-bg);
		border: 1px solid var(--warning-border);
	}
	.badge[data-status='missed-yesterday'] {
		color: var(--habit-text);
		background: var(--surface);
		border: 1px solid var(--habit-border);
	}
	.badge[data-status='deleted'] {
		color: var(--danger-text);
		background: var(--danger-bg);
		border: 1px solid var(--danger-border);
	}
	.deleted-row {
		opacity: 0.75;
	}
	.resume-auto {
		margin-top: 0.4rem;
		display: flex;
		justify-content: flex-end;
	}
	.resume-at-btn {
		min-height: 36px;
		padding: 0.25rem 0.75rem;
		border-radius: 0.35rem;
		background: transparent;
		border: 1px solid var(--surface-border);
		color: var(--muted);
		font-size: 0.8rem;
	}
	.resume-form {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		width: 100%;
		margin-top: 0.4rem;
		padding-top: 0.4rem;
		border-top: 1px solid var(--surface-border);
	}
	.resume-form label {
		font-size: 0.8rem;
		color: var(--muted);
	}
	.resume-form input[type='date'] {
		background: var(--bg);
		border: 1px solid var(--surface-border);
		border-radius: 0.35rem;
		color: var(--text);
		padding: 0.4rem;
		min-height: 40px;
	}
	.resume-form .actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}
	.resume-form .actions button {
		min-height: 40px;
		padding: 0.4rem 0.8rem;
		border-radius: 0.35rem;
		border: 1px solid var(--accent);
		background: var(--accent);
		color: var(--accent-text);
		font-weight: 600;
		font-size: 0.85rem;
	}
	.resume-form .actions button.secondary {
		background: transparent;
		color: var(--text);
		border-color: var(--muted);
	}
	.regularity {
		display: flex;
		gap: 0.3rem;
		margin-top: 0.5rem;
		padding-left: calc(1.5rem + 0.75rem); /* aligné sous le nom, sous l'emoji */
	}
	.dot {
		width: 0.65rem;
		height: 0.65rem;
		border-radius: 50%;
		display: inline-block;
	}
	.dot[data-status='done'] {
		background: var(--habit-border);
	}
	.dot[data-status='missed'] {
		background: transparent;
		border: 1.5px solid var(--muted);
	}
	.dot[data-status='not-due'] {
		background: var(--surface-border);
	}
	.monthly-count {
		margin: 0.3rem 0 0;
		padding-left: calc(1.5rem + 0.75rem);
		font-size: 0.75rem;
		color: var(--muted);
	}
	.secondary-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 0.4rem;
	}
	.pause-btn,
	.resume-btn {
		min-height: 36px;
		padding: 0.25rem 0.75rem;
		border-radius: 0.35rem;
		background: transparent;
		font-size: 0.8rem;
	}
	.pause-btn {
		border: 1px solid var(--muted);
		color: var(--muted);
	}
	.resume-btn {
		border: 1px solid var(--habit-border);
		color: var(--habit-text);
	}
</style>
