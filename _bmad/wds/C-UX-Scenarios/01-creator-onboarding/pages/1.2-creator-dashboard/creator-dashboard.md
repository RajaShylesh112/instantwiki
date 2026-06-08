### 1.2-creator-dashboard

**Previous Step:** ← [Landing Page](../1.1-landing-page/landing-page.md)  
**Next Step:** → [Upload & Processing](../1.3-upload-processing/upload-processing.md)

![Creator Dashboard Sketch](Sketches/1.2-creator-dashboard.jpg)

**Previous Step:** ← [Landing Page](../1.1-landing-page/landing-page.md)  
**Next Step:** → [Upload & Processing](../1.3-upload-processing/upload-processing.md)

---

# 1.2-creator-dashboard

## Page Metadata

| Property | Value |
|----------|-------|
| **Scenario** | Creator Onboarding & Wiki Setup |
| **Page Number** | 1.2 |
| **Platform** | Desktop Web |
| **Page Type** | Full Page with Modal Overlay |
| **Viewport** | Desktop-first (with responsive side drawer for mobile) |
| **Interaction** | Mouse & Keyboard |
| **Visibility** | Authenticated (User role) |

---

## Overview

**Page Purpose:** Allow authenticated users to view their active wikis, check resource limits, and initiate the creation of a new wiki through a structured modal.

**User Situation:** Clara has logged in and wants to create her first wiki for her bioinformatics studies.

**Success Criteria:** User creates a new wiki and is redirected to the Upload Sources screen.

**Entry Points:**
- Redirected after successful Auth signup/login.
- Navigating to `/dashboard`.

**Exit Points:**
- Click card `[ Open ]` $\to$ `/u/[username]/[wiki_slug]`
- Create Wiki success $\to$ `/u/[username]/[wiki_slug]/upload`
- Sidebar links $\to$ `/dashboard/usage`, `/dashboard/settings`

---

## Reference Materials

**Strategic Foundation:**
- [Product Brief](../../../A-Product-Brief/project-brief.md) - Section: Dashboard, Sidebar, Wiki Cards, and Create Wiki Modal
- [Trigger Map](../../../B-Trigger-Map/trigger-map.md) - Focus: Zero-configuration publishing and privacy toggles

---

## Layout Structure

The dashboard uses a GitHub-style split layout: a vertical navigation sidebar on the left and a wide content panel on the right.

```
+-------------------------------------------------------------+
| Sidebar        | Dashboard                                  |
| [Instant Wiki] |                                            |
|                | Your Wikis                   [+ Create Wiki] |
| - Dashboard    +--------------------------------------------+
| - My Wikis     | [ ML Atlas ]       [ Startup Research ]   |
| - Templates    | Public             Private                 |
| - Usage        | 25 Pages           12 Pages                |
| - Settings     | [ Open ]           [ Open ]                |
|                |                                            |
| [Profile]      |                                            |
| [Plan: Free]   |                                            |
+----------------+--------------------------------------------+
```

### Create Wiki Modal Layout
When open, overlays the dashboard with a clean gray card.
```
+---------------------------------------------+
| Create Wiki                             [X] |
+---------------------------------------------+
| Topic                                       |
| [ Machine Learning Research               ] |
|                                             |
| Description                                 |
| [ My notes and research                   ] |
|                                             |
| [ Generate AI Names ]                       |
| Suggestions:                                |
| (o) ML Atlas  ( ) Neural Nexus  ( ) Data    |
|                                             |
| URL Preview: instant.wiki/raja/ml-atlas     |
|                                             |
| Visibility                                  |
| ( ) Private    ( ) Unlisted    (o) Public   |
|                                             |
| [ Create Wiki ]                             |
+---------------------------------------------+
```

---

## Spacing

**Scale:** [Spacing Scale](../../../D-Design-System/00-design-system.md#spacing-scale)

| Property | Token |
|----------|-------|
| Sidebar width | 240px |
| Sidebar item padding | space-sm horizontal, space-xs vertical |
| Main panel padding | space-xl |
| Grid gap (Wiki cards) | space-lg |
| Modal internal spacing | space-lg |

---

## Typography

**Scale:** [Type Scale](../../../D-Design-System/00-design-system.md#type-scale)

| Element | Semantic | Size | Weight | Typeface |
|---------|----------|------|--------|----------|
| Sidebar Brand | span | text-md | semibold | sans-serif |
| Sidebar Link | a | text-sm | normal | sans-serif |
| Main Page Title | H1 | text-xl | bold | sans-serif |
| Wiki Card Title | H2 | text-md | semibold | sans-serif |
| Modal Section Header | H3 | text-md | semibold | sans-serif |
| URL Preview text | code | text-xs | normal | Monospace |

---

## Page Sections

### Section: Left Sidebar
**OBJECT ID:** `dash-sidebar`

| Property | Value |
|----------|-------|
| Purpose | Internal navigation control |
| Layout | Vertical Stack |
| Border | Border-r 1px solid gray-200 |

#### Navigation Link List
**OBJECT ID:** `dash-sidebar-nav`
- **Links:**
  - `dash-sidebar-link-dash`: "Dashboard" (Active state indicator)
  - `dash-sidebar-link-wikis`: "My Wikis"
  - `dash-sidebar-link-usage`: "Usage"
  - `dash-sidebar-link-settings`: "Settings"

#### Profile Footer
**OBJECT ID:** `dash-sidebar-footer`
- **Layout:** Vertical Stack at bottom
- **Labels:**
  - `dash-sidebar-profile-name`: User profile name (e.g. "Clara")
  - `dash-sidebar-plan-badge`: Plan type label (e.g. "Free" or "Pro")

---

### Section: Main Wikis Panel
**OBJECT ID:** `dash-main-panel`

| Property | Value |
|----------|-------|
| Purpose | List and create wikis |
| Padding | space-xl |

#### Panel Header Bar
**OBJECT ID:** `dash-main-header`
- **Layout:** Horizontal split (space-between)
- **Title:** "Your Wikis"
- **Button:** `dash-btn-create-trigger`: "+ Create Wiki" (brand primary color button)

#### Wikis Card Grid
**OBJECT ID:** `dash-wikis-grid`
- **Layout:** 3-Column Grid
- **Cards:** List of Wiki Cards (`dash-wiki-card-[id]`)
  - Title: "ML Atlas"
  - Visibility Badge: "PUBLIC"
  - Pages count: "25 Pages"
  - Created status: "Created 3 days ago"
  - Action button: `dash-wiki-card-btn-open`: "Open" (outline button)

---

### Section: Create Wiki Modal (Overlay)
**OBJECT ID:** `dash-modal`

| Property | Value |
|----------|-------|
| Component | Modal backdrop + floating card |
| Visibility | Hidden by default, visible when `dash-btn-create-trigger` is clicked |

#### Form Inputs Group
**OBJECT ID:** `dash-modal-form`
- **Fields:**
  - `dash-modal-input-topic`: Input field labeled "Topic" (*e.g. Machine Learning*)
  - `dash-modal-input-desc`: Textarea labeled "Description" (*e.g. My research notes*)
  - `dash-modal-btn-ai-names`: "Generate AI Names" button (calls DeepSeek to suggest 4 wiki names)
  - `dash-modal-radio-ai-suggestions`: List of 4 radio suggestions from AI output.
  - `dash-modal-preview-url`: Text displaying live preview (`instant.wiki/raja/ml-atlas`)
  - `dash-modal-radio-visibility`: Radio group for Visibility (`Private`, `Unlisted`, `Public`)
  - `dash-modal-btn-submit`: "Create Wiki" submit action button

---

## Page States

| State | When | Appearance | Actions |
|-------|------|------------|---------|
| Default | Page loads | Left sidebar active, right wikis grid displayed, modal hidden | Click "Open", click "+ Create Wiki" |
| Modal Open | User clicks "+ Create Wiki" | Backdrop overlay visible, Create Wiki modal card active in center | Fill form fields, click Close (X) |
| AI Suggestions Loading | User clicks "Generate AI Names" | Spinner visible inside the suggestions area, button disabled | None |
| AI Suggestions Ready | AI API returns names | Suggestions radio list populated, first suggestion selected by default, slug preview updated | Select radio options |

---

## Conditional Sections

| Condition | Include |
|-----------|---------|
| Has Forms / Input | → [form-validation.instructions.md](instructions/form-validation.instructions.md) |
| Form Rules | - Topic: required, max 50 chars<br/>- Description: optional, max 200 chars<br/>- Slug: validated regex `^[a-z0-9-]+$` |

---

## Open Questions

| # | Question | Context | Status |
|---|----------|---------|--------|
| 1 | Where do AI suggestions come from? | Edge function querying DeepSeek using the topic and description as prompt context. | 🟢 Resolved |
| 2 | Do we restrict wiki creation if the user is over their plan limit? | Yes, if over limit, "+ Create Wiki" shows a lock badge or triggers an upgrade modal. | 🟢 Resolved |

---

## Checklist

- [x] Page purpose clear
- [x] All Object IDs assigned
- [x] Spacing using WDS tokens
- [x] States documented

---

**Previous Step:** ← [Landing Page](../1.1-landing-page/landing-page.md)  
**Next Step:** → [Upload & Processing](../1.3-upload-processing/upload-processing.md)

---

_Created using Whiteport Design Studio (WDS) methodology_
