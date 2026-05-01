import io from 'socket.io-client';
import axios from 'axios';
import { base_url } from './axiosConfig';
import { cachedFetch } from './apiCache';

// Derive URLs from the single REACT_APP_BASE_URL source of truth
const API_BASE_URL = (base_url || '').replace(/\/$/, ''); // strip trailing slash
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || API_BASE_URL.replace(/\/api$/, '');

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

  // Initialize tracking — only connects socket if tracking is enabled.
  // tracking/config is cached for 10 min so 1 lakh users don't hammer the server.
  async init(userId = null) {
    // If already initialized for the same user, skip entirely
    if (this.isInitialized && this.userId === (userId || null)) return;

    this.userId = userId;
    try {
      const config = await cachedFetch(
        'tracking/config',
        () => axios.get(`${API_BASE_URL}/tracking/config`).then((r) => r.data),
        10 * 60 * 1000 // 10 minutes
      );
      if (config?.config?.isEnabled) {
        if (!this.socket) this.connectSocket();
        await this.start(userId);
      }
    } catch (error) {
      // Silently fail — tracking should never break the app
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

  // Stop all tracking and disconnect socket
  stop() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.sessionId = null;
    this.guestId = null;
    this.isInitialized = false;
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Create or update session
  async createSession(userId) {
    const device = this.getDeviceType();
    const location = await this.getLocation();

    const response = await axios.post(`${API_BASE_URL}/tracking/session`, {
      userId,
      sessionId: this.sessionId,
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
    this.socket = io(SOCKET_URL);

    this.socket.on('connect', () => {
      if (this.userId) this.socket.emit('join-user', this.userId);
      if (this.sessionId) this.socket.emit('join-session', this.sessionId);
    });

    // When admin re-enables tracking, start on next init (page reload picks it up)
    this.socket.on('tracking_config_changed', ({ isEnabled }) => {
      if (!isEnabled) this.stop();
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
    }, 15000);
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

    window.addEventListener('popstate', trackPageView);

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

    document.addEventListener('click', (e) => {
      const now = Date.now();
      clickCount++;

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

    window.addEventListener('error', (e) => {
      this.trackEvent('error', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        stack: e.error?.stack,
      });
    });

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

    if (this.socket && this.socket.connected) {
      this.socket.emit('track_event', eventData);
    }

    axios.post(`${API_BASE_URL}/tracking/event`, eventData).catch(err => {
      console.warn('Failed to send tracking event via HTTP:', err);
    });
  }

  trackProductView(productId, productName, category) {
    this.trackEvent('product_view', { productId, productName, category });
  }

  trackAddToCart(productId, productName, quantity, price) {
    this.trackEvent('add_to_cart', { productId, productName, quantity, price, totalValue: quantity * price });
  }

  trackRemoveFromCart(productId, productName, quantity) {
    this.trackEvent('remove_from_cart', { productId, productName, quantity });
  }

  trackCheckoutStarted(cartItems, totalValue) {
    this.trackEvent('checkout_started', { items: cartItems, totalValue, itemCount: cartItems.length });
  }

  trackPaymentSuccess(orderId, totalValue, paymentMethod) {
    this.trackEvent('payment_success', { orderId, totalValue, paymentMethod });
  }

  trackPaymentFailed(orderId, error, paymentMethod) {
    this.trackEvent('payment_failed', { orderId, error, paymentMethod });
  }

  trackSearch(query, resultsCount, filters = {}) {
    this.trackEvent('search', { query, resultsCount, filters });
  }

  getDeviceType() {
    const ua = navigator.userAgent;
    if (/mobile/i.test(ua)) return 'mobile';
    if (/tablet/i.test(ua)) return 'tablet';
    return 'desktop';
  }

  async getLocation() {
    try {
      return { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone };
    } catch (error) {
      return {};
    }
  }

  async getIPAddress() {
    return null;
  }

  destroy() {
    this.stop();
  }
}

const trackingService = new TrackingService();
export default trackingService;
