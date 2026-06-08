---
name: Cognitive Architecture
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#464555'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#712ae2'
  on-secondary: '#ffffff'
  secondary-container: '#8a4cfc'
  on-secondary-container: '#fffbff'
  tertiary: '#41485e'
  on-tertiary: '#ffffff'
  tertiary-container: '#586076'
  on-tertiary-container: '#d4dbf5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#eaddff'
  secondary-fixed-dim: '#d2bbff'
  on-secondary-fixed: '#25005a'
  on-secondary-fixed-variant: '#5a00c6'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Source Serif 4
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-md:
    fontFamily: Source Serif 4
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Source Serif 4
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
  headline-lg-mobile:
    fontFamily: Source Serif 4
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 30px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  page-margin-desktop: 80px
  page-margin-mobile: 20px
  gutter: 24px
---

## Brand & Style

The design system is engineered for an AI-powered wiki platform that prioritizes deep focus, institutional trust, and the effortless synthesis of information. The brand personality is "The Modern Librarian"—authoritative and structured, yet powered by an invisible, high-tech engine.

The visual style is **Sophisticated Minimalism** with a **Glassmorphic** layer. It utilizes heavy whitespace to reduce cognitive load while employing translucent materials to signify the "intelligence" layer where AI processes reside. The aesthetic moves away from the sterile "tech" look toward a more refined, editorial experience that honors the tradition of knowledge-sharing through modern interaction patterns.

## Colors

The palette is anchored in **Slate-900 (#0F172A)** for primary text and brand moments to establish authority. The background uses a crisp **Light Slate (#F8FAFC)** to differentiate from pure white surfaces.

**Indigo (#4F46E5)** and **Electric Purple (#7C3AED)** serve as "Intelligence Colors." These are reserved strictly for AI-driven features, such as automated summaries, smart links, and generative actions. Neutral tones are pulled from the Slate scale to maintain a cool, professional temperature across the UI. Functional colors (success, error, warning) should be desaturated to fit the sophisticated atmosphere.

## Typography

This design system uses a dual-font strategy to balance tradition with technology. 

- **Source Serif 4** is used for article headlines and major page titles. Its sturdy, academic construction provides an "encyclopedic" feel that encourages deep reading.
- **Plus Jakarta Sans** is used for all UI elements, navigation, and body copy. Its soft, modern curves provide high legibility for long-form content and keep the interface feeling approachable and current.

Line heights are intentionally generous (1.5x - 1.6x for body) to ensure a comfortable reading rhythm, essential for a knowledge-heavy platform.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy for article content to maintain an ideal line length for readability (approx. 720px - 800px center column), while peripheral tools and navigation utilize a fluid system.

An **8px linear scale** governs all spacing. 
- **Desktop:** 12-column grid with 80px side margins and 24px gutters.
- **Tablet:** 8-column grid with 40px side margins and 20px gutters.
- **Mobile:** 4-column grid with 20px side margins and 16px gutters.

Large-scale padding (xxl) should be used between major sections to emphasize the minimalist aesthetic and give the content room to "breathe."

## Elevation & Depth

Depth is conveyed through a combination of **Tonal Layering** and **Glassmorphism**.

1.  **The Base:** The Light Slate background is the lowest level.
2.  **The Canvas:** Main content cards use white surfaces with a very subtle, diffused shadow (0px 4px 20px rgba(15, 23, 42, 0.05)).
3.  **The Intelligence Layer:** Modals, AI tooltips, and floating action menus use a backdrop-blur (20px) with a semi-transparent white fill (opacity 80%). They feature a crisp 1px border (white at 40%) to create a "glass" edge.
4.  **Interaction:** Upon hover, elements should slightly lift with an increased shadow spread, reinforcing the tactile nature of the "high-end tool" metaphor.

## Shapes

The shape language is **Softly Rounded**. 

A base radius of **8px (0.5rem)** is applied to standard components like input fields and buttons. Larger containers and cards use **16px (1rem)** to soften the overall appearance of the grid. Pill-shapes are reserved exclusively for status indicators (tags/chips) and the primary AI "Search" bar to differentiate them from the more structured content boxes.

## Components

- **Buttons:** Primary buttons use a solid Indigo-to-Purple gradient. Secondary buttons use a ghost style with a Slate-200 border that darkens on hover. Use 8px corner radius.
- **AI Highlight Chips:** When the AI identifies a concept, it is highlighted with a subtle Indigo background (10% opacity) and a dotted bottom border. Hovering reveals a glassmorphic preview card.
- **Cards:** White background, 16px corner radius, and a thin Slate-100 border. No heavy shadows unless the card is being interacted with.
- **Input Fields:** Use a subtle Slate-50 fill and an 8px radius. On focus, the border transitions to Indigo with a soft outer glow.
- **Lists:** Clean, horizontal dividers using Slate-100. Bullet points in Source Serif 4 articles should use a custom Indigo diamond shape for a touch of distinction.
- **Navigation:** A persistent side-rail (left) using Slate-900 backgrounds with light text for high contrast against the main reading area.
- **Modals:** Centered, glassmorphic surfaces with a 24px corner radius and a backdrop blur of the content behind it.