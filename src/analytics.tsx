// Google Analytics (GA4): one page view per screen (hash route). Off with
// npm run dev and when VITE_GA_ID is not set. Builds that are not the live
// site (Cloudflare previews, local builds) send debug traffic, which GA shows
// in DebugView and can filter out of reports.
// Only the route pattern is sent, never what the user typed or stored.
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GA_ID = import.meta.env.DEV ? undefined : import.meta.env.VITE_GA_ID || undefined;

let started = false;
function start(id: string) {
  if (started) return;
  started = true;
  window.dataLayer = window.dataLayer || [];
  // gtag.js reads the `arguments` object itself, not an array.
  window.gtag = function gtag() { window.dataLayer!.push(arguments); };
  window.gtag('js', new Date());
  // Page views are sent below, on each route change.
  window.gtag('config', id, { send_page_view: false, ...(__DEPLOY__ !== 'production' && { debug_mode: true }) });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(script);
}

// Inside the router. `route` turns the current path into what is reported.
export function PageViews({ route = (path) => path }: { route?: (path: string) => string }) {
  const { pathname } = useLocation();
  const page = route(pathname);
  useEffect(() => {
    if (!GA_ID) return;
    // A moment later, so a page that redirects at once (/ to /korean) is not counted.
    const timer = setTimeout(() => {
      start(GA_ID);
      const location = `${window.location.origin}${import.meta.env.BASE_URL}#${page}`;
      window.gtag!('set', { page_location: location, page_path: page, page_title: document.title });
      window.gtag!('event', 'page_view');
    }, 300);
    return () => clearTimeout(timer);
  }, [page]);
  return null;
}
