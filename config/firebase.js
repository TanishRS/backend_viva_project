/**
 * Firebase Admin SDK initializer.
 *
 * Set FIREBASE_MOCK=true (default in .env.example) to run without real
 * Firebase credentials — a drop-in mock is used instead so the API is
 * fully runnable/testable out of the box. Set FIREBASE_MOCK=false and
 * fill in FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY
 * to use a real Firebase project (Auth verification + Cloud Messaging).
 */

const useMock = process.env.FIREBASE_MOCK !== 'false';

let app = null;
let getMessaging = null;
let getAuth = null;

if (!useMock) {
  // firebase-admin v10+ uses modular imports (admin.apps / admin.credential no longer exist)
  const { initializeApp, getApps, cert } = require('firebase-admin/app');
  getMessaging = require('firebase-admin/messaging').getMessaging;
  getAuth = require('firebase-admin/auth').getAuth;

  app = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        }),
      });
}

module.exports = { app, getMessaging, getAuth, useMock };
