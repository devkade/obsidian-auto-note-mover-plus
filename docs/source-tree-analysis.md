# Source Tree Analysis

**Project:** Auto Note Mover (Obsidian Plugin)
**Type:** Extension (Monolith)
**Generated:** 2025-12-01

## Directory Structure

```
obsidian-auto-note-mover/
├── main.ts                    # Plugin entry point - registers event handlers
├── manifest.json              # Obsidian plugin manifest (version, metadata)
├── package.json               # NPM dependencies and build scripts
├── tsconfig.json              # TypeScript compiler configuration
├── esbuild.config.mjs         # Build configuration (bundler)
│
├── settings/                  # Settings management
│   └── settings.ts           # Settings UI and data structures
│
├── suggests/                  # UI suggestion components
│   ├── suggest.ts            # Base suggestion class
│   ├── file-suggest.ts       # Folder autocomplete component
│   └── tag-suggest.ts        # Tag autocomplete component
│
├── utils/                     # Utility functions
│   └── Utils.ts              # File operations and frontmatter parsing
│
├── docs/                      # Documentation
│   └── sprint-artifacts/         # Sprint planning artifacts
│
├── LICENSE                    # MIT License
├── README.md                  # Project documentation
└── versions.json              # Version compatibility information
```

## Critical Directories

### `/` (Root)

**Purpose:** Main plugin code and configuration
**Key Files:**

-   `main.ts` - Plugin entry point with event handling logic
-   `manifest.json` - Obsidian plugin metadata
-   Entry point for build: `esbuild.config.mjs`

### `/settings`

**Purpose:** Settings UI and configuration management
**Pattern:** Settings tab integration with Obsidian
**Key Responsibilities:**

-   Rule configuration interface
-   Folder-tag pattern management
-   Settings persistence

### `/suggests`

**Purpose:** UI autocomplete components
**Pattern:** Popper.js-based suggestion modals
**Key Responsibilities:**

-   Folder path suggestions
-   Tag autocomplete
-   User input assistance

### `/utils`

**Purpose:** Shared utility functions
**Key Responsibilities:**

-   File movement operations
-   Frontmatter parsing
-   Path validation

## Entry Points

**Main Entry:** `main.ts`

-   Extends Obsidian `Plugin` class
-   Registers file event handlers
-   Implements rule matching and file moving logic

**Build Entry:** `esbuild.config.mjs`

-   Bundles TypeScript to single `main.js`
-   Configured for CommonJS output
-   Externals: Obsidian API, Electron, CodeMirror

## Integration Points

**Obsidian API Integration:**

-   File system events (create, rename, metadata change)
-   Vault file operations
-   Settings tab registration
-   Frontmatter access

**External Dependencies:**

-   `@popperjs/core` - UI positioning for suggestions
-   `obsidian` - Obsidian plugin API (external)

## Build Output

**Target:** `main.js` (bundled, generated)
**Source Maps:** Inline (development), none (production)
**Format:** CommonJS (required by Obsidian)
