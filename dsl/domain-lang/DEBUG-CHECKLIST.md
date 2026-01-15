# Quick Debug Checklist

Use this checklist when snippets/completions aren't working:

## Before Debugging

- [ ] I'm in the repository root (`/Users/larsbaunwall/Repos/DomainLang`)
- [ ] I ran `cd dsl/domain-lang && npm run build`
- [ ] Build completed successfully (no TypeScript errors)

## Starting the Debugger

- [ ] Opened Run and Debug panel (⇧⌘D)
- [ ] Selected "Run Extension" configuration
- [ ] Pressed F5 to start
- [ ] A **new VS Code window** opened (Extension Development Host)

## Testing Completions

- [ ] I'm working in the **Extension Development Host** window (not my original window)
- [ ] File has `.dlang` extension
- [ ] File is saved
- [ ] Cursor is **inside** a block (between `{ }`)
- [ ] I pressed **Ctrl+Space** (⌃Space) on Mac

## If Still Not Working

Check these:

### 1. Extension Loaded?

In Extension Development Host:
- [ ] Open Output panel (⇧⌘U)
- [ ] Select "DomainLang Language Server" from dropdown
- [ ] See "Server starting..." or similar message

### 2. VS Code Settings

Open settings (⌘,) and verify:
- [ ] `editor.snippetSuggestions`: "top"
- [ ] `editor.tabCompletion`: "on"
- [ ] `editor.quickSuggestions.other`: true

### 3. Mac Keyboard Conflict?

System Preferences → Keyboard → Shortcuts → Input Sources:
- [ ] "Select the previous input source" is unchecked

Or try alternative: **⌥Space** or **Esc**

### 4. Clean Build

```bash
cd dsl/domain-lang
npm run clean
npm run build
```

Then restart debugger (⇧⌘F5 to stop, F5 to start)

## Test Cases

### ✅ Should Work:

```dlang
Domain Sales {
    // Cursor here + Ctrl+Space = suggestions
}
```

```dlang
bc Sales for CustomerExperience {
    // Cursor here + Ctrl+Space = suggestions
}
```

### ❌ Won't Work:

```dlang
Domain Sales // Cursor here - not inside braces
```

```
test.txt file // Not a .dlang file
```

## Quick Fix

If nothing works, try this:

1. Stop debugger (⇧⌘F5)
2. Run: `cd dsl/domain-lang && npm run build`
3. Close Extension Development Host window
4. Start debugger again (F5)
5. In new window, create fresh file: `test.dlang`
6. Type:
   ```dlang
   Domain Test {
       
   }
   ```
7. Put cursor in the blank line
8. Press Ctrl+Space

Should see: `description`, `vision`, `classification` suggestions.

## Still Stuck?

Look at these logs:

1. **Debug Console** (original VS Code window) - ⇧⌘Y
2. **Output → DomainLang Language Server** (Extension Development Host) - ⇧⌘U
3. **Terminal output** from npm run build

Look for errors like:
- "Cannot find module"
- "Language server crashed"
- TypeScript compile errors
