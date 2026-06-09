---
name: Luminous Precision
colors:
  surface: '#f9f9f7'
  surface-dim: '#dadad8'
  surface-bright: '#f9f9f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f4f2'
  surface-container: '#eeeeec'
  surface-container-high: '#e8e8e6'
  surface-container-highest: '#e2e3e1'
  on-surface: '#1a1c1b'
  on-surface-variant: '#494454'
  inverse-surface: '#2f3130'
  inverse-on-surface: '#f1f1ef'
  outline: '#7b7486'
  outline-variant: '#cbc3d7'
  surface-tint: '#6d3bd7'
  primary: '#6b38d4'
  on-primary: '#ffffff'
  primary-container: '#8455ef'
  on-primary-container: '#fffbff'
  inverse-primary: '#d0bcff'
  secondary: '#006b5e'
  on-secondary: '#ffffff'
  secondary-container: '#6ef9e2'
  on-secondary-container: '#007164'
  tertiary: '#855000'
  on-tertiary: '#ffffff'
  tertiary-container: '#a76500'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#6ef9e2'
  secondary-fixed-dim: '#4ddcc6'
  on-secondary-fixed: '#00201b'
  on-secondary-fixed-variant: '#005047'
  tertiary-fixed: '#ffdcbb'
  tertiary-fixed-dim: '#ffb869'
  on-tertiary-fixed: '#2c1700'
  on-tertiary-fixed-variant: '#673d00'
  background: '#f9f9f7'
  on-background: '#1a1c1b'
  surface-variant: '#e2e3e1'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  title-sm:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Geist
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  code:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-page: 64px
  container-max: 1200px
  sidebar-width: 280px
---

## Brand & Style

This design system establishes a high-performance environment for thought and creation, blending the utilitarian structure of developer tools with the refined aesthetics of luxury productivity software. The brand personality is cerebral, precise, and expansive. It targets knowledge workers and researchers who require a calm, "Zen-like" atmosphere for deep focus.

The visual style is a hybrid of **Minimalism** and **Modern Corporate**, characterized by a "White-Space First" philosophy. It utilizes expansive margins and high-precision typography to reduce cognitive load. The UI feels airy yet grounded, using intentional color accents to highlight connections and pathways without cluttering the canvas.

## Colors

The palette is anchored by a warm, off-white background (`#FAFAF8`) that mimics premium paper, reducing eye strain compared to pure white. 

- **Primary (Obsidian Purple):** Used exclusively for high-intent actions, active states, and focus indicators.
- **Secondary (Teal):** Reserved for success states, secondary links, or specific metadata categorization.
- **Surface:** White is used for interactive cards and floating panels to create a subtle lift against the off-white background.
- **Graph Workspace:** A dedicated dark mode environment (`#0B0D12`) is utilized for data visualization and "Graph View" contexts to maximize the vibrance of nodes and connection lines.

## Typography

The typography system prioritizes technical precision and readability. **Hanken Grotesk** provides a modern, sharp personality for headers, while **Geist**—a font designed for developer-centric environments—handles body copy and interface labels with exceptional clarity.

- **Contrast:** Large display text should use a tight letter-spacing to feel "locked-in."
- **Readability:** Body text is set at 15px with a generous 1.6x line height to ensure long-form notes are easy to digest.
- **Hierarchy:** Use the uppercase label style for metadata, breadcrumbs, and sidebar section headers to distinguish them from content.

## Layout & Spacing

This design system utilizes a **Fixed-Fluid Hybrid** model. Navigation and sidebar elements are fixed-width, while the central workspace remains fluid up to a maximum reading width of 1200px.

- **Whitespace:** Emphasize "massive" whitespace by using 64px (or greater) page margins on desktop.
- **Rhythm:** All spacing is derived from a 4px baseline grid.
- **Desktop:** A 12-column grid with 24px gutters.
- **Tablet:** 8-column grid with 16px gutters and 32px margins.
- **Mobile:** 4-column grid with 16px gutters and 16px margins.

## Elevation & Depth

To maintain a clean, Apple-inspired aesthetic, this design system rejects heavy drop shadows in favor of **Tonal Layering** and **Ghost Outlines**.

- **Level 0 (Background):** `#FAFAF8` – The base canvas.
- **Level 1 (Cards/Panels):** `#FFFFFF` with a 1px solid border in `#E5E7EB`. No shadow.
- **Level 2 (Popovers/Modals):** `#FFFFFF` with a 1px border and a very soft, high-diffusion shadow (`0 10px 30px rgba(0,0,0,0.04)`).
- **Interactive Depth:** On hover, interactive cards do not lift; instead, the border color shifts to the Primary Purple at low opacity (10-15%).

## Shapes

The shape language is "Rounded-Square," striking a balance between the friendliness of consumer apps and the structure of professional tools.

- **Standard (8px):** Buttons, Input fields, and small Cards.
- **Large (16px):** Main content containers and floating sidebars.
- **Pill:** Reserved exclusively for status indicators (Chips) and the primary search bar to make them distinct from structural elements.

## Components

### Buttons
Primary buttons use a solid Obsidian Purple background with white text. Secondary buttons use a transparent background with a 1px border. All buttons have an 8px corner radius and height-balanced padding (e.g., 10px top/bottom, 20px left/right).

### Cards
Cards are flat white containers with a 1px grey border. They should never appear "heavy." Use ample internal padding (32px) to let content breathe.

### Input Fields
Inputs follow a minimal "Arc-like" aesthetic: a 1px subtle border that glows Primary Purple on focus. Background is slightly off-white (`#F3F4F1`) to distinguish from white cards.

### Chips & Tags
Small, pill-shaped elements with a secondary teal background at 10% opacity and 100% opacity teal text.

### The Graph View
In the dedicated dark section, nodes should use Primary Purple for "Main Notes" and Secondary Teal for "Connected References." Lines (edges) should be low-contrast grey (`#2D2E33`) with a 0.5px thickness to maintain precision.