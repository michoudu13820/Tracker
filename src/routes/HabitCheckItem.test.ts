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

describe('HabitCheckItem — signal « manquée hier » (US-025)', () => {
	it('scénario 1 — affiche le signal quand missedYesterday est vrai', () => {
		render(HabitCheckItem, { habit, done: false, onToggle: vi.fn(), missedYesterday: true });
		expect(screen.getByText('manquée hier')).toBeInTheDocument();
	});

	it("n'affiche aucun signal par défaut (scénarios 2/3)", () => {
		render(HabitCheckItem, { habit, done: false, onToggle: vi.fn() });
		expect(screen.queryByText('manquée hier')).toBeNull();
	});
});

describe('HabitCheckItem — couleur de carte dans le planning (US-036 scénario 2)', () => {
	function card(container: HTMLElement) {
		return container.querySelector('.habit-item') as HTMLElement;
	}

	it('applique la teinte choisie au fond et au liseré de la carte', () => {
		const { container } = render(HabitCheckItem, {
			habit: { ...habit, color: 'menthe' },
			done: false,
			onToggle: vi.fn()
		});

		const el = card(container);
		expect(el.dataset.cardColor).toBe('menthe');
		expect(el.getAttribute('style')).toContain('--card-tint: var(--tint-menthe-bg)');
		expect(el.getAttribute('style')).toContain('--card-accent: var(--tint-menthe-border)');
	});

	it('scénarios 3/4 — sans couleur choisie, applique la teinte par défaut', () => {
		const { container } = render(HabitCheckItem, { habit, done: false, onToggle: vi.fn() });

		const el = card(container);
		expect(el.dataset.cardColor).toBe('lavande');
		expect(el.getAttribute('style')).toContain('--card-accent: var(--tint-lavande-border)');
	});

	it("scénario 10 — la couleur n'ajoute aucune information : le nom et l'état restent lus normalement", () => {
		render(HabitCheckItem, {
			habit: { ...habit, color: 'menthe' },
			done: true,
			onToggle: vi.fn(),
			missedYesterday: true
		});

		expect(screen.getByText("Boire de l'eau")).toHaveClass('done');
		expect(screen.getByRole('checkbox')).toBeChecked();
		expect(screen.getByText('manquée hier')).toBeInTheDocument();
	});
});

describe('HabitCheckItem — les habitudes ignorent l’urgence (US-039 scénario 13)', () => {
	it("n'affiche jamais le signal ‼️ ni le libellé « Urgente » dans le planning", () => {
		const { container } = render(HabitCheckItem, {
			habit: { ...habit, color: 'menthe' },
			done: false,
			onToggle: vi.fn(),
			missedYesterday: true
		});

		expect(container.textContent).not.toContain('‼️');
		expect(screen.queryByText(/Urgente/i)).toBeNull();
	});
});
