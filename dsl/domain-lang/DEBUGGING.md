# Debugging DomainLang Extension

This guide explains how to debug the DomainLang VS Code extension and test LSP features like completion/snippets on Mac (and other platforms).

## Quick Start

### 1. Build Everything First

```bash
cd dsl/domain-lang
npm run build
```

This builds:
- `packages/language` - The language server with your completion provider
- `packages/extension` - The VS Code extension client

### 2. Open VS Code at the Right Level

**Important:** Open VS Code at the **repository root** (`DomainLang/`), not at `dsl/domain-lang/`.

```bash
cd /Users/larsbaunwall/Repos/DomainLang
code .
```

### 3. Start Debugging

1. In VS Code, open the **Run and Debug** panel (⇧⌘D on Mac)
2. Select **"Run Extension"** from the dropdown
3. Press **F5** (or click the green play button)

This opens a new **Extension Development Host** window where your extension is loaded.

### 4. Test in the Extension Development Host

In the new window that opens:

1. Create or open a `.dlang` file
2. Start typing inside a `BoundedContext` or `Domain` block
3. Press **Ctrl+Space** (or ⌃Space on Mac) to trigger completion
4. You should see context-aware suggestions!

## Troubleshooting

### Problem: Completions Don't Appear

**Checklist:**

1. ✅ **Extension is built:** Run `npm run build` from `dsl/domain-lang/`
2. ✅ **File extension is `.dlang`:** The extension only activates for `.dlang` files
3. ✅ **You're in the Extension Development Host:** The debugger opens a NEW window - use that one
4. ✅ **Trigger key combo:** On Mac it's **Ctrl+Space** or **⌃Space** (not Cmd+Space)
5. ✅ **Cursor is inside a block:** Put cursor inside `{ }` braces

### Problem: Extension Not Loading

**Check the Debug Console:**

In your **original VS Code window** (not the Extension Development Host):
1. Open **Debug Console** (⇧⌘Y on Mac)
2. Look for errors like:
   - `Cannot find module` - Run `npm run build`
   - `Language server crashed` - Check language server logs

**Check the Extension Development Host Output:**

In the **Extension Development Host** window:
1. Open **Output panel** (⇧⌘U on Mac)
2. Select **"DomainLang Language Server"** from dropdown
3. Look for startup messages or errors

### Problem: Snippets Insert But Don't Expand

**VS Code Settings:**

Make sure these settings are enabled (Cmd+, to open settings):

```json
{
    // Enable snippet suggestions
    "editor.snippetSuggestions": "top",
    
    // Enable suggestions while typing
    "editor.quickSuggestions": {
        "other": true,
        "comments": false,
        "strings": false
    },
    
    // Enable tab completion for snippets
    "editor.tabCompletion": "on",
    
    // Show suggestion details
    "editor.suggest.showWords": true,
    "editor.suggest.showSnippets": true
}
```

### Problem: Can't Type Ctrl+Space on Mac

Mac might intercept Ctrl+Space for Spotlight or Input Sources.

**Solutions:**

1. **Use the alternative:** Try **⌃Space** or **Esc** to trigger completions
2. **Change keyboard shortcut:** System Preferences → Keyboard → Shortcuts → Input Sources → Uncheck "Select the previous input source"
3. **Remap in VS Code:** 
   - Open Keyboard Shortcuts (⌘K ⌘S)
   - Search for "Trigger Suggest"
   - Change binding to something else (e.g., ⌥Space)

## Development Workflow

### Quick Iteration

When making changes to the completion provider:

```bash
# Terminal 1: Watch mode for automatic rebuilds
cd dsl/domain-lang
npm run watch --workspace packages/language

# VS Code: 
# 1. Make your changes to domain-lang-completion.ts
# 2. Wait for watch to rebuild (should be fast)
# 3. In Extension Development Host, reload window: ⇧⌘P → "Reload Window"
# 4. Test your changes
```

### Full Rebuild

If things get weird, do a clean build:

```bash
cd dsl/domain-lang
npm run clean
npm run build
```

Then restart the debugger (⇧⌘F5 to stop, then F5 to start).

## Testing Specific Features

### Test Context-Aware Completions

**Inside BoundedContext:**

```dlang
Domain CustomerExperience { description: "Customer experience" }

bc Sales for CustomerExperience {
    // Put cursor here, press Ctrl+Space
    // Should suggest: description, team, role, terminology, etc.
}
```

**Inside Domain:**

```dlang
Domain Sales {
    // Put cursor here, press Ctrl+Space
    // Should suggest: description, vision, classification
}
```

**Inside ContextMap:**

```dlang
Domain ECommerce { description: "E-commerce domain" }

bc Catalog for ECommerce { description: "Catalog" }
bc Orders for ECommerce { description: "Orders" }

ContextMap ECommerceMap {
    contains Catalog, Orders
    // Put cursor here, press Ctrl+Space
    // Should suggest: contains, relationship patterns
}
```

### Test Smart Detection

```dlang
Classification Core
Team SalesTeam
Domain CustomerExperience { description: "Customer experience" }

bc Sales for CustomerExperience as Core by SalesTeam {
    // Put cursor here, press Ctrl+Space
    // Should NOT suggest 'role' or 'team' since already defined inline
    // Should still suggest: description, terminology, decisions
}
```

### Test Top-Level Snippets

At the top level of a `.dlang` file:

```dlang
// Put cursor here, press Ctrl+Space
// Should suggest: Domain, BoundedContext, ContextMap, etc.
```

## Debugging the Language Server

To debug the actual language server code (not just the extension):

1. Start the extension debugger (F5)
2. In your **original VS Code**, start **"Attach to Language Server"**
3. Set breakpoints in `packages/language/src/**/*.ts`
4. Trigger completion in the Extension Development Host
5. Breakpoints should hit!

## VS Code Settings Reference

Add these to your `.vscode/settings.json` (in the Extension Development Host if needed):

```json
{
    // Completion settings
    "editor.snippetSuggestions": "top",
    "editor.tabCompletion": "on",
    "editor.suggest.snippetsPreventQuickSuggestions": false,
    
    // Show more info
    "editor.suggest.showMethods": true,
    "editor.suggest.showKeywords": true,
    "editor.suggest.showSnippets": true,
    
    // Trigger suggestions
    "editor.quickSuggestions": {
        "other": true,
        "comments": false,
        "strings": false
    },
    
    // Enable parameter hints
    "editor.parameterHints.enabled": true
}
```

## Keyboard Shortcuts (Mac)

| Action | Shortcut | Alternative |
|--------|----------|-------------|
| Trigger Suggest | Ctrl+Space (⌃Space) | Esc, ⌥Space |
| Start Debugging | F5 | - |
| Stop Debugging | ⇧F5 | - |
| Restart Debugging | ⇧⌘F5 | - |
| Reload Window | ⇧⌘P → "Reload Window" | - |
| Open Debug Console | ⇧⌘Y | - |
| Open Output Panel | ⇧⌘U | - |

## Files to Check

If something's not working, check these files:

- **Extension entry point:** `packages/extension/src/extension/main.ts`
- **Completion provider:** `packages/language/src/lsp/domain-lang-completion.ts`
- **Language module:** `packages/language/src/domain-lang-module.ts`
- **Extension package:** `packages/extension/package.json` (check `activationEvents`)
- **Build output:** `packages/extension/out/` and `packages/language/out/`

## Common Issues

### "Language server is not running"

- Extension didn't activate (wrong file extension?)
- Build failed (check for TypeScript errors)
- Server crashed (check Output panel)

### "No completions appear"

- Not triggering with the right key combo
- Cursor not in the right location
- Extension not loaded in Extension Development Host
- VS Code suggestion settings disabled

### "Snippets don't have placeholders"

- Tab completion not enabled
- Using wrong key to accept (use Tab, not Enter)

### "Changes not reflecting"

- Forgot to rebuild (`npm run build`)
- Forgot to reload window in Extension Development Host
- Old build cached (do clean build)

## Need More Help?

1. Check the **Debug Console** for errors
2. Check the **Output panel** → "DomainLang Language Server"
3. Look at the **Terminal** output from `npm run build`
4. Enable verbose logging (add `--log debug` to server options)

## Pro Tips

1. **Use watch mode** for faster iteration: `npm run watch --workspace packages/language`
2. **Keep Debug Console open** to see what's happening
3. **Use "Reload Window"** instead of restarting debugger (faster)
4. **Test in a real .dlang file** - create `test.dlang` in the Extension Development Host
5. **Check sortText** if completion order seems wrong
6. **Use descriptive labels** so you can find your completions easily
