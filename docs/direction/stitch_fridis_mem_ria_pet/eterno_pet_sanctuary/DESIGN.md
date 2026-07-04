---
name: Eterno Pet Sanctuary
colors:
  surface: '#fff8f3'
  surface-dim: '#dfd9d4'
  surface-bright: '#fff8f3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f9f2ed'
  surface-container: '#f4ede7'
  surface-container-high: '#eee7e1'
  surface-container-highest: '#e8e1dc'
  on-surface: '#1e1b18'
  on-surface-variant: '#424842'
  inverse-surface: '#33302c'
  inverse-on-surface: '#f7efea'
  outline: '#737972'
  outline-variant: '#c2c8c0'
  surface-tint: '#4a654f'
  primary: '#4a654f'
  on-primary: '#ffffff'
  primary-container: '#8daa91'
  on-primary-container: '#253f2b'
  inverse-primary: '#b0ceb4'
  secondary: '#5f5c6c'
  on-secondary: '#ffffff'
  secondary-container: '#e2ddf0'
  on-secondary-container: '#646171'
  tertiary: '#645d53'
  on-tertiary: '#ffffff'
  tertiary-container: '#aaa296'
  on-tertiary-container: '#3e3930'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cceacf'
  primary-fixed-dim: '#b0ceb4'
  on-primary-fixed: '#062010'
  on-primary-fixed-variant: '#334d38'
  secondary-fixed: '#e5e0f3'
  secondary-fixed-dim: '#c9c4d7'
  on-secondary-fixed: '#1c1a27'
  on-secondary-fixed-variant: '#474554'
  tertiary-fixed: '#ebe1d4'
  tertiary-fixed-dim: '#cfc5b9'
  on-tertiary-fixed: '#1f1b13'
  on-tertiary-fixed-variant: '#4c463c'
  background: '#fff8f3'
  on-background: '#1e1b18'
  surface-variant: '#e8e1dc'
typography:
  h1:
    fontFamily: Noto Serif
    fontSize: 48px
    fontWeight: '400'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Noto Serif
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  h3:
    fontFamily: Noto Serif
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: '0'
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-sm:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: 0.01em
  label-caps:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max-width: 1140px
  gutter: 32px
  margin-mobile: 20px
  stack-sm: 16px
  stack-md: 32px
  stack-lg: 64px
  section-padding: 120px
---

## Brand & Style

This design system is built upon the concept of the "Digital Sanctuary." It acknowledges the profound emotional weight of pet loss by providing a space that feels quiet, respectful, and timeless. The visual language avoids the clinical coldness of modern tech and the over-stimulation of social media, opting instead for a philosophy of **Empathetic Minimalism**.

The style leverages heavy whitespace and a restricted, desaturated palette to create a low-cognitive-load environment. By combining modern digital standards with traditional editorial sensibilities, the interface evokes the feeling of a high-end physical memory book or a serene memorial garden. Every interaction is designed to be soft and intentional, prioritizing the user's emotional state over conversion-driven urgency.

## Colors

The color strategy for this design system is rooted in nature and tranquility. The palette utilizes "muted life" tones—colors found in a fading garden or a quiet morning.

- **Primary (Sage Green):** Represents growth and peace. Used for primary actions and gentle highlights.
- **Secondary (Light Lavender):** Evokes spirituality and soft remembrance. Used for accents and categorical tags.
- **Tertiary (Warm Beige):** Provides a soft, paper-like background that is easier on the eyes than pure white.
- **Neutral (Taupe/Charcoal):** Used for typography to ensure high readability while maintaining a softer contrast than pure black.

Avoid all high-saturation colors, neon tones, or harsh reds. Success and error states should be handled through iconography and soft tonal shifts rather than aggressive color changes.

## Typography

The typography pairing reflects the balance between heritage and modern accessibility. 

**Noto Serif** is reserved for headlines and storytelling elements. Its elegant serifs convey a sense of tradition, respect, and the "eternal" nature of a memorial. It should be typeset with generous leading to allow the words to breathe.

**Manrope** is used for all functional and body text. Its balanced, geometric construction provides a clear, calm reading experience, ensuring that even long-form tributes remain legible and comforting. Use the `label-caps` style sparingly for small metadata to maintain a sophisticated editorial feel.

## Layout & Spacing

This design system employs a **Fixed Grid** model to create a sense of containment and security. Layouts should never feel crowded; the spacing rhythm is intentionally oversized to facilitate a slow, reflective browsing pace.

- Use a 12-column grid for desktop with wide 32px gutters.
- Vertical rhythm follows a 8px baseline, but section-to-section spacing should be significant (64px to 120px) to signify a change in "mood" or content type.
- Content should be centered whenever possible to create a focal point, mirroring the layout of a traditional monument or plaque.

## Elevation & Depth

To maintain a serene atmosphere, this design system avoids heavy shadows and high-contrast stacking. Depth is achieved through **Tonal Layers** and **Ambient Shadows**.

- **Surfaces:** Use subtle shifts between the Beige background and White surfaces to define content areas.
- **Shadows:** When necessary, use extremely diffused, low-opacity shadows (Opacity: 4-6%) with a slight tint of the primary Sage color. This makes elements feel as though they are gently resting on a soft surface rather than floating in digital space.
- **Blur:** Implement soft backdrop blurs for overlaying elements (like navigation bars) to maintain a sense of context without visual clutter.

## Shapes

The shape language is defined by **Organic Softness**. Harsh 90-degree angles are avoided to prevent the UI from feeling "sharp" or "industrial."

- Standard components use a 0.5rem (8px) radius.
- Imagery and large cards should use "rounded-xl" (1.5rem / 24px) to create a soft, framed appearance for photos.
- **Organic Elements:** Incorporate non-geometric, hand-drawn organic shapes for decorative background flourishes. These shapes should be asymmetrical and fluid, echoing the natural world.

## Components

Components in this design system must feel tactile and supportive.

- **Buttons:** Use fully rounded or medium-rounded shapes with soft color fills (Sage or Lavender). Text should be Manrope Semi-bold. Avoid high-contrast hover states; use subtle darkening or "glow" effects instead.
- **Cards:** Memorial cards should feature large photography placeholders. Use a thin, low-contrast border (1px Taupe at 10% opacity) rather than a heavy shadow.
- **Input Fields:** Use soft beige backgrounds for inputs with Noto Serif labels to make the act of writing a tribute feel more personal and less like "data entry."
- **Tribute Timeline:** A custom component using a soft vertical line and delicate icons to mark life milestones.
- **Photography Placeholders:** Use "aspect-ratio" boxes with soft rounded corners. When no photo is present, use a delicate sage-leaf illustration or a soft color gradient.
- **Chips & Tags:** Small, pill-shaped elements with Lavender backgrounds and darker text for categorizing memories (e.g., "Playful," "Quiet Moments").