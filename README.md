# Auto Note Mover Plus

**Auto Note Mover Plus** is a powerful Obsidian plugin that automatically moves your notes to specific folders based on flexible rules. It is a fork of the original [Auto Note Mover](https://github.com/farux/obsidian-auto-note-mover) with enhanced capabilities.

## Key Features (Plus)

-   **Multiple Conditions per Rule**: Combine multiple checks (Tag, Title, Property, Date) for a single folder destination.
-   **Flexible Matching**: Choose between **ALL** (AND) or **ANY** (OR) logic for your conditions.
-   **Date-Based Organization**: Move notes based on creation/modification time or custom date frontmatter fields.

## How it works

1. **Define Rules**: You set up rules that map conditions to a destination folder.
2. **Trigger**:
    - **Automatic**: Moves notes automatically when you create, edit, or rename them.
    - **Manual**: Moves notes only when you run the "Move the note" command.

## Configuration

### Rules

Each rule consists of:

1.  **Destination Folder**: Where the notes should go.
2.  **Match Mode**:
    -   `ALL`: The note must meet **every** condition in the list.
    -   `ANY`: The note must meet **at least one** condition in the list.
3.  **Conditions**: Add one or more criteria.

### Condition Types

| Type         | Description                                        | Example                             |
| :----------- | :------------------------------------------------- | :---------------------------------- |
| **Tag**      | Matches a tag in the note.                         | `#journal`, `#work/project`         |
| **Title**    | Matches the note title using Regex.                | `^Daily Note`, `Meeting$`           |
| **Property** | Matches a frontmatter property (key or key=value). | `status: active`, `published: true` |
| **Date**     | Matches date criteria (see below).                 | Created Time, Modified Time         |

#### Date Condition Details

Organize notes into date-based subfolders (e.g., `2023/10`).

-   **Source**: Choose `Frontmatter` (specify a key like `created`) or `File Metadata` (`ctime`/`mtime`).
-   **Format**: Use `{{YYYY}}`, `{{MM}}`, `{{DD}}` in your **Destination Folder** path.
    -   Example Folder Path: `Journal/{{YYYY}}/{{MM}}`
    -   If the date is `2023-11-25`, note moves to `Journal/2023/11`.

## Installation

### Manual Installation

1.  Download the `main.js`, `manifest.json`, and `styles.css` from the latest Release.
2.  Create a folder `auto-note-mover-plus` in your vault's `.obsidian/plugins/` directory.
3.  Place the files there.
4.  Reload Obsidian and enable the plugin.

## Attribution

This plugin is a fork of [Auto Note Mover](https://github.com/farux/obsidian-auto-note-mover) by [farux](https://github.com/farux).
Big thanks to the original author for the excellent foundation.

## License

MIT
