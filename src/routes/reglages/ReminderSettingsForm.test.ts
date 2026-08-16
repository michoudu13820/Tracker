// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ReminderSettingsForm from './ReminderSettingsForm.svelte';
import type { ReminderSettings } from '$lib/domain/types';

const settings: ReminderSettings = { enabled: false, time: '08:00', timezone: 'Europe/Paris' };

describe('ReminderSettingsForm (US-007)', () => {
	it('scénario 3bis — PWA non installée : message explicatif, aucun contrôle activable', () => {
		render(ReminderSettingsForm, {
			availability: 'needs-install',
			permission: 'default',
			settings,
			enabling: false,
			enableError: null,
			onToggle: vi.fn(),
			onTimeChange: vi.fn()
		});

		expect(screen.getByText(/installée sur l'écran/i)).toBeInTheDocument();
		expect(screen.getByText('Partager')).toBeInTheDocument();
		expect(screen.getByText(/Ajouter à l'écran d'accueil/)).toBeInTheDocument();
		expect(screen.queryByRole('switch')).not.toBeInTheDocument();
	});

	it('navigateur non supporté : message informatif, aucun contrôle', () => {
		render(ReminderSettingsForm, {
			availability: 'unsupported',
			permission: 'unsupported',
			settings,
			enabling: false,
			enableError: null,
			onToggle: vi.fn(),
			onTimeChange: vi.fn()
		});

		expect(screen.getByText(/pas disponibles sur ce navigateur/i)).toBeInTheDocument();
		expect(screen.queryByRole('switch')).not.toBeInTheDocument();
	});

	it('scénario 4 — activer la case à cocher déclenche onToggle(true)', async () => {
		const onToggle = vi.fn();
		render(ReminderSettingsForm, {
			availability: 'available',
			permission: 'default',
			settings,
			enabling: false,
			enableError: null,
			onToggle,
			onTimeChange: vi.fn()
		});

		await fireEvent.click(screen.getByRole('switch', { name: 'Recevoir un rappel quotidien' }));

		expect(onToggle).toHaveBeenCalledWith(true);
	});

	it('scénario 6 — décocher alors que les rappels sont activés déclenche onToggle(false)', async () => {
		const onToggle = vi.fn();
		render(ReminderSettingsForm, {
			availability: 'available',
			permission: 'granted',
			settings: { ...settings, enabled: true },
			enabling: false,
			enableError: null,
			onToggle,
			onTimeChange: vi.fn()
		});

		const toggle = screen.getByRole('switch', { name: 'Recevoir un rappel quotidien' });
		expect(toggle).toBeChecked();

		await fireEvent.click(toggle);

		expect(onToggle).toHaveBeenCalledWith(false);
	});

	it('scénario 5 — permission refusée : message explicite avec la marche à suivre', () => {
		render(ReminderSettingsForm, {
			availability: 'available',
			permission: 'denied',
			settings,
			enabling: false,
			enableError: null,
			onToggle: vi.fn(),
			onTimeChange: vi.fn()
		});

		expect(screen.getByRole('alert')).toHaveTextContent(/refusée/i);
		expect(screen.getByRole('alert')).toHaveTextContent(/Réglages de l'iPhone/);
	});

	it('scénario 5 — erreur d\'activation explicite affichée si fournie', () => {
		render(ReminderSettingsForm, {
			availability: 'available',
			permission: 'default',
			settings,
			enabling: false,
			enableError: "L'autorisation de notifications n'a pas été accordée : les rappels ne sont pas activés.",
			onToggle: vi.fn(),
			onTimeChange: vi.fn()
		});

		expect(screen.getByRole('alert')).toHaveTextContent(/autorisation de notifications/i);
	});

	it('scénario 7 — préremplit l\'heure par défaut (8h00) et propage un changement d\'heure', async () => {
		const onTimeChange = vi.fn();
		render(ReminderSettingsForm, {
			availability: 'available',
			permission: 'granted',
			settings: { ...settings, enabled: true },
			enabling: false,
			enableError: null,
			onToggle: vi.fn(),
			onTimeChange
		});

		const timeInput = screen.getByLabelText('Heure du rappel');
		expect(timeInput).toHaveValue('08:00');

		await fireEvent.change(timeInput, { target: { value: '20:30' } });

		expect(onTimeChange).toHaveBeenCalledWith('20:30');
	});

	it("US-040 scénario 7 — hors ligne : le réglage est annoncé comme en attente, pas comme actif", async () => {
		render(ReminderSettingsForm, {
			availability: 'available',
			permission: 'granted',
			settings: { ...settings, enabled: true },
			enabling: false,
			enableError: null,
			pendingSync: true,
			onToggle: vi.fn(),
			onTimeChange: vi.fn()
		});

		const status = screen.getByRole('status');
		expect(status).toHaveTextContent(/hors connexion/i);
		expect(status).toHaveTextContent(/retour du réseau/i);
		// L'exigence tient dans cette phrase : sans elle, l'utilisateur croirait son rappel actif.
		expect(status).toHaveTextContent(/pas encore actif/i);
	});

	it("US-040 scénario 7 — échec définitif : l'utilisateur est averti que le rappel n'est pas actif", async () => {
		render(ReminderSettingsForm, {
			availability: 'available',
			permission: 'granted',
			settings: { ...settings, enabled: true },
			enabling: false,
			enableError: null,
			syncFailed: true,
			onToggle: vi.fn(),
			onTimeChange: vi.fn()
		});

		expect(screen.getByRole('alert')).toHaveTextContent(/n'est pas actif/i);
	});
});
