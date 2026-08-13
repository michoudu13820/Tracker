// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import WeeklyReviewSettingsForm from './WeeklyReviewSettingsForm.svelte';
import type { WeeklyReviewSettings } from '$lib/domain/types';

const settings: WeeklyReviewSettings = { enabled: false, weekday: 0, time: '18:00' };

describe('WeeklyReviewSettingsForm (US-028)', () => {
	it("affiche un message et aucun contrôle si les rappels quotidiens ne sont pas actifs (scénario 1, prérequis)", () => {
		render(WeeklyReviewSettingsForm, {
			dailyRemindersEnabled: false,
			settings,
			onToggle: vi.fn(),
			onWeekdayChange: vi.fn(),
			onTimeChange: vi.fn()
		});

		expect(screen.getByText(/Active d'abord les rappels quotidiens/)).toBeInTheDocument();
		expect(screen.queryByRole('switch')).not.toBeInTheDocument();
	});

	it('affiche les contrôles activation/jour/heure quand les rappels quotidiens sont actifs', () => {
		render(WeeklyReviewSettingsForm, {
			dailyRemindersEnabled: true,
			settings,
			onToggle: vi.fn(),
			onWeekdayChange: vi.fn(),
			onTimeChange: vi.fn()
		});

		expect(screen.getByRole('switch')).toBeInTheDocument();
		expect(screen.getByLabelText('Jour')).toHaveValue('0');
		expect(screen.getByLabelText('Heure')).toHaveValue('18:00');
	});

	it('scénario 3 — active/désactive la revue hebdomadaire indépendamment du reste', async () => {
		const onToggle = vi.fn();
		render(WeeklyReviewSettingsForm, {
			dailyRemindersEnabled: true,
			settings,
			onToggle,
			onWeekdayChange: vi.fn(),
			onTimeChange: vi.fn()
		});

		await fireEvent.click(screen.getByRole('switch'));
		expect(onToggle).toHaveBeenCalledWith(true);
	});

	it('scénario 1 — change le jour de la revue', async () => {
		const onWeekdayChange = vi.fn();
		render(WeeklyReviewSettingsForm, {
			dailyRemindersEnabled: true,
			settings,
			onToggle: vi.fn(),
			onWeekdayChange,
			onTimeChange: vi.fn()
		});

		await fireEvent.change(screen.getByLabelText('Jour'), { target: { value: '3' } });
		expect(onWeekdayChange).toHaveBeenCalledWith(3);
	});

	it("scénario 1 — change l'heure de la revue", async () => {
		const onTimeChange = vi.fn();
		render(WeeklyReviewSettingsForm, {
			dailyRemindersEnabled: true,
			settings,
			onToggle: vi.fn(),
			onWeekdayChange: vi.fn(),
			onTimeChange
		});

		await fireEvent.change(screen.getByLabelText('Heure'), { target: { value: '19:30' } });
		expect(onTimeChange).toHaveBeenCalledWith('19:30');
	});
});
