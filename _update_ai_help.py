#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Update AI panel to sliding drawer and improve Help modal across all pages."""
import sys
import os

# Force UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

os.chdir(os.path.dirname(os.path.abspath(__file__)))

# New AI panel HTML block (no special chars in the script itself)
AI_PANEL_HTML = r'''  <!-- AI CHAT PANEL (right-side drawer) -->
  <div id="aiChatOverlay" class="ai-panel-overlay hidden"></div>
  <div id="aiChatPanel" class="ai-panel hidden" role="dialog" aria-label="AI Assistant">
    <div class="ai-panel-header">
      <div class="ai-panel-header-left">
        <div class="ai-panel-avatar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a10 10 0 1010 10 10 10 0 00-10-10z"/><path d="M12 6v6l4 2"/>
          </svg>
        </div>
        <div>
          <div class="ai-panel-title">Haven AI</div>
          <div class="ai-panel-subtitle">Schedule assistant</div>
        </div>
      </div>
      <div class="ai-panel-header-actions">
        <button id="aiChatSettingsBtn" class="ai-panel-icon-btn" title="Settings" onclick="openSettingsDrawer()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
        </button>
        <button id="aiChatClose" class="ai-panel-icon-btn" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
    <div class="ai-panel-body">
      <div class="ai-messages" id="aiChatMessages"></div>
    </div>
    <div class="ai-panel-footer">
      <div class="ai-input-wrapper" id="aiChatInputWrapper">
        <input type="text" id="aiChatInput" class="ai-input" placeholder="Ask about your schedule..." autocomplete="off">
        <button id="aiChatSend" class="ai-send-btn show" aria-label="Send">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
      <div class="ai-panel-footer-hint">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1010 10 10 10 0 00-10-10z"/><path d="M12 6v6l4 2"/></svg>
        <span>Natural language scheduling</span>
      </div>
    </div>
  </div>'''

# Improved help modal HTML
HELP_MODAL_HTML = r'''    <!-- HELP MODAL -->
    <div id="helpOverlay" class="overlay hidden"></div>
    <div id="helpModal" class="modal modal-sm hidden" role="dialog" aria-label="Help and Shortcuts">
      <div class="modal-header">
        <h3>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Help and Shortcuts
        </h3>
        <button id="helpModalClose" class="btn btn-ghost modal-close" aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="help-section">
          <div class="help-section-title">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01"/></svg>
            Keyboard Shortcuts
          </div>
          <div class="shortcuts-grid" id="helpShortcutsGrid"></div>
        </div>
        <div class="help-section">
          <div class="help-section-title">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            Tips and Tricks
          </div>
          <div class="help-tips">
            <div class="help-tip">
              <span class="help-tip-icon">bulb</span>
              <div class="help-tip-text">Type natural language in the command palette (Ctrl+K) to schedule tasks</div>
            </div>
            <div class="help-tip">
              <span class="help-tip-icon">loop</span>
              <div class="help-tip-text">Drag tasks to reschedule - other tasks automatically shift to avoid conflicts</div>
            </div>
            <div class="help-tip">
              <span class="help-tip-icon">paperclip</span>
              <div class="help-tip-text">Attach images to AI chat for visual analysis of schedules and screenshots</div>
            </div>
            <div class="help-tip">
              <span class="help-tip-icon">target</span>
              <div class="help-tip-text">Press F to toggle Focus Mode - hides sidebar and reduces visual clutter</div>
            </div>
          </div>
        </div>
      </div>
    </div>'''

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  Wrote {path}")

# Read schedule.html and extract old patterns
schedule_content = read_file('schedule.html')

# Find old AI chat modal block
ai_start = schedule_content.find('<div id="aiChatOverlay" class="overlay hidden">')
print(f"AI overlay start: {ai_start}")
if ai_start >= 0:
    ai_modal_start = schedule_content.find('<div id="aiChatModal"', ai_start)
    # Find the closing div of aiChatModal - count nesting
    depth = 0
    ai_end = ai_modal_start
    for i in range(ai_modal_start, len(schedule_content)):
        if schedule_content[i:i+4] == '<!--':
            end_comment = schedule_content.find('-->', i)
            if end_comment >= 0:
                i = end_comment + 3
                continue
        if schedule_content[i:i+6] == '<div ' or schedule_content[i:i+5] == '<div>':
            depth += 1
        elif schedule_content[i:i+6] == '</div>':
            depth -= 1
            if depth == 1:
                ai_end = i + 6
                break
    
    old_ai_block = schedule_content[ai_start:ai_end]
    print(f"Old AI block: {len(old_ai_block)} chars")
    
    # Also find the textarea version in other pages
    ai_start2 = schedule_content.find('<div id="aiChatOverlay" class="overlay hidden">')
    ai_modal_start2 = schedule_content.find('<div id="aiChatModal"', ai_start2)
    # Find by looking for the pattern more carefully
    # The old block ends with two </div> close tags after the modal-content div
    search_from = ai_modal_start2
    close_count = 0
    pos = search_from
    while pos < len(schedule_content):
        if schedule_content[pos:pos+4] == '<!--':
            end_c = schedule_content.find('-->', pos)
            if end_c >= 0:
                pos = end_c + 3
                continue
        if schedule_content[pos:pos+5] == '</div>':
            close_count += 1
            if close_count == 2:
                ai_end = pos + 6
                break
        pos += 1
    
    old_ai_block = schedule_content[ai_start:ai_end]
    print(f"Old AI block (method 2): {len(old_ai_block)} chars")

# Find old help modal block
help_start = schedule_content.find('<div id="helpOverlay" class="overlay hidden">')
old_help_block = None
if help_start >= 0:
    help_next = schedule_content.find('<div id="helpModal"', help_start)
    if help_next >= 0:
        close_count = 0
        pos = help_next
        while pos < len(schedule_content):
            if schedule_content[pos:pos+5] == '</div>':
                close_count += 1
                if close_count == 3:
                    help_end = pos + 6
                    break
            pos += 1
        if 'help_end' in dir() or 'help_end' in locals():
            old_help_block = schedule_content[help_start:help_end]
            print(f"Old help block: {len(old_help_block)} chars")
        else:
            print("Could not find help modal end")
    else:
        print("No helpModal found after helpOverlay")
else:
    print("No help overlay found in schedule.html")

# Update schedule.html
updated = schedule_content.replace(old_ai_block, AI_PANEL_HTML, 1)
if old_help_block:
    updated = updated.replace(old_help_block, HELP_MODAL_HTML, 1)
write_file('schedule.html', updated)
print("  Updated schedule.html")

# Update activities.html, analytics.html, tags.html
for fname in ['activities.html', 'analytics.html', 'tags.html']:
    content = read_file(fname)
    
    # Find and replace AI chat modal
    start = content.find('<div id="aiChatOverlay" class="overlay hidden">')
    if start >= 0:
        modal_start = content.find('<div id="aiChatModal"', start)
        # Count 2 closing divs
        close_count = 0
        pos = modal_start
        while pos < len(content):
            if content[pos:pos+4] == '<!--':
                end_c = content.find('-->', pos)
                if end_c >= 0:
                    pos = end_c + 3
                    continue
            if content[pos:pos+5] == '</div>':
                close_count += 1
                if close_count == 2:
                    end = pos + 6
                    break
            pos += 1
        old_block = content[start:end]
        content = content.replace(old_block, AI_PANEL_HTML, 1)
        print(f"  Replaced AI modal in {fname}")
    else:
        print(f"  No AI overlay in {fname}")
    
    # Add or replace help modal
    if '<div id="helpOverlay"' not in content:
        # Insert before AI panel
        insert_at = content.find('<!-- AI CHAT PANEL')
        if insert_at < 0:
            insert_at = content.find('</body>')
        content = content[:insert_at] + HELP_MODAL_HTML + '\n\n' + content[insert_at:]
        print(f"  Added help modal to {fname}")
    else:
        help_start2 = content.find('<div id="helpOverlay"')
        help_next2 = content.find('<div id="helpModal"', help_start2)
        if help_next2 >= 0:
            close_count = 0
            pos = help_next2
            while pos < len(content):
                if content[pos:pos+5] == '</div>':
                    close_count += 1
                    if close_count == 3:
                        end = pos + 6
                        break
                pos += 1
            old_help2 = content[help_start2:end]
            content = content.replace(old_help2, HELP_MODAL_HTML, 1)
            print(f"  Replaced help modal in {fname}")
    
    write_file(fname, content)

print("\nDone!")
