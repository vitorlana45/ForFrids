---
name: Serene Sanctuary Narrative
colors:
  surface: '#f2fcf0'
  surface-dim: '#d3ddd1'
  surface-bright: '#f2fcf0'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#ecf6ea'
  surface-container: '#e7f1e5'
  surface-container-high: '#e1ebdf'
  surface-container-highest: '#dbe5d9'
  on-surface: '#151e16'
  on-surface-variant: '#434843'
  inverse-surface: '#2a332b'
  inverse-on-surface: '#eaf4e7'
  outline: '#737872'
  outline-variant: '#c3c8c1'
  surface-tint: '#506354'
  primary: '#334537'
  on-primary: '#ffffff'
  primary-container: '#4a5d4e'
  on-primary-container: '#c0d5c2'
  inverse-primary: '#b7ccb9'
  secondary: '#7a573b'
  on-secondary: '#ffffff'
  secondary-container: '#fdceaa'
  on-secondary-container: '#79563a'
  tertiary: '#41423f'
  on-tertiary: '#ffffff'
  tertiary-container: '#595956'
  on-tertiary-container: '#d1d0cc'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d3e8d5'
  primary-fixed-dim: '#b7ccb9'
  on-primary-fixed: '#0e1f13'
  on-primary-fixed-variant: '#394b3d'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#ebbd9b'
  on-secondary-fixed: '#2d1602'
  on-secondary-fixed-variant: '#604025'
  tertiary-fixed: '#e4e2de'
  tertiary-fixed-dim: '#c8c6c3'
  on-tertiary-fixed: '#1b1c1a'
  on-tertiary-fixed-variant: '#474744'
  background: '#f2fcf0'
  on-background: '#151e16'
  surface-variant: '#dbe5d9'
typography:
  display-lg:
    fontFamily: Noto Serif
    fontSize: 48px
    fontWeight: '400'
    lineHeight: '1.2'
    letterSpacing: 0.02em
  headline-md:
    fontFamily: Noto Serif
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.3'
    letterSpacing: 0.01em
  headline-sm:
    fontFamily: Noto Serif
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.7'
    letterSpacing: 0.03em
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0.02em
  label-caps:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.15em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1120px
  gutter: 32px
  margin-edge: 40px
  section-gap: 120px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style

This design system is built upon a foundation of **Editorial Minimalism** with an **Organic** soul. It seeks to evoke a sense of timeless peace, dignity, and quiet reflection. The aesthetic avoids the cold sterility of modern corporate design, favoring instead a tactile, high-end lifestyle magazine feel.

The emotional response should be one of "hushed reverence"—a warm embrace that acknowledges the weight of the subject matter while providing a serene, airy environment for the user to navigate. Every interaction is designed to feel intentional and unhurried, utilizing ample negative space and soft transitions to prioritize the user's emotional well-being.

## Colors

The palette is anchored in a sophisticated, earthy naturalism.
- **Buttery Cream (#FDFBF7):** The primary canvas color. It is softer and more "lived-in" than pure white, reducing eye strain and providing a comforting, parchment-like base.
- **Deep Sage (#4A5D4E):** Used for primary actions, navigation headers, and significant structural elements. It conveys growth, stability, and natural tranquility.
- **Soft Terracotta (#C89D7C):** Applied sparingly as an accent for emotional warmth, highlight icons, or subtle decorative borders.
- **Deep Moss (#2D362E):** Reserved for high-contrast typography and iconography to ensure legibility while remaining within the organic spectrum.

## Typography

The typography strategy pairs a timeless serif with a refined, geometric sans-serif to achieve an editorial balance.
- **Headlines:** Using *Noto Serif* to provide a sense of heritage and literary grace. Letter spacing is increased slightly beyond standard defaults to create a "breathable" and prestigious feel.
- **Body & Interface:** Using *Manrope* for its exceptional clarity and modern proportions.
- **Rhythm:** Generous line-heights (1.6x - 1.7x) are mandatory for body text to maintain the "calm and serene" directive, preventing the UI from feeling cluttered or dense.

## Layout & Spacing

This design system utilizes a **Fixed Grid** centered on the viewport for desktop, transitioning to a fluid model for mobile. 
- **The "Breath" Principle:** Vertical spacing is intentionally oversized. Sections should be separated by large gaps to allow the content to stand alone.
- **Grid:** A 12-column grid with wide 32px gutters to prevent visual tension between elements.
- **Margins:** High outer margins (min 40px) create an "art gallery" framing effect for the content.

## Elevation & Depth

To maintain the organic and editorial feel, traditional heavy drop shadows are forbidden.
- **Tonal Layering:** Depth is communicated through subtle shifts in background color (e.g., a Buttery Cream card on a slightly more saturated Cream surface).
- **Soft Diffusion:** When elevation is required for functional clarity (like a floating action button), use an extremely diffused, low-opacity shadow tinted with the Deep Sage color (#4A5D4E at 5% opacity) to make it feel integrated into the environment.
- **Thin Outlines:** Use 1px borders in Terracotta (#C89D7C) at 30% opacity for cards to provide structure without the weight of a shadow.

## Shapes

The shape language is **Soft and Natural**. 
- **Corners:** Use 0.5rem (8px) as the base radius. This provides enough softness to feel welcoming while maintaining enough structure to appear sophisticated.
- **Interactive Elements:** Buttons and input fields follow the `rounded-lg` (16px) or `rounded-xl` (24px) patterns to mimic the smooth edges of river stones.
- **Imagery:** Photography should occasionally use asymmetrical "organic" masks (resembling soft pebbles or arches) to lean into the editorial aesthetic.

## Components

- **Buttons:** Primary buttons use the Deep Sage background with Buttery Cream text. They should have generous internal padding (16px top/bottom, 32px left/right). Hover states involve a slight shift to a more desaturated Sage.
- **Input Fields:** Use a "minimalist" style—a single bottom border or a very light Buttery Cream fill with a thin Terracotta outline. Labels should always use the `label-caps` typography style.
- **Cards:** Cards should be "borderless" in feel, using a slightly different cream tint or a very soft 1px Terracotta stroke. Avoid heavy containers.
- **Chips/Tags:** Use Soft Terracotta backgrounds with 15% opacity and matching dark text for a subtle, high-end highlight.
- **Imagery:** All photos should have a slightly warm, film-like grain filter to match the "emotional" and "warm" brand pillars.
- **Tributes/Memorials (Specialty Component):** Use a centered, serif-heavy layout with a decorative Terracotta divider line to honor the pet's memory with dignity.