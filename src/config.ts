/**
 * Pre-launch lock. While true, only the homepage is reachable and every other
 * URL shows a “Coming soon” page. Nothing else is removed.
 *
 * To open the full site, set VITE_SITE_LOCKED=false in the environment
 * (or change the default below) and rebuild.
 */
export const SITE_LOCKED = (import.meta.env.VITE_SITE_LOCKED ?? 'true') !== 'false';
