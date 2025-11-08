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

    // Send via fetch with keepalive (more reliable than sendBeacon for JSON)
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: true,
    }).catch((err) => {
      console.error('[Conteo] Failed to track pageview:', err);
      // Fail silently - analytics shouldn't break the site
    });
  }

  // Track initial pageview
  trackPageview();

  // Track SPA navigation (pushState/replaceState)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function () {
    originalPushState.apply(this, arguments);
    trackPageview();
    checkProductPage();
  };

  history.replaceState = function () {
    originalReplaceState.apply(this, arguments);
    trackPageview();
    checkProductPage();
  };

  // Track popstate (back/forward buttons)
  window.addEventListener('popstate', () => {
    trackPageview();
    checkProductPage();
  });

  // Track hash changes (for hash-based routing)
  window.addEventListener('hashchange', trackPageview);

  // Helper: Check if we're on a product page after navigation
  function checkProductPage() {
    if (window.location.pathname.includes('/products/')) {
      sessionStorage.setItem('conteo_last_product', window.location.pathname);
      setTimeout(() => extractShopifyProductInfo(), 500);
    }
  }

  // ============================================
  // COD TRACKING - Pixel Interceptor
  // Intercepts Facebook & TikTok pixel events
  // ============================================

  // Get COD tracking endpoint
  const codEndpoint = endpoint.replace('/api/track', '/api/track-cod');

  // Track product page views and extract product info from Shopify page
  let lastProductPage = null;
  if (window.location.pathname.includes('/products/')) {
    lastProductPage = window.location.pathname;
    sessionStorage.setItem('conteo_last_product', lastProductPage);

    // Try to extract product info from Shopify's meta tags or JSON
    setTimeout(() => {
      extractShopifyProductInfo();
    }, 500); // Wait for page to load
  }

  // Helper: Extract product info from Shopify page
  function extractShopifyProductInfo() {
    try {
      // Method 1: Try to get from Shopify's product JSON (most reliable)
      if (typeof ShopifyAnalytics !== 'undefined' && ShopifyAnalytics.meta) {
        const product = ShopifyAnalytics.meta.product;
        if (product) {
          sessionStorage.setItem('conteo_last_product_name', product.title || product.name);
          sessionStorage.setItem('conteo_last_product_id', String(product.id || product.variants?.[0]?.id || ''));
          return;
        }
      }

      // Method 2: Try meta.product from meta object
      if (typeof meta !== 'undefined' && meta.product) {
        const product = meta.product;
        sessionStorage.setItem('conteo_last_product_name', product.title || product.name);
        sessionStorage.setItem('conteo_last_product_id', String(product.id || product.variants?.[0]?.id || ''));
        return;
      }

      // Method 3: Look for product JSON in script tags
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent);
          if (data['@type'] === 'Product') {
            sessionStorage.setItem('conteo_last_product_name', data.name);
            if (data.sku) {
              sessionStorage.setItem('conteo_last_product_id', data.sku);
            }
            return;
          }
        } catch (e) {}
      }

      // Method 4: Try to find product form with product ID
      const productForm = document.querySelector('form[action*="/cart/add"]');
      if (productForm) {
        const productIdInput = productForm.querySelector('input[name="id"], select[name="id"]');
        const productTitleEl = document.querySelector('h1.product-title, h1.product__title, .product-single__title, [itemProp="name"]');

        if (productIdInput && productIdInput.value) {
          sessionStorage.setItem('conteo_last_product_id', productIdInput.value);
        }

        if (productTitleEl && productTitleEl.textContent) {
          sessionStorage.setItem('conteo_last_product_name', productTitleEl.textContent.trim());
        }
      }
    } catch (e) {
      // Fail silently
    }
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

      // trackShopify has different format: ['trackShopify', pixelId, eventName, data]
      // track has format: ['track', eventName, data]
      let event, data;
      if (action === 'trackShopify') {
        event = arguments[2]; // eventName is 3rd argument
        data = arguments[3] || {}; // data is 4th argument
      } else {
        event = arguments[1]; // eventName is 2nd argument
        data = arguments[2] || {}; // data is 3rd argument
      }

      // Capture product name from AddToCart event (save for later Purchase tracking)
      if (action === 'track' && event === 'AddToCart') {
        if (data.content_name) {
          sessionStorage.setItem('conteo_last_product_name', data.content_name);
        }
        if (data.content_ids && data.content_ids[0]) {
          sessionStorage.setItem('conteo_last_product_id', data.content_ids[0]);
        }
      }

      // Handle Shopify trackShopify AddToCart
      if (action === 'trackShopify' && event === 'AddToCart') {
        if (data.content_name) {
          sessionStorage.setItem('conteo_last_product_name', data.content_name);
        }
        if (data.content_ids && data.content_ids[0]) {
          sessionStorage.setItem('conteo_last_product_id', data.content_ids[0]);
        }
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

          // trackShopify has different format: ['trackShopify', pixelId, eventName, data]
          // track has format: ['track', eventName, data]
          let event, data;
          if (action === 'trackShopify') {
            event = arguments[2]; // eventName is 3rd argument
            data = arguments[3] || {}; // data is 4th argument
          } else {
            event = arguments[1]; // eventName is 2nd argument
            data = arguments[2] || {}; // data is 3rd argument
          }

          // Capture product name from AddToCart
          if (action === 'track' && event === 'AddToCart') {
            if (data.content_name) {
              sessionStorage.setItem('conteo_last_product_name', data.content_name);
            }
            if (data.content_ids && data.content_ids[0]) {
              sessionStorage.setItem('conteo_last_product_id', data.content_ids[0]);
            }
          }

          // Handle Shopify trackShopify AddToCart
          if (action === 'trackShopify' && event === 'AddToCart') {
            if (data.content_name) {
              sessionStorage.setItem('conteo_last_product_name', data.content_name);
            }
            if (data.content_ids && data.content_ids[0]) {
              sessionStorage.setItem('conteo_last_product_id', data.content_ids[0]);
            }
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

      // Track CompletePayment (TikTok's purchase event)
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

      // Call original ttq.track
      return originalTtq.apply(this, arguments);
    };
  }

  // ============================================
  // CUSTOM EVENTS API
  // Expose trackEvent function globally
  // ============================================

  // Get custom events endpoint
  const eventsEndpoint = endpoint.replace('/api/track', '/api/track-event');

  // Expose global API
  window.conteo = window.conteo || {};
  window.conteo.trackEvent = function(eventName, options) {
    if (!eventName || typeof eventName !== 'string') {
      console.error('[Conteo] trackEvent requires an event name');
      return;
    }

    const payload = {
      api_key: apiKey,
      visitor_id: getVisitorId(),
      session_id: sessionStorage.getItem('conteo_session_id'),
      event_name: eventName,
      properties: (options && options.props) || {},
      path: window.location.pathname,
      referrer: document.referrer || null,
      source: getTrafficSource(),
      device: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
      browser: (function() {
        const ua = navigator.userAgent;
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Safari')) return 'Safari';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Edge')) return 'Edge';
        return 'Other';
      })(),
      country: null // Will be detected server-side if needed
    };

    fetch(eventsEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch((err) => {
      console.error('[Conteo] Failed to track event:', err);
    });
  };

  console.log('[Conteo] Analytics initialized');
})();
