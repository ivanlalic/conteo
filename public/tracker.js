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
          const productName = product.title || product.name;
          const productId = product.id || product.variants?.[0]?.id;
          if (productName) sessionStorage.setItem('conteo_last_product_name', productName);
          if (productId) sessionStorage.setItem('conteo_last_product_id', String(productId));
          return;
        }
      }

      // Method 2: Try meta.product from meta object
      if (typeof meta !== 'undefined' && meta.product) {
        const product = meta.product;
        const productName = product.title || product.name;
        const productId = product.id || product.variants?.[0]?.id;
        if (productName) sessionStorage.setItem('conteo_last_product_name', productName);
        if (productId) sessionStorage.setItem('conteo_last_product_id', String(productId));
        return;
      }

      // Method 3: Look for product JSON in script tags
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent);
          if (data['@type'] === 'Product') {
            if (data.name) sessionStorage.setItem('conteo_last_product_name', data.name);
            if (data.sku) sessionStorage.setItem('conteo_last_product_id', data.sku);
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
          const title = productTitleEl.textContent.trim();
          if (title) sessionStorage.setItem('conteo_last_product_name', title);
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
        if (data.content_name && data.content_name !== 'undefined') {
          sessionStorage.setItem('conteo_last_product_name', data.content_name);
        }
        if (data.content_ids && data.content_ids[0] && data.content_ids[0] !== 'undefined') {
          sessionStorage.setItem('conteo_last_product_id', String(data.content_ids[0]));
        }
      }

      // Handle Shopify trackShopify AddToCart
      if (action === 'trackShopify' && event === 'AddToCart') {
        if (data.content_name && data.content_name !== 'undefined') {
          sessionStorage.setItem('conteo_last_product_name', data.content_name);
        }
        if (data.content_ids && data.content_ids[0] && data.content_ids[0] !== 'undefined') {
          sessionStorage.setItem('conteo_last_product_id', String(data.content_ids[0]));
        }
      }

      // Track Purchase
      if (action === 'track' && event === 'Purchase') {
        const productPage = sessionStorage.getItem('conteo_last_product') || '';
        let productName = data.content_name || sessionStorage.getItem('conteo_last_product_name');
        let productId = data.content_ids?.[0] || sessionStorage.getItem('conteo_last_product_id');

        // Don't send if productName is still undefined or the string "undefined"
        if (!productName || productName === 'undefined') {
          productName = 'Unknown Product';
        }
        if (!productId || productId === 'undefined') {
          productId = '';
        }

        sendCODEvent('purchase', {
          product_name: productName,
          product_id: String(productId),
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
            if (data.content_name && data.content_name !== 'undefined') {
              sessionStorage.setItem('conteo_last_product_name', data.content_name);
            }
            if (data.content_ids && data.content_ids[0] && data.content_ids[0] !== 'undefined') {
              sessionStorage.setItem('conteo_last_product_id', String(data.content_ids[0]));
            }
          }

          // Handle Shopify trackShopify AddToCart
          if (action === 'trackShopify' && event === 'AddToCart') {
            if (data.content_name && data.content_name !== 'undefined') {
              sessionStorage.setItem('conteo_last_product_name', data.content_name);
            }
            if (data.content_ids && data.content_ids[0] && data.content_ids[0] !== 'undefined') {
              sessionStorage.setItem('conteo_last_product_id', String(data.content_ids[0]));
            }
          }

          if (action === 'track' && event === 'Purchase') {
            const productPage = sessionStorage.getItem('conteo_last_product') || '';
            let productName = data.content_name || sessionStorage.getItem('conteo_last_product_name');
            let productId = data.content_ids?.[0] || sessionStorage.getItem('conteo_last_product_id');

            // Don't send if productName is still undefined or the string "undefined"
            if (!productName || productName === 'undefined') {
              productName = 'Unknown Product';
            }
            if (!productId || productId === 'undefined') {
              productId = '';
            }

            sendCODEvent('purchase', {
              product_name: productName,
              product_id: String(productId),
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
        if (data.content_name && data.content_name !== 'undefined') {
          sessionStorage.setItem('conteo_last_product_name', data.content_name);
        }
        if (data.content_id && data.content_id !== 'undefined') {
          sessionStorage.setItem('conteo_last_product_id', String(data.content_id));
        }
      }

      // Track CompletePayment (TikTok's purchase event)
      if (event === 'CompletePayment') {
        const productPage = sessionStorage.getItem('conteo_last_product') || '';
        let productName = data.content_name || sessionStorage.getItem('conteo_last_product_name');
        let productId = data.content_id || sessionStorage.getItem('conteo_last_product_id');

        // Don't send if productName is still undefined or the string "undefined"
        if (!productName || productName === 'undefined') {
          productName = 'Unknown Product';
        }
        if (!productId || productId === 'undefined') {
          productId = '';
        }

        sendCODEvent('purchase', {
          product_name: productName,
          product_id: String(productId),
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
  // UX BEHAVIOR DETECTION
  // Detects rage clicks, dead clicks, excessive
  // scrolling, and quick backs
  // ============================================

  // Skip behavior tracking if Do Not Track is enabled
  if (navigator.doNotTrack !== '1') {
    (function initBehaviorTracking() {
      var behaviorEndpoint = endpoint.replace('/api/track', '/api/track-behavior');
      var behaviorQueue = [];
      var sessionId = (function() {
        var sid = sessionStorage.getItem('conteo_session_id');
        if (!sid) {
          sid = 's_' + Math.random().toString(36).substr(2, 9) + Date.now();
          sessionStorage.setItem('conteo_session_id', sid);
        }
        return sid;
      })();

      function getDeviceType() {
        var ua = navigator.userAgent;
        if (/Tablet|iPad/i.test(ua)) return 'tablet';
        if (/Mobile|Android|iPhone/i.test(ua)) return 'mobile';
        return 'desktop';
      }

      function getSelector(el) {
        if (!el || el === document.body || el === document.documentElement) return 'body';
        var parts = [];
        var current = el;
        var depth = 0;
        while (current && current !== document.body && depth < 5) {
          var tag = current.tagName.toLowerCase();
          if (current.id) {
            parts.unshift('#' + current.id);
            break;
          }
          var parent = current.parentElement;
          if (parent) {
            var siblings = parent.children;
            var index = 0;
            for (var i = 0; i < siblings.length; i++) {
              if (siblings[i] === current) { index = i + 1; break; }
            }
            parts.unshift(tag + ':nth-child(' + index + ')');
          } else {
            parts.unshift(tag);
          }
          current = parent;
          depth++;
        }
        return parts.join(' > ');
      }

      function getElementText(el) {
        var text = (el.textContent || el.innerText || '').trim();
        return text.substring(0, 50);
      }

      function queueEvent(eventType, pageUrl, eventData) {
        behaviorQueue.push({
          event_type: eventType,
          visitor_id: getVisitorId(),
          session_id: sessionId,
          page_url: pageUrl,
          event_data: eventData,
          device_type: getDeviceType()
        });
      }

      function flushQueue() {
        if (behaviorQueue.length === 0) return;
        var payload = {
          api_key: apiKey,
          events: behaviorQueue.splice(0)
        };
        // Prefer sendBeacon for reliability on page unload
        if (navigator.sendBeacon) {
          navigator.sendBeacon(behaviorEndpoint, JSON.stringify(payload));
        } else {
          fetch(behaviorEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true
          }).catch(function() {});
        }
      }

      // Flush every 30 seconds if there are events
      setInterval(flushQueue, 30000);

      // Flush on page hide and unload
      document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden') flushQueue();
      });
      window.addEventListener('beforeunload', flushQueue);

      // ---- CLICK TRACKING (dead clicks + rage clicks) ----

      var recentClicks = []; // { x, y, time }
      var INTERACTIVE_TAGS = { INPUT: 1, TEXTAREA: 1, SELECT: 1, OPTION: 1, VIDEO: 1, AUDIO: 1 };

      document.addEventListener('click', function(e) {
        var el = e.target;
        if (!el || !el.tagName) return;

        // Skip interactive elements that don't produce visible DOM changes
        if (INTERACTIVE_TAGS[el.tagName] || el.isContentEditable) return;

        var now = Date.now();
        var x = e.clientX;
        var y = e.clientY;
        var url = window.location.pathname;
        var selector = getSelector(el);
        var tag = el.tagName.toLowerCase();
        var text = getElementText(el);

        // --- Rage click detection ---
        recentClicks.push({ x: x, y: y, time: now });
        // Remove clicks older than 2 seconds
        recentClicks = recentClicks.filter(function(c) { return now - c.time <= 2000; });
        // Check if 3+ clicks in 30x30 px area
        var nearbyCount = 0;
        for (var i = 0; i < recentClicks.length; i++) {
          var c = recentClicks[i];
          if (Math.abs(c.x - x) <= 30 && Math.abs(c.y - y) <= 30) {
            nearbyCount++;
          }
        }
        if (nearbyCount >= 3) {
          queueEvent('rage_click', url, {
            element_selector: selector,
            element_text: text,
            element_tag: tag,
            click_count: nearbyCount,
            x: x, y: y,
            viewport_width: window.innerWidth,
            viewport_height: window.innerHeight
          });
          recentClicks = []; // Reset after detecting rage click
          return; // Don't also detect as dead click
        }

        // --- Dead click detection ---
        var clickUrl = window.location.href;
        var mutationDetected = false;
        var observer = new MutationObserver(function() {
          mutationDetected = true;
        });
        observer.observe(document.body, {
          childList: true, attributes: true, characterData: true, subtree: true
        });

        setTimeout(function() {
          observer.disconnect();
          // Check if URL changed (navigation occurred)
          var urlChanged = window.location.href !== clickUrl;
          if (!mutationDetected && !urlChanged) {
            queueEvent('dead_click', url, {
              element_selector: selector,
              element_text: text,
              element_tag: tag,
              x: x, y: y,
              viewport_width: window.innerWidth,
              viewport_height: window.innerHeight
            });
          }
        }, 1000);
      }, true); // Use capture phase

      // ---- SCROLL TRACKING (excessive scrolling) ----

      var scrollState = {
        lastScrollY: 0,
        directionChanges: 0,
        lastDirection: 0, // 1 = down, -1 = up
        maxDepth: 0,
        startTime: Date.now()
      };
      var scrollThrottleTimer = null;

      window.addEventListener('scroll', function() {
        if (scrollThrottleTimer) return;
        scrollThrottleTimer = setTimeout(function() {
          scrollThrottleTimer = null;
          var scrollY = window.scrollY || window.pageYOffset;
          var docHeight = Math.max(
            document.body.scrollHeight, document.documentElement.scrollHeight
          );
          var viewportHeight = window.innerHeight;
          var contentHeight = docHeight - viewportHeight;

          if (contentHeight > 0) {
            var depth = (scrollY / contentHeight) * 100;
            if (depth > scrollState.maxDepth) scrollState.maxDepth = depth;
          }

          // Track direction changes
          var direction = scrollY > scrollState.lastScrollY ? 1 : -1;
          if (scrollState.lastDirection !== 0 && direction !== scrollState.lastDirection) {
            scrollState.directionChanges++;
          }
          scrollState.lastDirection = direction;
          scrollState.lastScrollY = scrollY;
        }, 200);
      });

      // Check for excessive scrolling on page hide
      function checkExcessiveScroll() {
        var docHeight = Math.max(
          document.body.scrollHeight, document.documentElement.scrollHeight
        );
        var viewportHeight = window.innerHeight;
        var isLongPage = docHeight > viewportHeight * 3;
        var deepScroll = scrollState.maxDepth > 90 && isLongPage;
        var manyDirectionChanges = scrollState.directionChanges > 5;

        if (deepScroll || manyDirectionChanges) {
          var elapsed = Math.round((Date.now() - scrollState.startTime) / 1000);
          queueEvent('excessive_scroll', window.location.pathname, {
            page_height: docHeight,
            viewport_height: viewportHeight,
            max_scroll_depth_percent: Math.round(scrollState.maxDepth),
            scroll_direction_changes: scrollState.directionChanges,
            time_on_page_seconds: elapsed
          });
        }
      }

      document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden') checkExcessiveScroll();
      });

      // ---- QUICK BACK DETECTION ----

      var navHistory = []; // { url, time }
      navHistory.push({ url: window.location.pathname, time: Date.now() });

      function checkQuickBack(newUrl) {
        var now = Date.now();
        if (navHistory.length >= 2) {
          var prev = navHistory[navHistory.length - 2];
          var current = navHistory[navHistory.length - 1];
          // User went from prev -> current, now going to newUrl
          // Quick back = newUrl === prev.url and dwell_time < 5s
          if (newUrl === prev.url && (now - current.time) < 5000) {
            queueEvent('quick_back', current.url, {
              page_from: prev.url,
              page_to: current.url,
              dwell_time_ms: now - current.time,
              navigation_method: 'unknown'
            });
          }
        }
        navHistory.push({ url: newUrl, time: now });
        // Keep history small
        if (navHistory.length > 10) navHistory.shift();

        // Reset scroll state for new page
        scrollState = {
          lastScrollY: 0,
          directionChanges: 0,
          lastDirection: 0,
          maxDepth: 0,
          startTime: Date.now()
        };
      }

      // Hook into existing navigation overrides
      var _origPush = history.pushState;
      history.pushState = function() {
        _origPush.apply(this, arguments);
        checkQuickBack(window.location.pathname);
      };
      var _origReplace = history.replaceState;
      history.replaceState = function() {
        _origReplace.apply(this, arguments);
        checkQuickBack(window.location.pathname);
      };
      window.addEventListener('popstate', function() {
        checkQuickBack(window.location.pathname);
      });
    })();
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
