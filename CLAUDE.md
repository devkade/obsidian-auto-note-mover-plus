# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Auto Note Mover is an Obsidian plugin that automatically moves notes to folders based on configurable rules. The plugin supports rule-based note organization using tags or regex patterns for note titles, with both automatic and manual trigger modes.

## Development Commands

- `npm run dev` - Start development build with watch mode using esbuild
- `npm run build` - Production build with TypeScript compilation and bundling

Build output: `main.js` (bundled plugin file)

## Architecture

### Core Components

- **main.ts**: Plugin entry point with event handling and rule matching logic
- **settings/settings.ts**: Settings UI and data structures for rules configuration
- **utils/Utils.ts**: Utility functions for file operations and frontmatter parsing
- **suggests/**: UI suggestion components for folder and tag autocomplete

### Key Architecture Patterns

**Event-Driven Plugin**: The plugin registers Obsidian event handlers for file creation, metadata changes, and file renaming. The core `fileCheck` function in `main.ts:13` orchestrates the rule matching and file moving logic.

**Rule Processing**: Rules are defined in the `folder_tag_pattern` array and processed in order. Each rule contains:
- `folder`: Destination folder path
- `tag`: Tag to match (mutually exclusive with pattern)
- `pattern`: Regex pattern for note title matching (mutually exclusive with tag)

**File Movement Safety**: The `fileMove` utility includes safety checks for:
- Destination folder existence
- Duplicate file names in target location
- Frontmatter disable detection (`AutoNoteMover: disable`)

### Settings Management

Settings use Obsidian's built-in data persistence with interfaces:
- `AutoNoteMoverSettings`: Main settings structure
- `FolderTagPattern`: Rule definition
- `ExcludedFolder`: Folder exclusion rules

The settings UI supports regex toggles for both tag matching and folder exclusion, providing flexible pattern matching options.

### Frontmatter Integration

The plugin respects frontmatter configuration:
- `AutoNoteMover: disable` - Prevents automatic note movement
- Uses Obsidian's `parseFrontMatterEntry` for reliable frontmatter parsing

## Dependencies

- **obsidian**: Obsidian API
- **@popperjs/core**: UI positioning for suggestions
- **esbuild**: Build tooling
- **TypeScript**: Type safety

## File Structure Notes

- Plugin follows Obsidian's standard plugin structure
- esbuild configuration handles external dependencies properly
- Source maps generated for development builds
- Uses CommonJS output format for Obsidian compatibility