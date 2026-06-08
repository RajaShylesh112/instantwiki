# Project Brief: Instant Wiki

> Simplified Brief - Essential context for design work

**Created:** 2026-06-08
**Author:** raja
**Brief Type:** Simplified

---

## Core Product Vision & Philosophy

**Instant Wiki is not a document management tool. It is a website builder powered by knowledge extraction.**

The user experience should never feel like a simple PDF uploader or a ChatGPT clone with a massive chat window. Instead, the UI must emphasize that users are creating, building, and publishing a real, structured knowledge website (like a cross between **Wikipedia, Notion, and Obsidian Publish / GitBook**). The AI works behind the scenes to extract and organize pages, concepts, and relationships, presenting the final output as a premium, shareable wiki.

---

## Project Scope & User Flow

### 1. Overall Product Flow
```
Landing Page
    ↓
Sign Up / Log In
    ↓
Dashboard
    ↓
Create Wiki (Modal)
    ↓
Upload Sources (Drag-and-Drop / URL Input)
    ↓
Processing Screen (Live Status Checklist)
    ↓
Knowledge Portal (Wiki Homepage, Graph View, Article Pages)
    ↓
Publish & Settings (Public Wiki View)
```

---

## Detailed Page & Component Specification

### 1. Landing Page
*   **URL:** `instant.wiki`
*   **Hero Section:** 
    *   Headline: *"Turn documents into websites."*
    *   Subheadline: *"Upload PDFs, notes, and research. Get a searchable Wikipedia-style website instantly."*
    *   Main CTA: `"Create Your Wiki"`
    *   Secondary CTA: `"View Example Wiki"`
*   **Demo Preview Section:** 
    *   Displays an interactive preview of a sample wiki: **"Machine Learning Atlas"**
    *   Lists main categories/pages (e.g., *Statistics*, *Linear Algebra*, *Deep Learning*) alongside a mini interactive graph visualization.
    *   Purpose: Immediately explains the core value proposition visually.

### 2. Authentication
*   **Sign In / Sign Up Screen:**
    *   Super clean, minimal, GitHub-style layout.
    *   Options: `Continue with Google`, `Continue with Email`.
    *   No marketing fluff or distractions.

### 3. Dashboard
*   **URL:** `/dashboard`
*   **Sidebar Layout:** Left-hand navigation following a clean, structured GitHub-style sidebar:
    *   `Dashboard`
    *   `My Wikis`
    *   `Templates (future)`
    *   `Usage`
    *   `Settings`
    *   *Bottom Section:* `Profile`, `Plan`
*   **Main Content Area:**
    *   `+ Create Wiki` Action Button.
    *   **Your Wikis** Grid: Lists wiki cards.
*   **Wiki Cards:**
    *   Displays Wiki Title (e.g., *ML Atlas*), visibility status badge (`PUBLIC`, `UNLISTED`, `PRIVATE`), page count (e.g., *25 Pages*), creation timestamp (e.g., *Created 3 days ago*), and an `[ Open ]` button.

### 4. Create Wiki Modal
Triggered by clicking `+ Create Wiki`. 
*   **Section 1: Topic** (Input field: *Machine Learning Research*)
*   **Section 2: Description** (Text area: *My notes and research*)
*   **Section 3: Generate AI Names** (Button that queries DeepSeek/AI to suggest wiki names like *ML Atlas*, *Neural Nexus*, *Data Forge*, *Learning Graph*). Selecting a suggestion updates the slug.
*   **Section 4: URL Preview** (Dynamic text showing the slug preview: `instant.wiki/raja/ml-atlas`)
*   **Section 5: Visibility** (Radio buttons: `Private`, `Unlisted`, `Public`)
*   **Action:** `[ Create Wiki ]` button.

### 5. Empty Wiki State
*   **URL:** `/u/[username]/[wiki_slug]` (e.g., `/u/raja/ml-atlas`)
*   **Content:** Minimal welcome screen indicating *0 Sources* and *0 Pages* with a clear `[ Upload Documents ]` CTA.

### 6. Upload Sources Page
*   **Purpose:** Feeds knowledge into the wiki creator.
*   **Layout:**
    *   Interactive Drag & Drop area accepting `PDF`, `TXT`, `Markdown`.
    *   "Paste URL" input field for extracting web pages.
    *   **Sources List:** Displays uploaded files (e.g., *MachineLearning.pdf*, *DeepLearning.pdf*, *Statistics.pdf*) with upload status.

### 7. Processing Screen
*   **Purpose:** Builds excitement and trust. Replaces a boring "Loading..." spinner with a live, animated sequence of building steps:
    *   `✓ Extracting Text`
    *   `✓ Finding Concepts`
    *   `⟳ Discovering Relationships`
    *   `Waiting: Generating Pages`

### 8. Wiki Homepage (Owner View)
*   **URL:** `/u/[username]/[wiki_slug]`
*   **Hero Section:** Displays Wiki Title, Description, and Stats counts (e.g., *25 Pages*, *74 Concepts*, *103 Relationships*).
*   **Overview Card:** AI-generated summary/introduction to the wiki's overall knowledge base.
*   **Knowledge Graph Preview:** An interactive mini-graph showing key concepts and their connections (e.g., *Statistics* $\leftrightarrow$ *Machine Learning* $\leftrightarrow$ *Deep Learning*). Clicking a node opens that page.
*   **Key Topics:** Grid cards styled like Wikipedia category links (*Statistics*, *Linear Algebra*, etc.).
*   **Search Bar:** Centered, prominent search bar matching pages, concepts, and entities.
*   **Wiki Sidebar (Internal Navigation):**
    *   `Overview`
    *   `Pages`
    *   `Graph`
    *   `Sources`
    *   `Settings`

### 9. Pages Section
*   **URL:** `/u/[username]/[wiki_slug]/pages`
*   **Content:** Clean list or grid of all generated wiki pages/articles. Clicking an item opens the article page.

### 10. Wiki Article Page
*   **URL:** `/u/[username]/[wiki_slug]/[page_slug]`
*   **Content Layout:**
    *   **Title**
    *   **Summary** (AI-generated TL;DR)
    *   **Content Body** (rendered markdown using premium serif typography, e.g., Merriweather)
    *   **Key Concepts** & **Related Topics** (clickable links to other pages in the wiki)
    *   **References** & **Source Documents** (shows which uploaded files/URLs this page was extracted from)

### 11. Graph View
*   **URL:** `/u/[username]/[wiki_slug]/graph`
*   **Features:** Full-screen interactive network graph of all concepts and relationships. Supports zoom, pan, node search, and clicking a node to jump to its article page. Designed to be the most visually impressive part of the application.

### 12. Sources View
*   **URL:** `/u/[username]/[wiki_slug]/sources`
*   **Content:** Lists all uploaded source documents. Displays transparency stats for each source to build user trust (e.g., *Pages Generated: 8*, *Concepts Found: 15*).

### 13. Settings
*   **URL:** `/u/[username]/[wiki_slug]/settings`
*   **Controls:** Edit Title, edit Slug, edit Description, change Visibility, and a dangerous action zone to `Delete Wiki`.

### 14. Public Wiki (Visitor View)
*   **URL:** `instant.wiki/[username]/[wiki_slug]`
*   **Content:** Identical to the Wiki Homepage and Article Pages but removes all owner editing and source upload controls. Looks like a professional publishing platform.

### 15. Usage Page
*   **URL:** `/dashboard/usage` (or Sidebar -> Usage)
*   **Content:** Plan details (e.g., Plan: *Free*), usage meters (e.g., *1 / 1 Wikis*, *12 / 25 Pages*).

---

## Design Goals & Aesthetics

1.  **Anti-Chatbot Layout:** Absolutely no standard AI chat interfaces, persistent chatbot bubbles, or large messaging inputs.
2.  **Clean & Premium Design:**
    *   A combination of Notion's clean typography, Wikipedia's structured layout, and GitHub's layout borders.
    *   Clean white or extremely light gray backgrounds.
    *   Left-hand navigation bars with subtle borders.
    *   Monospace elements for technical/metadata tags.
    *   Serif typography (e.g., Google Font *Merriweather* or *Lora*) for article body text to evoke a premium editorial feel.
    *   High-quality icons (e.g., Lucide React).
3.  **Core UX Principle:** **"I am building a website" not "I am talking to an AI."**

---

## Constraints & Technology Stack

*   **Framework:** Next.js App Router (React, TS)
*   **Styling:** Tailwind CSS, shadcn/ui components
*   **Database:** Supabase PostgreSQL
*   **Auth:** Supabase Auth (NextAuth v5 or Supabase auth-helpers)
*   **AI:** DeepSeek API

---

## Next Steps

This simplified brief provides the strategic design foundation for Instant Wiki. The design process can now proceed to:

- [x] **Phase 1: Product Brief** - Complete
- [ ] **Phase 2: Trigger Mapping** - Map user psychology to business goals (Optional/Simplified)
- [ ] **Phase 4: UX Design** - Begin wireframing and interactive UI specifications

---

_Generated by Whiteport Design Studio_
