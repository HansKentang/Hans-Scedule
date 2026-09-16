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

// Firestore collection references
function getFriendsCollection() {
  var db = getFirestoreDb();
  if (!db) return null;
  return db.collection('friends');
}

function getUserFriendsCollection(userId) {
  var db = getFirestoreDb();
  if (!db) return null;
  return db.collection('friends').where('users', 'array-contains', userId);
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
  var code = generateFriendCode(activeId);
  codeEl.textContent = code;
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

    // Don't allow adding yourself
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

    // Look up the friend code in Firestore
    initFirestore();
    var db = getFirestoreDb();
    if (!db) {
      status.textContent = 'Could not connect to server. Try again later.';
      status.className = 'fr-add-status error';
      btn.disabled = false;
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Friend';
      return;
    }

    db.collection('users').where('friendCode', '==', code).get()
      .then(function(snapshot) {
        if (snapshot.empty) {
          status.textContent = 'No user found with that friend code';
          status.className = 'fr-add-status error';
          btn.disabled = false;
          btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Friend';
          return;
        }

        var targetUser = null;
        snapshot.forEach(function(doc) { targetUser = { id: doc.id, ...doc.data() }; });

        if (!targetUser) {
          status.textContent = 'Could not find user';
          status.className = 'fr-add-status error';
          btn.disabled = false;
          btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Friend';
          return;
        }

        var friendId = targetUser.id;
        if (friendId === activeId) {
          status.textContent = "That's your own friend code!";
          status.className = 'fr-add-status error';
          btn.disabled = false;
          btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Friend';
          return;
        }

        // Check if friendship already exists
        var friendshipId = activeId < friendId ? activeId + '_' + friendId : friendId + '_' + activeId;

        db.collection('friends').doc(friendshipId).get()
          .then(function(doc) {
            if (doc.exists) {
              var existing = doc.data();
              if (existing.status === 'accepted') {
                status.textContent = 'You are already friends with ' + (targetUser.displayName || 'this user');
                status.className = 'fr-add-status error';
              } else if (existing.status === 'pending') {
                status.textContent = 'Friend request already sent. Waiting for them to accept.';
                status.className = 'fr-add-status';
              } else {
                status.textContent = 'Friendship already exists';
                status.className = 'fr-add-status error';
              }
              btn.disabled = false;
              btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Friend';
              return;
            }

            // Create friend request
            return db.collection('friends').doc(friendshipId).set({
              users: [activeId, friendId],
              status: 'pending',
              initiatedBy: activeId,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(function() {
              status.textContent = 'Friend request sent to ' + (targetUser.displayName || 'user') + '!';
              status.className = 'fr-add-status success';
              input.value = '';
              // Refresh the friend list
              subscribeToFriends();
              btn.disabled = false;
              btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Friend';
            });
          })
          .catch(function(err) {
            status.textContent = 'Error: ' + err.message;
            status.className = 'fr-add-status error';
            btn.disabled = false;
            btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Friend';
          });
      })
      .catch(function(err) {
        status.textContent = 'Error looking up code: ' + err.message;
        status.className = 'fr-add-status error';
        btn.disabled = false;
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Friend';
      });
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

  // Unsubscribe previous listener
  if (friendUnsubscribe) {
    friendUnsubscribe();
    friendUnsubscribe = null;
  }

  initFirestore();
  var db = getFirestoreDb();
  if (!db) return;

  friendUnsubscribe = db.collection('friends')
    .where('users', 'array-contains', activeId)
    .onSnapshot(function(snapshot) {
      var friends = [];
      var requests = [];
      var accepted = [];

      snapshot.forEach(function(doc) {
        var data = doc.data();
        var entry = { id: doc.id, ...data };
        // Determine the other user's ID
        var otherId = data.users.find(function(u) { return u !== activeId; });
        entry.otherUserId = otherId;

        friends.push(entry);
        if (data.status === 'pending') {
          requests.push(entry);
        } else if (data.status === 'accepted') {
          accepted.push(entry);
        }
      });

      friendsData = friends;
      friendRequestsData = requests;

      // Look up display names for each friend
      var userIds = accepted.map(function(f) { return f.otherUserId; }).filter(Boolean);
      if (userIds.length > 0) {
        Promise.all(userIds.map(function(uid) {
          return db.collection('users').doc(uid).get().then(function(doc) {
            return { id: uid, data: doc.exists ? doc.data() : null };
          }).catch(function() { return { id: uid, data: null }; });
        })).then(function(userDataList) {
          var userMap = {};
          userDataList.forEach(function(ud) { userMap[ud.id] = ud.data; });
          // Attach user data to accepted friends
          accepted.forEach(function(f) { f.userData = userMap[f.otherUserId] || null; });
          // Also for pending — look up the initiator's info
          var pendingUserIds = requests.map(function(r) {
            return r.initiatedBy === activeId ? r.otherUserId : r.initiatedBy;
          }).filter(Boolean);
          if (pendingUserIds.length > 0) {
            Promise.all(pendingUserIds.map(function(uid) {
              return db.collection('users').doc(uid).get().then(function(doc) {
                return { id: uid, data: doc.exists ? doc.data() : null };
              }).catch(function() { return { id: uid, data: null }; });
            })).then(function(pendingDataList) {
              var pendingMap = {};
              pendingDataList.forEach(function(pd) { pendingMap[pd.id] = pd.data; });
              requests.forEach(function(r) {
                var lookupId = r.initiatedBy === activeId ? r.otherUserId : r.initiatedBy;
                r.userData = pendingMap[lookupId] || null;
              });
              renderFriendList();
            });
          } else {
            renderFriendList();
          }
        });
      } else {
        renderFriendList();
      }
    }, function(err) {
      console.warn('[friends] Firestore subscription error:', err);
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

  // Count badges
  document.getElementById('frTabAllCount').textContent = friendsData.length;
  document.getElementById('frTabPendingCount').textContent = requests.length;
  document.getElementById('frTabAcceptedCount').textContent = accepted.length;

  if (totalCountEl) totalCountEl.textContent = friendsData.length + ' connections';
  if (friendCountEl) friendCountEl.textContent = accepted.length + ' friends';

  // Filter by tab
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

    // Figure out who the other person is
    var otherUser = f.userData;
    var displayName = otherUser ? (otherUser.displayName || 'Unknown') : 'Loading...';
    var initials = displayName.split(/\s+/).slice(0, 2).map(function(s) { return s[0]; }).join('').toUpperCase() || '?';
    var avatarColor = otherUser ? (otherUser.avatarColor || '#b4ccbc') : '#b4ccbc';
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

    // Actions
    html += '<div class="fr-item-actions">';
    if (isPending) {
      // If this user is the one who received the request, show accept/decline
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

  // Attach event listeners for accept/decline/remove
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
  var db = getFirestoreDb();
  if (!db) return;
  db.collection('friends').doc(friendshipId).update({
    status: 'accepted',
    acceptedAt: firebase.firestore.FieldValue.serverTimestamp()
  }).catch(function(err) {
    console.warn('[friends] accept error:', err);
  });
}

function declineFriendRequest(friendshipId) {
  var db = getFirestoreDb();
  if (!db) return;
  db.collection('friends').doc(friendshipId).delete().catch(function(err) {
    console.warn('[friends] decline error:', err);
  });
}

function removeFriend(friendshipId) {
  var db = getFirestoreDb();
  if (!db) return;
  if (!confirm('Remove this friend connection?')) return;
  db.collection('friends').doc(friendshipId).delete().catch(function(err) {
    console.warn('[friends] remove error:', err);
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
        initFirestore();
        var db = getFirestoreDb();
        if (db) db.collection('users').doc(activeId).update({ statusMessage: next }).catch(function() {});
      }
    };
  }

  initFirestore();
  var db = getFirestoreDb();
  if (db) {
    db.collection('users').doc(activeId).get().then(function(doc) {
      if (doc.exists) {
        var data = doc.data();
        var stats = data.stats || {};
        if (tasksEl) tasksEl.textContent = stats.totalTasks || 0;
        if (streakEl) streakEl.textContent = stats.currentStreak || 0;
        if (rateEl) rateEl.textContent = (stats.completionRate || 0) + '%';
        if (statusEl && data.statusMessage) statusEl.textContent = data.statusMessage;
      }
    }).catch(function() {});
  }
}

// ─── CONVERSATIONS LIST ──────────────────────────────────
function subscribeToConversations() {
  var activeId = getActiveUserId();
  if (!activeId) return;
  if (convUnsubscribe) { convUnsubscribe(); convUnsubscribe = null; }

  initFirestore();
  var db = getFirestoreDb();
  if (!db) return;

  convUnsubscribe = db.collection('conversations')
    .where('participants', 'array-contains', activeId)
    .onSnapshot(function(snapshot) {
      var convos = [];
      snapshot.forEach(function(doc) { convos.push({ id: doc.id, ...doc.data() }); });
      convos.sort(function(a, b) {
        var ta = a.updatedAt && a.updatedAt.toMillis ? a.updatedAt.toMillis() : 0;
        var tb = b.updatedAt && b.updatedAt.toMillis ? b.updatedAt.toMillis() : 0;
        return tb - ta;
      });
      renderConversations(convos);
    }, function() {});
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

  var db = getFirestoreDb();
  if (!db) return;

  var fetches = conversations.map(function(conv) {
    var otherId = conv.participants.find(function(p) { return p !== activeId; });
    return db.collection('users').doc(otherId).get().then(function(doc) {
      return { conv: conv, user: doc.exists ? doc.data() : null, otherId: otherId };
    }).catch(function() { return { conv: conv, user: null, otherId: otherId }; });
  });

  Promise.all(fetches).then(function(results) {
    var html = '';
    results.forEach(function(r) {
      var user = r.user;
      var name = user ? (user.displayName || 'Unknown') : 'Unknown';
      var initials = name.split(/\s+/).slice(0, 2).map(function(s) { return s[0]; }).join('').toUpperCase() || '?';
      var color = user ? (user.avatarColor || '#b4ccbc') : '#b4ccbc';
      var photoURL = user ? (user.photoURL || '') : '';
      var lastMsg = r.conv.lastMessage ? r.conv.lastMessage.text : 'No messages yet';
      var time = frFormatTime(r.conv.updatedAt);
      var unread = r.conv.unreadCount && r.conv.unreadCount[activeId] ? r.conv.unreadCount[activeId] : 0;

      var avatarHtml = photoURL
        ? '<img src="' + escapeHtml(photoURL) + '" alt="" style="width:100%;height:100%;object-fit:cover">'
        : '<span>' + escapeHtml(initials) + '</span>';

      html += '<div class="fr-conv-item" data-conv-friend="' + r.otherId + '" data-conv-name="' + escapeHtml(name) + '">' +
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
  if (!ts) return '';
  var then = ts.toMillis ? ts.toMillis() : (ts.seconds ? ts.seconds * 1000 : 0);
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
      entries.push({ name: f.userData.displayName || 'Unknown', tasks: f.userData.stats.totalTasks || 0, color: f.userData.avatarColor || '#b4ccbc', photoURL: f.userData.photoURL || '', isMe: false });
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
  initFirestore();
  var db = getFirestoreDb();
  if (!db) return;
  challengesUnsubscribe = db.collection('challenges')
    .where('participants', 'array-contains', activeId)
    .onSnapshot(function(snap) {
      var chs = [];
      snap.forEach(function(doc) { chs.push({ id: doc.id, ...doc.data() }); });
      chs.sort(function(a, b) {
        var ta = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
        var tb = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
        return tb - ta;
      });
      renderChallenges(chs);
    }, function() {});
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
    var activeUser = (typeof localUsers !== 'undefined' && activeId) ? localUsers.find(function(u) { return u.id === activeId; }) : null;
    if (activeUser) participantNames.push(activeUser.name || 'User');
    accepted.forEach(function(f) {
      participants.push(f.otherUserId);
      if (f.userData) participantNames.push(f.userData.displayName || 'Unknown');
    });

    initFirestore();
    var db = getFirestoreDb();
    if (!db) return;
    db.collection('challenges').add({
      title: title, description: 'Complete ' + target + ' tasks', target: target,
      progress: 0, status: 'active', participants: participants,
      participantNames: participantNames, createdBy: activeId,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(function(err) { console.warn('[friends] challenge error:', err); });
  });
}

// ─── ACTIVITY FEED ───────────────────────────────────────
function subscribeToFeed() {
  var activeId = getActiveUserId();
  if (!activeId) return;
  if (feedUnsubscribe) { feedUnsubscribe(); feedUnsubscribe = null; }
  initFirestore();
  var db = getFirestoreDb();
  if (!db) return;

  var accepted = friendsData.filter(function(f) { return f.status === 'accepted'; });
  var friendIds = accepted.map(function(f) { return f.otherUserId; }).filter(Boolean);
  friendIds.push(activeId);

  feedUnsubscribe = db.collection('activity')
    .orderBy('createdAt', 'desc')
    .limit(30)
    .onSnapshot(function(snap) {
      var items = [];
      snap.forEach(function(doc) {
        var d = doc.data();
        if (friendIds.indexOf(d.userId) !== -1) items.push({ id: doc.id, ...d });
      });
      renderFeed(items);
    }, function() {});
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
      '<div class="fr-feed-avatar" style="background:' + (item.avatarColor || 'var(--accent)') + '">' +
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

  // Ensure this user's profile + friend code exist in Firestore
  var activeId = getActiveUserId();
  var activeUser = (typeof localUsers !== 'undefined' && activeId)
    ? localUsers.find(function(u) { return u.id === activeId; })
    : null;
  if (activeUser && typeof syncUserToFirestore === 'function') {
    syncUserToFirestore({
      id: activeUser.id,
      name: activeUser.name,
      picture: activeUser.picture || '',
      _color: activeUser._color
    });
  }

  document.getElementById('focusToggleBtn')?.addEventListener('click', toggleFocusMode);
  document.getElementById('exportBtn')?.addEventListener('click', exportData);
  document.getElementById('importBtn')?.addEventListener('click', function() {
    document.getElementById('drawerImportFile')?.click();
  });

  // Mobile sidebar overlay + nav item close (shared handler in shared.js handles toggle)
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

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
