// Firebase loaded via CDN — avoids all CRA/webpack ESM resolution issues

const FIREBASE_CDN_VERSION = "10.12.0";

const loadScript = (src) =>
  new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });

let _messaging = null;

export const initFirebaseMessaging = async () => {
  if (_messaging) return _messaging;

  const base = `https://www.gstatic.com/firebasejs/${FIREBASE_CDN_VERSION}`;
  await loadScript(`${base}/firebase-app-compat.js`);
  await loadScript(`${base}/firebase-messaging-compat.js`);

  const firebase = window.firebase;
  if (!firebase) throw new Error("Firebase CDN failed to load");

  if (!firebase.apps.length) {
    firebase.initializeApp({
      apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId:             process.env.REACT_APP_FIREBASE_APP_ID,
    });
  }

  _messaging = firebase.messaging();
  return _messaging;
};
