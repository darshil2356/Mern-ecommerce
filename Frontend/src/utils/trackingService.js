import io from 'socket.io-client';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class TrackingService {
  constructor() {
    this.socket = null;
    this.sessionId = null;
    this.guestId = null;
    this.userId = null;
    this.heartbeatInterval = null;
    this.currentPage = window.location.pathname;
    this.isInitialized = false;
  }

  // Initialize tracking — connects socket (always), starts tracking if enabled
  async init(userId = null) {
    this.userId = userId;

    // Always connect socket so we can listen for config changes
    if (!this.socket) this.connectSocket();

    try {
      const configRes = await axios.get(`${API_BASE_URL}/tracking/config`);
      if (configRes.data.config?.isEnabled) {
        await this.start(userId);
      }
    } catch (error) {
      console.error('Failed to initialize tracking:', error);
    }
  }

  // Start all tracking
  async start(userId = null) {
    if (this.isInitialized) return;
    try {
      const sessionData = await this.createSession(userId);
      this.sessionId = sessionData.session.sessionId;
      this.guestId = sessionData.session.guestId;
      this.userId = userId;

      if (this.socket) {
        if (this.userId) this.socket.emit('join-user', this.userId);
        this.socket.emit('join-session', this.sessionId);
      }

      this.startHeartbeat();
      this.trackEvent('page_view', { page: this.currentPage, referrer: document.referrer });
      this.isInitialized = true;
      this.trackPageChanges();
      this.trackInteractions();
    } catch (error) {
      console.error('Failed to start tracking:', error);
    }
  }

  // Stop all tracking (keep socket alive to listen for re-enable)
  stop() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.sessionId = null;
    this.guestId = null;
    this.isInitialized = false;
  }

  // Create or update session
  async createSession(userId) {
    const device = this.getDeviceType();
    const location = await this.getLocation();

    const response = await axios.post(`${API_BASE_URL}/tracking/session`, {
      userId,
      sessionId: this.sessionId, // Will be null for new sessions
      ipAddress: await this.getIPAddress(),
      userAgent: navigator.userAgent,
      device,
      location,
      currentPage: this.currentPage,
    });

    return response.data;
  }

  // Connect to Socket.io
  connectSocket() {
    this.socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:8000');

    this.socket.on('connect', () => {
      if (this.userId) this.socket.emit('join-user', this.userId);
      this.socket.emit('join-session', this.sessionId);
    });

    // Listen for admin toggle — start or stop tracking in real-time
    this.socket.on('tracking_config_changed', ({ isEnabled }) => {
      if (isEnabled) {
        this.start(this.userId);
      } else {
        this.stop();
      }
    });
  }

  // Start heartbeat
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('heartbeat', {
          sessionId: this.sessionId,
          currentPage: this.currentPage,
        });
      }
    }, 15000); // 15 seconds
  }

  // Track page changes
  trackPageChanges() {
    let currentPath = window.location.pathname;

    const trackPageView = () => {
      const newPath = window.location.pathname;
      if (newPath !== currentPath) {
        currentPath = newPath;
        this.currentPage = newPath;
        this.trackEvent('page_view', {
          page: newPath,
          referrer: document.referrer,
        });
      }
    };

    // Listen for navigation events
    window.addEventListener('popstate', trackPageView);

    // For SPA navigation (if using React Router)
    const browserHistory = window.history;
    const originalPushState = browserHistory.pushState;
    browserHistory.pushState = function(...args) {
      originalPushState.apply(browserHistory, args);
      setTimeout(trackPageView, 0);
    };

    const originalReplaceState = browserHistory.replaceState;
    browserHistory.replaceState = function(...args) {
      originalReplaceState.apply(browserHistory, args);
      setTimeout(trackPageView, 0);
    };
  }

  // Track user interactions
  trackInteractions() {
    let clickCount = 0;
    let lastClickTime = 0;

    // Track clicks
    document.addEventListener('click', (e) => {
      const now = Date.now();
      clickCount++;

      // Detect rage clicking (more than 5 clicks in 1 second)
      if (now - lastClickTime < 1000) {
        if (clickCount > 5) {
          this.trackEvent('rage_click', {
            element: e.target.tagName,
            className: e.target.className,
            id: e.target.id,
            clickCount,
            timeWindow: 1000,
          });
          clickCount = 0;
        }
      } else {
        clickCount = 1;
      }

      lastClickTime = now;
    }, true);

    // Track errors
    window.addEventListener('error', (e) => {
      this.trackEvent('error', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        stack: e.error?.stack,
      });
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (e) => {
      this.trackEvent('error', {
        type: 'unhandled_promise_rejection',
        reason: e.reason,
        promise: e.promise,
      });
    });
  }

  // Track custom event
  trackEvent(eventType, metadata = {}) {
    if (!this.sessionId) return; // session not ready yet

    const eventData = {
      sessionId: this.sessionId,
      userId: this.userId,
      guestId: this.guestId,
      eventType,
      page: this.currentPage,
      metadata,
      ipAddress: null, // Will be set by server
      userAgent: navigator.userAgent,
      device: this.getDeviceType(),
      location: null, // Will be set by server
    };

    // Send via socket if connected
    if (this.socket && this.socket.connected) {
      this.socket.emit('track_event', eventData);
    }

    // Also send via HTTP as backup
    axios.post(`${API_BASE_URL}/tracking/event`, eventData).catch(err => {
      console.warn('Failed to send tracking event via HTTP:', err);
    });
  }

  // E-commerce specific tracking methods
  trackProductView(productId, productName, category) {
    this.trackEvent('product_view', {
      productId,
      productName,
      category,
    });
  }

  trackAddToCart(productId, productName, quantity, price) {
    this.trackEvent('add_to_cart', {
      productId,
      productName,
      quantity,
      price,
      totalValue: quantity * price,
    });
  }

  trackRemoveFromCart(productId, productName, quantity) {
    this.trackEvent('remove_from_cart', {
      productId,
      productName,
      quantity,
    });
  }

  trackCheckoutStarted(cartItems, totalValue) {
    this.trackEvent('checkout_started', {
      items: cartItems,
      totalValue,
      itemCount: cartItems.length,
    });
  }

  trackPaymentSuccess(orderId, totalValue, paymentMethod) {
    this.trackEvent('payment_success', {
      orderId,
      totalValue,
      paymentMethod,
    });
  }

  trackPaymentFailed(orderId, error, paymentMethod) {
    this.trackEvent('payment_failed', {
      orderId,
      error,
      paymentMethod,
    });
  }

  trackSearch(query, resultsCount, filters = {}) {
    this.trackEvent('search', {
      query,
      resultsCount,
      filters,
    });
  }

  // Utility methods
  getDeviceType() {
    const ua = navigator.userAgent;
    if (/mobile/i.test(ua)) return 'mobile';
    if (/tablet/i.test(ua)) return 'tablet';
    return 'desktop';
  }

  async getLocation() {
    try {
      // This would require a geolocation service or IP lookup
      // For now, return basic info
      return {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    } catch (error) {
      return {};
    }
  }

  async getIPAddress() {
    try {
      // This would require a service to get client IP
      // For now, return null (server will handle)
      return null;
    } catch (error) {
      return null;
    }
  }

  // Full cleanup (on app unmount)
  destroy() {
    this.stop();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Create singleton instance
const trackingService = new TrackingService();

export default trackingService;