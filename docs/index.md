-   esbuild 0.13.12
-   @popperjs/core 2.11.2

**Architecture Pattern:** Event-Driven Plugin (Extension)

**Build System:**

-   Development: `npm run dev` (watch mode)
-   Production: `npm run build` (type check + bundle)
-   Output: main.js (CommonJS)

## Generated Documentation

### Core Documentation

-   [Project Overview](./project-overview.md) - Executive summary and project introduction
-   [Architecture](./architecture.md) - Detailed technical architecture and design patterns
-   [Source Tree Analysis](./source-tree-analysis.md) - Directory structure with annotations

### Development Resources

-   [Development Guide](./development-guide.md) - Setup, workflow, and development practices

## Existing Documentation

### Project Documentation

-   [README.md](../README.md) - User-facing documentation and usage guide

### Configuration

-   [manifest.json](../manifest.json) - Plugin metadata (version 1.2.0, Obsidian ≥0.12.0)
-   [package.json](../package.json) - NPM dependencies and build scripts
-   [tsconfig.json](../tsconfig.json) - TypeScript compiler configuration

### Other

-   [LICENSE](../LICENSE) - MIT License
-   [.github/workflows/release.yml](../.github/workflows/release.yml) - Automated release workflow

## Getting Started

### For Users

1. Install the plugin from Obsidian Community Plugins or manually from GitHub releases
2. Configure rules in Settings → Auto Note Mover
3. Add folder-tag or folder-pattern mappings
4. Enable automatic or manual trigger mode

See [README.md](../README.md) for complete usage instructions.

### For Developers

1. **Clone and setup:**

    ```bash
    git clone https://github.com/devkade/obsidian-auto-note-mover-plus.git
    cd obsidian-auto-note-mover-plus
    npm install
    ```

2. **Start development:**

    ```bash
    npm run dev  # Watch mode with auto-rebuild
    ```

3. **Test in Obsidian:**
    - Link plugin folder to `.obsidian/plugins/` in test vault
    - Enable plugin in Obsidian settings
    - Reload on changes (Ctrl/Cmd + R)

See [Development Guide](./development-guide.md) for detailed instructions.

## Project Structure

```
obsidian-auto-note-mover/
├── main.ts                  # Plugin entry point
├── manifest.json            # Plugin metadata
├── package.json             # Dependencies
├── settings/
│   └── settings.ts          # Settings UI
├── suggests/
│   ├── file-suggest.ts      # Folder autocomplete
│   ├── tag-suggest.ts       # Tag autocomplete
│   └── suggest.ts           # Base class
├── utils/
│   └── Utils.ts             # File operations
└── docs/                    # This documentation
```

See [Source Tree Analysis](./source-tree-analysis.md) for complete structure.

## Key Components

**Plugin Core (main.ts):**

-   Event handlers for file create/modify/rename
-   Rule matching engine (fileCheck function)
-   Integration with Obsidian API

**Settings Management (settings/):**

-   Configuration UI with autocomplete
-   Rule definition (folder-tag/pattern mappings)
-   Folder exclusions
-   Settings persistence

**UI Components (suggests/):**

-   Folder path autocomplete
-   Tag autocomplete
-   Popper.js-based positioning

**Utilities (utils/):**

-   Safe file movement
-   Frontmatter parsing
-   Duplicate handling

## Architecture Highlights

**Pattern:** Event-Driven Plugin Architecture

**Flow:**

1. Obsidian file event (create/modify/rename)
2. Plugin event handler triggered
3. Rule matching against configured patterns
4. File moved to destination folder (if matched)

**Key Features:**

-   Tag-based or regex pattern matching
-   Folder exclusions
-   Frontmatter opt-out (`AutoNoteMover: disable`)
-   Duplicate file handling
-   Automatic and manual trigger modes

See [Architecture](./architecture.md) for complete details.

## Development Workflow

**Quick Start:**

-   `npm run dev` - Development build (watch mode)
-   `npm run build` - Production build (type check + bundle)

**Testing:**

-   Manual testing in Obsidian test vault
-   No automated test suite currently

**Release:**

-   Automated via GitHub Actions on tag push
-   **Scan Level:** Pattern-based (no source file reading)
-   **Date:** 2025-11-23

**Quick Scan Characteristics:**

-   Analyzed configuration files, manifests, and directory structure
-   Did not perform deep source code analysis
-   Sufficient for project overview and architecture documentation
-   For detailed code analysis, re-run with Deep or Exhaustive scan level

## Next Steps

### For AI-Assisted Development

When creating features or modifications:

1. Start with [Architecture](./architecture.md) for design patterns
2. Reference [Development Guide](./development-guide.md) for workflow
3. Use [Source Tree Analysis](./source-tree-analysis.md) to locate relevant files
4. Check [README.md](../README.md) for user-facing feature context

### For Brownfield PRD

When planning new features for this existing project:

-   Reference this index as the primary documentation source
-   Use [Architecture](./architecture.md) for technical constraints
-   Review [Project Overview](./project-overview.md) for current capabilities
-   Consult [Development Guide](./development-guide.md) for development patterns

---

**Documentation Version:** 1.0
**Last Updated:** 2025-12-01
**Maintained by:** Auto-generated by BMad Document Project Workflow
