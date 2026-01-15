# VS Code Settings for Testing DomainLang

When debugging the extension, you may need to configure the **Extension Development Host** window settings.

## Quick Fix for AI Completions

If you see gray "ghost text" suggestions that aren't valid DomainLang syntax, that's **GitHub Copilot or AI IntelliCode**, not our LSP.

### Option 1: Disable Copilot for .dlang (Recommended)

In the Extension Development Host window:

1. Open Command Palette (⇧⌘P)
2. Type "Preferences: Open User Settings (JSON)"
3. Add this:

```json
{
    "github.copilot.enable": {
        "*": true,
        "dlang": false
    }
}
```

### Option 2: Disable Inline Suggestions Temporarily

Click the **ghost text** and it will show "Accept Tab / Accept Word ⌘→"

- Press **Escape** to dismiss
- Or click the Copilot icon in status bar → "Disable Completions for dlang"

### Option 3: Use Workspace Settings (Already Configured)

The workspace at `dsl/domain-lang/.vscode/settings.json` already disables Copilot for .dlang files.

**In Extension Development Host:**
1. File → Open (`dsl/domain-lang/` folder)
2. Settings will auto-apply
3. Reload window (⇧⌘P → "Reload Window")

## Verify It's Working

### ✅ What You SHOULD See (Our LSP):

When you press **Ctrl+Space**:
- Completion **dropdown list** appears
- Shows: `description`, `vision`, `classification`, `Domain`, `bc`, etc.
- Icons show: 📝 (Snippet) or 🔑 (Keyword)

### ❌ What You SHOULDN'T See (AI Suggestions):

- Gray ghost text appearing automatically as you type
- Suggestions like "subdomain", "includes", "module", etc.
- "Accept Tab / Accept Word" hints

## Testing

1. **Restart Extension Development Host** (⇧⌘F5, then F5)
2. Create a test file: `test.dlang`
3. Type:
   ```dlang
   Domain Test {
       
   }
   ```
4. Put cursor in blank line, press **Ctrl+Space**
5. Should see dropdown with: `description`, `vision`, `classification`
6. **Should NOT see** gray ghost text appearing automatically

## Still Seeing AI Suggestions?

Check these:

### In Extension Development Host:

1. **Status bar** (bottom) - Look for Copilot icon
2. Click it → "Disable Completions for dlang"

### In your User Settings:

1. ⌘, to open settings
2. Search: "inline suggest"
3. Uncheck "Editor › Inline Suggest: Enabled" for dlang

### Global Copilot Settings:

```json
{
    // In User Settings (JSON)
    "github.copilot.enable": {
        "*": true,
        "plaintext": false,
        "markdown": false,
        "dlang": false
    }
}
```

## Why This Happens

GitHub Copilot and VS Code IntelliCode use AI to predict what you'll type next. They show:
- **Gray inline text** (ghost text) as you type
- Suggestions based on patterns from GitHub repos
- Often suggest invalid syntax because DomainLang is custom

Our **LSP completion provider** is different:
- Only shows suggestions when you press **Ctrl+Space**
- Based on actual grammar rules
- Context-aware and validated

## Summary

| Feature | AI (Copilot) | Our LSP |
|---------|--------------|---------|
| Trigger | Automatic while typing | Ctrl+Space |
| Display | Gray ghost text | Dropdown list |
| Accuracy | Guesses from patterns | Grammar-validated |
| For .dlang | ❌ Disable | ✅ Enable |

After configuring, you should **only** see our LSP suggestions when you explicitly trigger them with **Ctrl+Space**. No more random AI ghost text! 🎯
