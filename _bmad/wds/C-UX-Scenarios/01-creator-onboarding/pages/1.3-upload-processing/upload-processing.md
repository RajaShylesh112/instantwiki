### 1.3-upload-processing

**Previous Step:** ← [Creator Dashboard](../1.2-creator-dashboard/creator-dashboard.md)  
**Next Step:** None (Redirects to Wiki Homepage `/u/[username]/[wiki_slug]`)

![Upload & Processing Sketch](Sketches/1.3-upload-processing.jpg)

**Previous Step:** ← [Creator Dashboard](../1.2-creator-dashboard/creator-dashboard.md)  
**Next Step:** None (Redirects to Wiki Homepage `/u/[username]/[wiki_slug]`)

---

# 1.3-upload-processing

## Page Metadata

| Property | Value |
|----------|-------|
| **Scenario** | Creator Onboarding & Wiki Setup |
| **Page Number** | 1.3 |
| **Platform** | Desktop Web |
| **Page Type** | Full Page |
| **Viewport** | Desktop-first (responsive) |
| **Interaction** | Mouse & Keyboard (with Drag-and-Drop) |
| **Visibility** | Authenticated (Wiki Owner) |

---

## Overview

**Page Purpose:** Allow the wiki creator to feed knowledge into the wiki by uploading files or pasting web URLs, and display the live status of the AI knowledge extraction pipeline.

**User Situation:** Clara has created her empty wiki `clara/bioinformatics-research` and needs to upload her research PDFs so the AI can extract concepts.

**Success Criteria:** Files are uploaded successfully, and the system completes processing, redirecting Clara to her populated wiki page.

**Entry Points:**
- Direct redirect after creating a wiki.
- Navigating to `/u/[username]/[wiki_slug]/upload`.

**Exit Points:**
- Auto-redirect to `/u/[username]/[wiki_slug]` upon successful processing completion.

---

## Reference Materials

**Strategic Foundation:**
- [Product Brief](../../../A-Product-Brief/project-brief.md) - Section: Upload Sources Page, Processing Screen
- [Trigger Map](../../../B-Trigger-Map/trigger-map.md) - Focus: Zero-configuration setup and Live processing feedback (avoiding boring loaders)

---

## Layout Structure

The page follows the default left sidebar navigation structure but uses the main panel to display the drop zone.

```
+-------------------------------------------------------------+
| Sidebar        | Bioinformatics Research                    |
| [Instant Wiki] |                                            |
|                | +----------------------------------------+ |
| - Overview     | |           Drag Files Here              | |
| - Pages        | |                                        | |
| - Graph        | |       PDF, TXT, Markdown or Paste URL  | |
| - Sources      | |                                        | |
| - Settings     | +----------------------------------------+ |
|                |                                            |
| [Profile]      | Sources                                    |
| [Plan: Free]   | - GenomicsAnalysis.pdf  (Ready)            |
|                | [ Build Wiki ]                             |
+----------------+--------------------------------------------+
```

### Live Processing Screen Layout (Replacing Uploader during build)
```
+-------------------------------------------------------------+
| Sidebar        | Bioinformatics Research                    |
| [Instant Wiki] |                                            |
|                | Building Your Wiki...                      |
| - Overview     |                                            |
| - Pages        |   ✓ Extracting Text                        |
| - Graph        |   ✓ Finding Concepts                       |
| - Sources      |   ⟳ Discovering Relationships              |
| - Settings     |   Waiting: Generating Pages                |
|                |                                            |
+----------------+--------------------------------------------+
```

---

## Spacing

**Scale:** [Spacing Scale](../../../D-Design-System/00-design-system.md#spacing-scale)

| Property | Token |
|----------|-------|
| Drop zone size | 100% width, min-height 250px |
| Section gap | space-xl |
| List element gap | space-md |
| Processing step vertical gap | space-lg |

---

## Typography

**Scale:** [Type Scale](../../../D-Design-System/00-design-system.md#type-scale)

| Element | Semantic | Size | Weight | Typeface |
|---------|----------|------|--------|----------|
| Page Wiki Title | H1 | text-lg | bold | sans-serif |
| Dropzone text | p | text-md | normal | sans-serif |
| Dropzone helper | span | text-xs | normal | Monospace |
| Processing header | H2 | text-xl | semibold | sans-serif |
| Processing step text | p | text-md | medium | sans-serif |
| Status icons | span | text-md | bold | Monospace |

---

## Page Sections

### Section: Left Navigation Sidebar
**OBJECT ID:** `upload-sidebar`
*(References the shared navigation sidebar layout of the wiki workspace view)*
- Links: `Overview`, `Pages`, `Graph`, `Sources`, `Settings` (all disabled during processing state)

---

### Section: Knowledge Source Uploader
**OBJECT ID:** `upload-container`

| Property | Value |
|----------|-------|
| Purpose | Provide drop area and file listings |
| Padding | space-xl |

#### Drag & Drop Zone Box
**OBJECT ID:** `upload-dropzone`
- **Style:** Dashed border, light background (gray-50), hover change background to gray-100
- **EN:** "Drag Files Here\nPDF, TXT, Markdown\nor\nPaste URL"
- **Behavior:** Accepts drop events. Clicking opens native file selector.

#### URL Pasting Component
**OBJECT ID:** `upload-url-input-group`
- **Layout:** Horizontal split (Input field + Add button)
- **Placeholder EN:** "Paste website URL here..."
- **Button:** "Import URL"

#### Sources List
**OBJECT ID:** `upload-sources-list`
- **Layout:** Vertical Stack
- **Items:** List of uploaded files with progress indicators:
  - `upload-source-item-1`: "GenomicsAnalysis.pdf" (Size: 1.2MB, Status: Ready)
- **Trigger Button:** `upload-btn-build`: "Build Wiki" (Solid brand color, initiates processing animation)

---

### Section: Live Processing Checklist
**OBJECT ID:** `processing-status-container`
- **Visibility:** Hidden by default. Replaces the `upload-container` when building is initiated.

#### Processing Step Items Group
**OBJECT ID:** `processing-steps-group`
- **Layout:** Vertical Stack with space-lg spacing
- **Steps:**
  1. `processing-step-text`: "Extracting Text"
     - Status: Active spinning loader $\to$ Done checkmark
  2. `processing-step-concepts`: "Finding Concepts"
     - Status: Waiting $\to$ Active loader $\to$ Done checkmark
  3. `processing-step-relations`: "Discovering Relationships"
     - Status: Waiting $\to$ Active loader $\to$ Done checkmark
  4. `processing-step-pages`: "Generating Pages"
     - Status: Waiting $\to$ Active loader $\to$ Done checkmark

---

## Page States

| State | When | Appearance | Actions |
|-------|------|------------|---------|
| Empty | Initial page load | Drag & drop box empty, URL input empty, list empty, build button disabled | Drag files, paste URLs |
| Files Loaded | Files dragged or URLs added | Uploader box active, list displays added items, "Build Wiki" button enabled | Click "Build Wiki", remove source |
| Processing Step 1 | User clicks "Build Wiki" | Uploader hidden, processing container visible. Step 1 shows loader, others show Waiting. | None |
| Processing Step 2 | Text extracted | Step 1 shows checkmark, Step 2 shows loader, others show Waiting. | None |
| Processing Step 3 | Concepts found | Step 1 & 2 show checkmark, Step 3 shows loader, Step 4 shows Waiting. | None |
| Processing Step 4 | Relations discovered | Step 1, 2, 3 show checkmark, Step 4 shows loader. | None |
| Redirecting | Pages generated | All steps show checkmark, quick success message, page redirects to homepage. | None |

---

## Conditional Sections

| Condition | Include |
|-----------|---------|
| Has Drag & Drop | → [form-validation.instructions.md](instructions/form-validation.instructions.md) |
| Needs API Data | → [data-api.instructions.md](instructions/data-api.instructions.md) |
| API Call | Edge function upload and trigger vector database indexing |

---

## Open Questions

| # | Question | Context | Status |
|---|----------|---------|--------|
| 1 | What happens if a user closes the tab during processing? | The processing continues in the database/backend. If they return to the URL, they see the dashboard or homepage depending on the latest DB status. | 🟢 Resolved |

---

## Checklist

- [x] Page purpose clear
- [x] All Object IDs assigned
- [x] States documented (live checklists)
- [x] No chat bubble wrappers

---

**Previous Step:** ← [Creator Dashboard](../1.2-creator-dashboard/creator-dashboard.md)  
**Next Step:** None (Redirects to Wiki Homepage `/u/[username]/[wiki_slug]`)

---

_Created using Whiteport Design Studio (WDS) methodology_
