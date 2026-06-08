# WDS Trigger Mapping Session Log (Suggest Mode)

**Date:** 2026-06-08
**Project:** Instant Wiki
**Facilitator:** Saga the Analyst
**User:** raja

---

## Layer 1: WDS Form Learned
Trigger Mapping connects business goals to user psychology. It comprises:
1. **Business Goals:** A high-level qualitative vision and 3-5 SMART strategic objectives.
2. **Target Groups:** Primary, secondary, and tertiary user personas.
3. **Driving Forces:** Positive (Triggers/Motivations) and Negative (Fears/Frictions) forces for target groups.
4. **Prioritization:** Direct mapping of features to these triggers to measure business impact.

---

## Layer 2: Project Context (Initial)
- **Core Product:** Instant Wiki is a website builder powered by document knowledge extraction.
- **Key Flow:** Landing Page -> Auth -> Dashboard -> Create Wiki -> Upload -> Live Processing -> Knowledge Portal.
- **Key Aesthetics:** Minimal, premium Notion + Wikipedia + GitHub hybrid. Serif typography (Merriweather) for pages, clean light mode sidebar, interactive graph navigation.
- **Goal:** Drive creation and publishing of knowledge sites, making users feel they are building websites instead of chatting with bots.

---

## Layer 3: Domain Research (Step 1: Business Goals)
### Research on Knowledge/Wiki Publishing Platforms
- Competitors: GitBook, Obsidian Publish, ReadMe, Notion Sites, standard wikis.
- Success Indicators:
  - User Activation: Creating first wiki and publishing it.
  - Engagement: Number of pages generated, sources uploaded, graph nodes clicked.
  - Sharing/Distribution: Public pageviews, referral traffic ("Built with Instant Wiki").
  - Retention: Recurring wiki updates (adding sources to keep it alive).

---

## Layer 4: Generate (Step 1: Business Goals)
### Proposed Vision
"Empower researchers, developers, and writers to effortlessly transform raw documents into beautifully structured, searchable, and shareable knowledge portals, establishing Instant Wiki as the primary choice for self-publishing digital knowledge bases."

### Proposed SMART Objectives
1. **Activation Goal:** Achieve a 60% activation rate (defined as users who create a wiki and upload at least one source file) within the first 30 days of launch.
2. **Engagement Goal:** Average at least 15 generated pages and 3 source uploads per active wiki by the end of Q3 2026.
3. **Virality & Sharing Goal:** Generate at least 10,000 public wiki pageviews and 5% referral traffic to the homepage (via the "Built with Instant Wiki" badge) within 6 months of public release.
4. **Performance Goal:** Maintain a wiki generation time of under 30 seconds for standard documents (under 50 pages equivalent) to keep users engaged and feeling like they are building "instantly."

---

## Layer 5: Self-Review (Step 1: Business Goals)
- **Rubric Checks:**
  - Are there 3-5 objectives? Yes (4 objectives).
  - Are they SMART? Yes, they have specific numbers, timeframes (30 days, Q3 2026, 6 months), are relevant to a wiki-builder, and are measurable.
  - Is the vision inspirational but not directly measured? Yes.
- **Quality Score:** 95/100
- **Gaps:** None identified at this stage. Ready for user feedback.

---

## Layer 3: Domain Research (Step 2: Target Groups)
### Target Audiences for Instant Knowledge Publishing
- **Researchers / Grad Students:** Have huge backlogs of research papers, notes, PDFs. They struggle to find connections between papers. They want a visual map of their research to present or review, but making one manually takes days.
- **Developers / Tech Leads:** Documenting systems is tedious. They write sparse markdown files or store snippets in local Obsidian vaults. They want to publish a developer blog or "tech stack atlas" to show off or guide their team.
- **Startup Teams / Project Managers:** Conduct market research, user interviews, competitor analysis. Share insights in Slack or Google Drive folders where they get buried. They want a beautiful repository where team members can easily search concepts.

---

## Layer 4: Generate (Step 2: Target Groups)
We have selected **three focus target groups** and created detailed narrative personas for each.

### Persona 1: Clara the Compiler (Academic / Graduate Researcher)
- **Who she is:** Clara is a 2nd-year PhD candidate in Bioinformatics. She has hundreds of papers, PDFs, and notes scattered across Zotero and her desktop.
- **Her Day:** She spends her day reading research, writing lit reviews, and preparing presentations. She suffers from information overload.
- **His Goals:** She wants to find structural links between different papers, easily recall where she read about a specific concept, and share a clean study portal with her advisor.
- **Frustrations:** Zotero is good for lists, but terrible for visualizing relationships. Building a custom blog takes too much tech configuration.
- **Current Behavior:** Manually creates mind-maps in Miro or bookmarks things in Notion, which becomes messy quickly.

### Persona 2: Dan the Developer (Software Engineer / Tech Hobbyist)
- **Who he is:** Dan is a Full-Stack Software Engineer who loves building side projects. He reads constantly and maintains a large directory of local Markdown notes.
- **His Day:** Writes code, reviews documentation, and researches new tech stacks. He likes building things but dislikes writing formal, structured docs.
- **His Goals:** He wants to publish a beautiful "Machine Learning Atlas" or tech stack wiki to demonstrate his knowledge and share it on his Twitter or resume.
- **Frustrations:** Setting up Obsidian Publish costs money, and GitBook feels too enterprise-y and clinical. Writing manual documentation websites (e.g., Docusaurus) takes hours of layout and routing configuration.
- **Current Behavior:** Hosts raw markdown files on GitHub or leaves them as private files on his laptop.

### Persona 3: Sarah the Strategist (Startup Product Manager / Researcher)
- **Who she is:** Sarah is a PM at an early-stage startup. She does extensive competitor audits, user interviews, and product research.
- **Her Day:** Gathers qualitative feedback, reads market PDF reports, and tries to align her team on what competitors are doing.
- **Her Goals:** She wants to create a central, searchable "Competitor Wiki" and "User Insights Portal" so developers and marketing can search definitions and research findings.
- **Frustrations:** Document folders in Google Drive are black holes where documents go to die. No one reads long PDFs.
- **Current Behavior:** Summarizes findings in Notion pages, but team members still ask repetitive questions because they can't search inside PDF sources.

---

## Layer 5: Self-Review (Step 2: Target Groups)
- **Rubric Checks:**
  - Are there 2-4 primary target groups? Yes (3 focus personas).
  - Are they rich narrative personas? Yes, they have clear roles, situations, frustrations, and daily contexts.
  - Do they have names? Yes (Clara, Dan, Sarah).
  - Do they link back to objectives? Yes (Clara drives high page generation/source uploads; Dan drives virality/referral links by publishing his side wikis; Sarah drives team retention/search utilization).
- **Quality Score:** 96/100
- **Gaps:** None. The personas represent distinct customer segments with clear motivations matching the "website builder" concept.

---

## Layer 3: Domain Research (Step 3: Driving Forces)
### Understanding Positive & Negative Drivers (Loss Aversion in SaaS)
- Positive drivers attract users: automation speed, aesthetic beauty, status of having a published website, intelligence in connecting data.
- Negative drivers (frictions, anxieties, and fears) are twice as powerful:
  - Trust issues (AI hallucination/incorrect summaries).
  - Effort waste (if the AI builds pages that look messy, editing them takes more time than creating them manually).
  - Lock-in and export worries (what if the tool shuts down or charges too much?).
  - Security and privacy (confidential research papers or corporate IP).

---

## Layer 4: Generate (Step 3: Driving Forces)

### Driving Forces Map

#### Clara the Compiler (Academic / Graduate Researcher)
- **Positive Drivers (Toward):**
  - **Connection Discovery:** Wants to see hidden relationships between separate research PDFs mapped out visually.
  - **Advisor / Peer Impression:** Wants to present a highly organized, professional literature review portal.
  - **Fast Citation Recall:** Wants to instantly retrieve the source text and page citation behind any summary.
  - **Zero Coding Effort:** Wants a one-click way to go from PDF folder to a published website.
- **Negative Drivers (Away-From):**
  - **Academic Errors (Hallucinations):** Fears the AI generating fake statements or blending concepts incorrectly.
  - **Organization Fatigue:** Fears spending time setting up a wiki and then it becoming stale and unused.
  - **Time Sink Setup:** Fears a complex tool requiring extensive manual editing, tagging, or prompt engineering.

#### Dan the Developer (Software Engineer / Tech Hobbyist)
- **Positive Drivers (Toward):**
  - **Social Proof / Resume Asset:** Wants an impressive, published "digital garden" website link to share on Twitter/GitHub.
  - **Digital Garden Control:** Wants a visual network graph that looks slick and allows clicking to navigate.
  - **Frictionless Publishing:** Wants to turn a folder of markdown files into a live, themed website in seconds.
  - **Low Setup Cost:** Wants a premium look and feel without paying for expensive hosted publishes.
- **Negative Drivers (Away-From):**
  - **AI wrapper stigma:** Fears the website looking like a generic ChatGPT copy-paste or boring chatbot screen.
  - **Content Lock-in:** Fears not being able to export pages back into clean Markdown.
  - **Slow / Bulky Performance:** Fears slow loading pages or heavy layout files that ruin the reading experience.

#### Sarah the Strategist (Startup Product Manager / Researcher)
- **Positive Drivers (Toward):**
  - **Team Search Adoption:** Wants a central link where engineers/designers actually search and read insights.
  - **Traceable Trust:** Wants page summaries to clearly list references and source PDFs so team members trust the facts.
  - **Single Source of Truth:** Wants a simple link to hand over to new hires for easy onboarding.
  - **Multi-document Search:** Wants to query a concept (e.g. "pricing model") and find occurrences across 20 PDFs instantly.
- **Negative Drivers (Away-From):**
  - **IP Leakage:** Fears company research, competitor insights, or proprietary PDFs leaking publicly.
  - **Formatting Cleanup:** Fears spending hours fixing broken tables, scrambled lists, or layout bugs after document parsing.
  - **Abandoned Tooling:** Fears the team ignoring the portal because it's difficult to navigate or search.

### Cross-Group Patterns & Tensions
1. **Shared Drivers:**
   - **Frictionless Website Creation:** Everyone wants a website, but no one wants to build one. The transition from documents to a structured site must be fast and zero-effort.
   - **Traceability & Trust:** Clara (academic accuracy) and Sarah (team trust) both need clear links back to the original source PDFs.
2. **Tensions & Conflicts:**
   - **Privacy vs. Virality:** Dan wants public exposure and easy social sharing. Sarah needs strict privacy controls and IP security.
   - **Aesthetics vs. Speed:** Clara and Sarah want fast processing, but the resulting site must look professional (Merriweather typography, clean sidebar) to avoid looking like cheap AI generated garbage.

---

## Layer 5: Self-Review (Step 3: Driving Forces)
- **Rubric Checks:**
  - Are there 3-5 positive and negative drivers per persona? Yes (4 positive, 3 negative for Clara; 4 positive, 3 negative for Dan; 4 positive, 3 negative for Sarah).
  - Is loss aversion reflected? Yes, negative drivers deal with trust, stigma, and loss of time.
  - Are cross-group patterns and tensions documented? Yes.
- **Quality Score:** 97/100
- **Gaps:** None. Tensions are highly relevant and directly inform our visibility settings (public/unlisted/private) and the AI source reference UI constraints.

---

## Layer 3: Domain Research (Step 4: Prioritization)
### Prioritization Logic in Early Product Launches
- A startup's main risk is build-activation drop-off. If the initial parsing fails, takes 10 minutes, or formats badly, users close the tab and never come back.
- Performance (under 30s) is the #1 structural enabler, followed closely by User Activation (first file upload).
- Primary target group: **Clara (Researcher)** has the most rigorous document constraints. If the product works for Clara, it will easily work for Dan (markdown) and Sarah (competitor PDFs).
- Secondary target group: **Dan (Developer)** has the distribution power (social sharing).
- Tertiary target group: **Sarah (Product Manager)** has B2B capability, but that requires workspaces, teams, and billing—best left for subsequent milestones.

---

## Layer 4: Generate (Step 4: Prioritization)

### 1. Prioritized Objectives (Ranked)
1. **Performance Objective (Under 30s processing):** Without this, the website builder feels slow, and the core experience is broken.
2. **Activation Objective (60% activation rate):** Driving the user to upload their first source and generate their first page.
3. **Engagement Objective (15 pages/3 sources average):** Ensuring they build meaningful sites, not just blank cards.
4. **Virality & Sharing Objective (10k public views):** Post-activation referral growth loop.

### 2. Prioritized Target Groups (Ranked)
1. **Primary: Clara the Compiler (Researcher).** Needs the highest trust, dense extraction, and fast connections. Focuses the core engine on accuracy and citation transparency.
2. **Secondary: Dan the Developer (Tech Hobbyist).** Acts as the primary driver of public visibility and referral signups by publishing and sharing wikis.
3. **Tertiary: Sarah the Strategist (Startup PM).** Drives B2B collaboration, requiring private wikis and team controls (Should/Could status).

### 3. Design Focus Statement (MoSCoW)
- **MUST Address:**
  - **AI Trust & Traceability:** Page summaries must link back to exact source text/citations to combat hallucination fears (Clara's top negative driver).
  - **Frictionless Creation (Zero Config):** Going from file upload to a live site with a generated name/slug must require zero coding or templating (Clara/Dan's top positive driver).
  - **Anti-Chatbot Layout:** A layout that looks like a structured Wikipedia + Notion publishing site, avoiding the "cheap AI wrapper" stigma (Dan's top negative driver).
- **SHOULD Address:**
  - **Visual Connections:** An interactive mini-graph preview and full-screen Graph Page to visualize concept relationships (Clara/Dan's positive driver).
  - **Visibility Controls:** Private/Unlisted/Public status badges and settings (Sarah's negative driver of IP Leakage).
- **COULD Address:**
  - **Global search across all documents** (Sarah's PM research driver).
  - **Clean Markdown export option** to eliminate vendor lock-in anxiety (Dan's negative driver).

---

## Layer 5: Self-Review (Step 4: Prioritization)
- **Rubric Checks:**
  - Are objectives, target groups, and drivers ranked? Yes.
  - Is there documented reasoning ("Why") for each decision? Yes, detailed SaaS-centric rationale is provided.
  - Is there a MoSCoW-style Focus Statement? Yes.
- **Quality Score:** 98/100
- **Gaps:** None. The priority list aligns perfectly with our Next.js + Supabase phase 1 scope.
