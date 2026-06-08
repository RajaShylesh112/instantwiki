# Design Tokens: Instant Wiki

This document defines the core styling variables, scales, and visual tokens for the Instant Wiki platform.

---

## Token Categories

### 1. Colors

We avoid bright AI gradients or complex chatbot colors in favor of a clean, premium, publishing-oriented color palette (Harmonious Gray & Dark Charcoal, with a single muted blue/violet accent).

| Token Name | HSL / Value | Tailwind Class | Usage |
|------------|-------------|----------------|-------|
| `color-bg-primary` | `hsl(0, 0%, 100%)` | `bg-white` | Primary page background |
| `color-bg-secondary` | `hsl(0, 0%, 98%)` | `bg-gray-50` | Sidebar and uploader background |
| `color-border-subtle` | `hsl(0, 0%, 90%)` | `border-gray-200` | Grid borders and separators |
| `color-text-main` | `hsl(0, 0%, 9%)` | `text-gray-900` | Article body and headings |
| `color-text-muted` | `hsl(0, 0%, 45%)` | `text-gray-500` | Subtitles and counters |
| `color-accent-solid` | `hsl(250, 43%, 48%)` | `bg-indigo-600` | Brand CTA buttons and selections |
| `color-accent-hover` | `hsl(250, 43%, 38%)` | `bg-indigo-700` | CTA hover states |
| `color-danger-solid` | `hsl(0, 72%, 51%)` | `bg-red-600` | Permanent delete actions |
| `color-danger-bg` | `hsl(0, 100%, 97%)` | `bg-red-50` | Danger zone container background |

---

### 2. Typography

We use modern sans-serif typography for dashboard actions and settings, and premium serif typography for reading article content (evoking digital textbooks).

*   **System Typefaces:**
    *   **Sans-Serif Font:** `Inter, system-ui, sans-serif` (UI elements, labels, buttons)
    *   **Serif Font:** `Merriweather, Georgia, serif` (Article content and page summaries)
    *   **Monospace Font:** `Fira Code, Courier, monospace` (Stats counters, badges, and URL slugs)

| Token Name | Size | Line Height | Weight | Usage |
|------------|------|-------------|--------|-------|
| `type-title-hero` | `2.25rem (text-4xl)` | `1.2` | Bold (700) | Landing Page Hero Header |
| `type-title-page` | `1.875rem (text-3xl)`| `1.25` | Bold (700) | Wiki Homepage Title |
| `type-title-section`| `1.25rem (text-xl)`  | `1.5` | Semibold (600) | Section H2 Headings |
| `type-body-ui` | `0.875rem (text-sm)` | `1.5` | Normal (400) | Sidebar and settings labels |
| `type-body-read` | `1rem (text-md)` | `1.625` | Normal (400) | Article body text (Serif) |
| `type-badge-mono` | `0.75rem (text-xs)` | `1` | Medium (500) | Stats counters and tags (Mono) |

---

### 3. Spacing Scale

Our spacing scale is built to align with Tailwind's standard system to guarantee simple implementation.

| Token Name | Value | Rem | Usage |
|------------|-------|-----|-------|
| `space-zero` | `0px` | `0rem` | Flush components |
| `space-xs` | `4px` | `0.25rem` | Small label margins |
| `space-sm` | `8px` | `0.5rem` | Sidebar item padding |
| `space-md` | `16px` | `1rem` | Component gaps, default cell padding |
| `space-lg` | `24px` | `1.5rem` | Content container padding |
| `space-xl` | `32px` | `2rem` | Section gaps, main panels margins |
| `space-2xl` | `48px` | `3rem` | Hero margins, major page paddings |
| `space-3xl` | `64px` | `4rem` | Landing Page section boundaries |

---

### 4. Borders & Effects

We focus on sharp, minimal borders that feel like GitHub cards, avoiding flashy gradients.

*   **Border Radius:**
    *   `radius-sm`: `4px` (Small buttons, tag badges)
    *   `radius-md`: `8px` (Standard cards, inputs, buttons)
    *   `radius-lg`: `12px` (Wiki cards, uploader boxes, modals)
*   **Shadows:**
    *   `shadow-none`: Used for default flat cards to align with Wikipedia/Notion styling.
    *   `shadow-sm`: Subtle border outline shadow for hover states.
    *   `shadow-md`: Modal overlay shadows to separate popups from backdrops.

---

_Generated with Whiteport Design Studio framework_
