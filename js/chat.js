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

function mapConversationRow(r) {
  return {
    id: r.id,
    data: {
      participants: r.participants || [],
      lastMessage: r.last_message || null,
      unreadCount: r.unread_count || {},
      lastRead: r.last_read || {},
      typing: r.typing || {},
      updatedAt: r.updated_at,
      createdAt: r.created_at
    }
  };
}

// ─── GET OR CREATE CONVERSATION ──────────────────────────
function getOrCreateConversation(friendId) {
  var activeId = getActiveUserId();
  if (!activeId || !friendId) return Promise.reject('Not authenticated');

  var convId = generateConversationId(activeId, friendId);
  var sb = getSupabaseDb();
  if (!sb) return Promise.reject('Supabase not initialized');

  return sb.from('conversations').select('*').eq('id', convId).maybeSingle().then(function(res) {
    if (res.error) throw res.error;
    if (res.data) return mapConversationRow(res.data);

    var now = new Date().toISOString();
    return sb.from('conversations').insert({
      id: convId,
      participants: [activeId, friendId],
      last_message: null,
      unread_count: {},
      created_at: now,
      updated_at: now
    }).then(function(ires) {
      if (ires.error) throw ires.error;
      return {
        id: convId,
        data: { participants: [activeId, friendId], lastMessage: null, unreadCount: {}, updatedAt: now }
      };
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

  var sb = getSupabaseDb();
  if (!sb) return;

  loadConversations();
  chatState.convUnsubscribe = sbWatch('conversations', function() { loadConversations(); });
}

function loadConversations() {
  var sb = getSupabaseDb();
  var activeId = getActiveUserId();
  if (!sb || !activeId) return;

  sb.from('conversations').select('*').contains('participants', [activeId]).then(function(res) {
    if (res.error) {
      console.warn('[chat] conversation load error:', res.error);
      return;
    }
    var convs = (res.data || []).map(mapConversationRow);
    convs.sort(function(a, b) { return tsMillis(b.data.updatedAt) - tsMillis(a.data.updatedAt); });

    if (!chatState._isForeground && convs.length > 0) {
      checkNewUnreadMessages(convs, activeId);
    }

    chatState.conversations = convs;
    renderConversationList();

    if (chatState.activeConversationId && chatState.activeFriendId) {
      var activeConv = convs.find(function(c) { return c.id === chatState.activeConversationId; });
      if (activeConv) {
        checkUserTyping(activeConv.data, chatState.activeFriendId);
        renderMessages();
      }
    }

    updateUnreadBadge();
  });
}

// ─── SUBSCRIBE TO MESSAGES (real-time for active conversation) ──
function subscribeToMessages(conversationId) {
  if (chatState.msgUnsubscribe) {
    chatState.msgUnsubscribe();
    chatState.msgUnsubscribe = null;
  }

  var sb = getSupabaseDb();
  if (!sb || !conversationId) return;

  loadMessages(conversationId);

  var channel = sb.channel('haven-messages-' + conversationId + '-' + Math.random().toString(36).slice(2));
  channel.on('postgres_changes', {
    event: '*', schema: 'public', table: 'messages', filter: 'conversation_id=eq.' + conversationId
  }, function() { loadMessages(conversationId); }).subscribe();

  chatState.msgUnsubscribe = function() {
    try { sb.removeChannel(channel); } catch (e) {}
  };
}

function loadMessages(conversationId) {
  var sb = getSupabaseDb();
  if (!sb || !conversationId) return;

  sb.from('messages').select('*').eq('conversation_id', conversationId)
    .order('created_at', { ascending: true }).then(function(res) {
      if (res.error) {
        console.warn('[chat] messages load error:', res.error);
        return;
      }
      chatState.messages = (res.data || []).map(function(r) {
        return {
          id: r.id,
          data: {
            conversationId: r.conversation_id,
            from: r.sender_id,
            text: r.text,
            readBy: r.read_by || [],
            createdAt: r.created_at
          }
        };
      });
      renderMessages();
      markConversationAsRead(conversationId);
    });
}

// ─── SEND MESSAGE ─────────────────────────────────────────
function sendMessage(text) {
  var activeId = getActiveUserId();
  var convId = getConversationId();
  if (!activeId || !convId || !text.trim()) return;

  var sb = getSupabaseDb();
  if (!sb) return;

  var trimmed = text.trim();
  var now = new Date().toISOString();
  var otherUserId = chatState.activeFriendId;

  var conv = chatState.conversations.find(function(c) { return c.id === convId; });
  var unread = Object.assign({}, (conv && conv.data.unreadCount) || {});
  unread[otherUserId] = (unread[otherUserId] || 0) + 1;

  sb.from('messages').insert({
    conversation_id: convId,
    sender_id: activeId,
    text: trimmed,
    read_by: [activeId],
    created_at: now
  }).then(function(res) {
    if (res.error) {
      console.warn('[chat] send message error:', res.error);
      return;
    }
    return sb.from('conversations').update({
      last_message: { text: trimmed, from: activeId, timestamp: now },
      updated_at: now,
      unread_count: unread
    }).eq('id', convId);
  }).catch(function(err) {
    console.warn('[chat] send message error:', err);
  });

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

  var sb = getSupabaseDb();
  if (!sb) return;

  var conv = chatState.conversations.find(function(c) { return c.id === conversationId; });
  var unread = Object.assign({}, (conv && conv.data.unreadCount) || {});
  if (!unread[activeId]) return;

  unread[activeId] = 0;
  var lastRead = Object.assign({}, (conv && conv.data.lastRead) || {});
  lastRead[activeId] = new Date().toISOString();

  sb.from('conversations').update({
    unread_count: unread,
    last_read: lastRead
  }).eq('id', conversationId).then(function() {}).catch(function() {});
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

  getOrCreateConversation(friendId).then(function(conv) {
    chatState.activeConversationId = conv.id;

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

    var nameEl = document.getElementById('chatFriendName');
    if (nameEl) nameEl.textContent = friendName;

    subscribeToMessages(conv.id);

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

  if (chatState.otherUserTyping && chatState.messages.length > 0) {
    html += '<div class="chat-typing-indicator">' +
      '<span class="chat-typing-dot"></span>' +
      '<span class="chat-typing-dot"></span>' +
      '<span class="chat-typing-dot"></span>' +
      '<span class="chat-typing-label">' + escapeHtml(chatState.activeFriendName) + ' is typing...</span>' +
    '</div>';
  }

  container.innerHTML = html;
  container.scrollTop = container.scrollHeight;
}

// ─── FORMAT TIMESTAMP ─────────────────────────────────────
function formatTimestamp(timestamp) {
  var ms = tsMillis(timestamp);
  if (!ms) return '';
  var date = new Date(ms);
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

// ─── FETCH USER NAME FROM SUPABASE ───────────────────────
function fetchUserName(userId, callback) {
  var sb = getSupabaseDb();
  if (!sb || !userId) { callback('Unknown', '#b4ccbc'); return; }

  sb.from('profiles_public').select('*').eq('id', userId).maybeSingle().then(function(res) {
    if (res.error || !res.data) { callback('Unknown', '#b4ccbc'); return; }
    var p = mapProfileRow(res.data);
    callback(p.displayName || 'Unknown', p.avatarColor || '#b4ccbc');
  }).catch(function() {
    callback('Unknown', '#b4ccbc');
  });
}

// ─── TYPING INDICATOR ────────────────────────────────────
function emitTyping() {
  var activeId = getActiveUserId();
  var convId = chatState.activeConversationId;
  if (!activeId || !convId) return;

  var sb = getSupabaseDb();
  if (!sb) return;

  var now = Date.now();
  if (now - chatState._typingEmitTimer < 2000) return;
  chatState._typingEmitTimer = now;

  var conv = chatState.conversations.find(function(c) { return c.id === convId; });
  var typing = Object.assign({}, (conv && conv.data.typing) || {});
  typing[activeId] = new Date().toISOString();

  sb.from('conversations').update({ typing: typing }).eq('id', convId).then(function() {}).catch(function() {});
}

function clearTyping() {
  var activeId = getActiveUserId();
  var convId = chatState.activeConversationId;
  if (!activeId || !convId) return;

  chatState._typingEmitTimer = 0;

  var sb = getSupabaseDb();
  if (!sb) return;

  var conv = chatState.conversations.find(function(c) { return c.id === convId; });
  var typing = Object.assign({}, (conv && conv.data.typing) || {});
  if (!typing[activeId]) return;
  delete typing[activeId];

  sb.from('conversations').update({ typing: typing }).eq('id', convId).then(function() {}).catch(function() {});
}

function onChatInput() {
  var input = document.getElementById('chatMsgInput');
  if (!input) return;

  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 120) + 'px';

  emitTyping();

  if (chatState._typingTimer) {
    clearTimeout(chatState._typingTimer);
  }

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

  var ms = tsMillis(typing[otherUserId]);
  chatState.otherUserTyping = ms ? (Date.now() - ms < 4000) : true;
}

// ─── SETUP CHAT PANEL EVENT LISTENERS ─────────────────────
function setupChatPanel() {
  var overlay = document.getElementById('chatOverlay');
  if (overlay) {
    overlay.addEventListener('click', closeChatPanel);
  }

  var closeBtn = document.getElementById('chatCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeChatPanel);
  }

  var closeBtn2 = document.getElementById('chatCloseBtn2');
  if (closeBtn2) {
    closeBtn2.addEventListener('click', closeChatPanel);
  }

  var sendBtn = document.getElementById('chatSendBtn');
  var input = document.getElementById('chatMsgInput');

  function doSend() {
    if (!input) return;
    var text = input.value.trim();
    if (!text) return;
    sendMessage(text);
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

    input.addEventListener('input', onChatInput);

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

  subscribeToConversations();
  setupChatPanel();

  if (typeof requestNotifPermission === 'function') {
    requestNotifPermission();
  }

  document.addEventListener('visibilitychange', function() {
    chatState._isForeground = document.visibilityState === 'visible';

    if (chatState._isForeground) {
      for (var i = 0; i < chatState.conversations.length; i++) {
        var conv = chatState.conversations[i];
        chatState._prevUnreadCounts[conv.id] = getUnreadCount({ id: conv.id, data: conv.data });
      }
    }
  });

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

  chatState._isForeground = document.visibilityState === 'visible' && document.hasFocus();
}

window.openChatPanel = openChatPanel;
window.closeChatPanel = closeChatPanel;
window.initChat = initChat;
window.chatState = chatState;
