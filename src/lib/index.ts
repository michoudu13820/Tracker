/**
 * Barrel d'exports publics de `$lib`.
 * Règle de dépendance : `routes` / `components` → `stores` → `data` / `domain`.
 * Le `domain` ne dépend de rien (pur). Les composants n'accèdent jamais à `data` en
 * direct (toujours via un store). Voir CONVENTIONS.md et ADR-003/ADR-004.
 */

// Domaine (logique métier pure)
export * from './domain/types';
export * from './domain/dates';
export * from './domain/occurrences';
export * from './domain/tasks';
export * from './domain/reminders';
export * from './domain/summary';

// État partagé (un store par domaine fonctionnel — ADR-003)
export { habitsStore, HabitsStore } from './stores/habits.store.svelte';
export { tasksStore, TasksStore } from './stores/tasks.store.svelte';
export { completionsStore, CompletionsStore } from './stores/completions.store.svelte';
export { settingsStore, SettingsStore } from './stores/settings.store.svelte';
export { remindersStore, RemindersStore } from './stores/reminders.store.svelte';

// Accès aux données
export { idbRepositories } from './data/repositories';
export * from './data/backup';

// Composants UI réutilisables
export { TabBar } from './components';
