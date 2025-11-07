/**
 * Conteo.online Analytics Tracker
 * Lightweight tracking script for SPAs (Next.js, React, etc.)
 * Usage: <script src="https://your-app.vercel.app/tracker.js" data-api-key="YOUR_API_KEY"></script>
 */

(function () {
  'use strict';

  // Get API key from script tag
  const script = document.currentScript;
  const apiKey = script?.getAttribute('data-api-key');

  // Auto-detect endpoint from script src
  let endpoint = script?.getAttribute('data-endpoint');
  if (!endpoint && script?.src) {
    // Extract base URL from script src (e.g., https://conteo.vercel.app/tracker.js -> https://conteo.vercel.app)
    const scriptUrl = new URL(script.src);
    endpoint = `${scriptUrl.origin}/api/track`;
  }

  // Fallback
  if (!endpoint) {
    endpoint = 'https://conteo.online/api/track';
  }

  if (!apiKey) {
    console.error('[Conteo] Missing data-api-key attribute');
    return;
  }

  // Extract UTM parameters from URL
  function getUTMParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source') || null,
      utm_medium: params.get('utm_medium') || null,
      utm_campaign: params.get('utm_campaign') || null,
      utm_content: params.get('utm_content') || null,
      utm_term: params.get('utm_term') || null,
    };
  }

  // Track pageview
  function trackPageview() {
    const utmParams = getUTMParams();

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
      // UTM parameters
      ...utmParams,
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

  // ============================================
  // COD TRACKING - Pixel Interceptor
  // Intercepts Facebook & TikTok pixel events
  // ============================================

  // Get COD tracking endpoint
  const codEndpoint = endpoint.replace('/api/track', '/api/track-cod');

  // Track product page views
  let lastProductPage = null;
  if (window.location.pathname.includes('/products/')) {
    lastProductPage = window.location.pathname;
    sessionStorage.setItem('conteo_last_product', lastProductPage);
  }

  // Helper: Send COD event
  function sendCODEvent(eventType, data = {}) {
    const payload = {
      api_key: apiKey,
      visitor_id: getVisitorId(),
      event_type: eventType,
      source: getTrafficSource(),
      ...data
    };

    fetch(codEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(() => {});
  }

  // Helper: Get visitor ID (consistent hash)
  function getVisitorId() {
    let vid = sessionStorage.getItem('conteo_visitor_id');
    if (!vid) {
      vid = 'v_' + Math.random().toString(36).substr(2, 9) + Date.now();
      sessionStorage.setItem('conteo_visitor_id', vid);
    }
    return vid;
  }

  // Helper: Get traffic source
  function getTrafficSource() {
    const ref = document.referrer.toLowerCase();
    if (!ref || ref.includes(window.location.hostname)) return 'Direct';
    if (ref.includes('facebook.com') || ref.includes('fb.com')) return 'Facebook';
    if (ref.includes('tiktok.com')) return 'TikTok';
    if (ref.includes('google.')) return 'Google';
    if (ref.includes('twitter.com') || ref.includes('t.co')) return 'Twitter';
    if (ref.includes('instagram.com')) return 'Instagram';
    return 'Other';
  }

  // Intercept Facebook Pixel (fbq)
  if (typeof window.fbq !== 'undefined') {
    const originalFbq = window.fbq;
    window.fbq = function() {
      const action = arguments[0];
      const event = arguments[1];
      const data = arguments[2] || {};

      // Capture product name from AddToCart event (contains product details)
      if (action === 'track' && event === 'AddToCart') {
        if (data.content_name) {
          sessionStorage.setItem('conteo_last_product_name', data.content_name);
        }
        if (data.content_ids && data.content_ids[0]) {
          sessionStorage.setItem('conteo_last_product_id', data.content_ids[0]);
        }
      }

      // Track InitiateCheckout
      if (action === 'track' && event === 'InitiateCheckout') {
        const productPage = sessionStorage.getItem('conteo_last_product') || '';
        const productName = data.content_name || sessionStorage.getItem('conteo_last_product_name') || 'Unknown';
        const productId = data.content_ids?.[0] || sessionStorage.getItem('conteo_last_product_id') || '';

        sendCODEvent('initiate_checkout', {
          product_name: productName,
          product_id: productId,
          product_page: productPage,
          value: data.value || 0,
          currency: data.currency || 'EUR'
        });
      }

      // Track Purchase
      if (action === 'track' && event === 'Purchase') {
        const productPage = sessionStorage.getItem('conteo_last_product') || '';
        const productName = data.content_name || sessionStorage.getItem('conteo_last_product_name') || 'Unknown';
        const productId = data.content_ids?.[0] || sessionStorage.getItem('conteo_last_product_id') || '';

        sendCODEvent('purchase', {
          product_name: productName,
          product_id: productId,
          product_page: productPage,
          value: data.value || 0,
          currency: data.currency || 'EUR'
        });
      }

      // Call original fbq
      return originalFbq.apply(this, arguments);
    };

    // Copy properties from original function
    Object.keys(originalFbq).forEach(key => {
      window.fbq[key] = originalFbq[key];
    });
  } else {
    // If fbq doesn't exist yet, wrap it when it loads
    const fbqQueue = window.fbq || function() {
      fbqQueue.callMethod ? fbqQueue.callMethod.apply(fbqQueue, arguments) : fbqQueue.queue.push(arguments);
    };
    fbqQueue.queue = fbqQueue.queue || [];
    window.fbq = fbqQueue;

    // Check periodically if Facebook Pixel loaded
    const checkFbq = setInterval(function() {
      if (typeof window.fbq === 'function' && window.fbq.version) {
        clearInterval(checkFbq);
        // Reapply wrapper
        const originalFbq = window.fbq;
        window.fbq = function() {
          const action = arguments[0];
          const event = arguments[1];
          const data = arguments[2] || {};

          // Capture product name from AddToCart
          if (action === 'track' && event === 'AddToCart') {
            if (data.content_name) {
              sessionStorage.setItem('conteo_last_product_name', data.content_name);
            }
            if (data.content_ids && data.content_ids[0]) {
              sessionStorage.setItem('conteo_last_product_id', data.content_ids[0]);
            }
          }

          if (action === 'track' && event === 'InitiateCheckout') {
            const productPage = sessionStorage.getItem('conteo_last_product') || '';
            const productName = data.content_name || sessionStorage.getItem('conteo_last_product_name') || 'Unknown';
            const productId = data.content_ids?.[0] || sessionStorage.getItem('conteo_last_product_id') || '';

            sendCODEvent('initiate_checkout', {
              product_name: productName,
              product_id: productId,
              product_page: productPage,
              value: data.value || 0,
              currency: data.currency || 'EUR'
            });
          }

          if (action === 'track' && event === 'Purchase') {
            const productPage = sessionStorage.getItem('conteo_last_product') || '';
            const productName = data.content_name || sessionStorage.getItem('conteo_last_product_name') || 'Unknown';
            const productId = data.content_ids?.[0] || sessionStorage.getItem('conteo_last_product_id') || '';

            sendCODEvent('purchase', {
              product_name: productName,
              product_id: productId,
              product_page: productPage,
              value: data.value || 0,
              currency: data.currency || 'EUR'
            });
          }

          return originalFbq.apply(this, arguments);
        };

        Object.keys(originalFbq).forEach(key => {
          window.fbq[key] = originalFbq[key];
        });
      }
    }, 100);

    // Stop checking after 10 seconds
    setTimeout(() => clearInterval(checkFbq), 10000);
  }

  // Intercept TikTok Pixel (ttq.track)
  if (typeof window.ttq !== 'undefined' && typeof window.ttq.track === 'function') {
    const originalTtq = window.ttq.track;
    window.ttq.track = function() {
      const event = arguments[0];
      const data = arguments[1] || {};

      // Capture product name from AddToCart
      if (event === 'AddToCart') {
        if (data.content_name) {
          sessionStorage.setItem('conteo_last_product_name', data.content_name);
        }
        if (data.content_id) {
          sessionStorage.setItem('conteo_last_product_id', data.content_id);
        }
      }

      // Track CompletePayment
      if (event === 'CompletePayment') {
        const productPage = sessionStorage.getItem('conteo_last_product') || '';
        const productName = data.content_name || sessionStorage.getItem('conteo_last_product_name') || 'Unknown';
        const productId = data.content_id || sessionStorage.getItem('conteo_last_product_id') || '';

        sendCODEvent('purchase', {
          product_name: productName,
          product_id: productId,
          product_page: productPage,
          value: data.value || 0,
          currency: data.currency || 'EUR'
        });
      }

      // Track InitiateCheckout
      if (event === 'InitiateCheckout') {
        const productPage = sessionStorage.getItem('conteo_last_product') || '';
        const productName = data.content_name || sessionStorage.getItem('conteo_last_product_name') || 'Unknown';
        const productId = data.content_id || sessionStorage.getItem('conteo_last_product_id') || '';

        sendCODEvent('initiate_checkout', {
          product_name: productName,
          product_id: productId,
          product_page: productPage,
          value: data.value || 0,
          currency: data.currency || 'EUR'
        });
      }

      // Call original ttq.track
      return originalTtq.apply(this, arguments);
    };
  }

  console.log('[Conteo] Analytics initialized');
})();
