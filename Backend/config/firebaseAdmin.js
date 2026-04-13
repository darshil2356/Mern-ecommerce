const admin = require("firebase-admin");

let initialized = false;

const initFirebase = () => {
  if (initialized || admin.apps.length > 0) return admin;

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    : null;

  if (!serviceAccount) {
    console.warn("[FCM] FIREBASE_SERVICE_ACCOUNT_JSON not set — push notifications disabled.");
    return null;
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  initialized = true;
  console.log("[FCM] Firebase Admin initialized.");
  return admin;
};

module.exports = { initFirebase, admin };
