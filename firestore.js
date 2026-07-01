// ─── FIRESTORE — Shared helpers for the Havën Friend System ────────────
// This file must be loaded AFTER firebase-firestore-compat.js and BEFORE gsi.js.

var FIRESTORE_INITIALIZED = false;
var FIRESTORE_DB = null;

function initFirestore() {
  if (FIRESTORE_INITIALIZED) return;
  if (typeof firebase === 'undefined') {
    console.warn('[firestore] Firebase SDK not loaded');
    return;
  }
  // FIREBASE_CONFIG is defined in gsi.js — ensure it's available
  if (typeof FIREBASE_CONFIG === 'undefined') {
    console.warn('[firestore] FIREBASE_CONFIG not found');
    return;
  }
  if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
  }
  FIRESTORE_DB = firebase.firestore();
  // Enable offline persistence (new API for Firestore 11.10+)
  var isFileProtocol = typeof window !== 'undefined' && window.location.protocol === 'file:';
  if (!isFileProtocol && FIRESTORE_DB) {
    FIRESTORE_DB.enablePersistence({ synchronizeTabs: true }).catch(function(err) {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open — persistence can only be enabled in one tab at a time
      } else if (err.code === 'unimplemented') {
        // Browser doesn't support persistence
      }
    });
  }
  FIRESTORE_INITIALIZED = true;
  // Detach all Firestore listeners on page unload to prevent "message channel closed" errors
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', function() {
      if (FIRESTORE_DB) {
        FIRESTORE_DB.terminate().catch(function() {});
      }
    });
  }
}

function getFirestoreDb() {
  if (!FIRESTORE_DB) initFirestore();
  return FIRESTORE_DB;
}

// Generate a unique shareable friend code for a user
function generateFriendCode(userId) {
  var suffix = userId.slice(-7);
  return 'haven-' + suffix;
}

// Sync a user's public profile to Firestore (create or update)
// Called whenever a user signs in, creates a profile, or switches accounts
function syncUserToFirestore(user) {
  if (!user || !user.id) return Promise.resolve();
  try {
    initFirestore();
    if (!FIRESTORE_DB) return Promise.resolve();

    var friendCode = generateFriendCode(user.id);

    return FIRESTORE_DB.collection('users').doc(user.id).set({
      displayName: user.name || 'User',
      photoURL: user.picture || '',
      avatarColor: user._color || '#b4ccbc',
      email: user.email || '',
      friendCode: friendCode,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'online',
      stats: {
        totalTasks: 0,
        currentStreak: 0,
        bestStreak: 0,
        completionRate: 0
      }
    }, { merge: true }).catch(function(err) {
      console.warn('[firestore] syncUser failed:', err);
    });
  } catch (e) {
    console.warn('[firestore] syncUser error:', e);
    return Promise.resolve();
  }
}

// Update user's online status and last seen timestamp
function updateUserStatus(userId, status) {
  if (!userId || !FIRESTORE_DB) return;
  try {
    FIRESTORE_DB.collection('users').doc(userId).update({
      status: status,
      lastSeen: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(function() {});
  } catch (e) {}
}

// Remove a user's Firestore profile document (called when profile is deleted)
function removeUserFromFirestore(userId) {
  if (!userId || !FIRESTORE_DB) return Promise.resolve();
  try {
    return FIRESTORE_DB.collection('users').doc(userId).delete().catch(function() {});
  } catch (e) { return Promise.resolve(); }
}

// Update a user's task stats in Firestore (called after task changes)
function updateUserStats(userId, stats) {
  if (!userId || !FIRESTORE_DB) return Promise.resolve();
  try {
    return FIRESTORE_DB.collection('users').doc(userId).update({
      stats: stats,
      lastSeen: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(function() {});
  } catch (e) { return Promise.resolve(); }
}
