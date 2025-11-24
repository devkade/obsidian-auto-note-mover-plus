# Project Overview

**Project Name:** Auto Note Mover Plus
**Type:** Obsidian Plugin (Extension)
**Version:** 1.0.0
**Author:** devkade
**License:** MIT
**Last Updated:** 2025-11-25

## Executive Summary

Auto Note Mover Plus is an enhanced fork of Auto Note Mover with powerful new capabilities. The plugin automates note organization within Obsidian vaults by monitoring file system events and automatically moving notes to designated folders based on flexible, multi-condition rules.

## Purpose

**Problem Statement:**
Users of Obsidian often create notes in default locations and need to manually organize them into appropriate folders based on content, tags, or other criteria. This manual process is time-consuming and error-prone.

**Solution:**
Auto Note Mover Plus provides automatic file organization through:

-   Multi-condition rule-based routing (Tag, Title, Property, Date)
-   Flexible match logic (ALL/ANY)
-   Real-time processing on note creation and modification
-   Configurable folder exclusions
-   Per-note opt-out via frontmatter
-   Manual trigger option for on-demand organization

## Key Features

### Automatic Note Movement

-   Triggers on file creation, modification, or rename events
-   Moves notes based on matching rules
-   Respects folder exclusions

### Flexible Rule Configuration

-   **Tag-based rules:** Move notes with specific tags to target folders
-   **Title-based rules:** Use JavaScript regex to match note titles
-   **Property-based rules:** Match a frontmatter key or `key=pattern` value
-   **Date-based rules:** Read a date from either a frontmatter key or file metadata (`ctime`/`mtime`), then apply moment-style tokens in the destination path (e.g., `{{YYYY}}/{{MM}}`).
-   Rule priority based on configuration order; first match wins
-   Multiple rules supported

### User Control

-   **Trigger modes:** Automatic or manual (ribbon icon)
-   **Frontmatter disable:** Add `AutoNoteMover: disable` to opt-out
-   **Folder exclusions:** Prevent processing in specific directories
-   **Regex toggle:** Advanced pattern matching option

### User Experience

-   Settings tab with intuitive UI
-   Folder and tag autocomplete suggestions
-   Status bar indicator (optional)
-   Duplicate file name handling

## Technology Stack

### Core Technologies

| Technology   | Version | Purpose                 |
| ------------ | ------- | ----------------------- |
| TypeScript   | 4.4.4   | Primary language        |
| Obsidian API | 0.12.17 | Plugin platform         |
| esbuild      | 0.13.12 | Build tooling           |
| Node.js      | 16.x    | Development environment |

### Architecture

-   **Pattern:** Event-Driven Plugin Architecture
-   **Structure:** Monolithic (single bundled output)
-   **Entry Point:** `main.ts`
-   **Build Output:** `main.js` (CommonJS)

### Dependencies

-   **@popperjs/core** - UI positioning for autocomplete

## Repository Structure

**Type:** Monolith (single cohesive codebase)

```
obsidian-auto-note-mover/
├── main.ts              # Plugin entry point
├── settings/            # Configuration UI
├── suggests/            # Autocomplete components
├── utils/               # Utilities
└── docs/                # Documentation (generated)
```

**Primary Language:** TypeScript
**Build System:** esbuild with npm scripts

## Architecture Overview

**Architecture Type:** Event-Driven Plugin
**Pattern Classification:** Extension (Obsidian plugin framework)

### High-Level Flow

1. **Event Trigger:** Obsidian file system event (create/modify/rename)
2. **Rule Matching:** Check file against configured rules
3. **Validation:** Verify exclusions and frontmatter
4. **File Operation:** Move file to target folder if matched

### Key Components

-   **Event Handlers** - Respond to Obsidian file events
-   **Rule Engine** - Match files against tag/pattern rules
-   **Settings Manager** - Configuration UI and persistence
-   **File Operations** - Safe file movement with duplicate handling
-   **UI Suggestions** - Autocomplete for folders and tags

See [Architecture Documentation](./architecture.md) for detailed design.

## Getting Started

### For Users

**Installation:**

1. Download from Obsidian Community Plugins, or
2. Install manually from GitHub releases

**Configuration:**

1. Open Obsidian Settings → Auto Note Mover
2. Add folder-tag or folder-pattern rules
3. Optionally configure folder exclusions
4. Choose automatic or manual trigger mode

See project [README.md](../README.md) for usage instructions.

### For Developers

**Prerequisites:**

-   Node.js 16+
-   npm
-   Obsidian for testing

**Setup:**

```bash
git clone https://github.com/farux/obsidian-auto-note-mover.git
cd obsidian-auto-note-mover
npm install
npm run dev
```

See [Development Guide](./development-guide.md) for complete instructions.

## Project Links

### Documentation

-   **[Architecture](./architecture.md)** - Detailed technical architecture
-   **[Source Tree Analysis](./source-tree-analysis.md)** - Directory structure
-   **[Development Guide](./development-guide.md)** - Development setup and workflow
-   **[Deployment Guide](./deployment-guide.md)** - Release process

### External Resources

-   **Repository:** https://github.com/devkade/obsidian-auto-note-mover-plus
-   **Author Page:** https://github.com/devkade/
-   **License:** MIT (see [LICENSE](../LICENSE))

## Development Status

**Current Version:** 1.2.0
**Minimum Obsidian Version:** 0.12.0
**Platform Support:** Desktop and Mobile (not desktop-only)

### Recent Updates

See git commit history:

-   Version 1.2.0 release
-   Regular expression option for excluded folders
-   Continuous improvements and bug fixes

## Project Metadata

**Project Classification:**

-   **Type:** Extension (Obsidian Plugin)
-   **Repository Structure:** Monolith
-   **Complexity:** Medium (single-part plugin)

**Technology Profile:**

-   Strongly typed (TypeScript)
-   Event-driven architecture
-   Build-time bundling
-   No external services

**Development Characteristics:**

-   No database (uses Obsidian's storage)
-   No API backend (standalone plugin)
-   File system integration only
-   UI via Obsidian's plugin framework

## Key Directories

| Directory   | Purpose       | Key Files                                  |
| ----------- | ------------- | ------------------------------------------ |
| `/`         | Root          | `main.ts`, `manifest.json`, `package.json` |
| `/settings` | Configuration | `settings.ts`                              |
| `/suggests` | UI Components | `file-suggest.ts`, `tag-suggest.ts`        |
| `/utils`    | Utilities     | `Utils.ts`                                 |
| `/docs`     | Documentation | Generated docs (this folder)               |
| `/.github`  | CI/CD         | `workflows/release.yml`                    |

## Integration Points

### With Obsidian

-   File system event listeners
-   Vault file operations API
-   Settings tab registration
-   Metadata cache access
-   Ribbon icon integration

### External

-   None (standalone plugin)

## Support

**Issues and Feature Requests:**
GitHub Issues: https://github.com/farux/obsidian-auto-note-mover/issues

**Contributing:**
See repository for contribution guidelines

**Author Contact:**
https://github.com/farux/

---

**Last Updated:** 2025-11-24
**Documentation Version:** 1.0 (Initial scan)
