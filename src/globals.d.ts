// Set by vite.config.ts at build time: 'production' for the live site (the
// main branch on Cloudflare), 'preview' for every other build.
declare const __DEPLOY__: 'production' | 'preview';

interface ImportMetaEnv {
  // Google Analytics measurement id (G-XXXXXXX), set in the Cloudflare build.
  readonly VITE_GA_ID?: string;
}

interface Window {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
}
