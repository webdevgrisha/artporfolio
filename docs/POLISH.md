# Polish checklist

The goal of the project: the public site, and after it the admin, feel like a premium digital product in which every detail is thought through. This list is the definition of done for every page and every component. A page is not done until it passes the whole list.

Premium here means restraint and precision, not a number of effects: a flawless base and a few signature moments. The site is monochrome and only the works are in color, so the interface never competes with them.

Layout rules and tokens are in [STYLE_GUIDE.md](STYLE_GUIDE.md). This document is about how a page feels.

## 1. Response and speed

- [ ] A tap answers at once, within 100 ms: a pressed state, the start of a transition, an indicator.
- [ ] Going between pages is a smooth transition (View Transitions), not a white blink.
- [ ] The next page is fetched when the pointer rests on its link, so it opens instantly.
- [ ] Core Web Vitals on a phone on a slow network: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1.
- [ ] Only the largest image of the first screen loads with `priority`; the rest are lazy.
- [ ] Scripts do not hold back the first paint: the page reads without JavaScript.

## 2. Nothing jumps

- [ ] Every image has a size or an aspect ratio, so its place is kept before it loads.
- [ ] The font does not move the text when it arrives (the fallback is fitted to Absans).
- [ ] The chosen theme does not flash the other one on load.
- [ ] An open menu or dialog does not shift the page sideways (`scrollbar-gutter`).
- [ ] The messages of a form appear in a place kept for them, not by pushing what is below.

## 3. Images

- [ ] While a photo loads, a calm placeholder holds its place, and the photo fades in when it arrives instead of popping in.
- [ ] AVIF, else WebP, at the width needed (an honest `sizes`), sharp on a retina screen.
- [ ] The colors of the works are exact: the color profile is kept, P3 is not clipped to sRGB.
- [ ] A crop never cuts the main part of a work; a work shown whole is never cropped.
- [ ] `alt` says what is shown; a decorative photo has `alt=""`.

## 4. Motion

- [ ] Only the `--motion-*` tokens: one set of durations and one curve across the site.
- [ ] What comes in goes out the same way at the same speed.
- [ ] An animation can be interrupted midway: it turns back from where it is instead of playing to its end.
- [ ] Only `opacity`, `translate`, `scale` and `clip-path` move; never sizes or layout.
- [ ] Everything that pops up (the menu, a list, a tooltip) opens and closes with an animation, the same for all.
- [ ] With `prefers-reduced-motion: reduce` nothing slides or grows, and the outcome is the same.
- [ ] Native scrolling: no scroll-jacking, no preloaders, no sound.

## 5. States

Every interactive element has:

- [ ] rest, hover (under `hover: hover` only), pressed, keyboard focus (`:focus-visible`), disabled;
- [ ] the current page or the chosen option (`aria-current`, `aria-checked`);
- [ ] sending, success, error, offline.

Every page and block has:

- [ ] loading, empty (no works, no photos), an API error, a very long text, a very short text;
- [ ] the longest language (German, Finnish) and right-to-left script (Arabic, Hebrew).

## 6. Typography

- [ ] Only the `--font-size-*`, `--line-height-*` and `--letter-spacing-*` tokens.
- [ ] Headings are balanced (`text-wrap: balance`); paragraphs never end with one lone word (`pretty`).
- [ ] Short prepositions and conjunctions never end a line (a no-break space) where the language asks for it.
- [ ] Quotes, dashes and ellipses are those of the language («», „“, —, …), not `"` and `-`.
- [ ] A line of text is no longer than `--text-max-inline-size`.
- [ ] Large text lines up by its optical edges, its capitals and baseline (`text-box`), not by the box of the line.

## 7. Browser and device details

- [ ] Selected text is in the colors of the site (`::selection`).
- [ ] A tap on a phone shows no gray flash (`-webkit-tap-highlight-color`), but a pressed state of our own.
- [ ] The color of the address bar (`theme-color`) matches the page in both themes.
- [ ] The tab icon reads on a light and a dark tab; there is an icon for a phone's home screen.
- [ ] A link shared in a messenger or a network comes as a card with the picture of the page (`og:image`).
- [ ] The `pointer` cursor is only on what can be clicked.
- [ ] A printed page leaves out the menu and the buttons.

## 8. Accessibility is quality too

- [ ] Everything can be reached by keyboard in a sensible order; focus is visible and never hidden under the header.
- [ ] Text contrast is at least 4.5:1, large text 3:1, in both themes.
- [ ] A target for a finger is at least `--min-tap-target-size`.
- [ ] A screen reader reads the page sensibly: headings in order, icon buttons named.
- [ ] The page works zoomed to 200% and with a large browser font.

## 9. The polish pass

After each page, before calling it done:

1. A real iPhone in Safari and an Android phone in Chrome, not only DevTools emulation.
2. A slow network (Slow 4G) and an empty cache.
3. Both themes, `prefers-reduced-motion`, keyboard without a mouse.
4. Widths: 320px, just below and above 40rem and 75rem, 1920px and wider.
5. The longest language and a right-to-left one.
6. Lighthouse and Core Web Vitals.

## Signature moments

A few interactions the site is remembered for. Each is built with the page it belongs to.

1. **The preview grows into the work.** The picture in the gallery grid turns smoothly into the large one on the page of the work (a shared `view-transition-name`). With the gallery and work pages.
2. **Zoom down to the brushstroke.** A work can be zoomed in to the texture of the canvas, with gestures on a phone. With the work page.
3. **The work at its real size.** Its size is shown against a person or a room. With the work page.
4. **Reveal on scroll.** Subtle, in CSS (`animation-timeline: view()`), without libraries.

## First check, 12 November 2026

Checked the finished parts: header, menu, footer, newsletter, contacts, error pages. The base is strong: nothing jumps, the theme does not flash, the states of links and of the form are thought through, the menu opens with an animation, motion respects `reduced motion`, and `text-wrap` is set in the reset.

Missing:

- [x] a smooth transition between pages (View Transitions) — section 1;
- [x] fetching a page when the pointer rests on its link — section 1;
- [x] photos fading in, and a placeholder in the color of the work instead of gray — section 3;
- [x] an animation for the language and currency lists: they pop in while the menu unrolls — section 4;
- [x] a smooth theme change: it is instant now — section 4;
- [x] `::selection` and `-webkit-tap-highlight-color` — section 7;
- [x] `og:image`: a link to the site arrives in a messenger without a picture — section 7;
- [ ] tab icons for a dark tab and an icon for the home screen — section 7;
- [x] no-break spaces after short words in the texts from the API — section 6.
