# Development Guide

**Project:** Auto Note Mover Plus (Obsidian Plugin)
**Last Updated:** 2025-11-25

## Prerequisites

### Required Software

-   **Node.js** - Version 16+ (based on `@types/node: ^16.11.6`)
-   **npm** - Package manager for Node.js
-   **TypeScript** - Version 4.4.4
-   **Obsidian** - For testing the plugin

### Development Tools

-   **esbuild** - Fast bundler (v0.13.12)
-   **ESLint** - Code linting with TypeScript support
-   **TypeScript Compiler** - Type checking

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/devkade/obsidian-auto-note-mover-plus.git
cd obsidian-auto-note-mover-plus
```

### 2. Install Dependencies

```bash
npm install
```

This will install:

-   Development dependencies (TypeScript, esbuild, ESLint, types)
-   Runtime dependency (@popperjs/core for UI positioning)

## Development Workflow

### Development Build (Watch Mode)

```bash
npm run dev
```

**What it does:**

-   Runs esbuild in watch mode
-   Automatically rebuilds on file changes
-   Generates inline source maps for debugging
-   Outputs to `main.js`

### Production Build

```bash
npm run build
```

**What it does:**

-   Runs TypeScript compiler for type checking (`tsc -noEmit -skipLibCheck`)
-   Runs esbuild in production mode
-   No source maps
-   Outputs optimized `main.js`

### Type Checking

TypeScript compilation is run as part of the build process:

```bash
tsc -noEmit -skipLibCheck
```

## Project Structure for Development

```
Source Files (Editable):
├── main.ts              # Main plugin logic
├── settings/
│   └── settings.ts      # Settings UI
├── suggests/
│   ├── suggest.ts       # Base suggestion class
│   ├── file-suggest.ts  # Folder autocomplete
│   └── tag-suggest.ts   # Tag autocomplete
└── utils/
    └── Utils.ts         # Utilities

Build Output (Generated):
└── main.js              # Bundled plugin (do not edit)
```

## Testing the Plugin

### Manual Testing in Obsidian

1. **Build the plugin:**

    ```bash
    npm run dev
    ```

2. **Link to Obsidian vault:**

    - Copy the plugin folder to your vault's `.obsidian/plugins/` directory
    - Or create a symbolic link

3. **Enable in Obsidian:**

    - Open Obsidian Settings → Community Plugins
    - Disable Safe Mode (if enabled)
    - Enable "Auto Note Mover"

4. **Test changes:**
    - Make code changes
    - esbuild will auto-rebuild
    - Reload plugin in Obsidian (Ctrl+R or Cmd+R)

### Development Setup in Obsidian

**Recommended vault structure for testing:**

```
test-vault/
├── .obsidian/
│   └── plugins/
│       └── auto-note-mover/  # Symlink or copy
│           ├── main.js
│           ├── manifest.json
│           └── styles.css (if any)
└── (test notes and folders)
```

## Code Style and Conventions

### Linting

ESLint is configured with TypeScript support:

```bash
# Configuration files:
.eslintrc        # ESLint rules
.eslintignore    # Ignored files
```

### Editor Configuration

`.editorconfig` is provided for consistent formatting:

-   Indent style: tabs
-   Charset: utf-8
-   End of line: lf

## Build Configuration

### esbuild Configuration (`esbuild.config.mjs`)

-   **Entry point:** `main.ts`
-   **Output:** `main.js`
-   **Format:** CommonJS (required by Obsidian)
-   **Target:** ES2016
-   **Bundle:** true
-   **External modules:** Obsidian API, Electron, CodeMirror packages
-   **Tree shaking:** Enabled

### TypeScript Configuration (`tsconfig.json`)

-   **Module:** ESNext
-   **Target:** ES6
-   **Source maps:** Inline
-   **Strict:** `noImplicitAny: true`
-   **Module resolution:** Node

## Common Development Tasks

### Adding a New Feature

1. Identify the appropriate file(s) to modify
2. Make changes to TypeScript source
3. Test in development mode (`npm run dev`)
4. Run production build to verify (`npm run build`)
5. Test in Obsidian vault

### Modifying Settings

-   Edit `settings/settings.ts`
-   Settings are persisted using Obsidian's data API
-   UI changes will appear in plugin settings tab

### Adding UI Components

-   Create new suggest component in `suggests/`
-   Extend base classes from `obsidian` module
-   Use Popper.js for positioning (already included)

### Debugging

1. Enable source maps in development build (automatic)
2. Open Obsidian Developer Tools (Ctrl+Shift+I or Cmd+Option+I)
3. Set breakpoints in source files
4. Inline source maps allow debugging TypeScript directly

## Dependencies

### Runtime Dependencies

-   **@popperjs/core** (^2.11.2) - UI positioning for suggestion modals

### Development Dependencies

-   **TypeScript** (4.4.4) - Language and compiler
-   **esbuild** (0.13.12) - Fast bundler
-   **@typescript-eslint/eslint-plugin** (^5.2.0) - ESLint TypeScript support
-   **@typescript-eslint/parser** (^5.2.0) - TypeScript parser for ESLint
-   **obsidian** (^0.12.17) - Obsidian API types
-   **@types/node** (^16.11.6) - Node.js type definitions
-   **tslib** (2.3.1) - TypeScript runtime helpers
-   **builtin-modules** (^3.2.0) - Node.js builtin module list

## Release Process

A GitHub Actions workflow is configured for releases:

-   **File:** `.github/workflows/release.yml`
-   Automated release process (check workflow file for details)

## Additional Resources

-   **README.md** - Project overview and usage instructions
-   **CLAUDE.md** - Development guidance for Claude Code
-   **manifest.json** - Plugin metadata (version, compatibility)

## Troubleshooting

### Build Errors

-   Ensure TypeScript version matches: `4.4.4`
-   Clear node_modules and reinstall: `rm -rf node_modules && npm install`
-   Check for TypeScript errors: `npm run build`

### Plugin Not Loading in Obsidian

-   Verify `manifest.json` is present
-   Check Obsidian console for errors
-   Ensure `main.js` was generated
-   Verify minimum Obsidian version: `0.12.0`

### Watch Mode Not Rebuilding

-   Restart the dev command: `npm run dev`
-   Check for file permission issues
-   Verify esbuild is watching the correct directory
