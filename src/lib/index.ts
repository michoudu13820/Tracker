/**
 * Barrel d'exports publics de `$lib`.
 * Règle de dépendance : `routes` → `stores` → `data` / `domain`. Le `domain` ne dépend
 * de rien (pur). Les composants n'accèdent jamais à `data` en direct (toujours via un store).
 */

// Domaine (logique métier pure)
export * from './domain/types';
export * from './domain/dates';
export * from './domain/occurrences';
export * from './domain/reminders';
export * from './domain/summary';

// État partagé
export { habitsStore, HabitsStore } from './stores/habits.store.svelte';

// Accès aux données
export { idbRepositories, exportAllData } from './data/repositories';
