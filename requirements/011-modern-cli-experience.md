# PRS-011: Modern CLI Experience

Status: Draft
Priority: High
Target Version: 2.0.0

## Overview

This PRS defines a complete redesign of the DomainLang CLI (`dlang`), transforming it from a basic Commander.js application into a modern, visually stunning terminal experience inspired by Gemini CLI and GitHub Copilot CLI. The new CLI will use **Ink** (React for CLIs) to build a component-based interface with gradient text, responsive ASCII art branding, vibrant semantic colors, and polished user interactions.

The goal is to make `dlang` feel premium and delightful—creating a strong first impression while remaining simple and functionally powerful for domain modeling workflows.

**Key changes:**

- Migration from Commander.js to **Ink** (React-based CLI framework)
- Animated ASCII art banner on first run; static banner on `dlang`, `dlang help`, `dlang init`
- Vibrant color palette with semantic colors for status/feedback
- Interactive prompts for `dlang init` and `dlang query` commands
- Unicode emoji usage for visual feedback (✅ ❌ ⚠️ 📦 🔍 etc.)
- Output modes: text (default), `--json`, `--quiet` for CI
- Simple command structure (no complex nesting)

**Design principles:**

- 🎯 **Simple first** - Avoid complexity; flat command structure
- 🧩 **Encapsulated** - Components designed for future extensibility (e.g., MCP server integration)
- 🎨 **Vibrant + Semantic** - Eye-catching colors that convey meaning
- 📦 **Phased delivery** - Easy wins first, polish later

## User Stories

### Primary User Story

As a **domain modeler**,
I want a beautiful, intuitive CLI experience,
So that working with DomainLang feels professional and enjoyable.

### Secondary User Stories

As a **new user**,
I want a welcoming first-run experience with clear guidance,
So that I understand what DomainLang can do and feel confident getting started.

As a **developer**,
I want interactive prompts for complex operations like `init`,
So that I don't have to memorize all the options.

As a **CI/CD engineer**,
I want `--quiet` and `--json` modes,
So that I can integrate the CLI into automated pipelines without visual noise.

As a **power user**,
I want consistent emoji and color feedback,
So that I can quickly scan command output and understand results.

## Success Criteria

- [ ] 🎨 Animated ASCII art banner displays on first run
- [ ] 🖼️ Static ASCII banner on `dlang`, `dlang help`, `dlang init` (responsive to terminal width)
- [ ] 🌈 Gradient text rendering for branding
- [ ] 🎯 Vibrant semantic colors for status messages (success/error/warning/info)
- [ ] 💬 Interactive mode for `dlang init` and `dlang query`
- [ ] ⏳ Progress spinners for long-running operations
- [ ] 📝 `--json` output mode for programmatic consumption
- [ ] 🤫 `--quiet` mode for CI/CD pipelines
- [ ] 🔲 `--no-color` fallback for limited terminals
- [ ] 😀 Unicode emoji used throughout for visual feedback
- [ ] 🧩 Component library ensures consistent styling (tables, spinners, prompts)

## Functional Requirements

### Must Have (P0)

#### 1. Binary Name: `dlang`

The CLI binary is named `dlang`. All commands use this as the entry point:

```bash
dlang                    # Shows banner + help
dlang help               # Shows banner + help
dlang init               # Interactive project initialization
dlang validate <file>    # Validate model files
dlang generate <file>    # Generate code
dlang install            # Install dependencies
dlang model list         # List dependencies
dlang model add <pkg>    # Add dependency
dlang model remove <pkg> # Remove dependency
dlang model tree         # Show dependency tree
```

#### 2. Ink-Based Architecture

Migrate from Commander.js to Ink for component-based CLI rendering:

```typescript
// Entry point structure
import { render } from 'ink';
import { App } from './ui/App.js';

const args = process.argv.slice(2);
const isQuiet = args.includes('--quiet');
const isJson = args.includes('--json');

if (isQuiet || isJson) {
  // Non-Ink path for CI/programmatic use
  await runCommand(args);
} else {
  render(<App args={args} />);
}
```

**Core dependencies:**

- `ink` (^5.x) - React for CLIs
- `ink-gradient` - Gradient text rendering
- `ink-spinner` - Loading spinners
- `react` (^18.x) - React runtime
- `chalk` (^5.x) - ANSI color support

#### 3. Component Library (Design System)

All visual components MUST use a shared component library to ensure consistent styling across the CLI. This creates a cohesive look and feel while enabling rapid development.

**Component Categories:**

| Category | Components | Shared Styling |
| -------- | ---------- | -------------- |
| **Layout** | `Box`, `Divider`, `Spacer` | Consistent padding, borders |
| **Typography** | `Heading`, `Text`, `Code`, `Link` | Font weights, colors |
| **Feedback** | `StatusMessage`, `Spinner`, `ProgressBar` | Emoji, semantic colors |
| **Data Display** | `Table`, `Tree`, `List`, `KeyValue` | Borders, alignment, spacing |
| **Input** | `TextInput`, `Select`, `MultiSelect`, `Confirm` | Prompts, cursors, highlights |
| **Branding** | `Header`, `Banner`, `ThemedGradient` | Logo, gradients |

**Design Tokens:**

```typescript
// ui/tokens.ts - Single source of truth for design tokens
export const tokens = {
  // Spacing
  spacing: {
    xs: 1,
    sm: 2,
    md: 4,
    lg: 8,
  },
  
  // Border styles (consistent across all boxed components)
  borders: {
    style: 'round' as const,  // ╭╮╰╯ corners
    color: 'gray',
  },
  
  // Indentation
  indent: {
    item: 3,      // List/tree items
    nested: 2,    // Nested content
  },
};
```

**Table Component Example:**

```typescript
// ui/components/Table.tsx
import { Box, Text } from 'ink';
import { tokens } from '../tokens.js';
import { colors } from '../themes/colors.js';

interface TableProps {
  headers: string[];
  rows: string[][];
  compact?: boolean;
}

export const Table: React.FC<TableProps> = ({ headers, rows, compact }) => (
  <Box flexDirection="column" borderStyle={tokens.borders.style}>
    {/* Header row */}
    <Box borderBottom>
      {headers.map((h, i) => (
        <Box key={i} width={20} paddingX={tokens.spacing.sm}>
          <Text bold color={colors.primary}>{h}</Text>
        </Box>
      ))}
    </Box>
    {/* Data rows */}
    {rows.map((row, i) => (
      <Box key={i}>
        {row.map((cell, j) => (
          <Box key={j} width={20} paddingX={tokens.spacing.sm}>
            <Text color={colors.secondary}>{cell}</Text>
          </Box>
        ))}
      </Box>
    ))}
  </Box>
);
```

**Spinner Component Example:**

```typescript
// ui/components/Spinner.tsx - ALL spinners use this
import InkSpinner from 'ink-spinner';
import { Text, Box } from 'ink';
import { colors } from '../themes/colors.js';
import { EMOJI } from '../themes/emoji.js';

interface SpinnerProps {
  label: string;
  emoji?: keyof typeof EMOJI;
}

export const Spinner: React.FC<SpinnerProps> = ({ label, emoji = 'loading' }) => (
  <Box>
    <Text color={colors.info}>
      <InkSpinner type="dots" />
    </Text>
    <Text> {EMOJI[emoji]} {label}</Text>
  </Box>
);
```

**Wizard/Prompt Component Example:**

```typescript
// ui/components/Wizard.tsx - Multi-step interactive flows
import { Box, Text } from 'ink';
import { tokens } from '../tokens.js';

interface WizardStepProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const WizardStep: React.FC<WizardStepProps> = ({ title, subtitle, children }) => (
  <Box flexDirection="column" marginBottom={tokens.spacing.md}>
    <Text bold>{title}</Text>
    {subtitle && <Text dimColor>   └─ {subtitle}</Text>}
    <Box marginLeft={tokens.indent.item}>{children}</Box>
  </Box>
);
```

**Component Library Rules:**

1. ✅ **Always** use library components for tables, lists, trees, spinners
2. ✅ **Always** use `tokens.ts` for spacing and borders
3. ✅ **Always** use `colors.ts` for all color values
4. ✅ **Always** use `emoji.ts` constants (never hardcode emoji)
5. ❌ **Never** create ad-hoc styling in command files
6. ❌ **Never** use raw `ink-spinner` directly—wrap via `Spinner` component
7. ❌ **Never** hardcode colors—always reference semantic color names

#### 3.1 UX Patterns (Inspired by Gemini CLI & Copilot CLI)

The following UX patterns are adopted from Gemini CLI and GitHub Copilot CLI to create a polished, consistent interactive experience.

##### Round Border Style for Dialogs

All dialogs, prompts, and boxed content use rounded corners (`╭╮╰╯`) for a modern, friendly feel:

```typescript
// All boxed components use borderStyle="round"
<Box 
  borderStyle="round"
  borderColor={colors.border.default}
  padding={1}
>
  {children}
</Box>
```

##### Keyboard Hints in Footer

Interactive components always show keyboard shortcuts at the bottom:

```typescript
// Standard keyboard hint footer pattern
<Box marginTop={1}>
  <Text color={colors.secondary}>
    (↑↓ navigate · Enter select · Esc cancel)
  </Text>
</Box>

// For multi-select
<Text color={colors.secondary}>
  (Space toggle · Enter confirm · Esc cancel)
</Text>
```

##### Radio Button Selection Lists

For single-choice prompts, use a radio button selection pattern with visual indicators:

```typescript
// RadioButtonSelect component pattern
<Box flexDirection="column">
  {items.map((item, index) => (
    <Box key={item.key}>
      <Text color={index === activeIndex ? colors.success : colors.primary}>
        {index === activeIndex ? '●' : '○'}
      </Text>
      <Text color={index === activeIndex ? colors.accent : colors.primary}>
        {' '}{item.label}
      </Text>
    </Box>
  ))}
</Box>

// Example usage:
// ● Initialize new project
// ○ Add to existing project  
// ○ Cancel
```

##### Descriptive Selection Items

For choices that need explanation, pair labels with descriptions:

```typescript
interface DescriptiveItem {
  title: string;
  description?: string;
  value: T;
}

// Render as:
// ● Start fresh
//   Create a new DomainLang project from scratch
// ○ Migrate existing
//   Convert an existing domain model to DomainLang
```

##### Multi-Step Wizard Progress Headers

For multi-step flows like `dlang init`, show progress at the top:

```typescript
// Progress header component
<Text bold color={colors.secondary}>
  Step {currentStep} of {totalSteps}
</Text>

// Visual:
// Step 1 of 3
// 
// 📁 Project name: _
```

##### Checkbox Multi-Select Pattern

For selecting multiple items (e.g., starter dependencies):

```typescript
// Checkbox display pattern
<Text color={isChecked ? colors.accent : colors.secondary}>
  [{isChecked ? 'x' : ' '}]
</Text>
<Text> {item.label}</Text>

// Visual:
// [x] domainlang/core (recommended)
// [ ] domainlang/healthcare
// [x] domainlang/ecommerce
// 
// Done (2 selected)
```

##### Confirmation Prompts

Simple Yes/No confirmations use the RadioButtonSelect pattern:

```typescript
// Standard confirmation
<Box flexDirection="column" borderStyle="round" padding={1}>
  <Text bold>Create project in ./my-model?</Text>
  <Box marginTop={1}>
    <RadioButtonSelect 
      items={[
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ]} 
      onSelect={handleConfirm}
    />
  </Box>
</Box>
```

##### Loading State with Elapsed Time

For longer operations, show elapsed time:

```typescript
// Spinner with elapsed time (like Gemini CLI)
<Box>
  <Spinner type="dots" />
  <Text> Installing dependencies... ({elapsedSeconds}s)</Text>
</Box>
```

##### Tool Confirmation Pattern (Future MCP)

When executing potentially dangerous operations, show a confirmation dialog:

```typescript
// Pattern for future MCP tool confirmation
<Box borderStyle="round" borderColor={colors.warning} padding={1}>
  <Text bold>Allow execution?</Text>
  <Text color={colors.secondary}>
    This will modify: domains/sales.dlang
  </Text>
  <Box marginTop={1}>
    <RadioButtonSelect
      items={[
        { label: 'Allow once', value: 'once' },
        { label: 'Allow for this session', value: 'session' },
        { label: 'Deny', value: 'deny' },
      ]}
    />
  </Box>
</Box>
```

##### Copilot CLI-Inspired Output Patterns

Adopt these output patterns from GitHub Copilot CLI:

| Pattern | Description | Example |
| ------- | ----------- | ------- |
| Syntax highlighting | Code blocks use theme colors | Highlighted `.dlang` snippets |
| File references | Clickable paths where supported | `📄 domains/sales.dlang` |
| Approval prompts | Explicit user confirmation | Before file creation/modification |
| Session persistence | `--continue` flag for context | `dlang query --continue` |

##### UX Component Summary

```typescript
// ui/components/index.ts - exported UX components
export { RadioButtonSelect } from './RadioButtonSelect.js';
export { DescriptiveSelect } from './DescriptiveSelect.js';
export { MultiSelect } from './MultiSelect.js';
export { Confirm } from './Confirm.js';
export { WizardProgress } from './WizardProgress.js';
export { KeyboardHints } from './KeyboardHints.js';
export { LoadingWithTimer } from './LoadingWithTimer.js';
```

#### 4. ASCII Art Branding

The ASCII art is **inspired by the DomainLang icon**: three stacked 3D cubes in cyan, magenta, and yellow, representing the layered nature of domain modeling.

**Behavior:**

| Context | Banner Type |
| ------- | ----------- |
| First run ever | 🎬 Animated gradient banner + welcome message |
| `dlang` (no args) | Static gradient banner + help |
| `dlang help` | Static gradient banner + help |
| `dlang init` | Static gradient banner + interactive prompts |
| Other commands | No banner (clean output) |

**Responsive sizing:**

```text
// Wide terminals (≥100 cols) - Full ASCII art with cube icon + DomainLang wordmark
╭──────────────────────────────────────────────────────────────────────────╮
│                                                                          │
│      ┌──────┐                                                            │
│     ╱      ╱│   ██████╗   ██████╗ ███╗   ███╗  █████╗ ██╗███╗   ██╗      │
│    ┌──────┐ │   ██╔══██╗ ██╔═══██╗████╗ ████║ ██╔══██╗██║████╗  ██║      │
│    │ CYAN │ │   ██║  ██║ ██║   ██║██╔████╔██║ ███████║██║██╔██╗ ██║      │
│    │      │╱    ██║  ██║ ██║   ██║██║╚██╔╝██║ ██╔══██║██║██║╚██╗██║      │
│   ┌┴──────┴┐    ██████╔╝ ╚██████╔╝██║ ╚═╝ ██║ ██║  ██║██║██║ ╚████║      │
│  ╱MAGENTA╱│    ╚═════╝   ╚═════╝ ╚═╝     ╚═╝ ╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝      │
│ ┌────────┐│                                                              │
│ │        ││    ██╗      █████╗ ███╗   ██╗ ██████╗                        │
│ │        │╱    ██║     ██╔══██╗████╗  ██║██╔════╝                        │
│┌┴────────┴┐    ██║     ███████║██╔██╗ ██║██║  ███╗                       │
││  YELLOW  │    ██║     ██╔══██║██║╚██╗██║██║   ██║                       │
│└──────────┘    ███████╗██║  ██║██║ ╚████║╚██████╔╝                       │
│                ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝                        │
│                                                                          │
│   DDD Modeling DSL                                            v2.0.0    │
│                                                                          │
╰──────────────────────────────────────────────────────────────────────────╯

// Medium terminals (60-99 cols) - Simplified cube + title
╭────────────────────────────────────────────────╮
│                                                │
│    ╭───╮                                       │
│   ╭┴───┴╮   DomainLang                         │
│  ╭┴─────┴╮  DDD Modeling DSL          v2.0.0  │
│  ╰───────╯                                     │
│                                                │
╰────────────────────────────────────────────────╯

// Narrow terminals (<60 cols) - Minimal with colored squares
◆ ◆ ◆ DomainLang v2.0.0
```

**Cube colors in ASCII art:**

- Top cube: Cyan (`#00BCD4`)
- Middle cube: Magenta (`#EC4899`)  
- Bottom cube: Yellow (`#FFC107`)

These colors are applied via `ThemedGradient` or `chalk` depending on terminal support.

**First-run animation:**

On first run, the banner animates with a gradient wave effect (similar to Gemini CLI). The cubes "stack" from bottom to top with a stagger animation, creating a memorable first impression. Subsequent runs show the static version.

```typescript
// Track first run with a simple marker file
const isFirstRun = !existsSync(join(homedir(), '.dlang-welcomed'));
```

#### 5. Vibrant Semantic Colors

Colors are vibrant but meaningful. **Brand colors are derived from the DomainLang icon** (three stacked 3D cubes in cyan, magenta, and yellow):

```typescript
// ui/themes/colors.ts
export const colors = {
  // Brand colors (from icon - three cubes)
  brand: {
    cyan: '#00BCD4',     // Top cube
    magenta: '#EC4899',  // Middle cube  
    yellow: '#FFC107',   // Bottom cube
  },
  
  // Brand gradient (cyan → magenta → yellow - the three cubes)
  gradient: ['#00BCD4', '#EC4899', '#FFC107'],
  
  // Semantic status colors (vibrant)
  success: '#22C55E',  // Bright green
  error: '#EF4444',    // Bright red  
  warning: '#F59E0B',  // Bright amber
  info: '#00BCD4',     // Cyan (matches brand)
  
  // Text
  primary: '#F8FAFC',   // Near white
  secondary: '#94A3B8', // Slate gray
  muted: '#64748B',     // Darker slate
  
  // Accents
  accent: '#EC4899',    // Magenta (matches brand)
  link: '#00BCD4',      // Cyan (matches brand)
  highlight: '#FFC107', // Yellow (matches brand)
  
  // Border colors (for dialogs, boxes)
  border: {
    default: '#64748B', // Muted slate
    focused: '#00BCD4', // Cyan when focused
  },
};
```

#### 6. Emoji-Enhanced Output

Use Unicode emoji consistently for visual scanning:

| Context | Emoji | Example |
| ------- | ----- | ------- |
| Success | ✅ | `✅ Model validated successfully` |
| Error | ❌ | `❌ Validation failed: missing domain` |
| Warning | ⚠️ | `⚠️ Domain 'Sales' has no vision statement` |
| Info | ℹ️ | `ℹ️ Found 3 bounded contexts` |
| Loading | ⏳ | `⏳ Installing dependencies...` |
| Package | 📦 | `📦 Added core@1.0.0` |
| Search | 🔍 | `🔍 Resolving dependencies...` |
| File | 📄 | `📄 Created model.yaml` |
| Folder | 📁 | `📁 Created domains/` |
| Link | 🔗 | `🔗 https://domainlang.dev/docs` |
| Tip | 💡 | `💡 Run 'dlang help' for more commands` |
| Rocket | 🚀 | `🚀 Project initialized!` |

```typescript
// ui/components/StatusMessage.tsx
const EMOJI = {
  success: '✅',
  error: '❌', 
  warning: '⚠️',
  info: 'ℹ️',
  loading: '⏳',
  package: '📦',
  tip: '💡',
} as const;

export const StatusMessage: React.FC<Props> = ({ type, message }) => (
  <Text>
    <Text>{EMOJI[type]} </Text>
    <Text color={colors[type]}>{message}</Text>
  </Text>
);
```

#### 7. Output Modes

Three output modes for different contexts:

| Flag | Output | Use Case |
| ---- | ------ | -------- |
| (none) | Rich text with colors/emoji | Interactive terminal use |
| `--json` | Structured JSON | Programmatic consumption, tooling |
| `--quiet` | Minimal text, errors only | CI/CD pipelines |

```bash
# Default: Rich output
dlang validate model.dlang
✅ Model validated successfully
   📄 1 file, 3 domains, 5 bounded contexts

# JSON: Machine-readable
dlang validate model.dlang --json
{"success":true,"files":1,"domains":3,"boundedContexts":5}

# Quiet: CI-friendly  
dlang validate model.dlang --quiet
# (no output on success, only errors/warnings)
```

### Should Have (P1)

#### 8. Interactive `dlang init`

Multi-step wizard for project initialization:

```text
◆ DomainLang - DDD Modeling DSL

🚀 Create a new DomainLang project

📁 Project name: my-domain-model
   └─ Will create ./my-domain-model/

📝 Description: Enterprise sales domain model
   └─ Stored in model.yaml

📦 Add starter dependencies?
   ◉ domainlang/core (recommended)
   ○ Skip dependencies

✅ Project created!

   📁 my-domain-model/
   ├── 📄 model.yaml
   ├── 📄 index.dlang
   └── 📁 domains/

💡 Next steps:
   cd my-domain-model
   dlang validate .
```

#### 9. Interactive `dlang query` (Future)

Query the model interactively:

```text
🔍 Query your domain model

Enter query: bounded contexts in Sales domain
   
📋 Results:
   • OrderContext (Core)
   • BillingContext (Supporting)  
   • CustomerContext (Generic)

💡 Try: "domains with no vision" or "orphan contexts"
```

#### 10. Progress Indicators

Spinners for long-running operations:

```typescript
// During dependency installation
⏳ Installing dependencies...
   📦 Resolving core@1.0.0
   📦 Resolving shared-types@2.1.0
   ✅ Installed 2 packages

// During validation of large projects
⏳ Validating model...
   📄 Processing domains/sales.dlang
   📄 Processing domains/billing.dlang
   ✅ Validated 15 files in 234ms
```

#### 11. Styled Help Output

```text
◆ DomainLang CLI v2.0.0

📖 USAGE
   $ dlang <command> [options]

🛠️  COMMANDS
   init              Initialize a new DomainLang project
   validate <path>   Validate model files
   generate <file>   Generate code from model
   install           Install dependencies from model.yaml

📦 MODEL COMMANDS  
   model list        List declared dependencies
   model add <pkg>   Add a new dependency
   model remove      Remove a dependency
   model tree        Show dependency tree

⚙️  OPTIONS
   --help            Show help
   --version         Show version
   --quiet           Suppress decorative output (CI mode)
   --json            Output in JSON format
   --no-color        Disable colors

🔗 DOCUMENTATION
   https://domainlang.dev/docs

💡 EXAMPLES
   $ dlang init
   $ dlang validate ./domains
   $ dlang model add domainlang/core
```

### Could Have (Future)

#### 12. Theme Customization

Allow users to choose themes (implement later with proper encapsulation):

- Dark theme (default)
- Light theme
- High contrast
- ANSI-only (for limited terminals)

*Note: No separate config file for now. Theme detection can auto-detect terminal background.*

#### 13. MCP Server Integration

Design components with extensibility in mind for future MCP (Model Context Protocol) server integration. This will likely be the first extension point.

#### 14. Shell Completion Scripts

Generate completion scripts for bash/zsh/fish (defer to later phase).

## Implementation Phases

### Phase 1: Foundation (Week 1-2) 🏗️

**Goal:** Basic Ink setup with component library foundation

- [ ] Set up Ink + React in CLI package
- [ ] Create `App.tsx` root component
- [ ] **Create `tokens.ts` design tokens (spacing, borders, indent)**
- [ ] **Create `colors.ts` semantic color palette**
- [ ] **Create `emoji.ts` emoji constants**
- [ ] Implement output mode detection (`--json`, `--quiet`, `--no-color`)
- [ ] Create `StatusMessage` component with emoji
- [ ] Create `Spinner` component (wrapping ink-spinner)
- [ ] Create `Table` component with consistent styling
- [ ] Migrate `dlang validate` to Ink

**Deliverable:** `dlang validate` works with new UI + component library foundation

### Phase 2: Branding (Week 2-3) 🎨

**Goal:** ASCII art and visual identity

- [ ] Create responsive ASCII art (wide/medium/narrow)
- [ ] Implement `ThemedGradient` component
- [ ] Implement `Header` component with responsive sizing
- [ ] Add first-run detection and animated banner
- [ ] Update `dlang` (no args) and `dlang help` to show banner

**Deliverable:** Beautiful branding on startup

### Phase 3: Commands (Week 3-4) 📦

**Goal:** Migrate remaining commands

- [ ] Migrate `dlang generate` to Ink
- [ ] Migrate `dlang install` with progress spinner
- [ ] Migrate `dlang model list` with table formatting
- [ ] Migrate `dlang model add/remove` with feedback
- [ ] Migrate `dlang model tree` with tree visualization

**Deliverable:** All existing commands work with new UI

### Phase 4: Interactive (Week 4-5) 💬

**Goal:** Interactive experiences

- [ ] Implement `dlang init` interactive wizard
- [ ] Add text input components
- [ ] Add selection/multi-select components
- [ ] Add confirmation prompts

**Deliverable:** `dlang init` is fully interactive

### Phase 5: Polish (Week 5-6) ✨

**Goal:** Refinement and edge cases

- [ ] Test on various terminals (VS Code, iTerm2, Windows Terminal)
- [ ] Ensure graceful degradation for limited terminals
- [ ] Add snapshot tests for output
- [ ] **Document component library usage (internal dev docs)**
- [ ] Documentation and examples
- [ ] Performance optimization (<200ms startup)

**Deliverable:** Production-ready CLI with documented component library

## Non-Functional Requirements

- **Performance:** CLI should start and render initial output in < 200ms
- **Compatibility:**
  - Node.js 20+ (required by Ink 5)
  - Works in VS Code terminal, iTerm2, Windows Terminal, basic xterm
- **Accessibility:**
  - `--no-color` mode for colorblind users or limited terminals
  - Emoji have text equivalents in JSON mode
- **File Size:** CLI bundle should remain < 5MB
- **Graceful Degradation:** Falls back to basic output if terminal doesn't support colors/unicode
- **Encapsulation:** Components designed for future extensibility (MCP integration, themes)

## Out of Scope

- ❌ Full interactive REPL mode (future consideration)
- ❌ GUI or TUI with mouse support
- ❌ Separate configuration file for themes
- ❌ Real-time collaborative features
- ❌ Web-based CLI interface
- ❌ Shell completion scripts (deferred)

## Technical Architecture

### Architectural Decision: SDK over In-Process LSP

**Decision: Use the Model Query SDK directly, NOT an in-process LSP server.**

| Approach | Pros | Cons |
| -------- | ---- | ---- |
| **SDK (chosen)** | Fast startup, simple, direct AST access, browser-compatible loader | No workspace-wide indexing |
| In-process LSP | Full workspace features | Slow startup, complex, overkill for CLI |

**Rationale:**

1. **Startup time** - CLI must render in <200ms. LSP initialization adds 500ms+ overhead
2. **Simplicity** - SDK provides `loadModel()` which handles parsing, linking, and validation
3. **Already designed for this** - SDK has `loader-node.ts` specifically for CLI/Node.js usage
4. **Sufficient for CLI needs** - Most CLI commands operate on explicit file(s), not workspace discovery

**SDK Entry Point:**

```typescript
// packages/cli/src/core/model-loader.ts
import { loadModel } from '@domainlang/language/sdk/loader-node';
import type { QueryContext } from '@domainlang/language/sdk';

export async function loadDomainModel(
  entryFile: string,
  workspaceDir?: string
): Promise<QueryContext> {
  return loadModel(entryFile, { workspaceDir });
}
```

### CLI ↔ Language Package Integration

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           packages/cli                                   │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                         UI Layer (Ink)                             │  │
│  │   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │  │
│  │   │ Header  │ │ Spinner │ │  Table  │ │  Tree   │ │ Status  │    │  │
│  │   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                   │                                      │
│                                   ▼                                      │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                      Command Layer                                 │  │
│  │   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │  │
│  │   │ validate │ │ generate │ │   init   │ │  model   │            │  │
│  │   └──────────┘ └──────────┘ └──────────┘ └──────────┘            │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                   │                                      │
│                                   ▼                                      │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                       Core Layer                                   │  │
│  │   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │  │
│  │   │ model-loader  │  │ output-writer │  │ error-handler │        │  │
│  │   └───────────────┘  └───────────────┘  └───────────────┘        │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ import
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        packages/language                                 │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    Model Query SDK                                 │  │
│  │   ┌───────────────────┐  ┌───────────────────┐                   │  │
│  │   │   loader-node.ts  │  │     query.ts      │                   │  │
│  │   │   (file loading)  │  │  (fluent queries) │                   │  │
│  │   └───────────────────┘  └───────────────────┘                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                   │                                      │
│                                   ▼                                      │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                   Langium Services                                 │  │
│  │   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │  │
│  │   │   Parser    │ │   Linker    │ │  Validator  │                │  │
│  │   └─────────────┘ └─────────────┘ └─────────────┘                │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

**Data Flow Example (validate command):**

```text
dlang validate domains.dlang
         │
         ▼
┌─────────────────┐
│   main.ts       │  Parse args, detect output mode
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ validate.tsx    │  Ink component for validation UI
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ model-loader.ts │  Calls SDK's loadModel()
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ loader-node.ts  │  Creates Langium services, parses file
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ QueryContext    │  Returns { model, documents, query, diagnostics }
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ validate.tsx    │  Renders results via StatusMessage, Table
└─────────────────┘
```

### Command Architecture

Commands follow a clean separation between **business logic** and **presentation**:

```text
packages/cli/src/
├── main.ts                     # Entry point + arg parsing
├── core/                       # Business logic (pure functions, no UI)
│   ├── model-loader.ts         # SDK wrapper for loading models
│   ├── validator.ts            # Validation logic + result types
│   ├── generator.ts            # Code generation logic
│   ├── dependency-manager.ts   # Model dependency operations
│   └── types.ts                # Shared result/error types
├── commands/                   # Ink command components (UI only)
│   ├── validate.tsx            # Renders validation results
│   ├── generate.tsx            # Renders generation progress
│   ├── init/
│   │   ├── index.tsx           # Wizard orchestration
│   │   ├── steps/              # Individual wizard steps
│   │   └── actions.ts          # File creation logic
│   ├── install.tsx
│   └── model/
│       ├── list.tsx
│       ├── add.tsx
│       ├── remove.tsx
│       └── tree.tsx
├── ui/                         # Component library
│   └── ...
└── utils/
    ├── output-mode.ts          # Detect --json, --quiet, --no-color
    └── exit-codes.ts           # Standardized exit codes
```

**Command Interface:**

Each command exports a consistent interface:

```typescript
// commands/types.ts
export interface CommandResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: CommandError[];
  warnings?: CommandWarning[];
}

export interface CommandError {
  code: string;
  message: string;
  file?: string;
  line?: number;
  column?: number;
}

export interface CommandContext {
  outputMode: 'rich' | 'json' | 'quiet';
  cwd: string;
  noColor: boolean;
}
```

**Core Function Pattern:**

```typescript
// core/validator.ts - Pure business logic, no UI
import { loadModel } from '@domainlang/language/sdk/loader-node';
import type { CommandResult, ValidationResult } from './types.js';

export interface ValidationResult {
  valid: boolean;
  fileCount: number;
  domainCount: number;
  bcCount: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export async function validateModel(
  entryFile: string,
  options?: { workspaceDir?: string }
): Promise<CommandResult<ValidationResult>> {
  try {
    const { query, documents, diagnostics } = await loadModel(entryFile, options);
    
    const errors = diagnostics.filter(d => d.severity === 1);
    const warnings = diagnostics.filter(d => d.severity === 2);
    
    return {
      success: errors.length === 0,
      data: {
        valid: errors.length === 0,
        fileCount: documents.length,
        domainCount: query.domains().count(),
        bcCount: query.boundedContexts().count(),
        errors: errors.map(toCommandError),
        warnings: warnings.map(toCommandWarning),
      },
    };
  } catch (error) {
    return {
      success: false,
      errors: [{ code: 'LOAD_ERROR', message: String(error) }],
    };
  }
}
```

**Command Component Pattern:**

```typescript
// commands/validate.tsx - UI only, delegates to core
import React, { useEffect, useState } from 'react';
import { Box } from 'ink';
import { validateModel } from '../core/validator.js';
import { StatusMessage, Table, Spinner } from '../ui/components/index.js';
import type { CommandContext } from './types.js';

interface ValidateProps {
  file: string;
  context: CommandContext;
}

export const Validate: React.FC<ValidateProps> = ({ file, context }) => {
  const [result, setResult] = useState<CommandResult | null>(null);
  
  useEffect(() => {
    validateModel(file, { workspaceDir: context.cwd })
      .then(setResult);
  }, [file]);
  
  if (!result) {
    return <Spinner label="Validating model..." />;
  }
  
  if (context.outputMode === 'json') {
    console.log(JSON.stringify(result.data));
    return null;
  }
  
  return (
    <Box flexDirection="column">
      <StatusMessage 
        type={result.success ? 'success' : 'error'}
        message={result.success ? 'Model validated successfully' : 'Validation failed'}
      />
      {result.data && (
        <Table 
          headers={['Metric', 'Count']}
          rows={[
            ['Files', String(result.data.fileCount)],
            ['Domains', String(result.data.domainCount)],
            ['Bounded Contexts', String(result.data.bcCount)],
          ]}
        />
      )}
    </Box>
  );
};
```

### Exit Codes

Standardized exit codes for CI/CD integration:

| Code | Meaning |
| ---- | ------- |
| 0 | Success |
| 1 | Validation error (model has errors) |
| 2 | File not found |
| 3 | Parse error (syntax error) |
| 4 | Configuration error |
| 10 | Network error (dependency operations) |
| 127 | Unknown command |

```typescript
// utils/exit-codes.ts
export const EXIT = {
  SUCCESS: 0,
  VALIDATION_ERROR: 1,
  FILE_NOT_FOUND: 2,
  PARSE_ERROR: 3,
  CONFIG_ERROR: 4,
  NETWORK_ERROR: 10,
  UNKNOWN_COMMAND: 127,
} as const;
```

### Directory Structure

```text
packages/cli/src/
├── main.ts                     # Entry point, arg parsing, output mode detection
├── core/                       # Business logic (pure functions, no UI)
│   ├── model-loader.ts         # SDK wrapper for loadModel()
│   ├── validator.ts            # Validation logic + result types
│   ├── generator.ts            # Code generation logic
│   ├── dependency-manager.ts   # Model dependency operations
│   └── types.ts                # CommandResult, CommandError, etc.
├── commands/                   # Ink command components (UI layer)
│   ├── types.ts                # CommandContext, shared props
│   ├── validate.tsx
│   ├── generate.tsx
│   ├── install.tsx
│   ├── init/
│   │   ├── index.tsx           # Wizard orchestrator
│   │   ├── steps/
│   │   │   ├── ProjectName.tsx
│   │   │   ├── Description.tsx
│   │   │   └── Dependencies.tsx
│   │   └── actions.ts          # File creation (non-UI)
│   └── model/
│       ├── list.tsx
│       ├── add.tsx
│       ├── remove.tsx
│       └── tree.tsx
├── ui/                         # Component library (design system)
│   ├── App.tsx                 # Root component, routing
│   ├── tokens.ts               # Design tokens (spacing, borders)
│   ├── components/
│   │   ├── index.ts            # Barrel export
│   │   │
│   │   │  # Branding
│   │   ├── Header.tsx          # ASCII banner + gradient
│   │   ├── AsciiArt.ts         # Cube logo definitions (wide/medium/narrow)
│   │   ├── ThemedGradient.tsx  # Gradient text wrapper (cyan→magenta→yellow)
│   │   │
│   │   │  # Feedback
│   │   ├── StatusMessage.tsx   # Success/error/warning/info messages
│   │   ├── Spinner.tsx         # Loading spinner (wraps ink-spinner)
│   │   ├── LoadingWithTimer.tsx# Spinner with elapsed time display
│   │   ├── ProgressBar.tsx     # Progress indicator
│   │   │
│   │   │  # Data Display
│   │   ├── Table.tsx           # Styled table with round borders
│   │   ├── Tree.tsx            # Dependency/hierarchy tree
│   │   ├── List.tsx            # Bulleted/numbered lists
│   │   ├── KeyValue.tsx        # Key-value pairs
│   │   ├── Divider.tsx         # Horizontal rule
│   │   │
│   │   │  # Selection (Gemini CLI patterns)
│   │   ├── RadioButtonSelect.tsx   # Single selection with ●/○ indicators
│   │   ├── DescriptiveSelect.tsx   # Selection with title + description
│   │   ├── MultiSelect.tsx         # Checkbox [x]/[ ] multi-selection
│   │   ├── Confirm.tsx             # Yes/No confirmation prompt
│   │   │
│   │   │  # Input
│   │   ├── TextInput.tsx       # Text input field
│   │   │
│   │   │  # Wizard Components
│   │   ├── WizardProgress.tsx  # "Step N of M" progress header
│   │   └── KeyboardHints.tsx   # "(↑↓ navigate · Enter select)" footer
│   │
│   ├── themes/
│   │   ├── colors.ts           # Semantic color palette (cyan/magenta/yellow brand)
│   │   └── emoji.ts            # Emoji constants
│   └── hooks/
│       ├── useTerminalSize.ts  # Responsive sizing
│       ├── useFirstRun.ts      # First-run detection
│       ├── useKeypress.ts      # Keyboard event handling
│       ├── useSelectionList.ts # Arrow key navigation for selections
│       └── useCommandResult.ts # Async command execution
└── utils/
    ├── output-mode.ts          # Detect --json, --quiet, --no-color
    ├── exit-codes.ts           # Standardized exit codes
    └── json-formatter.ts       # JSON output formatting
```

### Command Execution Flow

```text
┌────────────────┐
│  dlang <cmd>   │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│  Parse Args    │
└───────┬────────┘
        │
        ├──────────────────┐
        ▼                  ▼
┌───────────────┐   ┌─────────────┐
│  --json       │   │  --quiet    │
│  JSON output  │   │  Minimal    │
└───────────────┘   └─────────────┘
        │
        ▼ (default)
┌────────────────┐
│  Ink render()  │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│  Show banner?  │──▶ Yes: dlang, help, init, first-run
└───────┬────────┘
        │
        ▼
┌────────────────┐
│  Command UI    │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│  Exit          │
└────────────────┘
```

## Dependencies

- **Requires:**
  - PRS-010 completion (defines model/dependency commands)
  - Node.js 20+ (Ink 5 requirement)
- **Blocks:** None
- **Related:**
  - PRS-010: Import System Redesign (defines CLI commands)
  - Future: MCP server integration

## Acceptance Testing

### Test Scenarios

1. **First run:** Animated banner displays, welcome message shown
2. **`dlang` / `dlang help`:** Static banner + styled help
3. **`dlang init`:** Interactive wizard creates project structure
4. **`dlang validate`:** Shows emoji feedback, errors in red
5. **`dlang --json validate`:** Returns valid JSON, no colors/emoji
6. **`dlang --quiet validate`:** Silent on success, errors only
7. **Narrow terminal:** Falls back to minimal banner
8. **`--no-color`:** Works in basic terminals

### Snapshot Testing

Use `ink-testing-library` for component output snapshots.

## References

- [Ink - React for CLIs](https://github.com/vadimdemedes/ink)
- [Gemini CLI UI Architecture](https://github.com/google-gemini/gemini-cli/tree/main/packages/cli/src/ui)
- [GitHub Copilot CLI](https://github.com/github/copilot-cli)
- [Shopify CLI UI Kit](https://github.com/Shopify/cli/tree/main/packages/cli-kit)
