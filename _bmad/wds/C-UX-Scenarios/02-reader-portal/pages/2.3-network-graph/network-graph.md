### 2.3-network-graph

**Previous Step:** ← [Wiki Article Page](../2.2-wiki-article/wiki-article.md)  
**Next Step:** None (Explorer endpoint)

![Network Graph Sketch](Sketches/2.3-network-graph.jpg)

**Previous Step:** ← [Wiki Article Page](../2.2-wiki-article/wiki-article.md)  
**Next Step:** None (Explorer endpoint)

---

# 2.3-network-graph

## Page Metadata

| Property | Value |
|----------|-------|
| **Scenario** | Reader Portal & Knowledge Exploration |
| **Page Number** | 2.3 |
| **Platform** | Desktop & Mobile Web |
| **Page Type** | Full Page |
| **Viewport** | Full-screen canvas area |
| **Interaction** | Zoom (mouse wheel / pinch gesture), Pan (drag), Click Node |
| **Visibility** | Public (visitor view) / Authenticated (owner controls visible) |

---

## Overview

**Page Purpose:** Render a full-screen interactive network graph showing all extracted concepts and their relationships, allowing visual discovery of knowledge structures.

**User Situation:** Dan wants to explore the relationships between different deep learning concepts in his ML Atlas wiki to find where "Backpropagation" links.

**Success Criteria:** Node canvas loads, displays connections smoothly, and lets the user navigate to concept pages on click.

**Entry Points:**
- Clicking "Graph" in the workspace navigation sidebar.
- Clicking "View Full Graph" links on homepage cards.

**Exit Points:**
- Click "Open Page" on node popup card $\to$ `/u/[username]/[wiki_slug]/[page_slug]`.
- Sidebar navigation links.

---

## Reference Materials

**Strategic Foundation:**
- [Product Brief](../../../A-Product-Brief/project-brief.md) - Section: Graph View (zoom, pan, search node, click node)
- [Trigger Map](../../../B-Trigger-Map/trigger-map.md) - Focus: Connection discovery and visual digital garden control (Dan's top want)

---

## Layout Structure

Features the standard vertical left navigation sidebar, but the main content area is a full-bleed Canvas/SVG container.

```
+-------------------------------------------------------------+
| Sidebar        | [ Search Node... ]       [+] [-] [Fit]     |
| [Instant Wiki] |                                            |
|                |         (Statistics)                       |
| - Overview     |              |                             |
| - Pages        |       (Machine Learning)                   |
| - Graph        |         /          \                       |
| - Sources      |   (Deep Learning) (Neural Networks)        |
| - Settings     |                                            |
|                | +----------------------------------------+ |
| [Profile]      | | Node Popup: Deep Learning  [Open Page] | |
| [Plan: Free]   | +----------------------------------------+ |
+----------------+--------------------------------------------+
```

---

## Spacing

**Scale:** [Spacing Scale](../../../D-Design-System/00-design-system.md#spacing-scale)

| Property | Token |
|----------|-------|
| Canvas size | 100% viewport width and height (excluding sidebar) |
| Sidebar width | 240px |
| Node text padding | space-xs horizontal |
| Controls padding | space-md |

---

## Typography

**Scale:** [Type Scale](../../../D-Design-System/00-design-system.md#type-scale)

| Element | Semantic | Size | Weight | Typeface |
|---------|----------|------|--------|----------|
| Search Node text | input | text-sm | normal | sans-serif |
| Node Labels | text | text-xs | medium | sans-serif |
| Node Popup Title | H3 | text-md | bold | sans-serif |
| Popup Summary text | p | text-xs | normal | sans-serif |

---

## Page Sections

### Section: Left Navigation Sidebar
**OBJECT ID:** `graph-sidebar`
*(References shared navigation sidebar)*
- `Graph` navigation link is active.

---

### Section: Force-Directed Graph Canvas
**OBJECT ID:** `graph-canvas-container`

| Property | Value |
|----------|-------|
| Purpose | Renders the visual concept graph |
| Component | HTML5 Canvas or high-performance SVG container |

#### Graph Nodes
**OBJECT ID:** `graph-node-element`
- **Component:** SVG Group / Canvas drawn path.
- **Labels:** Title of the concept (e.g. "Statistics").
- **Hover:** Increases node radius, adds drop shadow, highlights connected lines.
- **Click:** Centers node, highlights connected components, displays the Node Summary Popup card.

#### Graph Edges (Lines)
**OBJECT ID:** `graph-edge-element`
- **Style:** Clean solid lines representing a link between concepts. If relationship is directional, shows line arrows.

---

### Section: Floating Control Panel
**OBJECT ID:** `graph-controls`

| Property | Value |
|----------|-------|
| Purpose | Provide canvas zooming and node search tools |
| Layout | Floating horizontal/vertical flex in top right corner |

#### Zoom Controls Group
**OBJECT ID:** `graph-zoom-group`
- **Buttons:**
  - `graph-btn-zoom-in`: "+" button (zooms in by 10%)
  - `graph-btn-zoom-out`: "-" button (zooms out by 10%)
  - `graph-btn-fit`: "Fit" (resets zoom, fits entire graph within viewport bounding box)

#### Search Node Input
**OBJECT ID:** `graph-search-node`
- **Placeholder:** "Search Node..."
- **Behavior:** Autocompletes matching node names. Selecting a node zooms in and centers on that specific node, triggering its click state.

---

### Section: Node Summary Card (Overlay)
**OBJECT ID:** `graph-node-popup`

| Property | Value |
|----------|-------|
| Component | Hover/Click floating card next to selected node |
| Visibility | Hidden by default, visible when a node is clicked |

#### Popup Details
- **Title:** Concept name (e.g. "Deep Learning")
- **Brief Summary:** Short AI description paragraph.
- **Action Button:** `graph-popup-btn-open`: "Open Page" (brand primary color button, navigates to `/u/[username]/[wiki_slug]/[page_slug]`).

---

## Page States

| State | When | Appearance | Actions |
|-------|------|------------|---------|
| Default | Canvas loaded | Graph rendered in center, fit to screen size, floating search visible | Pan, zoom, click nodes |
| Node Selected | User clicks "Machine Learning" node | Selected node highlighted, connected nodes remain bright, all other nodes fade to 20% opacity. Summary popup visible. | Click "Open Page", click backdrop to deselect |
| Node Hover | User hovers a node | Node glows, cursor changes to pointer | Click |
| Searching | User types in search node field | Autocomplete dropdown lists matching nodes | Select node to zoom-center |

---

## Conditional Sections

| Condition | Include |
|-----------|---------|
| Needs API Data | → [data-api.instructions.md](instructions/data-api.instructions.md) |
| API Call | Fetch node list (id, name, slug, group) and edge list (source_id, target_id) |

---

## Open Questions

| # | Question | Context | Status |
|---|----------|---------|--------|
| 1 | How do we handle performance for massive graphs (100+ nodes)? | Using HTML5 Canvas or Vis.js clustering. Canvas has much higher render performance than SVG for large numbers of nodes. | 🟢 Resolved |

---

## Checklist

- [x] Page purpose clear
- [x] Zoom/pan interactive specs completed
- [x] Clean, developer-conscious minimalist design
- [x] Component mapping for nodes and popup specs complete

---

**Previous Step:** ← [Wiki Article Page](../2.2-wiki-article/wiki-article.md)  
**Next Step:** None (Explorer endpoint)

---

_Created using Whiteport Design Studio (WDS) methodology_
