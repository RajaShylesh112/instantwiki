### 2.1-wiki-homepage

**Previous Step:** ← [Upload & Processing](../../01-creator-onboarding/pages/1.3-upload-processing/upload-processing.md)  
**Next Step:** → [Wiki Article Page](../2.2-wiki-article/wiki-article.md)

![Wiki Homepage Sketch](Sketches/2.1-wiki-homepage.jpg)

**Previous Step:** ← [Upload & Processing](../../01-creator-onboarding/pages/1.3-upload-processing/upload-processing.md)  
**Next Step:** → [Wiki Article Page](../2.2-wiki-article/wiki-article.md)

---

# 2.1-wiki-homepage

## Page Metadata

| Property | Value |
|----------|-------|
| **Scenario** | Reader Portal & Knowledge Exploration |
| **Page Number** | 2.1 |
| **Platform** | Desktop & Mobile Web |
| **Page Type** | Full Page |
| **Viewport** | Desktop-first (responsive layout) |
| **Interaction** | Mouse & Keyboard / Touch |
| **Visibility** | Public (visitor view) / Authenticated (owner controls visible) |

---

## Overview

**Page Purpose:** Serve as the entry hub for a published wiki, summarizing the knowledge base, displaying stats, providing instant search, and displaying a mini concept network graph.

**User Situation:** Clara's advisor opens the link `/u/clara/bioinformatics-research` to review her compiled research data.

**Success Criteria:** Visitor reads the overview summary and clicks on a topic or searches a concept.

**Entry Points:**
- Direct navigation to `/u/[username]/[wiki_slug]` or `instant.wiki/[username]/[wiki_slug]`.
- Redirection after processing finishes.

**Exit Points:**
- Sidebar nav links $\to$ Graph View (`/graph`), Pages List (`/pages`), Sources (`/sources`).
- Click Category $\to$ Wiki Article Page (`/u/[username]/[wiki_slug]/[page_slug]`).
- Search suggestion click $\to$ `/u/[username]/[wiki_slug]/[page_slug]`.

---

## Reference Materials

**Strategic Foundation:**
- [Product Brief](../../../A-Product-Brief/project-brief.md) - Section: Wiki Homepage, Hero Section, Overview Card, Knowledge Graph Preview, Key Topics, Search Bar
- [Trigger Map](../../../B-Trigger-Map/trigger-map.md) - Focus: Connection discovery and anti-chatbot layout (Notion + Wikipedia aesthetic)

---

## Layout Structure

Uses a left navigation sidebar with a primary central column for overview cards, and a right sidebar for statistics and the mini graph card.

```
+-------------------------------------------------------------+
| Sidebar        | Search this Wiki... [Search Icon]           |
| [Instant Wiki] |                                            |
|                | Bioinformatics Research                    |
| - Overview     | A portal mapping genomics research papers. |
| - Pages        | 25 Pages | 74 Concepts | 103 Connections   |
| - Graph        | +----------------------------------------+ |
| - Sources      | | Overview                               | |
| - Settings     | | This wiki summarizes sequencing, RNA   | |
|                | | transcription, and variant models.     | |
| [Profile]      | +----------------------------------------+ |
| [Plan: Free]   | Key Topics                                 |
|                | [ Statistics ]      [ Sequencing ]         |
+----------------+--------------------------------------------+
```

---

## Spacing

**Scale:** [Spacing Scale](../../../D-Design-System/00-design-system.md#spacing-scale)

| Property | Token |
|----------|-------|
| Sidebar width | 240px |
| Main content width | flex-1 (max-width 960px) |
| Grid gap (Key topics) | space-md |
| Header bottom margin | space-xl |
| Section margin bottom | space-2xl |

---

## Typography

**Scale:** [Type Scale](../../../D-Design-System/00-design-system.md#type-scale)

| Element | Semantic | Size | Weight | Typeface |
|---------|----------|------|--------|----------|
| Wiki Title | H1 | text-3xl | bold | sans-serif |
| Stats Count | span | text-sm | medium | Monospace |
| Overview Card Content | p | text-md | normal | serif (Merriweather) |
| Section Header | H2 | text-xl | semibold | sans-serif |
| Topic Card Title | H3 | text-md | semibold | sans-serif |

---

## Page Sections

### Section: Left Navigation Sidebar
**OBJECT ID:** `home-sidebar`
- **Branding:** "instant.wiki" logo link
- **Links Group:**
  - `home-sidebar-overview`: "Overview" (Active state)
  - `home-sidebar-pages`: "Pages" (Links to `/pages`)
  - `home-sidebar-graph`: "Graph" (Links to `/graph`)
  - `home-sidebar-sources`: "Sources" (Links to `/sources`, hidden if visitor and wiki is private/unlisted)
  - `home-sidebar-settings`: "Settings" (Visible only to owner)

---

### Section: Global Search Header
**OBJECT ID:** `home-search-header`

| Property | Value |
|----------|-------|
| Purpose | Provide instant auto-complete search across all wiki pages |
| Padding | space-md space-lg |

#### Search Bar Input
**OBJECT ID:** `home-search-input`
- **Placeholder:** "Search this Wiki..."
- **Behavior:** On typing, displays dropdown list of matches divided by: *Pages*, *Concepts*, *Sources*. Clicking a match redirects directly.

---

### Section: Wiki Hero Header
**OBJECT ID:** `home-hero`

| Property | Value |
|----------|-------|
| Purpose | Render wiki metadata and statistics |
| Padding | space-lg space-none |

#### Wiki Title
**OBJECT ID:** `home-hero-title`
- **EN:** "Bioinformatics Research" (Dynamic)

#### Wiki Description
**OBJECT ID:** `home-hero-desc`
- **EN:** "A knowledge hub mapping out sequencing, variant prediction, and research papers."

#### Stats Bar Row
**OBJECT ID:** `home-hero-stats`
- **Layout:** Horizontal Flex
- **Stats Badges:**
  - `home-stat-pages`: "25 Pages"
  - `home-stat-concepts`: "74 Concepts"
  - `home-stat-relationships`: "103 Relationships"

---

### Section: Overview Card
**OBJECT ID:** `home-overview-card`

| Property | Value |
|----------|-------|
| Purpose | Render AI generated overview summary of the wiki knowledge |
| Component | Card container with light gray background |
| Padding | space-lg |

#### Overview Content Text
**OBJECT ID:** `home-overview-text`
- **EN:** "This wiki covers computational genomics, sequence alignments, RNA-Seq transcript structures, and machine learning models for variant pathogenicity prediction. Created from 3 core research documents."
- **Typography:** Serif (Merriweather) body

---

### Section: Key Topics Grid
**OBJECT ID:** `home-key-topics`

| Property | Value |
|----------|-------|
| Purpose | Display main category cards for navigation |
| Layout | Grid (2 or 3 Columns) |

#### Topic Cards
- **Card ID:** `home-topic-card-[slug]` (e.g. `home-topic-card-statistics`)
- **Typography:** H3 sans-serif
- **Hover:** Background color light gray transition, subtle lift effect.

---

## Page States

| State | When | Appearance | Actions |
|-------|------|------------|---------|
| Default | Wiki is active | Sidebar links enabled, main content cards visible | Click links, hover topics |
| Search Active | User is typing in search input | Dropdown overlay lists results matched by substring | Arrow down key to navigate list, click item |
| Private Mode | Visitor views without auth | Shows "This wiki is private" message, hides sidebar nav links | Go back |

---

## Conditional Sections

| Condition | Include |
|-----------|---------|
| Public Page (SEO) | → [seo-content.instructions.md](instructions/seo-content.instructions.md) |
| SEO Title/Desc | Title: "[Wiki Title] - Published on Instant Wiki" |
| Needs API Data | → [data-api.instructions.md](instructions/data-api.instructions.md) |
| API Call | Fetch wiki summary, stats, and key topics from Supabase DB |

---

## Open Questions

| # | Question | Context | Status |
|---|----------|---------|--------|
| 1 | Do we show the dynamic graph preview on mobile? | No, svg graph previews take up too much vertical space and are difficult to pan on small screens. Suggest hiding it on screens < 768px wide. | 🟢 Resolved |

---

## Checklist

- [x] Page purpose clear
- [x] All Object IDs assigned
- [x] Typography utilizes serif for body content
- [x] Layout complies with anti-chatbot principles

---

**Previous Step:** ← [Upload & Processing](../../01-creator-onboarding/pages/1.3-upload-processing/upload-processing.md)  
**Next Step:** → [Wiki Article Page](../2.2-wiki-article/wiki-article.md)

---

_Created using Whiteport Design Studio (WDS) methodology_
