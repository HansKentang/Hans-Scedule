#!/usr/bin/env python3
"""Cleanup sync system - removes cloud sync code from gsi.js, shared.js"""
import os, re

ROOT = r"C:\Users\ASUS\AI Apps\Hans Scedule"

def clean_gsi():
    path = os.path.join(ROOT, "gsi.js")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    changes = []
    
    # 1. Remove initCloudSync call in handleFirebaseUser
    content = content.replace(
        "  // Initialize cloud sync for Google-authenticated users\n"
        "  if (typeof initCloudSync === 'function') {\n"
        "    initCloudSync(user.id);\n"
        "  }\n"
        "  showToast('Signed in as ",
        "  showToast('Signed in as "
    )
    changes.append("handleFirebaseUser initCloudSync")
    
    # 2. Remove initCloudSync/stopCloudSync in switchAccount
    content = content.replace(
        "  // Initialize cloud sync for Google-authenticated users\n"
        "  var isGoogleUser = id.indexOf('firebase-') === 0;\n"
        "  if (isGoogleUser && typeof initCloudSync === 'function') {\n"
        "    initCloudSync(id);\n"
        "  } else if (typeof stopCloudSync === 'function') {\n"
        "    stopCloudSync();\n"
        "  }\n"
        "  showToast('Switched to ",
        "  showToast('Switched to "
    )
    changes.append("switchAccount initCloudSync")
    
    # 3. Remove clearCloudData/stopCloudSync in removeProfile
    content = content.replace(
        "  // Clear cloud sync data\n"
        "  if (typeof clearCloudData === 'function') {\n"
        "    clearCloudData(id);\n"
        "  }\n"
        "  if (typeof stopCloudSync === 'function') {\n"
        "    stopCloudSync();\n"
        "  }\n"
        "  var active = getActiveUserId();",
        "  var active = getActiveUserId();"
    )
    changes.append("removeProfile clearCloudData")
    
    # 4. Remove initCloudSync in initGSI
    content = content.replace(
        "  // Initialize cloud sync after auth confirmation\n"
        "  var isGoogleUser = activeId && activeId.indexOf('firebase-') === 0;\n"
        "  if (isGoogleUser && typeof initCloudSync === 'function') {\n"
        "    initCloudSync(activeId);\n"
        "  }\n"
        "\n"
        "  // Initialize chat badge for unread message count",
        "  // Initialize chat badge for unread message count"
    )
    changes.append("initGSI initCloudSync")
    
    # 5. Remove the entire sync status HTML block
    # Find the syncHtml block - it starts with "// Build sync status HTML" comment
    sync_start = "  // Build sync status HTML"
    # The syncHtml + line appears in the template. Let's find and remove the whole block
    # from the comment to the end of the if (syncStatus) { } block
    
    # Use regex to find and remove the sync status HTML block
    # Pattern: from "// Build sync status HTML" to the closing brace of the last sync-related block
    pattern = re.compile(
        r"  // Build sync status HTML\n"
        r"  var syncStatus = typeof getCloudSyncStatus === 'function' \? getCloudSyncStatus\(\) : null;\n"
        r"  var syncHtml = '';\n"
        r"  if \(syncStatus\) \{\n"
        r"(?:.*?\n)*?"
        r"  \}\n",
        re.DOTALL
    )
    match = pattern.search(content)
    if match:
        content = content[:match.start()] + content[match.end():]
        changes.append("sync status HTML block")
    else:
        print("WARN: Could not find sync status HTML block via regex")
        # Try manual approach
        lines = content.split("\n")
        new_lines = []
        i = 0
        in_sync_block = False
        depth = 0
        while i < len(lines):
            line = lines[i]
            if "// Build sync status HTML" in line:
                in_sync_block = True
                depth = 1  # Start with 1 for the if (syncStatus) {
                i += 1
                continue
            if in_sync_block:
                for ch in line:
                    if ch == "{": depth += 1
                    if ch == "}": depth -= 1
                if depth <= 0:
                    in_sync_block = False
                    # Also skip the blank line after
                    if i + 1 < len(lines) and lines[i+1].strip() == "":
                        i += 1
                    i += 1
                    continue
                i += 1
                continue
            new_lines.append(line)
            i += 1
        if len(new_lines) != len(lines):
            content = "\n".join(new_lines)
            changes.append("sync status HTML block (manual)")
    
    # 6. Remove + syncHtml + from the innerHTML template
    # The pattern is: \n      syncHtml +\n    '</div>' + ... 
    # We need to remove this line
    lines = content.split("\n")
    new_lines = []
    skip_next_blank = False
    for line in lines:
        if line.strip() == "syncHtml +":
            skip_next_blank = True
            continue
        if skip_next_blank and line.strip() == "":
            skip_next_blank = False
            continue
        new_lines.append(line)
    content = "\n".join(new_lines)
    changes.append("syncHtml + line from template")
    
    # 7. Remove syncNowBtn event listener
    content = content.replace(
        "\n  // Sync Now button\n"
        "  document.getElementById('syncNowBtn')?.addEventListener('click', function() {\n"
        "    if (typeof triggerSyncNow === 'function') triggerSyncNow();\n"
        "  });",
        ""
    )
    changes.append("syncNowBtn listener")
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    
    print(f"gsi.js: {len(changes)} changes made: {', '.join(changes)}")

def clean_shared():
    path = os.path.join(ROOT, "shared.js")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    changes = []
    
    # 1. Remove CLOUD_STORE write mirroring code from localStorage.setItem override
    # Find this section and remove the CLOUD_STORE conditional block
    old_ls_set = (
        "  localStorage.setItem = function(key, val) {\n"
        "    var pKey = _p(key);\n"
        "    __origLS.setItem(pKey, val);\n"
        "    if (typeof CLOUD_STORE !== 'undefined') {\n"
        "      if (CLOUD_STORE._writeLock > 0) {\n"
        "        // During initialization/poll, stash writes so they're not lost\n"
        "        CLOUD_STORE._deferredQueue[pKey] = val;\n"
        "      } else {\n"
        "        _queueCloudWrite(pKey, val);\n"
        "      }\n"
        "    }\n"
        "  };"
    )
    new_ls_set = (
        "  localStorage.setItem = function(key, val) {\n"
        "    var pKey = _p(key);\n"
        "    __origLS.setItem(pKey, val);\n"
        "  };"
    )
    if old_ls_set in content:
        content = content.replace(old_ls_set, new_ls_set)
        changes.append("removed CLOUD_STORE writes from localStorage.setItem")
    
    # 2. Remove the entire CLOUD_STORE section (var CLOUD_STORE through window exports)
    # From "// ─── CLOUD STORAGE — Firestore-backed cloud storage ─────────────" to just after "window._flushCloudWrites = _flushCloudWrites;"
    old_cloud_comment = "// ─── CLOUD STORAGE — Firestore-backed cloud storage ─────────────"
    cloud_end_marker = "window._flushCloudWrites = _flushCloudWrites;"
    
    start_idx = content.find(old_cloud_comment)
    end_idx = content.find(cloud_end_marker)
    if start_idx >= 0 and end_idx >= 0:
        end_idx = end_idx + len(cloud_end_marker)
        # Remove from start to end+1 (to include the newline after)
        content = content[:start_idx] + content[end_idx:]
        changes.append("removed entire CLOUD_STORE section")
    else:
        print(f"WARN: Could not find CLOUD_STORE section in shared.js (start={start_idx}, end={end_idx})")
    
    # 3. Remove the cloud-sync-changed event listener at the bottom of the file
    # Find "// ─── CLOUD SYNC UI RE-RENDERER ─────────────────────────"
    old_cloud_ui = "// ─── CLOUD SYNC UI RE-RENDERER ─────────────────────────"
    start_ui = content.find(old_cloud_ui)
    if start_ui >= 0:
        # Find the next section marker after this one
        rest = content[start_ui:]
        # Find the end of the listener function
        # Look for the closing of the event listener callback
        # The pattern is: window.addEventListener('cloud-sync-changed', function(ev) { ... settings ... });
        # We need to find the next section comment or the end of this function
        lines = rest.split("\n")
        depth = 0
        found_listener = False
        end_line = 0
        for i, line in enumerate(lines):
            if "window.addEventListener('cloud-sync-changed'" in line:
                found_listener = True
                depth = 1  # the opening { of the callback literal
            if found_listener:
                # Count braces
                for ch in line:
                    if ch == "{": depth += 1
                    if ch == "}": depth -= 1
                if depth <= 0 and i > 0:
                    end_line = i + 1  # include this line (the });)
                    break
        if found_listener and end_line > 0:
            end_ui = start_ui
            for i in range(end_line + 1):
                end_ui = content.find("\n", end_ui) + 1
                if end_ui == 0:
                    break
            content = content[:start_ui] + content[end_ui:]
            changes.append("removed cloud-sync-changed UI re-renderer")
        else:
            print("WARN: Could not find end of cloud-sync-changed listener in shared.js")
    
    # 4. Remove the line "      syncHtml +" from the gsi.js-related code (already done in gsi.js)
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    
    print(f"shared.js: {len(changes)} changes made: {', '.join(changes)}")

if __name__ == "__main__":
    clean_gsi()
    print("---")
    clean_shared()
