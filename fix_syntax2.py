with open('shared.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix: replace the empty 'if (e.key === 'Escape') {' with proper code
# The problematic block:
#   if (e.key === 'Escape') {\n
#     \n
#     else if (state.aiChatOpen) hideAIChat();\n
#     else if (state.taskModalOpen) hideTaskModal();\n
#     else if (state.helpModalOpen) hideHelpModal();\n
#   }
# Should be:
#   if (e.key === 'Escape') {\n
#     if (state.aiChatOpen) hideAIChat();\n
#     else if (state.taskModalOpen) hideTaskModal();\n
#     else if (state.helpModalOpen) hideHelpModal();\n
#   }

old = "  if (e.key === 'Escape') {\n\n    else if (state.aiChatOpen) hideAIChat();\n    else if (state.taskModalOpen) hideTaskModal();\n    else if (state.helpModalOpen) hideHelpModal();\n  }"
new = "  if (e.key === 'Escape') {\n    if (state.aiChatOpen) hideAIChat();\n    else if (state.taskModalOpen) hideTaskModal();\n    else if (state.helpModalOpen) hideHelpModal();\n  }"

if old in content:
    content = content.replace(old, new, 1)
    with open('shared.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed!")
else:
    print("Pattern not found")
    # Search for nearby text
    idx = content.find("if (e.key === 'Escape')")
    if idx >= 0:
        print(f"Found at {idx}")
        print(repr(content[idx:idx+200]))
