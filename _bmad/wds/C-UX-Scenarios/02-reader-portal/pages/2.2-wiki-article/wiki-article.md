### 2.2-wiki-article

**Previous Step:** ← [Wiki Homepage](../2.1-wiki-homepage/wiki-homepage.md)  
**Next Step:** → [Visual Network Graph](../2.3-network-graph/network-graph.md)

![Wiki Article Sketch](Sketches/2.2-wiki-article.jpg)

**Previous Step:** ← [Wiki Homepage](../2.1-wiki-homepage/wiki-homepage.md)  
**Next Step:** → [Visual Network Graph](../2.3-network-graph/network-graph.md)

---

# 2.2-wiki-article

## Page Metadata

| Property | Value |
|----------|-------|
| **Scenario** | Reader Portal & Knowledge Exploration |
| **Page Number** | 2.2 |
| **Platform** | Desktop & Mobile Web |
| **Page Type** | Full Page |
| **Viewport** | Desktop-first (responsive) |
| **Interaction** | Mouse & Keyboard / Touch |
| **Visibility** | Public (visitor view) / Authenticated (owner controls visible) |

---

## Overview

**Page Purpose:** Render a specific concept article with premium readable typography, show relationships to other pages, and list source document citations to build factual trust.

**User Situation:** Clara's advisor wants to read about "Variant Pathogenicity" in her genomics wiki, verifying her findings.

**Success Criteria:** Visitor reads the article and clicks citation links to check the original PDF snippets.

**Entry Points:**
- Clicking on a category or search suggestion on the homepage.
- Clicking a node in the network graph.
- Clicking related concept links inside another article.

**Exit Points:**
- Click citation link $\to$ Opens source document modal/drawer.
- Click related concepts $\to$ `/u/[username]/[wiki_slug]/[new_page_slug]`.
- Sidebar nav links.

---

## Reference Materials

**Strategic Foundation:**
- [Product Brief](../../../A-Product-Brief/project-brief.md) - Section: Wiki Article Page, Core UX Principle (I am building a website, not talking to a chatbot)
- [Trigger Map](../../../B-Trigger-Map/trigger-map.md) - Focus: AI Trust & Traceability (Clara's hallucination fear)

---

## Layout Structure

Standard workspace split layout (Left navigation sidebar, right main panel). The main panel restricts the text width to a readable max-width (e.g. 720px) to mimic GitBook and Medium.

```
+-------------------------------------------------------------+
| Sidebar        | Search this Wiki...                         |
| [Instant Wiki] |                                            |
|                | Statistics (H1 Title)                      |
| - Overview     | +----------------------------------------+ |
| - Pages        | | Summary: A branch of mathematics...   | |
| - Graph        | +----------------------------------------+ |
| - Sources      |                                            |
| - Settings     | Article Content (Merriweather font)        |
|                | Statistics plays a central role in ML...   |
| [Profile]      |                                            |
| [Plan: Free]   | References:                                |
|                | [1] GenomicsAnalysis.pdf (Page 12)         |
+----------------+--------------------------------------------+
```

### Citation Viewer Drawer (Slide-out panel from right on click)
```
+------------------------------------+
| Source Document Viewer         [X] |
+------------------------------------+
| GenomicsAnalysis.pdf (Page 12)     |
| +--------------------------------+ |
| | "...sequence alignments are   | |
| | analyzed using statistical     | |
| | algorithms..." (Highlight)     | |
| +--------------------------------+ |
+------------------------------------+
```

---

## Spacing

**Scale:** [Spacing Scale](../../../D-Design-System/00-design-system.md#spacing-scale)

| Property | Token |
|----------|-------|
| Main container width | max-width 720px |
| Paragraph margin-bottom | space-md |
| Line height | 1.625 (comfortable reading) |
| Citation drawer width | 400px |
| Reference section margin-top | space-2xl |

---

## Typography

**Scale:** [Type Scale](../../../D-Design-System/00-design-system.md#type-scale)

| Element | Semantic | Size | Weight | Typeface |
|---------|----------|------|--------|----------|
| Article Title | H1 | text-3xl | bold | sans-serif |
| Article H2 Heading | H2 | text-xl | semibold | sans-serif |
| Summary box text | p | text-sm | medium | sans-serif |
| Article Body Text | p | text-md | normal | serif (Merriweather) |
| Inline Citations | sup | text-xs | bold | Monospace |
| Source References | p | text-xs | normal | sans-serif |

---

## Page Sections

### Section: Left Navigation Sidebar
**OBJECT ID:** `article-sidebar`
*(References shared navigation sidebar)*
- `Pages` link is highlighted active.

---

### Section: Article Layout Container
**OBJECT ID:** `article-container`

| Property | Value |
|----------|-------|
| Purpose | Displays article content with optimal reading width |
| Padding | space-lg space-xl |

#### Article Title
**OBJECT ID:** `article-title`
- **EN:** "Statistics" (Dynamic)

#### Summary Box
**OBJECT ID:** `article-summary-card`
- **EN:** "Summary: A branch of mathematics dealing with data collection, analysis, interpretation, and presentation."
- **Style:** Border-l 4px solid gray-300, italic padding-left space-md.

#### Markdown Render Body
**OBJECT ID:** `article-markdown-body`
- **Style:** Serif Merriweather typography. Renders standard paragraph tags, code blocks, lists, and images.
- **Inline Concept Links:** Clickable text pointing to other pages (e.g. `[Probability](probability)`).
- **Inline Citation Badges:** Superscript badges (e.g. `[1]`) that scroll to the references footer or trigger the drawer.

---

### Section: References Footer
**OBJECT ID:** `article-references-footer`

| Property | Value |
|----------|-------|
| Purpose | List the sources used to verify the article's factual accuracy |
| Padding | space-lg space-none |
| Border | border-t 1px solid gray-200 |

#### Source List
**OBJECT ID:** `article-source-list`
- **Layout:** Vertical Stack
- **Items:** List of source files with page references:
  - `article-source-item-1`: "[1] GenomicsAnalysis.pdf (pages 12-14)" (Trigger link, opens drawer)
  - `article-source-item-2`: "[2] VariantPathogenicityGuide.pdf (page 5)"

---

### Section: Source Document Drawer (Overlay Panel)
**OBJECT ID:** `article-source-drawer`

| Property | Value |
|----------|-------|
| Component | Slid-out panel on right side |
| Visibility | Hidden by default, slides out when a source citation is clicked |

#### Drawer Content
- **Header:** Title of source document (e.g. `GenomicsAnalysis.pdf`)
- **Page number:** "Page 12"
- **Context Highlight Box:** Renders the exact text snippet extracted from the PDF, with the matching sentence highlighted in yellow.

---

## Page States

| State | When | Appearance | Actions |
|-------|------|------------|---------|
| Default | Page loaded | Markdown content rendered, sidebar enabled | Read text, click related concept links |
| Citation Selected | User clicks inline `[1]` badge or footer source link | Drawer slides out from right with highlighted source snippet | Scroll drawer text, click Close (X) |

---

## Conditional Sections

| Condition | Include |
|-----------|---------|
| Public Page (SEO) | → [seo-content.instructions.md](instructions/seo-content.instructions.md) |
| Needs API Data | → [data-api.instructions.md](instructions/data-api.instructions.md) |
| API Call | Fetch page article body, related categories, and reference source documents |

---

## Open Questions

| # | Question | Context | Status |
|---|----------|---------|--------|
| 1 | Do we support hosting actual PDFs inside the drawer? | For the initial release, showing the highlighted text snippet is sufficient. Full PDF rendering can be added as a subsequent feature. | 🟢 Resolved |

---

## Checklist

- [x] Page purpose clear
- [x] Spacing constraints for comfortable reading width
- [x] Serif typeface for article body text
- [x] Factual citation traceability specs completed

---

**Previous Step:** ← [Wiki Homepage](../2.1-wiki-homepage/wiki-homepage.md)  
**Next Step:** → [Visual Network Graph](../2.3-network-graph/network-graph.md)

---

_Created using Whiteport Design Studio (WDS) methodology_
