### 3.1-sources-manager

**Previous Step:** ← [Wiki Article Page](../../02-reader-portal/pages/2.2-wiki-article/wiki-article.md)  
**Next Step:** → [Wiki Settings](../3.2-wiki-settings/wiki-settings.md)

![Sources Manager Sketch](Sketches/3.1-sources-manager.jpg)

**Previous Step:** ← [Wiki Article Page](../../02-reader-portal/pages/2.2-wiki-article/wiki-article.md)  
**Next Step:** → [Wiki Settings](../3.2-wiki-settings/wiki-settings.md)

---

# 3.1-sources-manager

## Page Metadata

| Property | Value |
|----------|-------|
| **Scenario** | Wiki Management & Billing |
| **Page Number** | 3.1 |
| **Platform** | Desktop Web |
| **Page Type** | Full Page |
| **Viewport** | Desktop-first (responsive layout) |
| **Interaction** | Mouse & Keyboard |
| **Visibility** | Authenticated (Wiki Owner) |

---

## Overview

**Page Purpose:** List all documents and URLs that supply knowledge to the wiki, display transparency statistics (generated pages/concepts count per file), and allow uploading new sources.

**User Situation:** Clara wants to verify if `Statistics.pdf` was parsed correctly and check how many concepts the AI extracted from it.

**Success Criteria:** List of sources displays correctly with accurate metrics; user can upload new files to grow the wiki.

**Entry Points:**
- Clicking "Sources" link in the wiki workspace sidebar.
- Navigating to `/u/[username]/[wiki_slug]/sources`.

**Exit Points:**
- Click "Delete Source" $\to$ Triggers confirmation modal.
- Click "+ Add Source" $\to$ Opens inline file uploader.
- Sidebar navigation links.

---

## Reference Materials

**Strategic Foundation:**
- [Product Brief](../../../A-Product-Brief/project-brief.md) - Section: Sources View (transparency metrics: pages generated, concepts found)
- [Trigger Map](../../../B-Trigger-Map/trigger-map.md) - Focus: Traceable trust (Clara's top driver)

---

## Layout Structure

Standard navigation sidebar on left. Right main panel contains the sources header, inline uploader, and sources table.

```
+-------------------------------------------------------------+
| Sidebar        | Sources                                    |
| [Instant Wiki] |                                            |
|                | Manage your knowledge sources.             |
| - Overview     | [+ Add Source]                             |
| - Pages        +--------------------------------------------+
| - Graph        | Document Name       Pages      Concepts    |
| - Sources      +--------------------------------------------+
| - Settings     | DeepLearning.pdf    8          15     [Del] |
|                | Statistics.pdf      5          10     [Del] |
| [Profile]      |                                            |
| [Plan: Free]   |                                            |
+----------------+--------------------------------------------+
```

---

## Spacing

**Scale:** [Spacing Scale](../../../D-Design-System/00-design-system.md#spacing-scale)

| Property | Token |
|----------|-------|
| Table header cell padding | space-sm vertical, space-md horizontal |
| Table row gap | space-xs |
| Inline uploader height | min-height 120px |
| Section margin-bottom | space-xl |

---

## Typography

**Scale:** [Type Scale](../../../D-Design-System/00-design-system.md#type-scale)

| Element | Semantic | Size | Weight | Typeface |
|---------|----------|------|--------|----------|
| Page Title | H1 | text-xl | bold | sans-serif |
| Table Header Label | th | text-xs | semibold | Monospace |
| Document Title | td | text-sm | medium | sans-serif |
| Metric Counter | td | text-sm | normal | Monospace |
| Danger Action | button | text-xs | semibold | sans-serif |

---

## Page Sections

### Section: Left Navigation Sidebar
**OBJECT ID:** `sources-sidebar`
*(References shared navigation sidebar)*
- `Sources` link is active.

---

### Section: Sources Manager Container
**OBJECT ID:** `sources-container`

| Property | Value |
|----------|-------|
| Purpose | List, add, and delete knowledge sources |
| Padding | space-xl |

#### Section Header
**OBJECT ID:** `sources-header`
- **Title:** "Sources"
- **Subtitle EN:** "Manage the documents and links that feed this wiki."

#### Inline Add Source Card
**OBJECT ID:** `sources-add-card`
- **Visibility:** Hidden by default. Opens when user clicks `+ Add Source`.
- **Component:** Small drag-drop panel identical to uploader in Page 1.3.

#### Sources Table
**OBJECT ID:** `sources-table`
- **Headers:** `Document Name`, `Uploaded`, `Pages Generated`, `Concepts Found`, `Actions`.
- **Row Columns:**
  - `sources-col-name`: File name text link (e.g. `DeepLearning.pdf`)
  - `sources-col-date`: Time since upload text (e.g. `3 days ago`)
  - `sources-col-pages`: Count text (e.g. `8`)
  - `sources-col-concepts`: Count text (e.g. `15`)
  - `sources-col-action-btn`: "Delete" text link button (styled red/danger, triggers confirm delete modal)

---

## Page States

| State | When | Appearance | Actions |
|-------|------|------------|---------|
| Default | Page loaded | Table populated with current sources list, inline uploader closed | Click "+ Add Source", click "Delete" |
| Add Source Active | User clicks "+ Add Source" | Inline uploader card visible above table | Drag files, paste URLs, click Cancel |
| Deleting Source | User clicks "Delete" on row | Overlay modal pops up confirming source removal warning that generated concepts will be deleted | Click "Confirm Delete", click "Cancel" |

---

## Conditional Sections

| Condition | Include |
|-----------|---------|
| Has Forms / Input | → [form-validation.instructions.md](instructions/form-validation.instructions.md) |
| Needs API Data | → [data-api.instructions.md](instructions/data-api.instructions.md) |
| API Call | Fetch list of files linked to wiki with statistics; delete file and trigger DB cascades to prune concepts |

---

## Open Questions

| # | Question | Context | Status |
|---|----------|---------|--------|
| 1 | Does deleting a source automatically delete the pages generated by it? | Yes, database cascades remove any generated article pages whose only citation reference was the deleted source. If a page has multiple references, it remains active but with the deleted source citation removed. | 🟢 Resolved |

---

## Checklist

- [x] Page purpose clear
- [x] All Object IDs assigned
- [x] Table columns map statistics correctly
- [x] Delete safety warnings documented

---

**Previous Step:** ← [Wiki Article Page](../../02-reader-portal/pages/2.2-wiki-article/wiki-article.md)  
**Next Step:** → [Wiki Settings](../3.2-wiki-settings/wiki-settings.md)

---

_Created using Whiteport Design Studio (WDS) methodology_
