// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import HabitCheckItem from './HabitCheckItem.svelte';
import type { Habit } from '$lib/domain/types';

const habit: Habit = {
	id: 'h1',
	name: "Boire de l'eau",
	emoji: '💧',
	frequency: { kind: 'interval', days: 1, anchor: '2026-01-01' },
	createdAt: '2026-01-01'
};

describe('HabitCheckItem (US-004 scénarios 4/5)', () => {
	it('affiche le nom et l’emoji', () => {
		render(HabitCheckItem, { habit, done: false, onToggle: vi.fn() });
		expect(screen.getByText("Boire de l'eau")).toBeInTheDocument();
		expect(screen.getByText('💧')).toBeInTheDocument();
	});

	it('appelle onToggle(id, true) quand on coche (scénario 4)', async () => {
		const onToggle = vi.fn();
		render(HabitCheckItem, { habit, done: false, onToggle });
		await fireEvent.click(screen.getByRole('checkbox'));
		expect(onToggle).toHaveBeenCalledWith('h1', true);
	});

	it('appelle onToggle(id, false) quand on décoche (scénario 5)', async () => {
		const onToggle = vi.fn();
		render(HabitCheckItem, { habit, done: true, onToggle });
		await fireEvent.click(screen.getByRole('checkbox'));
		expect(onToggle).toHaveBeenCalledWith('h1', false);
	});

	it('affiche un style barré quand la case est cochée', () => {
		render(HabitCheckItem, { habit, done: true, onToggle: vi.fn() });
		expect(screen.getByText("Boire de l'eau")).toHaveClass('done');
	});
});

describe('HabitCheckItem — carte horizontale pleine largeur (US-010 scénario 5)', () => {
	it("affiche le nom complet sans le tronquer même s'il est très long", () => {
		const longName =
			'Faire 45 minutes de méditation guidée en pleine conscience avant le petit-déjeuner';
		render(HabitCheckItem, { habit: { ...habit, name: longName }, done: false, onToggle: vi.fn() });
		expect(screen.getByText(longName)).toBeInTheDocument();
	});
});
