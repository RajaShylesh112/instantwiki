### 3.2-wiki-settings

**Previous Step:** ← [Sources Manager](../3.1-sources-manager/sources-manager.md)  
**Next Step:** None (Settings endpoint)

![Wiki Settings Sketch](Sketches/3.2-wiki-settings.jpg)

**Previous Step:** ← [Sources Manager](../3.1-sources-manager/sources-manager.md)  
**Next Step:** None (Settings endpoint)

---

# 3.2-wiki-settings

## Page Metadata

| Property | Value |
|----------|-------|
| **Scenario** | Wiki Management & Billing |
| **Page Number** | 3.2 |
| **Platform** | Desktop Web |
| **Page Type** | Full Page |
| **Viewport** | Desktop-first (responsive) |
| **Interaction** | Mouse & Keyboard |
| **Visibility** | Authenticated (Wiki Owner) |

---

## Overview

**Page Purpose:** Allow the wiki owner to modify general wiki metadata (Title, Slug, Description), toggle visibility permissions, or delete the wiki entirely.

**User Situation:** Sarah wants to change her wiki visibility from Unlisted to Private to ensure it remains restricted to her immediate project team.

**Success Criteria:** User successfully updates wiki metadata, or deletes the wiki and is redirected to the dashboard.

**Entry Points:**
- Clicking "Settings" link in the wiki workspace sidebar.
- Navigating to `/u/[username]/[wiki_slug]/settings`.

**Exit Points:**
- Deletion success $\to$ Redirect to `/dashboard`.
- Sidebar navigation links.

---

## Reference Materials

**Strategic Foundation:**
- [Product Brief](../../../A-Product-Brief/project-brief.md) - Section: Settings (Title, Slug, Description, Visibility, Delete Wiki)
- [Trigger Map](../../../B-Trigger-Map/trigger-map.md) - Focus: Confidential IP leakage prevention (Sarah's negative driver)

---

## Layout Structure

Standard navigation sidebar on left. Right main panel contains the settings sections arranged vertically.

```
+-------------------------------------------------------------+
| Sidebar        | Settings                                   |
| [Instant Wiki] |                                            |
|                | General Settings                           |
| - Overview     | Title: [ Bioinformatics Research         ] |
| - Pages        | Slug:  [ bioinformatics-research         ] |
| - Graph        | Desc:  [ My notes and research           ] |
| - Sources      |                                            |
| - Settings     | Visibility: ( ) Private ( ) Unlisted (o) Pub|
|                | [ Save Changes ]                           |
| [Profile]      +--------------------------------------------+
| [Plan: Free]   | Danger Zone                                |
|                | [ Delete this Wiki ]                       |
+----------------+--------------------------------------------+
```

### Deletion Confirmation Modal Layout
```
+---------------------------------------------+
| Delete Wiki?                            [X] |
+---------------------------------------------+
| This action cannot be undone.               |
| All pages, concepts, and sources will       |
| be permanently deleted.                     |
|                                             |
| Type the wiki name to confirm:              |
| [ bioinformatics-research                 ] |
|                                             |
| [ Delete Permanent (Danger Button) ]        |
+---------------------------------------------+
```

---

## Spacing

**Scale:** [Spacing Scale](../../../D-Design-System/00-design-system.md#spacing-scale)

| Property | Token |
|----------|-------|
| Section gap | space-xl |
| Form label margin-bottom | space-xs |
| Input vertical gap | space-md |
| Danger zone top border padding | space-lg |

---

## Typography

**Scale:** [Type Scale](../../../D-Design-System/00-design-system.md#type-scale)

| Element | Semantic | Size | Weight | Typeface |
|---------|----------|------|--------|----------|
| Page Title | H1 | text-xl | bold | sans-serif |
| Section Header | H2 | text-md | semibold | sans-serif |
| Form Labels | label | text-xs | semibold | sans-serif |
| Danger Title | H3 | text-md | bold | sans-serif (Color: Red-600) |
| Danger warning text | p | text-xs | normal | sans-serif |

---

## Page Sections

### Section: Left Navigation Sidebar
**OBJECT ID:** `settings-sidebar`
*(References shared navigation sidebar)*
- `Settings` link is active.

---

### Section: Settings Form Container
**OBJECT ID:** `settings-form-container`

| Property | Value |
|----------|-------|
| Purpose | Form to edit wiki attributes and visibility |
| Padding | space-xl |

#### General Form Inputs
**OBJECT ID:** `settings-general-fields`
- **Fields:**
  - `settings-input-title`: Input text labeled "Title"
  - `settings-input-slug`: Input text labeled "Slug" (shows URL preview inline)
  - `settings-input-desc`: Textarea labeled "Description"
  - `settings-radio-visibility`: Radio buttons group for visibility selection (`Private`, `Unlisted`, `Public`)
  - `settings-btn-save`: "Save Changes" action button

---

### Section: Danger Zone Box
**OBJECT ID:** `settings-danger-zone`

| Property | Value |
|----------|-------|
| Purpose | Restrict and display dangerous actions |
| Border | 1px solid red-200, Background: red-50 |
| Padding | space-lg |

#### Danger Actions Group
- **Description EN:** "Once you delete a wiki, there is no going back. Please be certain."
- **Trigger Button:** `settings-btn-delete-trigger`: "Delete this Wiki" (styled red outline)

---

### Section: Deletion Confirmation Modal
**OBJECT ID:** `settings-delete-modal`

| Property | Value |
|----------|-------|
| Component | Backdrop + floating warning card |
| Visibility | Hidden by default, opens when `settings-btn-delete-trigger` is clicked |

#### Deletion Verification Group
- **Verification Input:** `settings-delete-confirm-input` (requires user to type the exact wiki slug, e.g. `bioinformatics-research`)
- **Action Button:** `settings-btn-delete-confirm`: "I understand the consequences, delete this wiki" (Solid red button, disabled until verification input matches slug)

---

## Page States

| State | When | Appearance | Actions |
|-------|------|------------|---------|
| Default | Page loaded | Form inputs show latest database values, save button active | Edit inputs, toggle visibility, click Delete |
| Saving Changes | User clicks Save | Save button disabled, displays "Saving..." text | None |
| Delete Modal Open | User clicks "Delete this Wiki" | Backdrop visible, verification input active, delete button disabled | Type slug, click Cancel |
| Delete Confirmed | Verification input matches slug | Permanent delete button becomes active and red | Click permanent delete |

---

## Conditional Sections

| Condition | Include |
|-----------|---------|
| Has Forms / Input | → [form-validation.instructions.md](instructions/form-validation.instructions.md) |
| Form Rules | Slug: must match regex, cannot be empty |
| Needs API Data | → [data-api.instructions.md](instructions/data-api.instructions.md) |
| API Call | Update wiki attributes; delete wiki and cascade deletes |

---

## Open Questions

| # | Question | Context | Status |
|---|----------|---------|--------|
| 1 | Does changing the slug break existing published links? | Yes, changing the slug changes the wiki URL, making old links return 404. We should show a warning message below the slug field when it is modified. | 🟢 Resolved |

---

## Checklist

- [x] Page purpose clear
- [x] Danger zone explicit separation and warning
- [x] Verification input for deletion documented
- [x] Visibility controls matches slug and DB logic

---

**Previous Step:** ← [Sources Manager](../3.1-sources-manager/sources-manager.md)  
**Next Step:** None (Settings endpoint)

---

_Created using Whiteport Design Studio (WDS) methodology_
