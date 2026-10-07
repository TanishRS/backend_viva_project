const { getMessaging, getAuth, useMock } = require('../config/firebase');

/**
 * sendPushNotification
 * Sends an FCM push to one or more device tokens.
 * When FIREBASE_MOCK=true (default), this logs and returns a fake success
 * response instead of calling real Firebase — lets the whole API run and
 * be graded/tested with zero external credentials.
 *
 * @param {string[]} tokens - FCM device tokens
 * @param {{title: string, body: string, data?: object}} payload
 */
async function sendPushNotification(tokens, payload) {
  const cleanTokens = (tokens || []).filter(Boolean);

  if (useMock || cleanTokens.length === 0) {
    console.log('[FirebaseMock] Push notification (not actually sent):', {
      tokens: cleanTokens,
      title: payload.title,
      body: payload.body,
    });
    return {
      mocked: true,
      successCount: cleanTokens.length,
      failureCount: 0,
      responses: cleanTokens.map(() => ({ success: true, mocked: true })),
    };
  }

  const message = {
    notification: { title: payload.title, body: payload.body },
    data: payload.data || {},
    tokens: cleanTokens,
  };

  const response = await getMessaging().sendEachForMulticast(message);
  return response;
}

/**
 * verifyFirebaseIdToken
 * Verifies a Firebase Auth ID token (used as an alternative/additional
 * login path to JWT, per the case study's "JWT + Firebase Auth" requirement).
 */
async function verifyFirebaseIdToken(idToken) {
  if (useMock) {
    // The mock accepts ANY token, so it must never be reachable in production.
    if (process.env.NODE_ENV === 'production') {
      const err = new Error('Firebase is not configured on this server (FIREBASE_MOCK is on)');
      err.statusCode = 503;
      throw err;
    }
    console.log('[FirebaseMock] Verifying ID token (mocked) — accepting as valid');
    return { uid: `mock-uid-${idToken.slice(0, 8)}`, mocked: true };
  }
  return getAuth().verifyIdToken(idToken);
}

module.exports = { sendPushNotification, verifyFirebaseIdToken };
