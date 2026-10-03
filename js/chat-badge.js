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

  var sb = getSupabaseDb();
  if (!sb) return;

  function load() {
    sb.from('conversations').select('*').contains('participants', [activeId]).then(function(res) {
      if (res.error) {
        console.warn('[chat-badge] subscription error:', res.error);
        return;
      }
      var convs = (res.data || []).map(function(r) {
        return { id: r.id, data: { unreadCount: r.unread_count || {} } };
      });
      _badgePrevUnreadTotal = _badgeGetTotalUnreadCount(convs);
      updateUnreadBadge();
    });
  }

  load();
  _badgeConvUnsub = sbWatch('conversations', load);
}

function initChatBadge() {
  var activeId = getActiveUserId();
  if (!activeId) return;

  setTimeout(subscribeToConversations, 100);

  window.addEventListener('beforeunload', function() {
    if (_badgeConvUnsub) {
      _badgeConvUnsub();
      _badgeConvUnsub = null;
    }
  });
}

window.updateUnreadBadge = updateUnreadBadge;
window.initChatBadge = initChatBadge;
