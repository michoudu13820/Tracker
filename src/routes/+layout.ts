/**
 * App 100% client (SPA offline-first) : pas de rendu serveur, tout est pré-rendu
 * en app shell statique puis hydraté. Cohérent avec adapter-static + fallback.
 */
export const ssr = false;
export const prerender = true;
