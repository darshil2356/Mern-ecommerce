import { useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { base_url, getConfig } from "../utils/axiosConfig";
import { buildForegroundNotification } from "../utils/notificationConfig";

const VAPID_KEY = process.env.REACT_APP_FIREBASE_VAPID_KEY;

const usePushNotification = (isLoggedIn) => {
  const subscribeToken = useCallback(async (token) => {
    try {
      await axios.post(`${base_url}notifications/subscribe`, { token }, getConfig());
    } catch (err) {
      console.warn("[FCM] Token subscription failed:", err.message);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    if (!("Notification" in window)) return;

    let unsubscribe = null;

    const init = async () => {
      try {
        // Dynamically import CDN-based firebase — zero webpack ESM issues
        const { initFirebaseMessaging } = await import("../utils/firebase");
        const messaging = await initFirebaseMessaging();

        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        // Get FCM token
        try {
          const token = await messaging.getToken({ vapidKey: VAPID_KEY });
          if (token) await subscribeToken(token);
        } catch (err) {
          console.warn("[FCM] getToken failed:", err.message);
        }

        // Foreground message handler — show as toast
        unsubscribe = messaging.onMessage((payload) => {
          const { title, body } = buildForegroundNotification(payload);
          toast.info(`${title} — ${body}`, { autoClose: 6000 });
        });
      } catch (err) {
        console.warn("[FCM] Init failed:", err.message);
      }
    };

    init();

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [isLoggedIn, subscribeToken]);
};

export default usePushNotification;
