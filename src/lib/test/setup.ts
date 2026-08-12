/**
 * Setup global Vitest : enregistre les matchers jest-dom (toHaveTextContent, toBeChecked, …)
 * utilisés par les tests de composants (@testing-library/svelte). Chargé automatiquement
 * via `test.setupFiles` (vite.config.ts) pour tous les fichiers de test.
 */
import '@testing-library/jest-dom/vitest';
