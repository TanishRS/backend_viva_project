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

let admin = null;

if (!useMock) {
  admin = require('firebase-admin');
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
    });
  }
}

module.exports = { admin, useMock };
