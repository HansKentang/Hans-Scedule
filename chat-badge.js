/* ============================================
   Havën Schedule — Chat Badge (lightweight)
   Global unread count badge for sidebar nav
   ============================================ */

var _badgeConvUnsub = null;
var _badgePrevUnreadTotal = 0;

function _badgeGetUnreadCount(conversation) {
  var activeId = getActiveUserId();
  if (!activeId || !conversation || !conversation.data.unreadCount) return 0;
  return conversation.data.unreadCount[activeId] || 0;
}

function _badgeGetTotalUnreadCount(convs) {
  var total = 0;
  for (var i = 0; i < convs.length; i++) {
    total += _badgeGetUnreadCount(convs[i]);
  }
  return total;
}

function updateUnreadBadge() {
  var total = _badgePrevUnreadTotal;
  var badge = document.getElementById('chatUnreadBadge');
  if (!badge) return;
  if (total > 0) {
    badge.textContent = total > 99 ? '99+' : total;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }

  // Update document title
  var baseTitle = document.title.replace(/^\(\d+\)\s*/, '');
  if (total > 0) {
    document.title = '(' + total + ') ' + baseTitle;
  } else {
    document.title = baseTitle;
  }
}

function subscribeToConversations() {
  var activeId = getActiveUserId();
  if (!activeId) return;

  if (_badgeConvUnsub) {
    _badgeConvUnsub();
    _badgeConvUnsub = null;
  }

  var db = getFirestoreDb();
  if (!db) return;

  _badgeConvUnsub = db.collection('conversations')
    .where('participants', 'array-contains', activeId)
    .orderBy('updatedAt', 'desc')
    .onSnapshot(function(snapshot) {
      var convs = [];
      snapshot.forEach(function(doc) {
        var data = doc.data();
        convs.push({ id: doc.id, data: data });
      });

      _badgePrevUnreadTotal = _badgeGetTotalUnreadCount(convs);
      updateUnreadBadge();
    }, function(err) {
      console.warn('[chat-badge] subscription error:', err);
    });
}

function initChatBadge() {
  var activeId = getActiveUserId();
  if (!activeId) return;

  initFirestore();

  // Delay subscription slightly to let Firestore init settle
  setTimeout(function() {
    subscribeToConversations();
  }, 100);
}

// Expose for chat.js to reuse if needed
window.updateUnreadBadge = updateUnreadBadge;
window.initChatBadge = initChatBadge;
