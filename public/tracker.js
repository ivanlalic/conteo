/**
 * Conteo.online Analytics Tracker
 * Lightweight tracking script for SPAs (Next.js, React, etc.)
 * Usage: <script src="https://conteo.online/tracker.js" data-api-key="YOUR_API_KEY"></script>
 */

(function () {
  'use strict';

  // Get API key from script tag
  const script = document.currentScript;
  const apiKey = script?.getAttribute('data-api-key');
  const endpoint = script?.getAttribute('data-endpoint') || 'https://conteo.online/api/track';

  if (!apiKey) {
    console.error('[Conteo] Missing data-api-key attribute');
    return;
  }

  // Track pageview
  function trackPageview() {
    const data = {
      api_key: apiKey,
      path: window.location.pathname,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      // Screen size (optional)
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      // Timestamp
      timestamp: new Date().toISOString(),
    };

    // Send via fetch with keepalive (works even when navigating away)
    if (navigator.sendBeacon) {
      // Preferred: sendBeacon (doesn't block navigation)
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      navigator.sendBeacon(endpoint, blob);
    } else {
      // Fallback: fetch with keepalive
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true,
      }).catch(() => {
        // Fail silently - analytics shouldn't break the site
      });
    }
  }

  // Track initial pageview
  trackPageview();

  // Track SPA navigation (pushState/replaceState)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function () {
    originalPushState.apply(this, arguments);
    trackPageview();
  };

  history.replaceState = function () {
    originalReplaceState.apply(this, arguments);
    trackPageview();
  };

  // Track popstate (back/forward buttons)
  window.addEventListener('popstate', trackPageview);

  // Track hash changes (for hash-based routing)
  window.addEventListener('hashchange', trackPageview);

  console.log('[Conteo] Analytics initialized');
})();
