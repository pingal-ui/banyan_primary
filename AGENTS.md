# Banyan Visual Exploration — Project Notes

## Design & Animation Standards (always active)

All UI work on this project must follow two skill philosophies by default. These are not optional — apply them to every component, interaction, and animation you create or modify.

### Emil Kowalski — Animation principles

- **Animations must have a purpose:** spatial consistency, state feedback, preventing jarring changes. "Looks cool" is not a purpose.
- **Easing:** entering elements use `--ease-out` (starts fast). On-screen motion uses `--ease-in-out`. Sheets/drawers use `--ease-drawer`. Never `ease-in` on UI.
- **Duration:** buttons 100–160ms, tooltips/popovers 125–200ms, sheets/modals 200–300ms. Nothing UI-level exceeds 300ms.
- **Scale from reality:** entering elements start at `scale(0.95)` + `opacity: 0`. Never `scale(0)`.
- **Buttons must feel pressed:** every tappable element needs `transform: scale(0.97)` on `:active` with `transition: transform 160ms ease-out`.
- **Only animate `transform` and `opacity`** for performance. No layout property animations.
- **Hover states must be gated:** `@media (hover: hover) and (pointer: fine)` on all hover transforms.
- **CSS transitions over keyframes** for interruptible UI (rapidly triggered elements like toasts, lists).
- **`prefers-reduced-motion`:** every animation block needs a reduced-motion fallback.
- Use the project's easing variables: `--ease-out`, `--ease-drawer`, `--ease-spring` (defined in `:root`).

### design-taste-frontend — Anti-slop visual standards

Applies to brand/marketing-adjacent surfaces (home hero, onboarding, empty states, promotional cards). Does **not** apply to functional product UI (forms, data tables, settings, transaction lists).

- **Read the brief before generating.** Infer vibe from context — don't default to AI-purple gradients, centered hero over dark mesh, three equal feature cards, or generic glassmorphism.
- **Anti-defaults:** no Inter + slate-900 boilerplate, no infinite micro-animation loops, no symmetric feature-card grids, no gradient text.
- **Motion is intentional:** set a `MOTION_INTENSITY` implicitly — Banyan is premium consumer, so lean 5–7 (purposeful, not cinematic).
- **Composition varies:** not every section uses the same left-text / right-image layout. Break rhythm deliberately.
- **One design read before generating:** state the intended aesthetic direction in one line before writing any markup.

### Impeccable — Product UI standards

- **No `transition: all`** — always specify exact properties.
- **No all-caps body copy** — uppercase only for short labels (≤4 words). `PENDING`, status text, body sentences must be sentence-case.
- **No eyebrow on every section** — uniform small-caps tracked labels on every section is an AI tell. Vary treatment; use size/weight contrast instead.
- **No pipe `|` separators** — use `·` or a `<div>` divider element.
- **Buttons:** verb + object labels. Every interactive element needs default, hover, focus, active, disabled states.
- **Color:** use DS tokens (`var(--brand-primary)`, `var(--text-primary)`, etc.) — never raw hex or rgba when a token exists.
- **Consistent component vocabulary:** same button shape, same icon style, same form control across all screens. If a component looks different in two places, one is wrong.
- **Motion conveys state, not decoration.** Every animation must answer "why does this animate?"
- **No nested cards.**
- **No decorative glassmorphism** — blur/glass is purposeful or absent.

## Asset Pipeline

All image assets must be optimised before use. Never add raw Figma exports or uncompressed PNGs directly.

### Rule: always convert new assets to WebP

When adding any new image asset:

1. **Download** to `assets/` (filename = Figma asset UUID, e.g. `abc123.png`)
2. **Resize** based on display category:
   - Full-phone backgrounds (displayed ≤393px wide) → cap at **800×500**
   - Square avatars / profile photos (1000×1000, displayed ≤108px) → cap at **300×300**
   - Mid-size UI images (displayed ~393px) → cap at **800px** on longest side
   - Already-small images (≤200px original) → keep dimensions
3. **Convert** to WebP at **quality 85, method 6** using Pillow:
   ```python
   img.thumbnail(cap, Image.LANCZOS)
   img.save('assets/uuid.webp', 'WEBP', quality=85, method=6)
   ```
4. **Reference** in HTML as `assets/uuid.webp` (never `.png`)
5. **SVGs** — keep as `.svg`, no conversion needed

### Quick script (single new asset)

```python
from PIL import Image
img = Image.open('assets/UUID.png')
img.thumbnail((800, 800), Image.LANCZOS)
img.save('assets/UUID.webp', 'WEBP', quality=85, method=6)
```

### Benchmark
Original 50 assets: 33MB → 1MB after optimisation (97% reduction).

---

## File Structure

- `transactions.html` — main single-file prototype
- `assets/` — all image assets (WebP + SVG only)
- `assets_cache/` — raw downloaded originals (not referenced by HTML)
