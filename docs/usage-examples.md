# Usage Examples

This document provides various configuration examples for the **Auto Note Mover** plugin. You can configure these rules in the plugin settings tab.

## Sample Configuration (`data.json`)

### 1. Move by Date with Exclusions

Move general notes to a date-based folder, but **exclude** specific note types (like Daily or Weekly notes) using regex.

-   **Goal**: Move notes to `20_Notes/Year/Month` based on creation time, but **skip** Daily Notes (`YYYY-MM-DD`) and Weekly Notes (`YYYY-Www`).
-   **Settings**:
    -   **Folder**: `20_Notes/{{gggg}}/M{{MM}}`
    -   **Match**: `ALL`
    -   **Conditions**:
        1.  **Type**: `Date`
            -   **Source**: `Metadata` -> `Created time`
            -   **Note**: This sets the destination folder based on the file's creation date.
        2.  **Type**: `Title`
            -   **Value**: `^(?!\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$).*$`
            -   **Explanation**: Negative lookahead to **exclude** files named like `2024-01-01`.
        3.  **Type**: `Title`
            -   **Value**: `^(?!\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$).*$`
            -   **Explanation**: Negative lookahead to **exclude** files named like `2024-W01`.

### 2. Move by Tag

Move notes containing a specific tag to a designated folder.

-   **Goal**: Move all notes with `#book` tag to `Reading List` folder.
-   **Settings**:
    -   **Folder**: `Reading List`
    -   **Match**: `ALL`
    -   **Condition**:
        -   **Type**: `Tag`
        -   **Value**: `#book`

### 3. Move by Title (Regex)

Move notes where the filename matches a specific Regular Expression pattern.

-   **Goal**: Move notes starting with "Meeting -" to `Meetings` folder.
-   **Settings**:
    -   **Folder**: `Meetings`
    -   **Match**: `ALL`
    -   **Condition**:
        -   **Type**: `Title`
        -   **Value**: `^Meeting -`

### 4. Move by Date (Daily Notes)

Organize notes into date-based folders using the note's creation date or a frontmatter date property.

-   **Goal**: Move notes to `Diary/YYYY/MM` based on their creation time.
-   **Settings**:
    -   **Folder**: `Diary/{{YYYY}}/{{MM}}`
    -   **Match**: `ALL`
    -   **Condition**:
        -   **Type**: `Date`
        -   **Source**: `Metadata` -> `Created time`

### 5. Move by Property (Frontmatter)

Move notes that have a specific frontmatter property or value.

-   **Goal**: Move notes with `type: reference` in frontmatter to `References` folder.
-   **Settings**:
    -   **Folder**: `References`
    -   **Match**: `ALL`
    -   **Condition**:
        -   **Type**: `Property`
        -   **Value**: `type=reference`

### 6. Complex Logic (ANY Match)

Move notes if _any_ of the conditions are met.

-   **Goal**: Move note to `Inbox` if it has `#inbox` tag OR `status: new` property.
-   **Settings**:
    -   **Folder**: `Inbox`
    -   **Match**: `ANY`
    -   **Conditions**:
        1.  **Type**: `Tag`, **Value**: `#inbox`
        2.  **Type**: `Property`, **Value**: `status=new`
