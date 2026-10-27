# Frontend Style Guide

This document defines the CSS and responsive-layout conventions for the project. It is a living guide: update it when a repeated design problem produces a rule that improves consistency, readability, or accessibility.

The unit-selection model in this guide is based on Josh W. Comeau's [The Surprising Truth About Pixels and Accessibility](https://www.joshwcomeau.com/css/surprising-truth-about-pixels-and-accessibility/): use relative units when a value should respond to the user's preferred font size, and fixed units when it should not.

The custom-property model is based on [CSS Variables for React Devs](https://www.joshwcomeau.com/css/css-variables-for-react-devs/): custom properties are inherited CSS properties, not inherently global constants, and should be scoped to the element that owns their meaning.

The color model is informed by [Color Formats in CSS](https://www.joshwcomeau.com/css/color-formats/): choose formats for readability and manipulation, and separate semantic color meaning from the literal color value.

## Priorities

When trade-offs are necessary, use this order:

1. Correct semantics and accessibility.
2. Stable layout across supported viewport sizes.
3. Clear ownership between parent layout and child components.
4. Readable CSS with predictable values.
5. Visual fidelity to Figma.

Do not reproduce fragile Figma coordinates when normal document flow, Flexbox, or Grid can express the same design.

## File organization

- Use CSS Modules for component and page styles.
- Keep a component's CSS beside its TSX file.
- Global styles live in `front/src/app/styles/`. Keep `reset.css` limited to browser normalization.
- Keep `globals.css` limited to application-wide tokens (colors, spacing, font sizes, motion, layers) and document defaults.
- `reset.css` and `globals.css` live in the `reset` and `base` cascade layers; CSS Modules stay unlayered, so component styles always win regardless of import order.
- Reusable visual behavior is a component in `shared/ui`, not a global helper class. For example, text that is only for screen readers uses `<VisuallyHidden>`.
- Keep feature-specific custom properties in the nearest owning layout or component.
- Do not place admin-only values in global styles.

```text
Component/
├── Component.tsx
└── Component.module.css
```

## Style ownership

A parent owns the placement of its direct children. A child owns its internal layout and appearance.

```css
/* Parent.module.css */
.profile {
  margin-inline: var(--sidebar-gutter);
}

/* Profile.module.css */
.root {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}
```

- Pass `className` when a parent needs to position a reusable child.
- Do not put external margins in a reusable component.
- Do not add wrapper elements only to apply spacing when `className` is sufficient.
- Add a wrapper when it has a semantic or layout responsibility such as clipping, sizing, scrolling, or establishing a grid area.

## Layout

- Use normal document flow first.
- Use Flexbox for one-dimensional alignment.
- Use Grid for two-dimensional or explicitly column-based composition.
- Use `gap` for spacing between sibling items with the same relationship.
- Use `margin-block-start: auto` to push the final flex item to the end.
- Use absolute or fixed positioning only for overlays, decorative layers, indicators, and viewport-bound UI.
- Avoid viewport-height subtraction such as `calc(100dvh - 282px)`. Prefer a flex or grid layout that consumes the remaining space.

## Responsive strategy

- New layouts are mobile-first by default.
- Add a breakpoint when the layout changes, not for isolated one-pixel differences.
- Use the three documented device ranges:
  - phone: below `40rem`;
  - tablet: `40rem` and wider;
  - desktop: `75rem` and wider (the admin sidebar becomes a column).
- Use `rem` for media queries so increased browser font settings switch constrained layouts earlier.
- Use `clamp()` only when a value should genuinely scale continuously.
- Prefer a stable component size inside a fluid container.
- Think in terms of available space rather than device labels.
- Test at the minimum supported width, at every breakpoint, just above every breakpoint, and on a wide desktop.

Do not convert every Figma value into a viewport formula:

```css
/* Avoid: precise but unreadable and hard to maintain. */
font-size: clamp(1.5rem, 3.515625vw, 2.25rem);

/* Prefer: stable component sizing or a simple, intentional scale. */
font-size: clamp(1.5rem, 3.5vw, 2.25rem);
```

Use at most two meaningful decimal places for authored fluid ratios unless a documented calculation requires more precision.

## Choosing units

Do not choose units mechanically. For every value, ask:

> Should this value grow when the user increases their browser's default font size?

Use `rem` or `em` when the answer is yes. Use `px` or another layout-relative unit when the answer is no.

### Typography

- Use `rem` for font sizes so browser font preferences are respected.
- Never redefine the root font size to make rem conversion easier.
- Use `em` when a value should scale with the current component's font size, such as text-relative spacing.
- Text-related vertical rhythm should normally scale with text.

### Layout and spacing

- Do not assume all padding and margins should use `rem`.
- Horizontal page gutters often should not grow with font scaling because doing so removes space from enlarged text.
- Spacing that serves readability, such as distance between paragraphs and headings, should normally scale with text.
- Use `%`, fractional Grid tracks, intrinsic sizing, and flexible growth for available layout space.
- Use `dvh` for viewport-height screens.

### Width and height

- Avoid fixed widths and heights when content determines the required size.
- Prefer `min-block-size` over `block-size` for controls containing text, so they can grow when text wraps.
- A text-containing component may use a rem-based width to preserve its proportions during font scaling, but it must also have `max-inline-size: 100%`.
- Use pixels for geometry that should remain physically stable, such as a one-pixel border or an image-specific crop.

### Viewport units

- Use `vw` or `dvw` only for values that should depend on viewport width.
- Do not use viewport units as the sole basis for font size; they do not respond to browser zoom and font scaling like relative text units do.
- Fluid typography must retain accessible `rem` bounds and be verified with increased default font size.

### Media queries

- Use `rem` for breakpoints.
- A user with enlarged default text has less effective space, even on a desktop display; allowing the compact layout to activate earlier is desirable.

## Spacing

- Prefer `gap`, `padding`, and parent-owned layout rules over positional offsets.
- Use logical properties: `margin-inline`, `padding-block`, `inset-inline-start`, `inline-size`, and `block-size`.
- Take every spacing value from the spacing system below. Do not copy pixel distances from Figma.
- Repeated spacing within a feature may get a named local custom property that points to a scale token.

### Spacing system

All spacing is a step of one base unit, `--space-unit: 0.25rem` (4px). There are two scales:

| Scale | Tokens | Use for | Changes by device |
| --- | --- | --- | --- |
| Component | `--space-1` … `--space-8` | Inside components: button padding, label-to-field gap, icon-to-text gap | No |
| Layout | `--layout-space-4` … `--layout-space-24` | Page structure: page gutters, distance between sections, sidebar spacing | Yes, × `--layout-scale` |

The number in a token name is the number of base units: `--space-4` is 4 × 4px = 16px.

The layout coefficient is set once in `globals.css`:

| Device | Range | `--layout-scale` | `--layout-space-4` |
| --- | --- | --- | --- |
| Phone | below `40rem` | 1 | 16px |
| Tablet | `40rem` and wider | 1.25 | 20px |
| Desktop | `75rem` and wider | 1.5 | 24px |

```css
.page {
  /* Grows from phone to desktop automatically, no media query needed. */
  gap: var(--layout-space-8);
}

.button {
  /* The same on every device. */
  padding: var(--space-1) var(--space-4);
}
```

Rules:

- A component looks the same on every device, so it uses only `--space-*`.
- A layout decides how much air surrounds components, so it uses `--layout-space-*`.
- Use a media query for spacing only when the layout itself changes, for example when the page gutter jumps from `--layout-space-4` to `--layout-space-12` because the sidebar appears.
- Need a step that does not exist? Add it to both `globals.css` and this table; do not write a raw value.
- Pixel values stay for physical geometry that is not spacing: 1px borders, focus-ring offsets, image sizes.

Font sizes use the fixed `--font-size-sm` … `--font-size-4xl` scale. Change a font size between devices with a media query only where the design calls for it.

## Custom properties

Custom properties inherit through the DOM. Define them on the nearest common ancestor of every consumer.

Global custom properties are reserved for genuine application-wide design tokens:

```css
:root {
  --motion-duration-standard: 180ms;
  --motion-easing-standard: cubic-bezier(0.2, 0, 0, 1);
}
```

Component-specific properties stay scoped:

```css
.sidebar {
  --sidebar-gutter: var(--layout-space-10);
}
```

Name properties by purpose, not by their current value. Prefer `--sidebar-gutter` over `--space-78`. Scale tokens such as `--space-4` are the exception: their name is a step of the spacing system, not a pixel value.

### Scope and ownership

- A custom property is not automatically global.
- Define a value on `:root` only when the entire application may consume it.
- Define feature tokens on the feature's layout root.
- Define component tokens on the component root.
- A child may consume an inherited parent token when that token is an intentional part of the layout contract.
- Do not make a value global only to avoid passing a class or declaring it in the correct feature scope.

### Change values, not consumers

When several components share the same responsive or capability-based value, update the custom property once instead of repeating a media query in every component:

```css
:root {
  --min-tap-target-size: 44px;
}

@media (pointer: coarse) {
  :root {
    --min-tap-target-size: 48px;
  }
}

.button,
.input {
  min-block-size: var(--min-tap-target-size);
}
```

Use this pattern only when the components share the same semantic requirement. Similar numbers alone do not justify a shared token.

### React and runtime values

- Keep static visual values in CSS, not React.
- Pass a CSS custom property from React when the value is genuinely runtime data, such as an active index, measured coordinate, or user-controlled theme value.
- React should pass the data; CSS should own the visual formula and transition.
- Use a small explicit TypeScript type for custom inline properties when it improves readability.
- Reading or setting root custom properties with `getComputedStyle()` or `style.setProperty()` is an escape hatch, not the default state-management strategy.

```tsx
const indicatorStyle = {
  "--active-index": activeIndex,
} as React.CSSProperties;
```

```css
.indicator {
  transform: translateY(calc(var(--active-index) * var(--item-size)));
}
```

### Constraints

- CSS custom properties are not statically typed by default; use clear names and visual tests.
- A custom property cannot be used as the condition of a media query.
- Add a fallback to `var()` only when the value is truly optional. Missing required tokens should remain visible during development.
- Do not create a custom property for a value used once unless it forms a deliberate component API.

## Colors

### Semantic tokens

- Repeated application colors should be exposed as semantic custom properties.
- Name tokens by role, not appearance: prefer `--color-text-muted` over `--gray-500` in component code.
- Palette-level tokens may describe appearance; components should consume semantic aliases.
- Keep one-off asset-specific colors local when they do not represent a reusable design decision.

```css
:root {
  --color-text: hsl(0deg 0% 0%);
  --color-text-muted: hsl(0deg 0% 47%);
  --color-surface: hsl(0deg 0% 100%);
  --color-border: hsl(0deg 0% 0%);
}
```

### Formats

- Use modern space-separated color syntax.
- Use `rgb(r g b / alpha)` or `hsl(h s l / alpha)` for transparency; do not introduce legacy comma-based `rgba()` syntax.
- HSL is a readable default for authored sRGB colors when developers need to reason about hue, saturation, and lightness.
- Hex remains acceptable for immediately obvious constants such as `#000` and `#fff`, imported brand values, or values copied exactly from an external specification.
- Named colors are for prototypes, tests, and educational examples, not the production palette. Standard keywords such as `transparent` and `currentColor` are exceptions.
- Do not copy HSB values from Figma into `hsl()` without conversion; HSB brightness and HSL lightness are different models.

### Perceptual and wide-gamut colors

- Consider `oklch()` when building a real color scale whose lightness steps should feel perceptually consistent.
- Do not introduce OKLCH only to express black, white, or a single isolated color.
- Use Display P3 only as a progressive enhancement and keep an sRGB fallback when required by the browser-support policy.

```css
.accent {
  background-color: hsl(350deg 100% 50%);
  background-color: color(display-p3 1 0 0.15);
}
```

### Derived colors

- Store complete color values by default.
- Split hue, saturation, and lightness into separate custom properties only when the application genuinely derives multiple related colors at runtime.
- Prefer explicit semantic tokens over long chains of calculated color fragments when the palette is static.
- Use an alpha color for translucent overlays instead of applying `opacity` to a container; container opacity also fades its children.

### Accessibility

- Verify text and interactive-state contrast; a readable color model does not guarantee accessible contrast.
- Do not communicate state through color alone.
- Check hover, focus, active, disabled, and error states against every surface on which they appear.
- Treat visual regression tests as the safety net for untyped custom-property names and theme changes.

## Selectors and class names

- Use locally meaningful names such as `.header`, `.navigationLink`, and `.activeIndicator`.
- Avoid selectors that depend on DOM depth.
- Descendant selectors are acceptable for tightly owned elements such as `.avatar img`.
- Keep specificity low; do not use IDs or `!important`.
- Represent state with an explicit class, ARIA attribute, or `data-*` attribute.
- Use `clsx` for conditional class names in React.

## Typography

- Use the project font inherited from global styles.
- Set `font-weight` explicitly on headings because browser defaults are bold.
- Use unitless `line-height` for normal text when possible.
- Use `line-height: normal` only when matching the font's native metrics is intentional.
- Prevent untrusted or dynamic text from breaking layouts with `min-inline-size: 0` and an appropriate wrapping rule.

## Interaction and accessibility

- Use links for navigation and buttons for actions.
- Every interactive element must have a visible `:focus-visible` state.
- Apply hover-only effects inside `@media (hover: hover)` when touch devices do not need them.
- Respect `prefers-reduced-motion` through the shared motion tokens.
- Hidden drawers must be removed from pointer and keyboard interaction, not only translated off-screen.
- Decorative images use empty alternative text and may be hidden from assistive technology when their container already is.

## Images

- Put images in a container when shape, clipping, or aspect ratio belongs to the UI.
- Use `object-fit: cover` for cropped media and `contain` when the entire asset must remain visible.
- Always reserve geometry with dimensions or `aspect-ratio` to avoid layout shift.
- Reuse an existing asset only when its crop, resolution, and aspect ratio match the design slot.
- Gallery and content images should eventually use responsive sources, modern formats, and lazy loading below the fold.

## Motion

- Animate `transform` and `opacity` where possible.
- Avoid transitions on layout-heavy properties when a transform can express the same motion.
- Use shared duration and easing tokens.
- Motion must communicate a state change, not exist only as decoration.

## Figma-to-code rules

- Treat Figma as the visual specification, not as production layout code.
- Identify relationships between elements before copying coordinates.
- Preserve exact asset geometry and meaningful typography.
- Replace absolute coordinates with flow, Flexbox, or Grid whenever the relationship allows it.
- Do not encode spacing with text whitespace.
- Prefer named layout relationships over unexplained numeric formulas.
- Document intentional optical corrections separately from geometric alignment.

## Review checklist

Before approving a UI change, verify:

- The component is semantically correct.
- Parent and child style ownership is clear.
- The layout works without unnecessary absolute positioning.
- Responsive behavior is intentional at each breakpoint.
- Dynamic content can wrap without overflow.
- Text remains usable at 200% browser zoom.
- Layout remains usable with the browser's default font size increased to at least 32px.
- Keyboard focus, hover, reduced motion, and hidden states work correctly.
- Repeated values have one source of truth.
- Numeric values are readable and explainable.
- No existing asset or component was recreated without a reason.
- `pnpm check` and the frontend build pass.

## Evolving this guide

Add a rule when:

- the same review discussion occurs more than once;
- a bug reveals a missing layout or accessibility convention;
- a new shared pattern is introduced;
- the design system gains a reusable token or component.

Every new rule should state the reason and include a short project-relevant example.
