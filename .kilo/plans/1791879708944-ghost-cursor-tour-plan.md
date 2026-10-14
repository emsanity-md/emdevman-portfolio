# GhostCursorTour Implementation Plan

## Goal
Add a reusable "fake user cursor" guided tour (Figma-style multiplayer cursor) that automatically tours the app's content with a fake username label and explanation bubble at each stop.

## Files to Create/Modify

### New Files
1. `emdevman/app/components/GhostCursorTour.tsx` - Main tour component
2. `emdevman/app/components/GhostCursorTour.module.css` - Scoped styles (or use globals.css additions)

### Modified Files
3. `emdevman/app/sections/Hero.tsx` - Add `data-tour="hero"` to section
4. `emdevman/app/sections/TechStack.tsx` - Add `data-tour="tech-stack"` to section
5. `emdevman/app/components/GitHubContributions.tsx` - Add `data-tour="github"` to section
6. `emdevman/app/sections/Projects.tsx` - Add `data-tour="projects"` to section
7. `emdevman/app/sections/About.tsx` - Add `data-tour="about"` to section
8. `emdevman/app/sections/Contact.tsx` - Add `data-tour="contact"` to section
9. `emdevman/app/page.tsx` - Render `<GhostCursorTour />` with steps config

---

## Component Design: `GhostCursorTour.tsx`

### Props Interface
```typescript
interface GhostCursorTourProps {
  steps: TourStep[];
  username?: string;           // default: "guest_marvin"
  color?: string;              // default: CSS var(--primary) or #F2AE00
  startDelay?: number;         // default: 2500ms
  loop?: boolean;              // default: true
  enabled?: boolean;           // default: true (can check ?tour=0)
}

interface TourStep {
  selector: string;
  text: string;
  anchor?: { x: number; y: number };  // default: {x: 0.15, y: 0.35}
  duration?: number;                   // default: 3800ms
  click?: boolean;                     // optional: click element before moving on
}
```

### Behavior Implementation

1. **Mount & Guards**
   - Run only in `useEffect` (SSR safe)
   - Check `window.matchMedia('(max-width: 767px)')` → disable
   - Check `window.matchMedia('(prefers-reduced-motion: reduce)')` → disable
   - Check `enabled` prop and `?tour=0` query param → disable
   - Return early if any guard fails

2. **Cursor Element**
   - `position: fixed`, `pointer-events: none`, `z-index: 9999`
   - `aria-hidden="true"`
   - Cursor SVG: arrow with white stroke
   - Username pill: rounded, positioned under cursor
   - Bubble: dark rounded, 1px border in accent color
   - Move via `transform: translate3d(x, y, 0)` + CSS transition
   - Transition: `cubic-bezier(0.22, 1, 0.36, 1)` 900ms

3. **Tour Loop**
   - Wait `startDelay` (2500ms)
   - For each step:
     - `document.querySelector(step.selector)` → skip if missing
     - Hide bubble, `scrollIntoView({behavior: 'smooth', block: 'center'})`
     - Wait ~650ms
     - Measure `getBoundingClientRect()`
     - Move cursor to anchor point (default 15% from left, 35% from top of element)
     - Wait ~900ms (transition duration)
     - Fade in bubble with `step.text`
     - Wait `step.duration` (default 3800ms)
     - If `step.click` → `element.click()`
   - Loop if `loop: true`

4. **Bubble Positioning**
   - Default: right of cursor
   - Flip left if cursor within 340px of right viewport edge
   - Keep inside viewport vertically

5. **Stop Conditions**
   - Click/tap anywhere → stop permanently, remove cursor
   - Escape key → stop permanently, remove cursor
   - Cleanup: clear all timers, remove event listeners, remove DOM nodes

6. **React Strict Mode / SSR Safety**
   - All DOM access in `useEffect`
   - Track mounted state
   - Cleanup function removes everything
   - Use `useRef` for timers and cursor elements

7. **Print Styles**
   - `@media print { .ghost-cursor-tour { display: none !important; } }`

8. **Modal/Dialog Awareness**
   - Check for open `[role="dialog"]`, `.modal`, `[data-modal]` before each step
   - Pause tour while modal is open (poll or MutationObserver)

---

## Step Configuration (for page.tsx)

```typescript
const tourSteps: TourStep[] = [
  {
    selector: '#home',
    text: 'Welcome! This is the hero with my name, bio, and social links.',
    duration: 4000,
  },
  {
    selector: '#tech-stack',
    text: 'My toolkit — skills carousel and a 4-step workflow from idea to impact.',
    duration: 4000,
  },
  {
    selector: '#github',
    text: 'Live GitHub contribution calendar — 53 weeks of public activity.',
    duration: 4500,
  },
  {
    selector: '#projects',
    text: 'Interactive project deck — click a card for quick view or case study.',
    duration: 4500,
  },
  {
    selector: '#about',
    text: 'About me — current focus, 4 working principles, project frames, and a quote.',
    duration: 4500,
  },
  {
    selector: '#contact',
    text: 'Get in touch — message form, email copy button, GitHub, LinkedIn, location.',
    duration: 4000,
  },
];
```

Each text is under 110 chars and specific to actual content.

---

## Integration Steps

1. Create `GhostCursorTour.tsx` with all logic
2. Add `data-tour="..."` attributes to 6 section elements
3. Import and render `<GhostCursorTour steps={tourSteps} />` in `page.tsx`
4. Add print-hiding CSS to `globals.css`
5. Test: dev server → verify cursor starts ~2.5s, visits all steps, bubble in viewport, stops on click/Escape
6. Run `npm run build` and `npm run typecheck` → no errors

---

## Validation Checklist

- [ ] Cursor appears after ~2.5s delay
- [ ] Visits all 6 steps in order
- [ ] Smooth scroll to each section
- [ ] Cursor glides with 900ms cubic-bezier transition
- [ ] Bubble fades in after cursor arrives
- [ ] Bubble flips left near right viewport edge
- [ ] Stays for configured duration per step
- [ ] Loops back to first step
- [ ] Click anywhere stops tour permanently
- [ ] Escape key stops tour permanently
- [ ] No console errors
- [ ] No hydration warnings
- [ ] Disabled on mobile (≤767px)
- [ ] Disabled with `prefers-reduced-motion: reduce`
- [ ] Hidden in print (`@media print`)
- [ ] Production build passes
- [ ] TypeScript strict mode passes
- [ ] Works across all designs (v1-v5) — cursor only targets sections that exist in current design