/**
 * Barrel des composants UI réutilisables (`$lib/components`).
 *
 * Y placer les composants partagés entre plusieurs routes (coquille de navigation,
 * champs de formulaire, cellules de tableau, etc.). Les composants spécifiques à une
 * seule route restent colocalisés dans le dossier de cette route. Voir CONVENTIONS.md.
 */
export { default as TabBar } from './TabBar.svelte';
export { default as TaskItem } from './TaskItem.svelte';
export { default as SwipeToDelete } from './SwipeToDelete.svelte';
export { default as ConfirmDialog } from './ConfirmDialog.svelte';
export { default as HabitForm } from './HabitForm.svelte';
export { default as TaskForm } from './TaskForm.svelte';
export { default as CardColorPicker } from './CardColorPicker.svelte';
