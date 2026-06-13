---
name: Haven Schedule
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c2c8c2'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8c928d'
  outline-variant: '#424844'
  surface-tint: '#b4ccbc'
  primary: '#b4ccbc'
  on-primary: '#203529'
  primary-container: '#2d4236'
  on-primary-container: '#96ae9e'
  inverse-primary: '#4d6356'
  secondary: '#dfc1a6'
  on-secondary: '#3f2d1a'
  secondary-container: '#57432e'
  on-secondary-container: '#ccb096'
  tertiary: '#c8c6c5'
  on-tertiary: '#313030'
  tertiary-container: '#3e3d3d'
  on-tertiary-container: '#aaa8a7'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d0e8d7'
  primary-fixed-dim: '#b4ccbc'
  on-primary-fixed: '#0b1f15'
  on-primary-fixed-variant: '#364b3f'
  secondary-fixed: '#fcddc1'
  secondary-fixed-dim: '#dfc1a6'
  on-secondary-fixed: '#281807'
  on-secondary-fixed-variant: '#57432e'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474746'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: EB Garamond
    fontSize: 48px
    fontWeight: '500'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: EB Garamond
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: EB Garamond
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 36px
  headline-md:
    fontFamily: EB Garamond
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  title-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.1em
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  container-padding: 24px
  gutter: 16px
  section-gap: 48px
  stack-sm: 4px
  stack-md: 12px
---

## Brand & Style
The design system is centered on "cozy productivity"—a philosophy that blends high-level organization with a calm, sanctuary-like aesthetic. It targets individuals who view their schedule not as a list of chores, but as a curated lifestyle dashboard. 

The visual style is a blend of **Minimalism** and **Editorial Design**. It utilizes expansive dark surfaces to reduce eye strain and cognitive load, creating a focused "focus mode" environment. The emotional response is intentional, moody, and sophisticated, avoiding the frantic energy of traditional productivity tools in favor of a grounded, rhythmic experience.

## Colors
The palette is rooted in deep, earthy tones to evoke a sense of quietude and permanence.
- **Primary (Forest Green):** A muted, deep green used for focus areas, active states, and primary call-to-actions. It represents growth and calm.
- **Secondary (Muted Sand):** A soft, warm neutral used for subtle accents, dividers, and secondary highlights to prevent the interface from feeling too cold.
- **Surface & Background:** The foundation uses a "Deep Charcoal" (#0F0F0F) for the main background and "Off-Black" (#1A1A1A) for card elements and containers to create soft tonal depth.
- **Text:** High-contrast text uses an off-white (#E0E0E0) to maintain readability without the harshness of pure white.

## Typography
The typography strategy pairings a classical serif with a modern, high-legibility sans-serif.
- **EB Garamond** is used for headings and "inspirational" moments (quotes, dashboard titles) to provide an editorial, literary feel.
- **Hanken Grotesk** handles all functional data, body text, and UI labels. Its clean, geometric nature ensures the schedule remains legible even at high densities.
- **Hierarchy:** Use all-caps with generous letter spacing for section headers (e.g., "WEEKLY PLANNER") to create a clear architectural structure.

## Layout & Spacing
The layout uses a **Fluid Grid** with fixed maximum widths for desktop to maintain the "dashboard" feel. 
- **Desktop:** 12-column grid with 24px gutters. Content is often organized in modular blocks (bento-box style) that reflow into a single column on mobile.
- **Rhythm:** This design system relies on "breathable" vertical spacing. Significant gaps (48px+) are used between major functional areas (e.g., separating the "Brain Dump" from the "Weekly Planner") to signify mental transitions.
- **Safe Areas:** Mobile views utilize a minimum 20px horizontal margin to ensure content doesn't feel cramped against the screen edges.

## Elevation & Depth
Depth is achieved through **Tonal Layers** rather than heavy shadows. 
- **Base Level:** The darkest neutral (#0F0F0F) serves as the desk surface.
- **Container Level:** Cards and interactive modules use a slightly lighter grey (#1A1A1A) with a very subtle, low-opacity 1px border (#2A2A2A) to define boundaries.
- **Active States:** Subtle forest green washes (10-20% opacity) are used to lift active items.
- **Interaction:** Soft, diffused shadows (0px 4px 20px rgba(0,0,0,0.5)) are reserved exclusively for floating elements like dropdown menus or date pickers.

## Shapes
The shape language is "Soft" but structured. 
- Standard UI components (buttons, input fields) use a **4px (0.25rem)** radius. This creates a professional, disciplined look that isn't as aggressive as sharp corners but remains more serious than "bubbly" rounded designs.
- Image containers and large dashboard cards may use **8px (0.5rem)** to slightly soften the overall layout.
- Checkboxes are kept square to maintain the "grid-like" feel of a traditional planner.

## Components
- **Buttons:** Primary buttons are solid Forest Green with off-white text. Secondary buttons use a ghost style (thin border) in Muted Sand.
- **Schedule Cards:** Use a top-border accent color (Forest Green for today, Muted Sand for future dates) to provide quick visual scanning.
- **Inputs:** Minimalist bottom-border only or very subtle filled fields. Focus states should transform the border to Forest Green.
- **Chips/Badges:** Small, rectangular tags with low-saturation backgrounds for categorizing tasks (e.g., "Deep Work", "Health").
- **Lists:** Clean, indented structures with custom-styled checkboxes. Checkboxes should animate with a soft fade rather than a harsh snap.
- **Imagery:** Use desaturated, high-quality photography with soft natural lighting (e.g., linen textures, plants, morning light) to reinforce the "haven" narrative.