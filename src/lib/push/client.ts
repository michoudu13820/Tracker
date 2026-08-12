import { PUBLIC_VAPID_KEY, PUBLIC_SCHEDULER_URL } from '$env/static/public';
import type { ScheduledReminder } from '$lib/domain/reminders';

/**
 * Client Web Push — côté navigateur.
 *
 * Rôle : obtenir la permission, souscrire au push, et POSTer au micro-serveur la
 * fenêtre de rappels + la souscription. L'ENDPOINT de souscription lui-même sert
 * d'identifiant implicite (pas de compte, pas d'email) : le serveur hache cet
 * endpoint pour obtenir une clé de stockage stable. Voir docs/architecture/ADR-001.
 *
 * Contraintes iOS (vérifiées 2026) : Web Push ne fonctionne QUE si la PWA est
 * installée sur l'écran d'accueil (iOS 16.4+ ; EU/France OK depuis iOS 17.4 après
 * le rétropédalage DMA d'Apple).
 */

/** Web Push n'est disponible que dans une PWA installée (standalone) sur iOS. */
export function isPushSupported(): boolean {
	return (
		typeof window !== 'undefined' &&
		'serviceWorker' in navigator &&
		'PushManager' in window &&
		'Notification' in window
	);
}

/** Détecte le mode « installé sur l'écran d'accueil » (requis pour le push iOS). */
export function isStandalone(): boolean {
	if (typeof window === 'undefined') return false;
	// iOS Safari expose navigator.standalone ; les autres exposent le media query.
	return (
		window.matchMedia('(display-mode: standalone)').matches ||
		(navigator as unknown as { standalone?: boolean }).standalone === true
	);
}

/** État de permission courant, sans jamais déclencher de demande (lecture pure). */
export function notificationPermission(): NotificationPermission | 'unsupported' {
	if (typeof Notification === 'undefined') return 'unsupported';
	return Notification.permission;
}

/** Demande la permission et retourne la souscription push (ou null si refus/non supporté). */
export async function subscribe(): Promise<PushSubscription | null> {
	if (!isPushSupported()) return null;

	const permission = await Notification.requestPermission();
	if (permission !== 'granted') return null;

	const reg = await navigator.serviceWorker.ready;
	const existing = await reg.pushManager.getSubscription();
	if (existing) return existing;

	return reg.pushManager.subscribe({
		userVisibleOnly: true,
		applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY) as BufferSource
	});
}

/**
 * Retourne la souscription push déjà existante (sans jamais demander la permission).
 * Utilisé au démarrage de l'app pour retrouver l'état d'un abonnement déjà accepté lors
 * d'une session précédente (la souscription en mémoire ne survit pas à un rechargement).
 */
export async function getExistingSubscription(): Promise<PushSubscription | null> {
	if (!isPushSupported() || Notification.permission !== 'granted') return null;
	const reg = await navigator.serviceWorker.ready;
	return reg.pushManager.getSubscription();
}

/**
 * Envoie au serveur la souscription + la fenêtre de rappels calculée localement.
 * C'est le SEUL appel réseau sortant qui contient des données propres à l'utilisateur —
 * et il ne contient QUE des instants d'envoi, aucune habitude ni historique.
 */
export async function pushSchedule(
	subscription: PushSubscription,
	reminders: ScheduledReminder[]
): Promise<void> {
	await fetch(`${PUBLIC_SCHEDULER_URL}/register-subscription`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ subscription, reminders })
	});
}

/** Désinscription : coupe les rappels côté serveur (US-007, scénario 6). */
export async function unsubscribe(subscription: PushSubscription): Promise<void> {
	await fetch(`${PUBLIC_SCHEDULER_URL}/unregister-subscription`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ endpoint: subscription.endpoint })
	});
	await subscription.unsubscribe();
}

/**
 * Interface du client push, pour injection dans `RemindersStore` (mockable en test — même
 * patron que les repositories de `$lib/data`, voir CONVENTIONS.md et `create-store`).
 */
export interface PushClient {
	isPushSupported(): boolean;
	isStandalone(): boolean;
	notificationPermission(): NotificationPermission | 'unsupported';
	subscribe(): Promise<PushSubscription | null>;
	getExistingSubscription(): Promise<PushSubscription | null>;
	pushSchedule(subscription: PushSubscription, reminders: ScheduledReminder[]): Promise<void>;
	unsubscribe(subscription: PushSubscription): Promise<void>;
}

/** Implémentation réelle (navigateur), utilisée par défaut par `RemindersStore`. */
export const defaultPushClient: PushClient = {
	isPushSupported,
	isStandalone,
	notificationPermission,
	subscribe,
	getExistingSubscription,
	pushSchedule,
	unsubscribe
};

function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
	const raw = atob(base64);
	const output = new Uint8Array(raw.length);
	for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
	return output;
}
