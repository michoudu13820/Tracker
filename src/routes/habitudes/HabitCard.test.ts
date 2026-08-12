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

/** Props communes par défaut, surchargeables par test (US-013 + US-015). */
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
