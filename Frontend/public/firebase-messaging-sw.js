/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// ⚠️ Service Workers cannot read process.env — values must be hardcoded here
firebase.initializeApp({
  apiKey: "AIzaSyBufeRboatdtaFhdv7L3LaQ676z3ys_0G8",
  authDomain: "yeshoda-497c7.firebaseapp.com",
  projectId: "yeshoda-497c7",
  storageBucket: "yeshoda-497c7.firebasestorage.app",
  messagingSenderId: "1026589527890",
  appId: "1:1026589527890:web:f449ba8d880539f736748b",
});

const messaging = firebase.messaging();

// Background message handler — shows system notification when app is closed/minimized
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  const data = payload.data || {};

  self.registration.showNotification(title || "Yashoda Fashion", {
    body: body || "",
    icon: "/logo192.png",
    badge: "/logo192.png",
    data,
  });
});

// Notification click — navigate to the relevant screen
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const screen = event.notification.data?.screen || "";
  const url = self.location.origin + (screen ? `/${screen}` : "/");
  event.waitUntil(clients.openWindow(url));
});
