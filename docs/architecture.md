# Architecture Documentation

**Project:** Auto Note Mover Plus
**Type:** Obsidian Plugin (Extension)
**Architecture Pattern:** Event-Driven Plugin Architecture
**Last Updated:** 2025-12-01

## Executive Summary

Auto Note Mover Plus is an enhanced Obsidian community plugin that automatically organizes notes into designated folders based on flexible, multi-condition rules. The plugin implements an event-driven architecture, responding to file system events within the Obsidian vault and executing rule-based file operations.

**Key Capabilities:**

-   Multiple condition types: Tag, Title, Property, and Date-based matching
-   Flexible match logic: ALL (AND) or ANY (OR) combinations
-   Date-based dynamic folder paths with moment.js token support
-   Manual trigger support via command
-   Frontmatter-based opt-out mechanism

## Technology Stack

### Core Technologies

| Category   | Technology   | Version | Purpose                       |
| ---------- | ------------ | ------- | ----------------------------- |
| Language   | TypeScript   | 4.4.4   | Type-safe development         |
| Platform   | Obsidian API | 0.12.17 | Plugin host environment       |
| Build Tool | esbuild      | 0.13.12 | Fast bundling and compilation |
| Runtime    | Node.js      | 16.x    | Development environment       |

### Dependencies

**Runtime:**

-   **@popperjs/core** (^2.11.2) - UI positioning for autocomplete suggestions

**Development:**

-   TypeScript compiler and type definitions
-   ESLint with TypeScript support
-   esbuild for bundling

### Build Pipeline

-   **Input:** TypeScript source files (`main.ts`, `settings/*.ts`, etc.)
-   **Process:** Type checking → esbuild bundling
-   **Output:** Single CommonJS bundle (`main.js`)

## Architecture Pattern

### Event-Driven Plugin Architecture

The plugin follows Obsidian's plugin architecture pattern with event-driven file processing:

```
┌─────────────────────────────────────────────────────────┐
│                    Obsidian Vault                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │               File System Events                   │  │
│  │  • File Created  • Metadata Changed  • File Renamed│  │
│  └──────────────────┬────────────────────────────────┘  │
│                     │                                    │
│  ┌──────────────────▼────────────────────────────────┐  │
│  │         Auto Note Mover Plugin                    │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  Event Handlers (main.ts)                   │  │  │
│  │  │  • onCreate   • onModify   • onRename       │  │  │
│  │  └────────────┬────────────────────────────────┘  │  │
│  │               │                                    │  │
│  │  ┌────────────▼────────────────────────────────┐  │  │
│  │  │  Rule Matching Engine (fileCheck)           │  │  │
│  │  │  • Load rules from settings                 │  │  │
│  │  │  • Match tags or title patterns             │  │  │
│  │  │  • Check exclusions and frontmatter         │  │  │
│  │  └────────────┬────────────────────────────────┘  │  │
│  │               │                                    │  │
│  │  ┌────────────▼────────────────────────────────┐  │  │
│  │  │  File Operations (Utils.ts)                 │  │  │
│  │  │  • Move file to target folder               │  │  │
│  │  │  • Handle duplicates                        │  │  │
│  │  │  • Parse frontmatter                        │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │                                                    │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  Settings UI (settings/settings.ts)         │  │  │
│  │  │  • Rule configuration                       │  │  │
│  │  │  • Folder/tag autocomplete                  │  │  │
│  │  │  • Exclusion management                     │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Plugin Core (`main.ts`)

**Responsibility:** Entry point and event orchestration

**Key Functions:**

-   `onload()` - Plugin initialization, register event handlers
-   `fileCheck()` - Main rule matching logic (main.ts:13)
-   Event listeners for file operations
-   Ribbon icon registration

**Event Handlers:**

-   `onCreate` - Triggers on new file creation
-   `onModify` - Triggers on metadata/content changes
-   `onRename` - Triggers on file rename

### 2. Settings Management (`settings/settings.ts`)

**Responsibility:** Configuration UI and persistence

**Components:**

-   `AutoNoteMoverSettings` - Settings data structure
-   `FolderTagPattern` - Rule definition interface
-   `ExcludedFolder` - Folder exclusion configuration
-   Settings tab UI with autocomplete inputs

**Features:**

-   Rule creation and editing
-   Folder/tag pattern configuration
-   Regex toggle for advanced matching
-   Settings persistence via Obsidian API

### 3. UI Suggestion Components (`suggests/`)

**Responsibility:** Autocomplete user experience

**Files:**

-   `suggest.ts` - Base suggestion modal class
-   `file-suggest.ts` - Folder path autocomplete
-   `tag-suggest.ts` - Tag autocomplete

**Technology:**

-   Extends Obsidian's modal classes
-   Uses Popper.js for positioning
-   Real-time filtering and selection

### 4. Utilities (`utils/Utils.ts`)

**Responsibility:** File operations and data parsing

**Key Functions:**

-   `fileMove()` - Safe file movement with duplicate checking
-   Frontmatter parsing (`parseFrontMatterEntry`)
-   Destination folder validation
-   Disable flag detection

## Data Architecture

### Settings Data Structure

```typescript
interface AutoNoteMoverSettings {
	folder_tag_pattern: FolderTagPattern[];
	excluded_folder: ExcludedFolder[];
	trigger_auto_manual: string;
	use_regex_to_check_tag: boolean;
	statusBar_trigger_indicator: boolean;
}

interface FolderTagPattern {
	folder: string; // Destination folder path
	tag: string; // Tag to match (or empty if using pattern)
	pattern: string; // Regex pattern for title (or empty if using tag)
}

interface ExcludedFolder {
	folder: string; // Folder path to exclude
	regex_enabled: boolean;
}
```

**Storage:** Obsidian's plugin data API (JSON serialization)

### Frontmatter Integration

The plugin respects note-level configuration via frontmatter:

```yaml
---
AutoNoteMover: disable
---
```

When present, automatic moving is disabled for that note.

## API Design

### Obsidian Plugin API Integration

The plugin integrates with Obsidian through the standard plugin API:

**File System:**

-   `app.vault.getFiles()` - File enumeration
-   `app.vault.getAbstractFileByPath()` - File retrieval
-   `app.vault.rename()` - File movement
-   `app.metadataCache` - Frontmatter access

**UI Components:**

-   `Plugin` base class - Plugin lifecycle
-   `PluginSettingTab` - Settings UI
-   `addRibbonIcon()` - Toolbar integration

**Event System:**

-   `registerEvent()` - Event listener registration
-   File system event types (create, modify, rename)

### Internal Plugin Methods

**Core Processing:**

```typescript
fileCheck(file: TFile, trigger: string): Promise<void>
```

-   Orchestrates rule matching and file movement
-   Parameters:
    -   `file` - Target file object
    -   `trigger` - Event source ("auto" or "manual")

**File Operations:**

```typescript
fileMove(file: TFile, folder: string): Promise<void>
```

-   Safely moves file to destination
-   Handles duplicate names
-   Validates destination folder

## Source Tree

See [Source Tree Analysis](./source-tree-analysis.md) for detailed directory structure.

**Critical Paths:**

-   `/main.ts` - Plugin entry point
-   `/settings/` - Configuration management
-   `/suggests/` - UI autocomplete
-   `/utils/` - Shared utilities

## Development Workflow

See [Development Guide](./development-guide.md) for complete development instructions.

**Key Points:**

-   TypeScript source → esbuild → single `main.js` bundle
-   Watch mode for development (`npm run dev`)
-   Type checking before production build
-   Manual testing in Obsidian vault

## Deployment Architecture

**Distribution:**

-   GitHub Releases (automated via GitHub Actions)
-   Obsidian Community Plugins directory
-   Manual installation support

**Build Artifacts:**

-   `main.js` - Bundled plugin code
-   `manifest.json` - Plugin metadata
-   ZIP package for distribution

## Testing Strategy

**Current Approach:** Manual testing

**Test Workflow:**

1. Build plugin in watch mode
2. Link to test Obsidian vault
3. Create test notes with tags/patterns
4. Verify automatic movement
5. Test edge cases (duplicates, exclusions, frontmatter)

**Test Patterns:**

-   Pattern matching (`test_file_patterns` in requirements)
-   No formal test suite identified (no \*.test.ts files)

**Recommended Test Cases:**

-   Tag matching accuracy
-   Regex pattern validation
-   Frontmatter disable flag
-   Duplicate file handling
-   Folder exclusions
-   Manual vs automatic triggers

## Security Considerations

### Input Validation

-   User-provided regex patterns (potential for catastrophic backtracking)
-   Folder paths (validated before file operations)
-   Tag names from vault metadata

### File Operations

-   Safe file movement with duplicate detection
-   Frontmatter parsing uses Obsidian's built-in parser
-   No external network requests
-   No sensitive data storage

### Permissions

-   Operates within Obsidian's sandbox
-   Requires user's Obsidian vault access
-   No elevated system permissions

## Performance Characteristics

### Event Processing

-   Reactive: Only processes on file events
-   Synchronous rule matching
-   File operations delegated to Obsidian API

### Scalability

-   Suitable for vaults with thousands of notes
-   O(n) rule matching per event (n = number of rules)
-   No caching or indexing beyond Obsidian's metadata cache

### Resource Usage

-   Minimal memory footprint
-   No background processing
-   Event-driven (idle when no file changes)

## Extension Points

### Adding New Features

**Rule Types:**

-   Current: Tag-based, Pattern-based
-   Extensible: Add new matching criteria in `fileCheck()`

**UI Enhancements:**

-   Autocomplete system (`suggests/`) can be extended
-   New setting types via `settings.ts`

**File Operations:**

-   Utility functions in `utils/Utils.ts`
-   Can add pre/post-move hooks

## Configuration Management

### Settings Persistence

-   Stored in `.obsidian/plugins/auto-note-mover/data.json`
-   Managed by Obsidian's plugin data API
-   Automatically saved on changes

### Configuration Options

-   **trigger_auto_manual** - Automatic vs manual mode
-   **use_regex_to_check_tag** - Enable regex for tag matching
-   **statusBar_trigger_indicator** - Status bar visibility
-   **folder_tag_pattern** - Rule array
-   **excluded_folder** - Exclusion array

## Integration Architecture

### Obsidian Ecosystem

-   **Platform:** Obsidian desktop/mobile app
-   **Compatibility:** Minimum v0.12.0
-   **Distribution:** Community plugins or manual install

### External Integrations

-   None (standalone plugin)
-   Operates entirely within Obsidian

## Known Limitations

-   No undo functionality for automatic moves
-   Regex patterns not validated at input time
-   No bulk operations UI
-   Limited error reporting to user
-   No dry-run or preview mode

## Future Considerations

Based on architecture analysis:

-   Add rule testing/preview functionality
-   Implement undo/history for moves
-   Add batch processing UI
-   Enhance error handling and user feedback
-   Consider rule priorities/ordering
-   Add rule import/export

---

**Architecture maintained by:** Development team
**Last significant architectural change:** Plugin initialization pattern
**Contact:** See README.md for project maintainers
