### 1.1-landing-page

**Previous Step:** None  
**Next Step:** → [Creator Dashboard](../1.2-creator-dashboard/creator-dashboard.md)

![Landing Page Sketch](Sketches/1.1-landing-page.jpg)

**Previous Step:** None  
**Next Step:** → [Creator Dashboard](../1.2-creator-dashboard/creator-dashboard.md)

---

# 1.1-landing-page

## Page Metadata

| Property | Value |
|----------|-------|
| **Scenario** | Creator Onboarding & Wiki Setup |
| **Page Number** | 1.1 |
| **Platform** | Desktop & Mobile Web |
| **Page Type** | Full Page |
| **Viewport** | Desktop-first (responsive to Mobile) |
| **Interaction** | Mouse & Keyboard (Desktop) / Touch (Mobile) |
| **Visibility** | Public |

---

## Overview

**Page Purpose:** Attract visiting researchers and creators, demonstrate the product value immediately through a visual interactive demo, and drive sign-ups.

**User Situation:** A researcher (Clara) or developer (Dan) arrives at `instant.wiki` via social sharing or direct search, wondering if this is another boring chatbot wrapper or a useful tool.

**Success Criteria:** Visitor clicks "Create Your Wiki" or "View Example Wiki".

**Entry Points:**
- Direct navigation to `instant.wiki`
- Referral links from public wiki footer badges (e.g. `instant.wiki/raja/ml-atlas?ref=badge`)

**Exit Points:**
- Signup/Auth redirection page
- Public Example Wiki `/u/raja/ml-atlas`

---

## Reference Materials

**Strategic Foundation:**
- [Product Brief](../../../A-Product-Brief/project-brief.md) - Project scope and visual guidelines
- [Trigger Map](../../../B-Trigger-Map/trigger-map.md) - Focus on zero-coding setup and anti-chatbot layout

---

## Layout Structure

The page uses a clean white background with a left-aligned, spacious visual flow.

```
+-----------------------------------------------------------+
| [Logo] Instant Wiki                 [View Example] [Sign In] [Create Wiki] |
+-----------------------------------------------------------+
|                                                           |
|    Turn documents into websites.                          |
|    Upload PDFs, notes, and research.                      |
|    Get a searchable Wikipedia-style website instantly.   |
|                                                           |
|    [Create Your Wiki (Primary)]  [View Example Wiki (Sec)]|
|                                                           |
+-----------------------------------------------------------+
|    [Demo Preview: Machine Learning Atlas]                 |
|    +-----------------------------+--------------------+   |
|    | Key Topics                  | Mini Graph         |   |
|    | - Statistics                |    O -- O          |   |
|    | - Linear Algebra            |    |    |          |   |
|    | - Deep Learning             |    O -- O          |   |
|    +-----------------------------+--------------------+   |
|                                                           |
+-----------------------------------------------------------+
| Footer: Logo, Terms, Privacy        [Built with Instant Wiki] |
+-----------------------------------------------------------+
```

---

## Spacing

**Scale:** [Spacing Scale](../../../D-Design-System/00-design-system.md#spacing-scale)

| Property | Token |
|----------|-------|
| Page padding (horizontal) | space-lg mobile / space-2xl desktop |
| Section gap | space-3xl |
| Element gap (default within sections) | space-lg |
| Component gap (within groups) | space-md |

---

## Typography

**Scale:** [Type Scale](../../../D-Design-System/00-design-system.md#type-scale)

| Element | Semantic | Size | Weight | Typeface |
|---------|----------|------|--------|----------|
| Logo | span | text-lg | bold | Monospace |
| Main Hero Headline | H1 | text-4xl | bold | sans-serif (Outfit/Inter) |
| Hero Subheadline | p | text-xl | normal | sans-serif |
| Section headings | H2 | text-2xl | semibold | sans-serif |
| Demo Wiki Title | H3 | text-lg | bold | serif (Merriweather) |
| Body copy | p | text-md | normal | sans-serif |
| Monospace Tags | span | text-xs | normal | Monospace |

---

## Page Sections

### Section: Global Header
**OBJECT ID:** `landing-header`

| Property | Value |
|----------|-------|
| Purpose | Provide branding and secondary access controls |
| Padding | space-md space-lg |
| Element gap | space-md |

#### Logo Branding
**OBJECT ID:** `landing-header-logo`
- **EN:** "instant.wiki"
- **Component:** Monospace text link pointing to `/`

#### Nav Links Group
**OBJECT ID:** `landing-header-nav-group`
- **Layout:** Horizontal Flex
- **Links:**
  - `landing-header-link-example`: "View Example" (links to `/u/raja/ml-atlas`)
  - `landing-header-link-signin`: "Sign In" (links to `/auth/signin`)
  - `landing-header-btn-signup`: "Create Wiki" (solid action button, links to `/auth/signup`)

---

### Section: Hero Pitch
**OBJECT ID:** `landing-hero`

| Property | Value |
|----------|-------|
| Purpose | Pitch the core product vision instantly |
| Padding | space-2xl space-xl |

#### Headline
**OBJECT ID:** `landing-hero-headline`
- **EN:** "Turn documents into websites."

#### Subheadline
**OBJECT ID:** `landing-hero-subheadline`
- **EN:** "Upload PDFs, notes, and research. Get a searchable Wikipedia-style website instantly."

#### Hero CTA Group
**OBJECT ID:** `landing-hero-cta-group`
- **Layout:** Horizontal Flex
- **Buttons:**
  - `landing-hero-btn-primary`: "Create Your Wiki" (solid brand color, hover translation micro-animation)
  - `landing-hero-btn-secondary`: "View Example Wiki" (outline styling, hover border color transition)

---

### Section: Demo Preview Card
**OBJECT ID:** `landing-demo-preview`

| Property | Value |
|----------|-------|
| Purpose | Demonstrate the Wikipedia-style concept graph visually |
| Component | Card container with thin border |
| Padding | space-lg |

#### Demo Header
**OBJECT ID:** `landing-demo-header`
- **EN:** "Machine Learning Atlas"
- **Typography:** Serif (Merriweather) H3

#### Demo Content Group
**OBJECT ID:** `landing-demo-content-group`
- **Layout:** 2-Column Grid (Desktop) / 1-Column Stack (Mobile)

##### Column 1: Topics List
**OBJECT ID:** `landing-demo-topics`
- **Links:**
  - `landing-demo-topic-stats`: "Statistics" (hover underline, opens preview popup)
  - `landing-demo-topic-algebra`: "Linear Algebra"
  - `landing-demo-topic-deep`: "Deep Learning"

##### Column 2: Mini Graph Preview
**OBJECT ID:** `landing-demo-graph`
- **Component:** SVG container rendering a static preview of 4 nodes:
  - Node A: "Statistics"
  - Node B: "Linear Algebra"
  - Node C: "Machine Learning"
  - Node D: "Deep Learning"
- **Behavior:** Hovering a node highlights its connected lines. Clicking "Deep Learning" triggers a mock article slide-in.

---

### Section: Footer
**OBJECT ID:** `landing-footer`

| Property | Value |
|----------|-------|
| Purpose | Branding and legal footer |
| Padding | space-lg |

#### Branding Badge
**OBJECT ID:** `landing-footer-badge`
- **EN:** "⚡ Built with Instant Wiki"
- **Style:** Monospace bordered badge, evoking quality developer aesthetics.

---

## Page States

| State | When | Appearance | Actions |
|-------|------|------------|---------|
| Default | First visit | Complete layout with inactive preview graph | Click CTAs, hover nodes |
| Mock Hover | User hovers "Deep Learning" node | Highlight connected lines in graph, show brief popup summary card | Click to expand |

---

## Conditional Sections

| Condition | Include |
|-----------|---------|
| Public Page (SEO) | → [meta-content.instructions.md](instructions/meta-content.instructions.md) |
| SEO Title/Desc | Title: "Instant Wiki - Turn Documents into Websites" |

---

## Open Questions

| # | Question | Context | Status |
|---|----------|---------|--------|
| 1 | Should the demo graph be fully interactive (pan/zoom) or static? | Panning on a tiny demo card can lead to accidental scroll locks on mobile viewports. Suggesting static links on the landing page card, reserving full interactivity for `/graph` routes. | 🟢 Resolved |

---

## Checklist

- [x] Page purpose clear
- [x] All Object IDs assigned
- [x] Components reference design system
- [x] States documented

---

**Previous Step:** None  
**Next Step:** → [Creator Dashboard](../1.2-creator-dashboard/creator-dashboard.md)

---

_Created using Whiteport Design Studio (WDS) methodology_
