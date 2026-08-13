// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import HabitProgressItem from './HabitProgressItem.svelte';
import type { Habit } from '$lib/domain/types';

const habit: Habit = {
	id: 'h1',
	name: "Boire de l'eau",
	emoji: '💧',
	frequency: { kind: 'interval', days: 1, anchor: '2026-01-01' },
	createdAt: '2026-01-01',
	target: { value: 1.5, unit: 'L' }
};

describe('HabitProgressItem (US-018 scénario 1 — affichage initial)', () => {
	it('affiche une barre de progression vide et le cumul « 0 / 1,5 L »', () => {
		render(HabitProgressItem, { habit, value: 0, done: false, onAdd: vi.fn(), onCorrect: vi.fn() });

		expect(screen.getByText('0 / 1,5 L')).toBeInTheDocument();
		expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
		expect(
			screen.getByRole('button', { name: `Ajouter une quantité pour « ${habit.name} »` })
		).toBeInTheDocument();
	});
});

describe('HabitProgressItem — signal « manquée hier » (US-025)', () => {
	it('scénario 1 — affiche le signal quand missedYesterday est vrai', () => {
		render(HabitProgressItem, {
			habit,
			value: 0,
			done: false,
			onAdd: vi.fn(),
			onCorrect: vi.fn(),
			missedYesterday: true
		});
		expect(screen.getByText('manquée hier')).toBeInTheDocument();
	});

	it("n'affiche aucun signal par défaut (scénarios 2/3)", () => {
		render(HabitProgressItem, { habit, value: 0, done: false, onAdd: vi.fn(), onCorrect: vi.fn() });
		expect(screen.queryByText('manquée hier')).toBeNull();
	});
});

describe('HabitProgressItem — ajout via le bouton « + » (US-018 scénario 2)', () => {
	it('ouvre la saisie libre et appelle onAdd avec le nombre saisi', async () => {
		const onAdd = vi.fn();
		render(HabitProgressItem, { habit, value: 0, done: false, onAdd, onCorrect: vi.fn() });

		await fireEvent.click(
			screen.getByRole('button', { name: `Ajouter une quantité pour « ${habit.name} »` })
		);
		const input = screen.getByLabelText('Quantité à ajouter');
		await fireEvent.input(input, { target: { value: '0,2' } });
		await fireEvent.click(screen.getByRole('button', { name: 'OK' }));

		expect(onAdd).toHaveBeenCalledWith(0.2);
	});
});

describe('HabitProgressItem — saisie invalide (US-018 scénario 6)', () => {
	it('refuse une valeur non numérique et affiche un message, sans appeler onAdd', async () => {
		const onAdd = vi.fn();
		render(HabitProgressItem, { habit, value: 0, done: false, onAdd, onCorrect: vi.fn() });

		await fireEvent.click(
			screen.getByRole('button', { name: `Ajouter une quantité pour « ${habit.name} »` })
		);
		await fireEvent.input(screen.getByLabelText('Quantité à ajouter'), {
			target: { value: 'abc' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'OK' }));

		expect(onAdd).not.toHaveBeenCalled();
		expect(screen.getByRole('alert')).toHaveTextContent(
			'La quantité doit être un nombre strictement positif.'
		);
	});

	it('refuse une valeur négative ou nulle', async () => {
		const onAdd = vi.fn();
		render(HabitProgressItem, { habit, value: 0, done: false, onAdd, onCorrect: vi.fn() });

		await fireEvent.click(
			screen.getByRole('button', { name: `Ajouter une quantité pour « ${habit.name} »` })
		);
		await fireEvent.input(screen.getByLabelText('Quantité à ajouter'), { target: { value: '-1' } });
		await fireEvent.click(screen.getByRole('button', { name: 'OK' }));

		expect(onAdd).not.toHaveBeenCalled();
	});
});

describe('HabitProgressItem — correction de la valeur cumulée (US-018 scénario 9)', () => {
	it('ouvre la correction pré-remplie avec le cumul actuel et appelle onCorrect', async () => {
		const onCorrect = vi.fn();
		render(HabitProgressItem, { habit, value: 2, done: true, onAdd: vi.fn(), onCorrect });

		await fireEvent.click(screen.getByRole('button', { name: '2 / 1,5 L' }));
		const input = screen.getByLabelText('Corriger la valeur cumulée');
		expect(input).toHaveValue('2');

		await fireEvent.input(input, { target: { value: '0,2' } });
		await fireEvent.click(screen.getByRole('button', { name: 'OK' }));

		expect(onCorrect).toHaveBeenCalledWith(0.2);
	});
});

describe('HabitProgressItem — dépassement de la cible (US-018 scénario 5)', () => {
	it('plafonne visuellement la barre à 100% et signale le dépassement', () => {
		render(HabitProgressItem, { habit, value: 1.8, done: true, onAdd: vi.fn(), onCorrect: vi.fn() });

		const bar = screen.getByRole('progressbar');
		expect(bar).toHaveAttribute('aria-valuenow', '100');
		expect(screen.getByText('1,8 / 1,5 L')).toBeInTheDocument();
	});
});

describe('HabitProgressItem — statut fait (US-018 scénario 4)', () => {
	it('applique le style barré au nom quand l’habitude est faite', () => {
		render(HabitProgressItem, { habit, value: 1.5, done: true, onAdd: vi.fn(), onCorrect: vi.fn() });
		expect(screen.getByText(habit.name)).toHaveClass('done');
	});
});
