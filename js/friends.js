/* ============================================
   Havën Schedule — Friends Page
   Friend code, add friend, friend list
   ============================================ */

let currentTab = 'all';
let friendsData = [];
let friendRequestsData = [];
let friendUnsubscribe = null;
let convUnsubscribe = null;
let feedUnsubscribe = null;
let challengesUnsubscribe = null;

function sbClient() {
  return getSupabaseDb();
}

// ─── RENDER FRIEND CODE ─────────────────────────────────
function renderFriendCode() {
  var codeEl = document.getElementById('frCodeDisplay');
  if (!codeEl) return;
  var activeId = getActiveUserId();
  if (!activeId) {
    codeEl.textContent = '—';
    return;
  }
  codeEl.textContent = generateFriendCode(activeId);
}

// ─── COPY FRIEND CODE ────────────────────────────────────
function setupCopyButton() {
  var btn = document.getElementById('frCopyBtn');
  if (!btn) return;
  btn.addEventListener('click', function() {
    var code = document.getElementById('frCodeDisplay')?.textContent;
    if (!code || code === '—') return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(function() {
        showCopyFeedback(btn);
      }).catch(function() {
        fallbackCopy(code, btn);
      });
    } else {
      fallbackCopy(code, btn);
    }
  });
}

function showCopyFeedback(btn) {
  btn.classList.add('copied');
  var origText = btn.innerHTML;
  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
  setTimeout(function() {
    btn.classList.remove('copied');
    btn.innerHTML = origText;
  }, 2000);
}

function fallbackCopy(text, btn) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); showCopyFeedback(btn); } catch (e) {}
  document.body.removeChild(ta);
}

// ─── ADD FRIEND BY CODE ──────────────────────────────────
function setupAddFriend() {
  var input = document.getElementById('frAddInput');
  var btn = document.getElementById('frAddBtn');
  var status = document.getElementById('frAddStatus');
  if (!input || !btn || !status) return;

  var ADD_BTN_HTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Friend';

  function resetBtn() {
    btn.disabled = false;
    btn.innerHTML = ADD_BTN_HTML;
  }

  function doAddFriend() {
    var code = input.value.trim();
    if (!code) {
      status.textContent = 'Please enter a friend code';
      status.className = 'fr-add-status error';
      return;
    }

    var activeId = getActiveUserId();
    if (!activeId) {
      status.textContent = 'You need to be signed in to add friends';
      status.className = 'fr-add-status error';
      return;
    }

    var ownCode = generateFriendCode(activeId);
    if (code === ownCode) {
      status.textContent = "That's your own friend code!";
      status.className = 'fr-add-status error';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Adding...';
    status.textContent = 'Looking up friend code...';
    status.className = 'fr-add-status';

    var sb = sbClient();
    if (!sb) {
      status.textContent = 'Could not connect to server. Try again later.';
      status.className = 'fr-add-status error';
      resetBtn();
      return;
    }      sb.from('profiles_public').select('*').eq('friend_code', code).limit(1).maybeSingle()
      .then(function(res) {
        if (res.error) throw res.error;
        var targetUser = res.data ? mapProfileRow(res.data) : null;
        if (!targetUser) {
          status.textContent = 'No user found with that friend code';
          status.className = 'fr-add-status error';
          return;
        }

        var friendId = targetUser.id;
        if (friendId === activeId) {
          status.textContent = "That's your own friend code!";
          status.className = 'fr-add-status error';
          return;
        }

        var friendshipId = activeId < friendId ? activeId + '_' + friendId : friendId + '_' + activeId;

        return sb.from('friends').select('*').eq('id', friendshipId).maybeSingle().then(function(fres) {
          if (fres.error) throw fres.error;
          if (fres.data) {
            if (fres.data.status === 'accepted') {
              status.textContent = 'You are already friends with ' + (targetUser.displayName || 'this user');
              status.className = 'fr-add-status error';
            } else if (fres.data.status === 'pending') {
              status.textContent = 'Friend request already sent. Waiting for them to accept.';
              status.className = 'fr-add-status';
            } else {
              status.textContent = 'Friendship already exists';
              status.className = 'fr-add-status error';
            }
            return;
          }

          return sb.from('friends').insert({
            id: friendshipId,
            users: [activeId, friendId],
            status: 'pending',
            initiated_by: activeId,
            created_at: new Date().toISOString()
          }).then(function(ires) {
            if (ires.error) throw ires.error;
            status.textContent = 'Friend request sent to ' + (targetUser.displayName || 'user') + '!';
            status.className = 'fr-add-status success';
            input.value = '';
            subscribeToFriends();
          });
        });
      })
      .catch(function(err) {
        status.textContent = 'Error: ' + (err.message || err);
        status.className = 'fr-add-status error';
      })
      .then(resetBtn);
  }

  btn.addEventListener('click', doAddFriend);
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); doAddFriend(); }
  });
}

// ─── SUBSCRIBE TO FRIENDS (real-time) ─────────────────────
function subscribeToFriends() {
  var activeId = getActiveUserId();
  if (!activeId) return;

  if (friendUnsubscribe) {
    friendUnsubscribe();
    friendUnsubscribe = null;
  }
  if (!sbClient()) return;

  loadFriends();
  friendUnsubscribe = sbWatch('friends', function() { loadFriends(); });
}

function loadFriends() {
  var sb = sbClient();
  var activeId = getActiveUserId();
  if (!sb || !activeId) return;

  sb.from('friends').select('*').contains('users', [activeId]).then(function(res) {
    if (res.error) {
      console.warn('[friends] load error:', res.error);
      return;
    }

    var rows = res.data || [];
    var ids = [];
    var friends = [];

    rows.forEach(function(r) {
      var users = r.users || [];
      var otherId = users.find(function(u) { return u !== activeId; });
      friends.push({
        id: r.id,
        users: users,
        status: r.status,
        initiatedBy: r.initiated_by,
        otherUserId: otherId
      });
      if (otherId) ids.push(otherId);
      if (r.status === 'pending' && r.initiated_by) ids.push(r.initiated_by);
    });

    friendsData = friends;
    friendRequestsData = friends.filter(function(f) { return f.status === 'pending'; });

    ids = ids.filter(function(v, i, a) { return v && a.indexOf(v) === i; });
    if (!ids.length) {
      renderFriendList();
      renderLeaderboard();
      return;
    }

    sb.from('profiles_public').select('*').in('id', ids).then(function(pres) {
      var map = {};
      (pres.data || []).forEach(function(p) { map[p.id] = mapProfileRow(p); });
      friends.forEach(function(f) {
        var lookup = f.status === 'pending'
          ? (f.initiatedBy === activeId ? f.otherUserId : f.initiatedBy)
          : f.otherUserId;
        f.userData = map[lookup] || null;
      });
      renderFriendList();
      renderLeaderboard();
    });
  });
}

// ─── RENDER FRIEND LIST ───────────────────────────────────
function renderFriendList() {
  var activeId = getActiveUserId();
  var listEl = document.getElementById('frList');
  var totalCountEl = document.getElementById('frTotalCount');
  var friendCountEl = document.getElementById('frFriendCount');
  if (!listEl) return;

  var accepted = friendsData.filter(function(f) { return f.status === 'accepted'; });
  var requests = friendsData.filter(function(f) { return f.status === 'pending'; });

  document.getElementById('frTabAllCount').textContent = friendsData.length;
  document.getElementById('frTabPendingCount').textContent = requests.length;
  document.getElementById('frTabAcceptedCount').textContent = accepted.length;

  if (totalCountEl) totalCountEl.textContent = friendsData.length + ' connections';
  if (friendCountEl) friendCountEl.textContent = accepted.length + ' friends';

  var displayList;
  if (currentTab === 'pending') {
    displayList = requests;
  } else if (currentTab === 'accepted') {
    displayList = accepted;
  } else {
    displayList = friendsData;
  }

  if (displayList.length === 0) {
    var emptyMsg = currentTab === 'pending' ? 'No pending requests' :
                   currentTab === 'accepted' ? 'No accepted friends yet' :
                   'No friends yet. Share your friend code to connect!';
    listEl.innerHTML = '<div class="fr-empty">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>' +
      '<p>' + emptyMsg + '</p></div>';
    return;
  }

  var html = '';
  for (var i = 0; i < displayList.length; i++) {
    var f = displayList[i];
    var isPending = f.status === 'pending';
    var isAccepted = f.status === 'accepted';

    var otherUser = f.userData;
    var displayName = otherUser ? (otherUser.displayName || 'Unknown') : 'Loading...';
    var initials = displayName.split(/\s+/).slice(0, 2).map(function(s) { return s[0]; }).join('').toUpperCase() || '?';
    var avatarColor = safeColor(otherUser ? otherUser.avatarColor : null, '#b4ccbc');
    var photoURL = otherUser ? (otherUser.photoURL || '') : '';
    var isOnline = otherUser ? otherUser.status === 'online' : false;

    var avatarHtml = photoURL
      ? '<img src="' + escapeHtml(photoURL) + '" alt="">'
      : '<span>' + escapeHtml(initials) + '</span>';

    html += '<div class="fr-item">' +
      '<div class="fr-item-avatar" style="background:' + avatarColor + '">' + avatarHtml + '</div>' +
      '<div class="fr-item-info">' +
        '<div class="fr-item-name">' + escapeHtml(displayName) + '</div>' +
        '<div class="fr-item-status">' +
          (isAccepted
            ? '<span class="fr-item-status-dot ' + (isOnline ? 'online' : 'offline') + '"></span>' + (isOnline ? 'Online' : 'Offline')
            : '<span class="fr-pending-badge"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg> Pending</span>'
          ) +
        '</div>' +
        (isAccepted && otherUser && otherUser.stats
          ? '<div class="fr-item-stats">' +
              '<span class="fr-stat"><b>' + (otherUser.stats.totalTasks || 0) + '</b><em>tasks</em></span>' +
              '<span class="fr-stat"><b>' + (otherUser.stats.currentStreak || 0) + '</b><em>streak</em></span>' +
              '<span class="fr-stat"><b>' + (otherUser.stats.completionRate || 0) + '%</b><em>done</em></span>' +
            '</div>'
          : '') +
      '</div>';

    html += '<div class="fr-item-actions">';
    if (isPending) {
      if (f.initiatedBy !== activeId) {
        html += '<button class="fr-item-action-btn accept" data-friend-accept="' + f.id + '" title="Accept">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button>';
        html += '<button class="fr-item-action-btn decline" data-friend-decline="' + f.id + '" title="Decline">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
      }
    } else if (isAccepted) {
      html += '<button class="fr-item-action-btn chat" data-friend-chat="' + f.otherUserId + '" data-friend-name="' + escapeHtml(displayName) + '" title="Chat">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></button>';
    }
    html += '<button class="fr-item-action-btn" data-friend-remove="' + f.id + '" title="Remove">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>';
    html += '</div></div>';
  }

  listEl.innerHTML = html;

  listEl.querySelectorAll('[data-friend-accept]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      acceptFriendRequest(btn.dataset.friendAccept);
    });
  });
  listEl.querySelectorAll('[data-friend-decline]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      declineFriendRequest(btn.dataset.friendDecline);
    });
  });
  listEl.querySelectorAll('[data-friend-remove]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      removeFriend(btn.dataset.friendRemove);
    });
  });
  listEl.querySelectorAll('[data-friend-chat]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var friendId = btn.dataset.friendChat;
      var friendName = btn.dataset.friendName;
      if (typeof openChatPanel === 'function') {
        openChatPanel(friendId, friendName);
      }
    });
  });
}

// ─── ACCEPT / DECLINE / REMOVE ────────────────────────────
function acceptFriendRequest(friendshipId) {
  var sb = sbClient();
  if (!sb) return;
  sb.from('friends').update({
    status: 'accepted',
    accepted_at: new Date().toISOString()
  }).eq('id', friendshipId).then(function(res) {
    if (res.error) console.warn('[friends] accept error:', res.error);
    else loadFriends();
  });
}

function declineFriendRequest(friendshipId) {
  var sb = sbClient();
  if (!sb) return;
  sb.from('friends').delete().eq('id', friendshipId).then(function(res) {
    if (res.error) console.warn('[friends] decline error:', res.error);
  });
}

function removeFriend(friendshipId) {
  var sb = sbClient();
  if (!sb) return;
  if (!confirm('Remove this friend connection?')) return;
  sb.from('friends').delete().eq('id', friendshipId).then(function(res) {
    if (res.error) console.warn('[friends] remove error:', res.error);
  });
}

// ─── RENDER PROFILE ──────────────────────────────────────
function renderProfile() {
  var activeId = getActiveUserId();
  if (!activeId) return;

  var avatarEl = document.getElementById('frProfileAvatar');
  var nameEl = document.getElementById('frProfileName');
  var statusEl = document.getElementById('frProfileStatus');
  var codeEl = document.getElementById('frProfileCode');
  var tasksEl = document.getElementById('frMyTasks');
  var streakEl = document.getElementById('frMyStreak');
  var rateEl = document.getElementById('frMyRate');

  var activeUser = (typeof localUsers !== 'undefined' && activeId)
    ? localUsers.find(function(u) { return u.id === activeId; })
    : null;
  var activeAuthUid = activeUser && activeUser.authUid ? activeUser.authUid : '';

  if (activeUser && nameEl) {
    var displayName = activeUser.name || 'User';
    nameEl.textContent = displayName;
    if (avatarEl) {
      var initials = displayName.split(/\s+/).slice(0, 2).map(function(s) { return s[0]; }).join('').toUpperCase() || '?';
      var photoURL = activeUser.picture || '';
      avatarEl.style.background = activeUser._color || 'var(--accent)';
      avatarEl.innerHTML = photoURL
        ? '<img src="' + escapeHtml(photoURL) + '" alt="" style="width:100%;height:100%;object-fit:cover">'
        : '<span>' + escapeHtml(initials) + '</span>';
    }
  }

  if (codeEl) {
    var code = generateFriendCode(activeId);
    codeEl.textContent = code;
    codeEl.onclick = function() {
      var t = codeEl.textContent;
      if (!t || t === '\u2014') return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(t).then(function() {
          codeEl.style.background = 'var(--accent-soft)';
          codeEl.style.color = 'var(--primary)';
          setTimeout(function() { codeEl.style.background = ''; codeEl.style.color = ''; }, 1500);
        });
      }
    };
  }

  if (statusEl) {
    statusEl.onclick = function() {
      var cur = statusEl.textContent === 'Click to set status...' ? '' : statusEl.textContent;
      var next = prompt('Set your status:', cur);
      if (next !== null) {
        statusEl.textContent = next || 'Click to set status...';
        var sb = sbClient();
        if (sb) ownProfileFilter(sb.from('profiles').update({ status_message: next }), activeId, activeAuthUid)
          .then(function() {}).catch(function() {});
      }
    };
  }

  var sb = sbClient();
  if (sb) {
    ownProfileFilter(sb.from('profiles').select('*'), activeId, activeAuthUid).maybeSingle().then(function(res) {
      if (res.error) return;
      var row = res.data;
      if (!row) return;
      var stats = row.stats || {};
      if (tasksEl) tasksEl.textContent = stats.totalTasks || 0;
      if (streakEl) streakEl.textContent = stats.currentStreak || 0;
      if (rateEl) rateEl.textContent = (stats.completionRate || 0) + '%';
      if (statusEl && row.status_message) statusEl.textContent = row.status_message;
    }).catch(function() {});
  }
}

// ─── CONVERSATIONS LIST ──────────────────────────────────
function subscribeToConversations() {
  var activeId = getActiveUserId();
  if (!activeId) return;
  if (convUnsubscribe) { convUnsubscribe(); convUnsubscribe = null; }
  if (!sbClient()) return;

  loadConversations();
  convUnsubscribe = sbWatch('conversations', function() { loadConversations(); });
}

function loadConversations() {
  var sb = sbClient();
  var activeId = getActiveUserId();
  if (!sb || !activeId) return;

  sb.from('conversations').select('*').contains('participants', [activeId]).then(function(res) {
    if (res.error) return;
    var convos = (res.data || []).map(function(r) {
      return {
        id: r.id,
        participants: r.participants || [],
        lastMessage: r.last_message || null,
        unreadCount: r.unread_count || {},
        updatedAt: r.updated_at
      };
    });
    convos.sort(function(a, b) { return tsMillis(b.updatedAt) - tsMillis(a.updatedAt); });
    renderConversations(convos);
  });
}

function renderConversations(conversations) {
  var listEl = document.getElementById('frConvList');
  if (!listEl) return;
  var activeId = getActiveUserId();

  if (!conversations || conversations.length === 0) {
    listEl.innerHTML = '<div class="fr-conv-item" style="opacity:0.5;pointer-events:none">' +
      '<div class="fr-conv-avatar" style="background:var(--text-tertiary)">?</div>' +
      '<div class="fr-conv-info"><div class="fr-conv-name">No conversations yet</div>' +
      '<div class="fr-conv-preview">Start chatting with a friend</div></div></div>';
    return;
  }

  var sb = sbClient();
  if (!sb) return;

  var otherIds = conversations.map(function(c) {
    return c.participants.find(function(p) { return p !== activeId; });
  }).filter(Boolean);

  sb.from('profiles_public').select('*').in('id', otherIds).then(function(res) {
    var map = {};
    (res.data || []).forEach(function(p) { map[p.id] = mapProfileRow(p); });

    var html = '';
    conversations.forEach(function(conv) {
      var otherId = conv.participants.find(function(p) { return p !== activeId; });
      var user = map[otherId] || null;
      var name = user ? (user.displayName || 'Unknown') : 'Unknown';
      var initials = name.split(/\s+/).slice(0, 2).map(function(s) { return s[0]; }).join('').toUpperCase() || '?';
      var color = safeColor(user ? user.avatarColor : null, '#b4ccbc');
      var photoURL = user ? (user.photoURL || '') : '';
      var lastMsg = conv.lastMessage ? conv.lastMessage.text : 'No messages yet';
      var time = frFormatTime(conv.updatedAt);
      var unread = conv.unreadCount && conv.unreadCount[activeId] ? conv.unreadCount[activeId] : 0;

      var avatarHtml = photoURL
        ? '<img src="' + escapeHtml(photoURL) + '" alt="" style="width:100%;height:100%;object-fit:cover">'
        : '<span>' + escapeHtml(initials) + '</span>';

      html += '<div class="fr-conv-item" data-conv-friend="' + otherId + '" data-conv-name="' + escapeHtml(name) + '">' +
        '<div class="fr-conv-avatar" style="background:' + color + '">' + avatarHtml + '</div>' +
        '<div class="fr-conv-info"><div class="fr-conv-name">' + escapeHtml(name) + '</div>' +
        '<div class="fr-conv-preview">' + escapeHtml((lastMsg || '').substring(0, 50)) + '</div></div>' +
        '<div class="fr-conv-meta"><div class="fr-conv-time">' + time + '</div>' +
        (unread > 0 ? '<div class="fr-conv-badge">' + unread + '</div>' : '') +
        '</div></div>';
    });
    listEl.innerHTML = html;
    listEl.querySelectorAll('.fr-conv-item[data-conv-friend]').forEach(function(item) {
      item.addEventListener('click', function() {
        if (typeof openChatPanel === 'function') openChatPanel(item.dataset.convFriend, item.dataset.convName);
      });
    });
  });
}

function frFormatTime(ts) {
  var then = tsMillis(ts);
  if (!then) return '';
  var diff = Date.now() - then;
  if (diff < 60000) return 'Now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h';
  if (diff < 604800000) return Math.floor(diff / 86400000) + 'd';
  var d = new Date(then);
  return (d.getMonth() + 1) + '/' + d.getDate();
}

// ─── LEADERBOARD ─────────────────────────────────────────
function renderLeaderboard() {
  var listEl = document.getElementById('frLeaderboard');
  if (!listEl) return;
  var activeId = getActiveUserId();

  var entries = [];
  var activeUser = (typeof localUsers !== 'undefined' && activeId)
    ? localUsers.find(function(u) { return u.id === activeId; })
    : null;
  var myTasks = 0;
  try { var ms = computeUserStats ? computeUserStats() : {}; myTasks = ms.totalTasks || 0; } catch(e) {}
  entries.push({ name: activeUser ? activeUser.name || 'You' : 'You', tasks: myTasks, color: activeUser && activeUser._color ? activeUser._color : 'var(--accent)', isMe: true });

  friendsData.filter(function(f) { return f.status === 'accepted'; }).forEach(function(f) {
    if (f.userData && f.userData.stats) {
      entries.push({ name: f.userData.displayName || 'Unknown', tasks: f.userData.stats.totalTasks || 0, color: safeColor(f.userData.avatarColor, '#b4ccbc'), photoURL: f.userData.photoURL || '', isMe: false });
    }
  });

  entries.sort(function(a, b) { return b.tasks - a.tasks; });

  var html = '';
  entries.forEach(function(e, i) {
    var initials = e.name.split(/\s+/).slice(0, 2).map(function(s) { return s[0]; }).join('').toUpperCase() || '?';
    var av = e.photoURL ? '<img src="' + escapeHtml(e.photoURL) + '" alt="" style="width:100%;height:100%;object-fit:cover">' : '<span>' + escapeHtml(initials) + '</span>';
    html += '<div class="fr-lb-row' + (e.isMe ? ' me' : '') + '">' +
      '<div class="fr-lb-rank">' + (i + 1) + '</div>' +
      '<div class="fr-lb-avatar" style="background:' + e.color + '">' + av + '</div>' +
      '<div class="fr-lb-name">' + escapeHtml(e.name) + '</div>' +
      '<div class="fr-lb-score"><div class="fr-lb-score-num">' + e.tasks + '</div><div class="fr-lb-score-label">tasks</div></div></div>';
  });
  if (entries.length <= 1) {
    html = '<div class="fr-lb-row me"><div class="fr-lb-rank">\u2014</div><div class="fr-lb-avatar" style="background:var(--accent)">' + (entries[0] ? entries[0].name.charAt(0) : '?') + '</div><div class="fr-lb-name">Add friends to compete!</div><div class="fr-lb-score"><div class="fr-lb-score-num">' + myTasks + '</div><div class="fr-lb-score-label">tasks</div></div></div>';
  }
  listEl.innerHTML = html;
}

// ─── CHALLENGES ──────────────────────────────────────────
function subscribeToChallenges() {
  var activeId = getActiveUserId();
  if (!activeId) return;
  if (challengesUnsubscribe) { challengesUnsubscribe(); challengesUnsubscribe = null; }
  if (!sbClient()) return;
  loadChallenges();
  challengesUnsubscribe = sbWatch('challenges', function() { loadChallenges(); });
}

function loadChallenges() {
  var sb = sbClient();
  var activeId = getActiveUserId();
  if (!sb || !activeId) return;
  sb.from('challenges').select('*').contains('participants', [activeId]).then(function(res) {
    if (res.error) return;
    var chs = (res.data || []).map(function(r) {
      return {
        id: r.id,
        title: r.title,
        description: r.description,
        target: r.target,
        progress: r.progress,
        status: r.status,
        participants: r.participants || [],
        participantNames: r.participant_names || [],
        createdBy: r.created_by,
        createdAt: r.created_at
      };
    });
    chs.sort(function(a, b) { return tsMillis(b.createdAt) - tsMillis(a.createdAt); });
    renderChallenges(chs);
  });
}

function renderChallenges(challenges) {
  var listEl = document.getElementById('frChallengeList');
  if (!listEl) return;
  if (!challenges || challenges.length === 0) {
    listEl.innerHTML = '<div class="fr-ch-empty">No active challenges. Create one to compete with friends!</div>';
    return;
  }
  var html = '';
  challenges.forEach(function(ch) {
    var progress = ch.progress || 0;
    var target = ch.target || 10;
    var pct = Math.min(100, Math.round((progress / target) * 100));
    var isActive = ch.status !== 'completed';
    html += '<div class="fr-ch-item">' +
      '<div class="fr-ch-item-header"><div class="fr-ch-item-title">' + escapeHtml(ch.title || 'Challenge') + '</div>' +
      '<span class="fr-ch-item-badge ' + (isActive ? 'active' : 'completed') + '">' + (isActive ? 'Active' : 'Done') + '</span></div>' +
      '<div class="fr-ch-item-meta">' + escapeHtml(ch.description || '') + ' \u00b7 ' + progress + '/' + target + '</div>' +
      '<div class="fr-ch-progress-bar"><div class="fr-ch-progress-fill" style="width:' + pct + '%"></div></div>' +
      '<div class="fr-ch-participants">';
    (ch.participantNames || []).forEach(function(n) {
      html += '<div class="fr-ch-participant" style="background:var(--accent)" title="' + escapeHtml(n) + '">' + escapeHtml((n || '?').charAt(0)) + '</div>';
    });
    html += '</div></div>';
  });
  listEl.innerHTML = html;
}

function setupChallenges() {
  var btn = document.getElementById('frChCreateBtn');
  if (!btn) return;
  btn.addEventListener('click', function() {
    var title = prompt('Challenge title (e.g. "7-Day Exercise Streak"):');
    if (!title) return;
    var target = parseInt(prompt('Target number:', '10'), 10);
    if (!target || target < 1) return;
    var activeId = getActiveUserId();
    if (!activeId) return;

    var accepted = friendsData.filter(function(f) { return f.status === 'accepted'; });
    var participants = [activeId];
    var participantNames = [];
  var activeUser = (typeof localUsers !== 'undefined' && activeId)
    ? localUsers.find(function(u) { return u.id === activeId; })
    : null;
    if (activeUser) participantNames.push(activeUser.name || 'User');
    accepted.forEach(function(f) {
      participants.push(f.otherUserId);
      if (f.userData) participantNames.push(f.userData.displayName || 'Unknown');
    });

    var sb = sbClient();
    if (!sb) return;
    sb.from('challenges').insert({
      title: title, description: 'Complete ' + target + ' tasks', target: target,
      progress: 0, status: 'active', participants: participants,
      participant_names: participantNames, created_by: activeId,
      created_at: new Date().toISOString()
    }).then(function(res) {
      if (res.error) console.warn('[friends] challenge error:', res.error);
    }).catch(function(err) { console.warn('[friends] challenge error:', err); });
  });
}

// ─── ACTIVITY FEED ───────────────────────────────────────
function subscribeToFeed() {
  var activeId = getActiveUserId();
  if (!activeId) return;
  if (feedUnsubscribe) { feedUnsubscribe(); feedUnsubscribe = null; }
  if (!sbClient()) return;
  loadFeed();
  feedUnsubscribe = sbWatch('activity', function() { loadFeed(); });
}

function loadFeed() {
  var sb = sbClient();
  var activeId = getActiveUserId();
  if (!sb || !activeId) return;

  var accepted = friendsData.filter(function(f) { return f.status === 'accepted'; });
  var friendIds = accepted.map(function(f) { return f.otherUserId; }).filter(Boolean);
  friendIds.push(activeId);

  sb.from('activity').select('*').order('created_at', { ascending: false }).limit(30).then(function(res) {
    if (res.error) return;
    var items = (res.data || [])
      .filter(function(r) { return friendIds.indexOf(r.user_id) !== -1; })
      .map(function(r) {
        return { id: r.id, userId: r.user_id, userName: r.user_name, avatarColor: r.avatar_color, text: r.text, createdAt: r.created_at };
      });
    renderFeed(items);
  });
}

function renderFeed(items) {
  var listEl = document.getElementById('frFeedList');
  if (!listEl) return;
  if (!items || items.length === 0) {
    listEl.innerHTML = '<div class="fr-feed-empty">Activity from friends will appear here</div>';
    return;
  }
  var html = '';
  items.forEach(function(item) {
    var time = frFormatTime(item.createdAt);
    html += '<div class="fr-feed-item">' +
      '<div class="fr-feed-avatar" style="background:' + safeColor(item.avatarColor, 'var(--accent)') + '">' +
      (item.userName ? escapeHtml(item.userName.charAt(0).toUpperCase()) : '?') + '</div>' +
      '<div class="fr-feed-body"><div class="fr-feed-text"><strong>' + escapeHtml(item.userName || 'Someone') + '</strong> ' + escapeHtml(item.text || 'did something awesome') + '</div>' +
      '<div class="fr-feed-time">' + time + '</div></div></div>';
  });
  listEl.innerHTML = html;
}

// ─── SETUP TABS ───────────────────────────────────────────
function setupTabs() {
  var tabsContainer = document.getElementById('frTabs');
  if (!tabsContainer) return;
  tabsContainer.querySelectorAll('.fr-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      tabsContainer.querySelectorAll('.fr-tab').forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      currentTab = tab.dataset.tab;
      renderFriendList();
    });
  });
}

// ─── SETUP PAGE ───────────────────────────────────────────
function setupPage() {
  dom.importFileInput = document.getElementById('drawerImportFile');
  dom.aiChatBtn = document.getElementById('aiChatBtnSidebar');
  dom.aiChatPanel = document.getElementById('aiChatPanel');
  dom.aiChatOverlay = document.getElementById('aiChatOverlay');
  dom.aiChatMessages = document.getElementById('aiChatMessages');
  dom.aiChatInput = document.getElementById('aiChatInput');
  dom.aiChatInputWrapper = document.getElementById('aiChatInputWrapper');
  dom.aiChatSend = document.getElementById('aiChatSend');
  dom.aiChatClose = document.getElementById('aiChatClose');

  dom.helpOverlay = document.getElementById('helpOverlay');
  dom.helpModal = document.getElementById('helpModal');
  dom.helpModalClose = document.getElementById('helpModalClose');
  dom.helpOverlay?.addEventListener('click', hideHelpModal);
  dom.helpModalClose?.addEventListener('click', hideHelpModal);
  populateShortcuts();

  document.getElementById('themeBtnSidebar')?.addEventListener('click', toggleTheme);
  dom.importFileInput?.addEventListener('change', importData);
  dom.aiChatBtn?.addEventListener('click', openSettingsBubble);
  dom.aiChatOverlay?.addEventListener('click', hideAIChat);
  dom.aiChatClose?.addEventListener('click', hideAIChat);
  dom.aiChatSend?.addEventListener('click', sendAIMessage);
  dom.aiChatInput?.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAIMessage(); }
  });

  setupCopyButton();
  setupAddFriend();
  setupTabs();
  setupChallenges();
  renderProfile();
  subscribeToConversations();

  if (typeof initChat === 'function') {
    initChat();
  }
}

// ─── INIT ──────────────────────────────────────────────────
function init() {
  loadState();
  applyTheme();
  applyImages();

  renderFriendCode();
  renderProfile();
  subscribeToFriends();
  subscribeToChallenges();
  subscribeToFeed();
  setupPage();

  var activeId = getActiveUserId();
  var activeUser = (typeof localUsers !== 'undefined' && activeId)
    ? localUsers.find(function(u) { return u.id === activeId; })
    : null;
  if (activeUser && typeof syncUserToProfile === 'function') {
    syncUserToProfile({
      id: activeUser.id,
      name: activeUser.name,
      picture: activeUser.picture || '',
      email: activeUser.email || '',
      _color: activeUser._color,
      authUid: activeUser.authUid || ''
    });
  }

  document.getElementById('focusToggleBtn')?.addEventListener('click', toggleFocusMode);
  document.getElementById('exportBtn')?.addEventListener('click', exportData);
  document.getElementById('importBtn')?.addEventListener('click', function() {
    document.getElementById('drawerImportFile')?.click();
  });

  var frOverlay = document.getElementById('hubSidebarOverlay');
  function closeFrSidebar() {
    var s = document.getElementById('hubSidebar');
    if (s) s.classList.remove('open');
    frOverlay?.classList.remove('active');
    var btn = document.getElementById('hubMobileMenuBtn');
    if (btn) btn.classList.remove('hidden-btn');
  }
  frOverlay?.addEventListener('click', closeFrSidebar);
  var frSidebar = document.getElementById('hubSidebar');
  frSidebar?.querySelectorAll('.hub-snav-item').forEach(function(item) {
    item.addEventListener('click', closeFrSidebar);
  });
}

if (typeof havenBoot === 'function') havenBoot(init);
else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
