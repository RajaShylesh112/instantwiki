# Feature Impact Analysis: Instant Wiki

This analysis prioritizes product features by mapping them back to the psychological driving forces of our target groups.

## Scoring Rules

*   **Primary Persona (⭐ Clara the Compiler):** High = 5 pts | Medium = 3 pts | Low = 1 pt  
*   **Other Personas (Dan the Developer, Sarah the Strategist):** High = 3 pts | Medium = 1 pt | Low = 0 pts  

**Max Possible Score:** 11 (with 3 personas)  
**Must Have Threshold:** 7+ or Primary High (5)

---

## Prioritized Features

| Rank | Feature | Clara (⭐) | Dan | Sarah | Score | Decision |
| ---- | ------- | --------- | --- | ----- | ----- | -------- |
| 1 | **Frictionless Document Uploader** (drag/drop files, parse URLs) | High (5) | High (3) | High (3) | **11** | **Must Have** |
| 2 | **Premium Wiki Layout** (Wikipedia + Notion style, Merriweather text) | High (5) | High (3) | High (3) | **11** | **Must Have** |
| 3 | **Interactive Concept Graph** (mini preview + full graph page with zoom/pan) | High (5) | High (3) | Medium (1) | **9** | **Must Have** |
| 4 | **AI Citation Tracing** (inline citation links mapping back to PDF sentences) | High (5) | Low (0) | High (3) | **8** | **Must Have** |
| 5 | **Live Processing Screen** (checklists showing live steps to build trust) | High (5) | Medium (1) | Medium (1) | **7** | **Must Have** |
| 6 | **AI Name/Slug Suggestion Engine** (queries names, updates slug dynamically) | Medium (3) | High (3) | Medium (1) | **7** | **Must Have** |
| 7 | **Visibility Controls** (Private, Unlisted, Public wiki settings) | Medium (3) | Low (0) | High (3) | **6** | **Consider for MVP** |
| 8 | **Global Concept Search** (search bar querying concepts, pages, and entities) | Medium (3) | Low (0) | High (3) | **6** | **Consider for MVP** |
| 9 | **Markdown Zip Exporter** (export all generated pages into raw markdown files) | Low (1) | High (3) | Low (0) | **4** | **Defer (Nice-to-Have)** |

---

## Strategic Decisions

### 1. Must Have MVP (Score 7+ or Primary High)
*   **Frictionless Document Uploader (11):** Natively uploads PDFs, TXT, and Markdown files, plus URL text extraction.
*   **Premium Wiki Layout (11):** Serif typography (Merriweather), clean light gray sidebar, cards for concepts, and anti-chatbot layout.
*   **Interactive Concept Graph (9):** SVG/Canvas-based interactive network graph that allows users to pan, zoom, search, and click nodes to open article pages.
*   **AI Citation Tracing (8):** Maps AI generated text blocks directly back to source PDF references, eliminating hallucination fears.
*   **Live Processing Screen (7):** Replaces a basic spinner with step-by-step progress checkmarks (*Extracting Text $\to$ Finding Concepts $\to$ Discovering Relationships $\to$ Generating Pages*).
*   **AI Name/Slug Suggestion Engine (7):** Helps users quickly name and map their wiki during creation.

### 2. Consider for MVP (Score 6)
*   **Visibility Controls (6):** Standard private/unlisted/public options to support Sarah's confidentiality needs. High priority to include early in database schema.
*   **Global Concept Search (6):** Prominent search bar querying articles and concepts within a wiki.

### 3. Defer (Score <6)
*   **Markdown Zip Exporter (4):** Extremely important to delight developers (Dan) and address lock-in fears, but can be built after the core creation engine is validated.

---

_Generated with Whiteport Design Studio framework_  
_Strategic input for Phase 4: UX Design and Phase 6: PRD/Development_
