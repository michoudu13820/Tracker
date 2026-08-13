// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import HabitCard from './HabitCard.svelte';
import type { Habit } from '$lib/domain/types';

const habit: Habit = {
	id: 'h1',
	name: 'Yoga',
	emoji: '🧘',
	frequency: { kind: 'interval', days: 1, anchor: '2026-08-01' },
	createdAt: '2026-08-01'
};

function pointer(el: Element, type: 'pointerdown' | 'pointerup', clientX: number) {
	return fireEvent(el, new MouseEvent(type, { clientX, bubbles: true, cancelable: true }));
}

/** Props communes par défaut, surchargeables par test (US-013 + US-015 + US-024). */
function baseProps(overrides: Partial<Record<string, unknown>> = {}) {
	return {
		habit,
		revealed: false,
		onReveal: vi.fn(),
		onCloseReveal: vi.fn(),
		onEdit: vi.fn(),
		onDelete: vi.fn(),
		onPause: vi.fn(),
		onResume: vi.fn(),
		onSetResumeAt: vi.fn(),
		completions: [],
		// Égal à l'ancrage de l'habitude de base : "hier" (2026-07-31) tombe avant l'ancrage,
		// donc jamais dû → n'active jamais accidentellement le signal "manquée hier" (US-025)
		// dans les tests qui ne portent pas spécifiquement sur ce scénario.
		today: '2026-08-01',
		...overrides
	};
}

describe('HabitCard (US-013 — suppression)', () => {
	it('ouvre l\'édition au clic quand le bouton de suppression n\'est pas révélé', async () => {
		const onEdit = vi.fn();
		render(HabitCard, baseProps({ onEdit }));

		await fireEvent.click(screen.getByRole('button', { name: /^Yoga/ }));
		expect(onEdit).toHaveBeenCalledWith(habit);
	});

	it('révèle le bouton poubelle au glissement (scénario 1) sans supprimer', async () => {
		const onReveal = vi.fn();
		const onDelete = vi.fn();
		render(HabitCard, baseProps({ onReveal, onDelete }));

		const row = screen.getByRole('button', { name: /Yoga/ });
		await pointer(row, 'pointerdown', 200);
		await pointer(row, 'pointerup', 100);

		expect(onReveal).toHaveBeenCalledTimes(1);
		expect(onDelete).not.toHaveBeenCalled();
	});

	it('demande confirmation au clic sur le bouton poubelle, avec le nom de l\'habitude et le caractère définitif (scénario 2)', async () => {
		render(HabitCard, baseProps({ revealed: true }));

		await fireEvent.click(screen.getByRole('button', { name: 'Supprimer « Yoga »' }));

		const dialog = screen.getByRole('alertdialog');
		expect(dialog).toHaveTextContent('Yoga');
		expect(dialog).toHaveTextContent('définitive');
	});

	it('ne supprime pas tant que la confirmation n\'a pas eu lieu', async () => {
		const onDelete = vi.fn();
		render(HabitCard, baseProps({ revealed: true, onDelete }));

		await fireEvent.click(screen.getByRole('button', { name: 'Supprimer « Yoga »' }));
		expect(onDelete).not.toHaveBeenCalled();
	});

	it('supprime effectivement après confirmation (scénario 3)', async () => {
		const onDelete = vi.fn();
		const onCloseReveal = vi.fn();
		render(HabitCard, baseProps({ revealed: true, onDelete, onCloseReveal }));

		await fireEvent.click(screen.getByRole('button', { name: 'Supprimer « Yoga »' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

		expect(onDelete).toHaveBeenCalledWith(habit);
		expect(onCloseReveal).toHaveBeenCalled();
	});

	it('annule sans supprimer quand on choisit Annuler (scénario 4)', async () => {
		const onDelete = vi.fn();
		render(HabitCard, baseProps({ revealed: true, onDelete }));

		await fireEvent.click(screen.getByRole('button', { name: 'Supprimer « Yoga »' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

		expect(onDelete).not.toHaveBeenCalled();
		expect(screen.queryByRole('alertdialog')).toBeNull();
	});

	it('referme le bouton poubelle sans suppression si on interagit ailleurs sur la carte (scénario 5)', async () => {
		const onCloseReveal = vi.fn();
		const onEdit = vi.fn();
		render(HabitCard, baseProps({ revealed: true, onCloseReveal, onEdit }));

		await fireEvent.click(screen.getByRole('button', { name: /^Yoga/ }));

		expect(onCloseReveal).toHaveBeenCalledTimes(1);
		expect(onEdit).not.toHaveBeenCalled();
	});
});

describe('HabitCard (US-015 — pause/reprise)', () => {
	it('propose « Mettre en pause » et pas de badge pour une habitude active (scénario 1, état initial)', () => {
		render(HabitCard, baseProps());

		expect(screen.getByRole('button', { name: 'Mettre en pause' })).toBeInTheDocument();
		expect(screen.queryByText('En pause')).toBeNull();
	});

	it('met l\'habitude en pause au clic sur « Mettre en pause » (scénario 1)', async () => {
		const onPause = vi.fn();
		render(HabitCard, baseProps({ onPause }));

		await fireEvent.click(screen.getByRole('button', { name: 'Mettre en pause' }));
		expect(onPause).toHaveBeenCalledWith(habit);
	});

	it('affiche un badge « En pause » et l\'action « Réactiver » pour une habitude en pause (scénario 1/4)', () => {
		const pausedHabit: Habit = { ...habit, status: 'paused' };
		render(HabitCard, baseProps({ habit: pausedHabit }));

		expect(screen.getByText('En pause')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Réactiver' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Mettre en pause' })).toBeNull();
	});

	it('réactive une habitude en pause au clic sur « Réactiver » (scénario 4)', async () => {
		const pausedHabit: Habit = { ...habit, status: 'paused' };
		const onResume = vi.fn();
		render(HabitCard, baseProps({ habit: pausedHabit, onResume }));

		await fireEvent.click(screen.getByRole('button', { name: 'Réactiver' }));
		expect(onResume).toHaveBeenCalledWith(pausedHabit);
	});
});

describe('HabitCard — habitude supprimée, lecture seule (US-027 scénario 2)', () => {
	const deletedHabit: Habit = { ...habit, status: 'deleted' };

	it('affiche un badge « Supprimée », sans action de modification', () => {
		render(HabitCard, baseProps({ habit: deletedHabit }));

		expect(screen.getByText('Supprimée')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /^Yoga/ })).toBeNull();
		expect(screen.queryByRole('button', { name: 'Mettre en pause' })).toBeNull();
		expect(screen.queryByRole('button', { name: 'Réactiver' })).toBeNull();
		expect(screen.queryByRole('button', { name: /Supprimer/ })).toBeNull();
	});
});

describe('HabitCard — date de reprise automatique (US-027 scénarios 3/5)', () => {
	const pausedHabit: Habit = { ...habit, status: 'paused' };

	it("propose de programmer une date de reprise pour une habitude en pause sans date", () => {
		render(HabitCard, baseProps({ habit: pausedHabit }));
		expect(
			screen.getByRole('button', { name: '+ Date de reprise automatique' })
		).toBeInTheDocument();
	});

	it('scénario 3 — programme une date de reprise automatique', async () => {
		const onSetResumeAt = vi.fn();
		render(HabitCard, baseProps({ habit: pausedHabit, onSetResumeAt }));

		await fireEvent.click(screen.getByRole('button', { name: '+ Date de reprise automatique' }));
		await fireEvent.input(screen.getByLabelText('Date de reprise automatique (optionnel)'), {
			target: { value: '2026-09-01' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Valider' }));

		expect(onSetResumeAt).toHaveBeenCalledWith(pausedHabit, '2026-09-01');
	});

	it('affiche la date déjà programmée pour une habitude en pause avec resumeAt', () => {
		const withResume: Habit = { ...pausedHabit, resumeAt: '2026-09-01' };
		render(HabitCard, baseProps({ habit: withResume }));

		expect(screen.getByText('🔁 Reprise auto : 01/09/2026')).toBeInTheDocument();
	});

	it('scénario 5 — retire la date de reprise automatique déjà programmée', async () => {
		const withResume: Habit = { ...pausedHabit, resumeAt: '2026-09-01' };
		const onSetResumeAt = vi.fn();
		render(HabitCard, baseProps({ habit: withResume, onSetResumeAt }));

		await fireEvent.click(screen.getByRole('button', { name: '🔁 Reprise auto : 01/09/2026' }));
		await fireEvent.input(screen.getByLabelText('Date de reprise automatique (optionnel)'), {
			target: { value: '' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Valider' }));

		expect(onSetResumeAt).toHaveBeenCalledWith(withResume, undefined);
	});

	it("n'affiche aucun contrôle de reprise automatique pour une habitude active", () => {
		render(HabitCard, baseProps());
		expect(screen.queryByText(/Reprise auto/)).toBeNull();
		expect(screen.queryByRole('button', { name: /Date de reprise automatique/ })).toBeNull();
	});
});

describe('HabitCard — indicateur de régularité apaisé (US-024)', () => {
	const dailyHabit: Habit = {
		id: 'h2',
		name: "Boire de l'eau",
		emoji: '💧',
		frequency: { kind: 'interval', days: 1, anchor: '2026-08-01' },
		createdAt: '2026-08-01'
	};

	it('scénario 1 — affiche 7 pastilles de régularité', () => {
		render(HabitCard, baseProps({ habit: dailyHabit }));

		const region = screen.getByLabelText('Régularité des 7 derniers jours');
		expect(region.querySelectorAll('[role="img"]')).toHaveLength(7);
	});

	it('scénario 2 — affiche un compteur mensuel neutre', () => {
		const completions = [
			{ habitId: dailyHabit.id, date: '2026-08-01', done: true },
			{ habitId: dailyHabit.id, date: '2026-08-02', done: true }
		];
		render(HabitCard, baseProps({ habit: dailyHabit, completions, today: '2026-08-12' }));

		expect(screen.getByText('2 fois ce mois-ci')).toBeInTheDocument();
	});

	it("scénario 3 — n'affiche jamais de mécanique de streak (flamme, jours d'affilée, série)", () => {
		render(HabitCard, baseProps({ habit: dailyHabit }));

		expect(screen.queryByText(/🔥/)).toBeNull();
		expect(screen.queryByText(/jours? d'affilée/i)).toBeNull();
		expect(screen.queryByText(/série/i)).toBeNull();
		expect(screen.queryByText(/record/i)).toBeNull();
	});

	it("scénario 4 — distingue les jours non concernés des jours manqués (fréquence hebdomadaire)", () => {
		const weekdaysHabit: Habit = {
			id: 'h3',
			name: 'Yoga',
			emoji: '🧘',
			frequency: { kind: 'weekdays', weekdays: [1, 3, 5] },
			createdAt: '2026-07-01'
		};
		// 2026-08-09 = dimanche : lundi 03/08 est "manqué" (dû, non fait), mardi 04/08 est
		// "non concerné" (jamais dû ce jour-là).
		render(HabitCard, baseProps({ habit: weekdaysHabit, today: '2026-08-09' }));

		expect(screen.getByLabelText('Lun : manqué')).toBeInTheDocument();
		expect(screen.getByLabelText('Mar : non concerné')).toBeInTheDocument();
	});
});

describe('HabitCard — signal « manquée hier » (US-025)', () => {
	const dailyHabit: Habit = {
		id: 'h4',
		name: 'Méditer',
		emoji: '🧘',
		frequency: { kind: 'interval', days: 1, anchor: '2026-08-01' },
		createdAt: '2026-08-01'
	};

	it('scénario 1 — affiche « manquée hier » si due hier et non cochée', () => {
		// today = jeudi 13/08 → hier = mercredi 12/08, due (intervalle 1 jour), aucune complétion.
		render(HabitCard, baseProps({ habit: dailyHabit, today: '2026-08-13', completions: [] }));
		expect(screen.getByText('manquée hier')).toBeInTheDocument();
	});

	it('scénario 3 — aucun signal si hier a été cochée faite', () => {
		const completions = [{ habitId: dailyHabit.id, date: '2026-08-12', done: true }];
		render(HabitCard, baseProps({ habit: dailyHabit, today: '2026-08-13', completions }));
		expect(screen.queryByText('manquée hier')).toBeNull();
	});

	it("scénario 5 — n'ajoute aucune action de reprogrammation quand le signal est affiché", () => {
		render(HabitCard, baseProps({ habit: dailyHabit, today: '2026-08-13', completions: [] }));
		expect(screen.getByText('manquée hier')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /reprogram/i })).toBeNull();
		expect(screen.queryByRole('button', { name: /rattrap/i })).toBeNull();
	});
});

describe('HabitCard — cible chiffrée (US-017 scénario 2)', () => {
	it('affiche la cible chiffrée quand l’habitude en a une', () => {
		const targetHabit: Habit = { ...habit, target: { value: 1.5, unit: 'L' } };
		render(HabitCard, baseProps({ habit: targetHabit }));

		expect(screen.getByText(/1,5 L/)).toBeInTheDocument();
	});

	it("n'affiche aucune indication de cible pour une habitude simple", () => {
		render(HabitCard, baseProps());
		expect(screen.queryByText(/🎯/)).toBeNull();
	});
});
