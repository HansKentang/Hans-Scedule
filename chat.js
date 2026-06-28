/* ============================================
   Havën Schedule — Chat System
   Real-time messaging between friends
   ============================================ */

let chatState = {
  activeConversationId: null,
  activeFriendId: null,
  activeFriendName: '',
  conversations: [],
  messages: [],
  convUnsubscribe: null,
  msgUnsubscribe: null,
  panelOpen: false,
  _prevUnreadCounts: {},
  _isForeground: true,
  _typingTimer: null,
  _typingEmitTimer: 0,
  otherUserTyping: false,
};

function generateConversationId(uid1, uid2) {
  return uid1 < uid2 ? uid1 + '_' + uid2 : uid2 + '_' + uid1;
}

function getConversationId() {
  var activeId = getActiveUserId();
  if (!activeId || !chatState.activeFriendId) return null;
  return generateConversationId(activeId, chatState.activeFriendId);
}

// ─── GET OR CREATE CONVERSATION ──────────────────────────
function getOrCreateConversation(friendId) {
  var activeId = getActiveUserId();
  if (!activeId || !friendId) return Promise.reject('Not authenticated');

  var convId = generateConversationId(activeId, friendId);
  var db = getFirestoreDb();
  if (!db) return Promise.reject('Firestore not initialized');

  return db.collection('conversations').doc(convId).get().then(function(doc) {
    if (doc.exists) return { id: doc.id, data: doc.data() };

    return db.collection('conversations').doc(convId).set({
      participants: [activeId, friendId],
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastMessage: null,
      unreadCount: {},
    }).then(function() {
      return db.collection('conversations').doc(convId).get().then(function(newDoc) {
        return { id: newDoc.id, data: newDoc.data() };
      });
    });
  });
}

// ─── SUBSCRIBE TO CONVERSATIONS (real-time list) ────────
function subscribeToConversations() {
  var activeId = getActiveUserId();
  if (!activeId) return;

  if (chatState.convUnsubscribe) {
    chatState.convUnsubscribe();
    chatState.convUnsubscribe = null;
  }

  var db = getFirestoreDb();
  if (!db) return;

  chatState.convUnsubscribe = db.collection('conversations')
    .where('participants', 'array-contains', activeId)
    .orderBy('updatedAt', 'desc')
    .onSnapshot(function(snapshot) {
      var convs = [];
      snapshot.forEach(function(doc) {
        var data = doc.data();
        convs.push({ id: doc.id, data: data });
      });

      // Before updating, check for new unread messages to fire notifications
      if (!chatState._isForeground && convs.length > 0) {
        checkNewUnreadMessages(convs, activeId);
      }

      chatState.conversations = convs;
      renderConversationList();

      // Check typing indicator for active conversation
      if (chatState.activeConversationId && chatState.activeFriendId) {
        var activeConv = convs.find(function(c) { return c.id === chatState.activeConversationId; });
        if (activeConv) {
          checkUserTyping(activeConv.data, chatState.activeFriendId);
          renderMessages();
        }
      }

      // Also update global unread count badge
      updateUnreadBadge();
    }, function(err) {
      console.warn('[chat] conversation subscription error:', err);
    });
}

// ─── SUBSCRIBE TO MESSAGES (real-time for active conversation) ──
function subscribeToMessages(conversationId) {
  if (chatState.msgUnsubscribe) {
    chatState.msgUnsubscribe();
    chatState.msgUnsubscribe = null;
  }

  var db = getFirestoreDb();
  if (!db || !conversationId) return;

  chatState.msgUnsubscribe = db.collection('messages')
    .where('conversationId', '==', conversationId)
    .orderBy('createdAt', 'asc')
    .onSnapshot(function(snapshot) {
      var msgs = [];
      snapshot.forEach(function(doc) {
        var data = doc.data();
        msgs.push({ id: doc.id, data: data });
      });

      chatState.messages = msgs;
      renderMessages();

      // Mark as read when viewing
      markConversationAsRead(conversationId);
    }, function(err) {
      console.warn('[chat] messages subscription error:', err);
    });
}

// ─── SEND MESSAGE ─────────────────────────────────────────
function sendMessage(text) {
  var activeId = getActiveUserId();
  var convId = getConversationId();
  if (!activeId || !convId || !text.trim()) return;

  var db = getFirestoreDb();
  if (!db) return;

  var msg = {
    conversationId: convId,
    from: activeId,
    text: text.trim(),
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    readBy: [activeId],
  };

  // Add message and update conversation metadata in a batch
  var batch = db.batch();

  var msgRef = db.collection('messages').doc();
  batch.set(msgRef, msg);

  // Update conversation's lastMessage and increment unread for the other user
  var convRef = db.collection('conversations').doc(convId);
  var otherUserId = chatState.activeFriendId;

  batch.update(convRef, {
    lastMessage: {
      text: text.trim(),
      from: activeId,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    },
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    ['unreadCount.' + otherUserId]: firebase.firestore.FieldValue.increment(1),
  });

  batch.commit().catch(function(err) {
    console.warn('[chat] send message error:', err);
  });

  // Clear input
  var input = document.getElementById('chatMsgInput');
  if (input) {
    input.value = '';
    input.style.height = 'auto';
  }
}

// ─── MARK CONVERSATION AS READ ────────────────────────────
function markConversationAsRead(conversationId) {
  var activeId = getActiveUserId();
  if (!activeId || !conversationId) return;

  var db = getFirestoreDb();
  if (!db) return;

  // Track read status using a subcollection or field
  var convRef = db.collection('conversations').doc(conversationId);
  convRef.update({
    ['unreadCount.' + activeId]: 0,
    ['lastRead.' + activeId]: firebase.firestore.FieldValue.serverTimestamp(),
  }).catch(function() {});
}

// ─── GET UNREAD COUNT FOR A CONVERSATION ─────────────────
function getUnreadCount(conversation) {
  var activeId = getActiveUserId();
  if (!activeId || !conversation || !conversation.data.unreadCount) return 0;
  return conversation.data.unreadCount[activeId] || 0;
}

// ─── GET TOTAL UNREAD COUNT ───────────────────────────────
function getTotalUnreadCount() {
  var activeId = getActiveUserId();
  if (!activeId) return 0;
  var total = 0;
  for (var i = 0; i < chatState.conversations.length; i++) {
    total += getUnreadCount(chatState.conversations[i]);
  }
  return total;
}

// ─── UPDATE UNREAD BADGE ──────────────────────────────────
function updateUnreadBadge() {
  var total = getTotalUnreadCount();
  var badge = document.getElementById('chatUnreadBadge');
  if (!badge) return;
  if (total > 0) {
    badge.textContent = total > 99 ? '99+' : total;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }

  // Also update document title if needed
  var baseTitle = document.title.replace(/^\(\d+\)\s*/, '');
  if (total > 0) {
    document.title = '(' + total + ') ' + baseTitle;
  }
}

// ─── OPEN CHAT PANEL ──────────────────────────────────────
function openChatPanel(friendId, friendName) {
  var activeId = getActiveUserId();
  if (!activeId || !friendId) return;

  chatState.activeFriendId = friendId;
  chatState.activeFriendName = friendName || 'Friend';

  // Get or create conversation
  getOrCreateConversation(friendId).then(function(conv) {
    chatState.activeConversationId = conv.id;

    // Show panel
    var panel = document.getElementById('chatPanel');
    var overlay = document.getElementById('chatOverlay');
    if (!panel) return;

    panel.classList.remove('hidden');
    overlay.classList.remove('hidden');

    requestAnimationFrame(function() {
      panel.classList.add('open');
      overlay.classList.add('active');
    });

    chatState.panelOpen = true;

    // Set friend name in header
    var nameEl = document.getElementById('chatFriendName');
    if (nameEl) nameEl.textContent = friendName;

    // Subscribe to messages
    subscribeToMessages(conv.id);

    // Focus input
    setTimeout(function() {
      var input = document.getElementById('chatMsgInput');
      if (input) input.focus();
    }, 400);
  }).catch(function(err) {
    console.warn('[chat] open conversation error:', err);
  });
}

// ─── CLOSE CHAT PANEL ─────────────────────────────────────
function closeChatPanel() {
  var panel = document.getElementById('chatPanel');
  var overlay = document.getElementById('chatOverlay');

  if (panel) {
    panel.classList.remove('open');
    panel.classList.add('hidden');
  }
  if (overlay) {
    overlay.classList.remove('active');
    overlay.classList.add('hidden');
  }

  chatState.panelOpen = false;
  chatState.messages = [];
  chatState.otherUserTyping = false;

  // Clear typing indicator when closing (before nulling activeConversationId)
  clearTyping();

  if (chatState._typingTimer) {
    clearTimeout(chatState._typingTimer);
    chatState._typingTimer = null;
  }

  chatState.activeConversationId = null;

  if (chatState.msgUnsubscribe) {
    chatState.msgUnsubscribe();
    chatState.msgUnsubscribe = null;
  }
}

// ─── RENDER CONVERSATION LIST ─────────────────────────────
function renderConversationList() {
  var container = document.getElementById('chatConvList');
  if (!container) return;

  var activeId = getActiveUserId();
  if (!activeId) {
    container.innerHTML = '<div class="chat-conv-empty">Sign in to chat</div>';
    return;
  }

  if (chatState.conversations.length === 0) {
    container.innerHTML = '<div class="chat-conv-empty">No conversations yet</div>';
    return;
  }

  var html = '';
  for (var i = 0; i < chatState.conversations.length; i++) {
    var conv = chatState.conversations[i];
    var otherId = conv.data.participants.find(function(p) { return p !== activeId; });
    var unread = getUnreadCount(conv);
    var lastMsg = conv.data.lastMessage;

    html += '<div class="chat-conv-item' + (conv.id === chatState.activeConversationId ? ' active' : '') + '" data-conv-id="' + conv.id + '" data-other-id="' + otherId + '">' +
      '<div class="chat-conv-avatar" data-conv-avatar="' + otherId + '">?</div>' +
      '<div class="chat-conv-info">' +
        '<div class="chat-conv-name" data-conv-name="' + otherId + '">Loading...</div>' +
        '<div class="chat-conv-preview">' + (lastMsg ? escapeHtml(lastMsg.text) : 'No messages yet') + '</div>' +
      '</div>' +
      (unread > 0 ? '<div class="chat-conv-badge">' + (unread > 99 ? '99+' : unread) + '</div>' : '') +
    '</div>';
  }

  container.innerHTML = html;

  // Fetch display names for each conversation partner
  container.querySelectorAll('[data-conv-avatar]').forEach(function(el) {
    var otherId = el.dataset.convAvatar;
    var nameEl = el.closest('.chat-conv-item').querySelector('[data-conv-name]');
    fetchUserName(otherId, function(name, avatarColor) {
      var initials = name.split(/\s+/).slice(0, 2).map(function(s) { return s[0]; }).join('').toUpperCase() || '?';
      el.textContent = initials;
      el.style.background = avatarColor || '#b4ccbc';
      el.style.color = '#fff';
      if (nameEl) nameEl.textContent = name;
    });
  });

  // Click handler
  container.querySelectorAll('.chat-conv-item').forEach(function(item) {
    item.addEventListener('click', function() {
      var otherId = item.dataset.otherId;
      var nameEl = item.querySelector('[data-conv-name]');
      var name = nameEl ? nameEl.textContent : 'Friend';
      openChatPanel(otherId, name);
    });
  });
}

// ─── RENDER MESSAGES ──────────────────────────────────────
function renderMessages() {
  var container = document.getElementById('chatMessages');
  if (!container) return;

  var activeId = getActiveUserId();
  if (!activeId) return;

  if (chatState.messages.length === 0) {
    var emptyHtml = '<div class="chat-empty">' +
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>' +
      '<p>No messages yet</p>' +
      '<span>Send a message to start chatting</span></div>';

    // Show typing indicator even in empty state
    if (chatState.otherUserTyping) {
      emptyHtml += '<div class="chat-typing-indicator">' +
        '<span class="chat-typing-dot"></span>' +
        '<span class="chat-typing-dot"></span>' +
        '<span class="chat-typing-dot"></span>' +
        '<span class="chat-typing-label">' + escapeHtml(chatState.activeFriendName) + ' is typing...</span>' +
      '</div>';
    }

    container.innerHTML = emptyHtml;
    return;
  }

  var html = '';
  for (var i = 0; i < chatState.messages.length; i++) {
    var msg = chatState.messages[i];
    var isMine = msg.data.from === activeId;
    var timeStr = formatTimestamp(msg.data.createdAt);

    html += '<div class="chat-msg ' + (isMine ? 'chat-msg-mine' : 'chat-msg-theirs') + '">' +
      '<div class="chat-msg-bubble">' +
        '<div class="chat-msg-text">' + escapeHtml(msg.data.text) + '</div>' +
        '<div class="chat-msg-time">' + timeStr + '</div>' +
      '</div>' +
    '</div>';
  }

  // Append typing indicator if other user is typing
  if (chatState.otherUserTyping && chatState.messages.length > 0) {
    html += '<div class="chat-typing-indicator">' +
      '<span class="chat-typing-dot"></span>' +
      '<span class="chat-typing-dot"></span>' +
      '<span class="chat-typing-dot"></span>' +
      '<span class="chat-typing-label">' + escapeHtml(chatState.activeFriendName) + ' is typing...</span>' +
    '</div>';
  }

  container.innerHTML = html;

  // Scroll to bottom
  container.scrollTop = container.scrollHeight;
}

// ─── FORMAT TIMESTAMP ─────────────────────────────────────
function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  var date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  var now = new Date();
  var diff = now - date;
  var minutes = Math.floor(diff / 60000);
  var hours = Math.floor(diff / 3600000);
  var days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Now';
  if (minutes < 60) return minutes + 'm ago';
  if (hours < 24) return hours + 'h ago';
  if (days < 7) return days + 'd ago';

  var h = date.getHours();
  var m = date.getMinutes();
  var ampm = h < 12 ? 'AM' : 'PM';
  var h12 = h % 12 || 12;
  return (date.getMonth() + 1) + '/' + date.getDate() + ' ' + h12 + ':' + String(m).padStart(2, '0') + ampm;
}

// ─── FETCH USER NAME FROM FIRESTORE ──────────────────────
function fetchUserName(userId, callback) {
  var db = getFirestoreDb();
  if (!db || !userId) { callback('Unknown', '#b4ccbc'); return; }

  db.collection('users').doc(userId).get().then(function(doc) {
    if (doc.exists) {
      var data = doc.data();
      callback(data.displayName || 'Unknown', data.avatarColor || '#b4ccbc');
    } else {
      callback('Unknown', '#b4ccbc');
    }
  }).catch(function() {
    callback('Unknown', '#b4ccbc');
  });
}

// ─── TYPING INDICATOR ────────────────────────────────────
function emitTyping() {
  var activeId = getActiveUserId();
  var convId = chatState.activeConversationId;
  if (!activeId || !convId) return;

  var db = getFirestoreDb();
  if (!db) return;

  // Throttle writes: at most once every 2 seconds per conversation
  var now = Date.now();
  if (now - chatState._typingEmitTimer < 2000) return;
  chatState._typingEmitTimer = now;

  db.collection('conversations').doc(convId).update({
    ['typing.' + activeId]: firebase.firestore.FieldValue.serverTimestamp(),
  }).catch(function() {});
}

function clearTyping() {
  var activeId = getActiveUserId();
  var convId = chatState.activeConversationId;
  if (!activeId || !convId) return;

  chatState._typingEmitTimer = 0;

  var db = getFirestoreDb();
  if (!db) return;

  db.collection('conversations').doc(convId).update({
    ['typing.' + activeId]: firebase.firestore.FieldValue.delete(),
  }).catch(function() {});
}

function onChatInput() {
  var input = document.getElementById('chatMsgInput');
  if (!input) return;

  // Auto-resize textarea
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 120) + 'px';

  // Emit typing indicator
  emitTyping();

  // Clear previous debounce timer
  if (chatState._typingTimer) {
    clearTimeout(chatState._typingTimer);
  }

  // After 2 seconds of no input, clear typing indicator
  chatState._typingTimer = setTimeout(function() {
    clearTyping();
    chatState._typingTimer = null;
  }, 2000);
}

function checkUserTyping(convData, otherUserId) {
  if (!convData || !otherUserId) {
    chatState.otherUserTyping = false;
    return;
  }

  var typing = convData.typing;
  if (!typing || !typing[otherUserId]) {
    chatState.otherUserTyping = false;
    return;
  }

  var ts = typing[otherUserId];
  // If it's a Firestore Timestamp, convert to Date
  if (ts && ts.toDate) {
    var date = ts.toDate();
    var elapsed = Date.now() - date.getTime();
    // Consider typing valid for up to 4 seconds
    chatState.otherUserTyping = elapsed < 4000;
  } else {
    // If it's a boolean or other truthy value
    chatState.otherUserTyping = true;
  }
}

// ─── SETUP CHAT PANEL EVENT LISTENERS ─────────────────────
function setupChatPanel() {
  // Close overlay click
  var overlay = document.getElementById('chatOverlay');
  if (overlay) {
    overlay.addEventListener('click', closeChatPanel);
  }

  // Close button
  var closeBtn = document.getElementById('chatCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeChatPanel);
  }

  // Close button 2
  var closeBtn2 = document.getElementById('chatCloseBtn2');
  if (closeBtn2) {
    closeBtn2.addEventListener('click', closeChatPanel);
  }

  // Send message
  var sendBtn = document.getElementById('chatSendBtn');
  var input = document.getElementById('chatMsgInput');

  function doSend() {
    if (!input) return;
    var text = input.value.trim();
    if (!text) return;
    sendMessage(text);
    // Clear typing when message is sent
    clearTyping();
    if (chatState._typingTimer) {
      clearTimeout(chatState._typingTimer);
      chatState._typingTimer = null;
    }
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', doSend);
  }

  if (input) {
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        doSend();
      }
    });

    // Typing indicator + auto-resize
    input.addEventListener('input', onChatInput);

    // Clear typing on blur
    input.addEventListener('blur', function() {
      if (chatState._typingTimer) {
        clearTimeout(chatState._typingTimer);
        chatState._typingTimer = null;
      }
      clearTyping();
    });
  }
}

// ─── CHECK NEW UNREAD MESSAGES FOR NOTIFICATIONS ─────────
function checkNewUnreadMessages(convs, activeId) {
  var permission = typeof Notification !== 'undefined' && Notification.permission;
  if (permission !== 'granted') return;

  for (var i = 0; i < convs.length; i++) {
    var conv = convs[i];
    var currentUnread = getUnreadCount({ id: conv.id, data: conv.data });
    var prevUnread = chatState._prevUnreadCounts[conv.id] || 0;

    if (currentUnread > prevUnread) {
      // New messages in this conversation — fetch sender info
      var lastMsg = conv.data.lastMessage;
      if (lastMsg && lastMsg.from !== activeId) {
        fetchUserName(lastMsg.from, function(senderName) {
          var body = lastMsg.text || 'New message';
          var truncatedBody = body.length > 100 ? body.slice(0, 97) + '...' : body;
          _sendNotification(
            senderName,
            truncatedBody,
            {
              tag: 'chat-' + conv.id,
              onClick: function() {
                window.focus();
                var otherId = conv.data.participants.find(function(p) { return p !== activeId; });
                if (otherId && typeof openChatPanel === 'function') {
                  openChatPanel(otherId, senderName);
                }
              }
            }
          );
        });
      }
    }

    chatState._prevUnreadCounts[conv.id] = currentUnread;
  }
}

// ─── INIT ──────────────────────────────────────────────────
function initChat() {
  var activeId = getActiveUserId();
  if (!activeId) return;

  initFirestore();
  subscribeToConversations();
  setupChatPanel();

  // Request notification permission for chat alerts
  if (typeof requestNotifPermission === 'function') {
    requestNotifPermission();
  }

  // Track page visibility for background notification logic
  document.addEventListener('visibilitychange', function() {
    chatState._isForeground = document.visibilityState === 'visible';

    // When coming back to foreground, update prevUnreadCounts to avoid re-notifying
    if (chatState._isForeground) {
      for (var i = 0; i < chatState.conversations.length; i++) {
        var conv = chatState.conversations[i];
        chatState._prevUnreadCounts[conv.id] = getUnreadCount({ id: conv.id, data: conv.data });
      }
    }
  });

  // Also track window blur/focus for more accurate foreground detection
  window.addEventListener('focus', function() {
    chatState._isForeground = true;
    for (var i = 0; i < chatState.conversations.length; i++) {
      var conv = chatState.conversations[i];
      chatState._prevUnreadCounts[conv.id] = getUnreadCount({ id: conv.id, data: conv.data });
    }
  });
  window.addEventListener('blur', function() {
    chatState._isForeground = false;
  });

  // Set initial state
  chatState._isForeground = document.visibilityState === 'visible' && document.hasFocus();
}

// Expose globals
window.openChatPanel = openChatPanel;
window.closeChatPanel = closeChatPanel;
window.initChat = initChat;
window.chatState = chatState;
