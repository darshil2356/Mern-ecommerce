import io from 'socket.io-client';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8000/api';

class TrackingService {
  constructor() {
    this.socket = null;
    this.sessionId = localStorage.getItem('trackingSessionId') || null;
    this.guestId = localStorage.getItem('trackingGuestId') || null;
    this.userId = null;
    this.heartbeatInterval = null;
    this.currentPage = window.location.pathname;
    this.isInitialized = false;
  }

  // Initialize tracking
  async init(userId = null) {
    // If already initialized and user just logged in, upgrade guest session to user session
    if (this.isInitialized) {
      if (userId && userId !== this.userId) {
        this.userId = userId;
        await this.upgradeSession(userId);
      }
      return;
    }

    try {
      // Check if tracking is enabled before doing anything
      const configRes = await axios.get(`${API_BASE_URL}tracking/config`);
      if (!configRes.data.isEnabled) return;

      const sessionData = await this.createSession(userId);

      this.sessionId = sessionData.session.sessionId;
      this.guestId = sessionData.session.guestId;
      this.userId = userId;

      // Persist so page refresh reuses same session
      localStorage.setItem('trackingSessionId', this.sessionId);
      localStorage.setItem('trackingGuestId', this.guestId);

      this.startHeartbeat();

      this.trackEvent('page_view', {
        page: this.currentPage,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
      });

      this.isInitialized = true;
      this.trackPageChanges();
      this.trackInteractions();

    } catch (error) {
      console.error('Failed to initialize tracking:', error);
    }
  }

  // Upgrade guest session to logged-in user session
  async upgradeSession(userId) {
    try {
      await axios.patch(`${API_BASE_URL}tracking/session/${this.sessionId}/upgrade`, { userId });
      // Rejoin socket room as user
      if (this.socket && this.socket.connected) {
        this.socket.emit('join-user', userId);
      }
    } catch (error) {
      console.error('Failed to upgrade session:', error);
    }
  }

  // Create or update session
  async createSession(userId) {
    const device = this.getDeviceType();
    const location = await this.getLocation();

    const response = await axios.post(`${API_BASE_URL}tracking/session`, {
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
      console.log('Connected to tracking server');

      // Join rooms
      if (this.userId) {
        this.socket.emit('join-user', this.userId);
      }
      this.socket.emit('join-session', this.sessionId);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from tracking server');
    });

    // Stop tracking immediately if admin disables it
    this.socket.on('tracking_config_changed', ({ isEnabled }) => {
      if (!isEnabled) this.destroy();
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
    if (!this.sessionId) return;

    const eventData = {
      sessionId: this.sessionId,
      userId: this.userId,
      guestId: this.guestId,
      eventType,
      page: this.currentPage,
      metadata,
      ipAddress: null,
      userAgent: navigator.userAgent,
      device: this.getDeviceType(),
      location: null,
    };

    // Send via socket if connected, otherwise fall back to HTTP
    if (this.socket && this.socket.connected) {
      this.socket.emit('track_event', eventData);
    } else {
      axios.post(`${API_BASE_URL}tracking/event`, eventData).catch(err => {
        console.warn('Failed to send tracking event:', err);
      });
    }
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

  // Cleanup
  destroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.socket) {
      this.socket.disconnect();
    }
    this.isInitialized = false;
  }
}

// Create singleton instance
const trackingService = new TrackingService();

export default trackingService;