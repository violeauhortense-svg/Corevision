// Backend API Configuration
// Using ngrok tunnel (public HTTPS URL to local backend)

export const apiBaseUrl = 'https://impromptu-unguided-equivocal.ngrok-free.dev';

export const projectId = "self-hosted"
export const publicAnonKey = "local-auth"

// ngrok free tier shows an interstitial warning page unless this header is
// present, which breaks every fetch() call made to apiBaseUrl. Patch fetch
// once, globally, so every existing call site is covered automatically.
if (typeof window !== 'undefined' && !(window as any).__ngrokFetchPatched) {
  (window as any).__ngrokFetchPatched = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url.includes('ngrok-free.dev') || url.includes('ngrok.io') || url.includes('ngrok.app')) {
      const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
      headers.set('ngrok-skip-browser-warning', 'true');
      return originalFetch(input, { ...init, headers });
    }
    return originalFetch(input, init);
  };
}

