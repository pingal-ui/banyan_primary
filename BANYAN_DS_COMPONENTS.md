# Banyan DS — Component Reference

**Figma file:** `xNm2tReL99n1Y54DIvn8LW`  
**Font:** Geist · Regular = Medium (500) · Emphasized = SemiBold (600)  
**Padding notation:** top / right / bottom / left

---

## Token Quick Reference

| Token | Resolves to | Usage |
|-------|------------|-------|
| `brand/primary` | #46882B | CTA fill, ghost/link label, active controls |
| `brand/primary/dim` | #46882B @40% | Hover/pressed tints |
| `brand/primary/subtle` | #46882B @10% | Backgrounds |
| `text/primary` | #000000 @80% | Body text, filled input values |
| `text/secondary` | #000000 @60% | Placeholder, secondary labels |
| `text/tertiary` | #000000 @40% | Hints, captions |
| `text/disabled` | #000000 @20% | Disabled text |
| `text/inverse` | #FFFFFF | Text on dark/brand fills |
| `surface/overlay` | #FFFFFF @40% | Input / card backgrounds |
| `surface/overlay/md` | #FFFFFF @60% | Elevated surfaces |
| `surface/overlay/lg` | #FFFFFF @10% | Sheet surfaces (with blur) |
| `surface/secondary` | #F1F1F1 | Secondary button fill |
| `surface/subtle` | #000000 @5% | Subtle backgrounds |
| `border/default` | #FFFFFF @60% | Resting input border |
| `border/focus` | #FFFFFF | Focused input border |
| `overlay/scrim` | #000000 @50% | Modal backdrop |
| `neutral/black/20` | #000000 @20% | Sheet handle, disabled fills |
| `neutral/white/100` | #FFFFFF | Thumb, inverse fill |
| `semantic/error` | #C82C2C | Error state |
| `semantic/success` | #32B450 | Success state |
| `semantic/warning` | #C17C14 | Warning state |

---

## 1. Button

**Page:** Buttons · **Component set:** `Button` · **360 variants**

### Properties

| Property | Options |
|----------|---------|
| Variant | Primary · Secondary · Dashed |
| State | Default · Pressed · Disabled |
| Size | XL · Large · Medium · Small · XSmall |
| Icon | None · Leading · Trailing · Icon Only |

### Sizing

| Size | Height | H-padding | V-padding | Gap | Label style | Icon size |
|------|--------|-----------|-----------|-----|-------------|-----------|
| XL | 60px | 24px | 20px | 8px | Body/L/Emphasized | 20px |
| Large | 50px | 20px | 15px | 6px | Body/M/Emphasized | 16px |
| Medium | 44px | 16px | 13px | 6px | Body/S/Emphasized | 16px |
| Small | 34px | 12px | 9px | 4px | Body/S/Regular | 14px |
| XSmall | 28px | 10px | 7px | 4px | 11pt Geist Medium | 12px |

**Corner radius:** `radius/full` (999px — pill)  
**Width:** HUG content by default

### Token map by state & variant

| Layer | Primary Default | Primary Pressed | Primary Disabled | Secondary Default | Dashed Default |
|-------|----------------|-----------------|------------------|-------------------|----------------|
| Container fill | `brand/primary` | `brand/primary/dim` | `brand/primary/dim` | `surface/secondary` | none |
| Container blur | — | — | — | 12px `BACKGROUND_BLUR` | — |
| Container stroke | — | — | — | — | `brand/primary` 1px dashed |
| Label color | `text/inverse` | `text/inverse` | `surface/overlay` | `text/primary` | `text/secondary` |
| Icon color | `text/inverse` | `text/inverse` | `surface/overlay` | `text/primary` | `text/secondary` |

### Anatomy

```
Button (COMPONENT, cornerRadius=999)
└── Content (FRAME, HORIZONTAL, HUG×HUG, gap=N)
    ├── [Icon] (INSTANCE, N×N)            ← Leading only
    ├── Button Label (TEXT)
    └── [Icon] (INSTANCE, N×N)            ← Trailing only

Icon Only:
Button (COMPONENT, cornerRadius=999, pad=20)
└── Content (FRAME)
    └── Icon (INSTANCE, N×N)
```

### Usage notes

- Width stretches to `FILL` when placed inside a full-width auto-layout (e.g. form footer).
- Dashed variant is for secondary destructive or placeholder actions.
- Never use Primary on a brand-coloured background — use Secondary or Ghost there.

---

## 2. Ghost Button

**Page:** Buttons · **Component set:** `Ghost Button` · **180 variants**

### Properties

| Property | Options |
|----------|---------|
| Variant | Primary · Secondary · Destructive |
| State | Default · Pressed · Disabled |
| Size | XL · Large · Medium · Small · XSmall |
| Icon | None · Leading · Trailing · Icon Only |

> ⚠️ Size order in Figma property panel needs manual reordering to: XL → Large → Medium → Small → XSmall

### Sizing

| Size | Height | H-padding | V-padding | Gap | Label style | Icon (Leading/Trailing) | Icon Only |
|------|--------|-----------|-----------|-----|-------------|------------------------|-----------|
| XL | 60px | 24px | 20px | 8px | Body/L/Emphasized | 20px | 32px |
| Large | 50px | 20px | 15px | 6px | Body/M/Emphasized | 16px | 24px |
| Medium | 44px | 16px | 13px | 6px | Body/S/Emphasized | 16px | 20px |
| Small | 34px | 12px | 9px | 6px | Body/S/Regular | 14px | 16px |
| XSmall | 28px | 10px | 7px | 6px | 11pt Geist Medium | 12px | 16px |

**Corner radius:** 0 (no background, no radius needed)  
**No fill or background** on container.

### Token map by variant

| Layer | Primary | Secondary | Destructive |
|-------|---------|-----------|-------------|
| Label color | `brand/primary` | `text/primary` | `semantic/error` |
| Icon color | `brand/primary` | `text/primary` | `semantic/error` |

**Disabled state (all variants):** label remains `brand/primary` but component opacity drops (system-level disabled).

### Anatomy

```
Ghost Button (COMPONENT, no fill, no radius)
└── Content (FRAME, HORIZONTAL, HUG×HUG, gap=N)
    ├── [Icon] (INSTANCE)                 ← Leading/Trailing
    └── Label (TEXT)
```

---

## 3. Link Button

**Page:** Buttons · **Component set:** `Link` · **180 variants**

Identical sizing, padding, and gap to Ghost Button. No underline in default state.

### Token map

| Layer | All variants |
|-------|-------------|
| Label color | `brand/primary` |
| Icon color | `brand/primary` |

### Properties

Same as Ghost Button: Variant (Primary · Secondary · Destructive) × State × Size × Icon.

---

## 4. Toggle

**Page:** Controls · **Component set:** `Toggle` · **12 variants**

### Properties

| Property | Options |
|----------|---------|
| Size | SM · MD · LG |
| State | Off · On |
| Disabled | False · True |

### Sizing

| Size | Width | Height | Thumb diameter | Thumb offset (on) |
|------|-------|--------|---------------|-------------------|
| LG | 60px | 36px | 32px | right-aligned |
| MD | 51px | 31px | 27px | right-aligned |
| SM | ~42px | ~26px | ~22px | right-aligned |

### Anatomy & tokens

```
Toggle (COMPONENT)
├── Track (RECTANGLE, cornerRadius=9999)
│   ├── Off fill  → neutral/black/20
│   └── On fill   → brand/green/500
└── Thumb (ELLIPSE)
    └── fill      → neutral/white/100
```

### State behaviour

| State | Track fill | Thumb |
|-------|-----------|-------|
| Off / enabled | `neutral/black/20` | `neutral/white/100` |
| On / enabled | `brand/green/500` | `neutral/white/100` |
| Off / disabled | `neutral/black/20` (+ component opacity) | `neutral/white/100` |
| On / disabled | `brand/green/500` (+ component opacity) | `neutral/white/100` |

---

## 5. Radio Button

**Page:** Controls · **Component set:** `Radio Button` · **12 variants**

### Properties

| Property | Options / Type |
|----------|---------------|
| Size | SM · MD · LG |
| State | Unselected · Selected |
| Disabled | False · True |
| Label | Boolean (show/hide) |
| Subtext | Boolean (show/hide) |
| Label Text | Text override |
| Subtext Text | Text override |

### Sizing (control element only)

| Size | Control diameter | Component height |
|------|-----------------|-----------------|
| LG | 20px | 25px |
| MD | 17px | 22px |
| SM | 14px | ~18px |

### Anatomy & tokens

```
Radio Button (COMPONENT, HORIZONTAL, gap=8)
├── Control Wrapper (FRAME, HORIZONTAL)
│   └── Control (FRAME, 20×20)
│       ├── Outer (ELLIPSE)
│       │   ├── Unselected: fill=transparent, stroke=neutral/black/20 2px
│       │   └── Selected:   fill=brand/green/500, stroke=brand/green/500 2px
│       └── Dot (ELLIPSE) [Selected only]
│           └── fill → neutral/white/100
└── Text Stack (FRAME, VERTICAL, gap=4)
    ├── Label (TEXT)   → neutral/black/100 · Body/M/Regular
    └── Subtext (TEXT) → neutral/black/60  · Body/S/Regular
```

### State behaviour

| State | Outer fill | Outer stroke | Dot |
|-------|-----------|--------------|-----|
| Unselected / enabled | transparent | `neutral/black/20` 2px | hidden |
| Unselected / disabled | transparent | `neutral/black/20` 2px (+ opacity) | hidden |
| Selected / enabled | `brand/green/500` | `brand/green/500` 2px | `neutral/white/100` |
| Selected / disabled | `brand/green/500` (+ opacity) | `brand/green/500` 2px | `neutral/white/100` |

---

## 6. Checkbox

**Page:** Controls · **Component set:** `Checkbox` · **12 variants**

Same property structure as Radio Button. Control is a **square with rounded corners** instead of a circle.

### Anatomy & tokens

```
Checkbox (COMPONENT, HORIZONTAL, gap=8)
├── Control Wrapper
│   └── Control (FRAME)
│       └── Box (RECTANGLE, radius=4)
│           ├── Unselected: fill=transparent, stroke=neutral/black/20 2px
│           └── Checked:    fill=brand/green/500, stroke=brand/green/500 2px
│               + Checkmark icon → neutral/white/100
└── Text Stack
    ├── Label  → neutral/black/100
    └── Subtext → neutral/black/60
```

---

## 7. Input

**Page:** Inputs · **Component set:** `Input` · **224 variants**

### Properties

| Property | Options |
|----------|---------|
| State | Default · Focused · Filled · Disabled · Error · Success · Loading |
| Size | XL · Large · Medium · Small |
| Leading Icon | false · true |
| Trailing Icon | false · true |
| Help Text | false · true |

### Sizing (container)

| Size | Height | V-padding | H-padding |
|------|--------|-----------|-----------|
| XL | 60px | 19px | 16px |
| Large | 52px | 15px | 16px |
| Medium | 44px | 11px | 12px |
| Small | 36px | 8px | 12px |

**Corner radius:** 12px (`radius/md`)  
**Width:** 345px default (FILL in context)

### Token map by state

| Layer | Default | Focused | Filled | Disabled | Error | Success |
|-------|---------|---------|--------|----------|-------|---------|
| Container fill | `surface/overlay` | `surface/overlay` | `surface/overlay` | `surface/overlay` | `surface/overlay` | `surface/overlay` |
| Container stroke | `border/default` 0.5px | `border/focus` 1.5px | `border/default` 0.5px | `border/default` 0.5px | `semantic/error` 1px | `semantic/success` 1px |
| Label / placeholder | `text/secondary` | `text/secondary` | `text/primary` | `text/disabled` | `text/secondary` | `text/secondary` |
| Help text | `text/secondary` | `text/secondary` | `text/secondary` | `text/disabled` | `semantic/error` | `semantic/success` |
| Help icon | `text/secondary` | `text/secondary` | `text/secondary` | `text/disabled` | `semantic/error` | `semantic/success` |
| Leading icon | `text/secondary` | `text/primary` | `text/primary` | `text/disabled` | `text/secondary` | `text/secondary` |
| Trailing icon | `text/secondary` | `text/secondary` | `text/secondary` | `text/disabled` | `semantic/error` | `semantic/success` |

### Anatomy

```
Input (COMPONENT, VERTICAL, gap=4)
├── Input (FRAME, HORIZONTAL, pad=19/16/19/16, gap=8, radius=12)
│   ├── [Leading Icon] (INSTANCE, 20×20)    ← if Leading Icon=true
│   ├── Text Area (FRAME, VERTICAL, gap=2, FILL×HUG)
│   │   ├── [Field Label] (TEXT)            ← if label exists
│   │   └── Label (TEXT)                   ← placeholder / value
│   └── [Trailing Icon] (INSTANCE, 20×20)   ← if Trailing Icon=true
└── [Message] (FRAME, HORIZONTAL, pad=0/0/0/16, gap=4)  ← if Help Text=true
    ├── Icon (INSTANCE, 12×12)
    └── Help Text (TEXT)
```

---

## 8. Textarea

**Page:** Inputs · **Component set:** `Textarea` · **24 variants**

### Properties

| Property | Options |
|----------|---------|
| State | Default · Focused · Filled · Disabled · Error · Success |
| Size | Large · Medium |
| Help Text | false · true |

### Sizing

| Size | Height | Padding |
|------|--------|---------|
| Large | 120px | 16px all sides |
| Medium | 88px | 12px all sides |

**Corner radius:** 12px · **Width:** 345px

### Token map (same logic as Input)

| Layer | Default | Focused | Error |
|-------|---------|---------|-------|
| Container fill | `surface/overlay` | `surface/overlay` | `surface/overlay` |
| Container stroke | `border/default` 0.5px | `border/focus` 1.5px | `semantic/error` 1px |
| Placeholder text | `text/secondary` | `text/secondary` | `text/secondary` |

### Anatomy

```
Textarea (COMPONENT, VERTICAL, gap=4)
├── Textarea Field (FRAME, VERTICAL, pad=16/16/16/16, radius=12)
│   └── Placeholder (TEXT)
└── [Message] (FRAME, HORIZONTAL, pad=0/0/0/16, gap=4)
    ├── Icon (INSTANCE, 12×12)
    └── Help Text (TEXT)
```

---

## 9. Heading

**Page:** Heading · **Component set:** `Heading` · **6 variants**

### Properties

| Property | Options |
|----------|---------|
| Type | Centred · Left Aligned · Text Only Centre · Text Only Left |
| Title | Yes · No |
| Left Button 1 | Instance swap |
| Left Button 2 | Instance swap |
| Right Button 1 | Instance swap |
| Right Button 2 | Instance swap |

### Sizing

| Type | Width | Height |
|------|-------|--------|
| Centred / Left Aligned (with buttons) | 390px | 60px |
| Text Only Centre / Text Only Left | 390px | 38px |

**Vertical padding:** 8px top, 8px bottom  
**Horizontal padding:** Centred = 0px; Left Aligned / Text Only = 20px left

### Anatomy

```
Heading (COMPONENT, HORIZONTAL, 390px wide, pad=8/0/8/0 or 8/0/8/20)
├── [Left Buttons] (FRAME, HORIZONTAL, gap=8)
│   ├── Left Button 1 (INSTANCE — Medium Ghost, h=44)
│   └── Left Button 2 (INSTANCE — Medium Ghost, h=44)
├── [Title] (TEXT, Body/L/Emphasized, color=neutral/black/100)
└── [Right Buttons] (FRAME, HORIZONTAL, gap=8)
    ├── Right Button 1 (INSTANCE — Medium Ghost, h=44)
    └── Right Button 2 (INSTANCE — Medium Ghost, h=44)
```

### Token map

| Layer | Token |
|-------|-------|
| Title text | `neutral/black/100` |
| Button labels | via Ghost Button → `brand/primary` |

### Usage notes

- Left buttons visible only on Centred and Left Aligned types.
- Title hidden when `Title=No`.
- Buttons are Medium Ghost (44px tall), swappable via instance override.

---

## 10. Card

**Page:** Card · **Component set:** `Card` · **8 variants**

### Properties

| Property | Options |
|----------|---------|
| Style | Default · Elevated · Outlined · Ghost |
| Media | No · Yes |

### Sizing

**Width:** 320px · **Height:** 167px (no media) / larger with media

### Token map by style

| Style | Fill | Stroke | Effect |
|-------|------|--------|--------|
| Default | `neutral/white/100` | — | DROP_SHADOW radius=4 |
| Elevated | `neutral/white/100` | — | DROP_SHADOW (stronger) |
| Outlined | `neutral/white/100` | `border/default` 1px | — |
| Ghost | transparent | — | — |

**Corner radius:** 12px (`radius/md`)

### Anatomy

```
Card (COMPONENT, VERTICAL, radius=12, DROP_SHADOW)
├── Heading (INSTANCE — Heading component, Left Aligned)
│   └── Title → neutral/black/100 · Body/M/Emphasized
└── [Content Frame] (FRAME, VERTICAL, pad=0/20/20/20, gap=8)
    └── [slot for body content]
```

---

## 11. Bottom Nav

**Page:** Navigation · **Component set:** `Bottom Nav` · **8 variants**

### Properties

| Property | Options |
|----------|---------|
| AI Mode | Off · On |
| Selected | Home · Pay · Accounts · Explore |

### Sizing

**Width:** 390px · **Height:** ~84px (includes safe area padding)

### Icon map

| Tab | Inactive icon | Selected icon |
|-----|--------------|---------------|
| Home | House (Outlined) | House (Filled) |
| Pay | ArrowFatLinesUp (Outlined) | ArrowFatLinesUp (Filled) |
| Accounts | Bank (Outlined) | Bank (Filled) |
| Explore | GridFour (Outlined) | GridFour (Filled) |

### Token map

| Element | Inactive | Selected |
|---------|----------|----------|
| Icon fill | `text/tertiary` | `brand/primary` |
| Label text | `text/tertiary` | `brand/primary` |
| Label style | `Body/XS/Regular` | `Body/XS/Emphasized` |

### Anatomy

```
Bottom Nav (COMPONENT, HORIZONTAL, space-between, 390×84)
└── Tab × 4 (FRAME, VERTICAL, HUG, gap=4, centered)
    ├── Icon (INSTANCE, 24×24)
    └── Label (TEXT, Body/XS/Regular or Emphasized)
```

---

## 12. Action Sheet

**Page:** Sheets · **Component set:** `Action Sheet` · **3 variants**

### Properties

| Property | Options |
|----------|---------|
| Title | No · Yes |
| Cancel | True · False |

> Note: `Title=Yes, Cancel=False` is not rendered — 3 variants total, not 4.

### Anatomy

```
Action Sheet (COMPONENT, VERTICAL, 390×844)
├── Overlay (RECTANGLE, 390×844)
│   └── fill → overlay/scrim  (#000 @50%)
└── Sheet (FRAME, VERTICAL, HUG height, bottom-pinned)
    ├── fill      → surface/overlay/lg  (#FFF @10%)
    ├── blur      → BACKGROUND_BLUR 24px
    ├── radius    → 20px top-left, 20px top-right
    ├── padding   → 12 / 16 / 32 / 16
    ├── gap       → 8px
    ├── Handle Row (FRAME, VERTICAL, FILL×16px, centered)
    │   └── Handle (RECTANGLE, 36×5, radius=999)
    │       └── fill → neutral/black/20
    └── Content (FRAME, VERTICAL, FILL×HUG)
        ├── [Action list frame] (FRAME, VERTICAL, radius=12)
        │   ├── fill → neutral/white/100
        │   └── Action rows (Ghost Buttons, full-width, separated by dividers)
        └── [Cancel button] (Ghost Button, Destructive, full-width) ← if Cancel=True
```

### State variants

| Variant | Title row | Cancel button |
|---------|-----------|---------------|
| Title=No, Cancel=True | Hidden | Shown |
| Title=Yes, Cancel=True | Shown | Shown |
| Title=No, Cancel=False | Hidden | Hidden |

### Usage notes

- The 390×844 frame is a full-screen container. The Sheet frame sits at the bottom via absolute positioning (y = 844 - sheet.height).
- The Overlay dims the content behind. On implementation, pair with a tap-to-dismiss gesture on the Overlay.
- Sheet height is HUG — it grows with content.

---

## Appendix A — Text Style Reference

| Style | Size | Weight | LH | LS | Case |
|-------|------|--------|----|----|------|
| Large Title/Emphasized | 34pt | Bold | 41px | -5% | Normal |
| Large Title/Regular | 34pt | Medium | 41px | -5% | Normal |
| Title 1/Emphasized | 28pt | Bold | 34px | -5% | Normal |
| Title 1/Regular | 28pt | Medium | 34px | -5% | Normal |
| Title 2/Emphasized | 24pt | SemiBold | auto | 0% | Normal |
| Title 2/Regular | 24pt | Medium | auto | 0% | Normal |
| Title 3/Emphasized | 20pt | SemiBold | 25px | -5% | Normal |
| Title 3/Medium | 20pt | Medium | auto | 0% | Normal |
| Title 3/Regular | 20pt | Medium | 25px | -5% | Normal |
| Body/L/Emphasized | 17pt | SemiBold | 22px | 0 | Normal |
| Body/L/Regular | 17pt | Medium | 22px | 0 | Normal |
| Body/M/Emphasized | 15pt | SemiBold | 20px | 0 | Normal |
| Body/M/Regular | 15pt | Medium | 20px | 0 | Normal |
| Body/S/Emphasized | 13pt | SemiBold | 18px | 0 | Normal |
| Body/S/Regular | 13pt | Medium | 18px | 0 | Normal |
| Body/XS/Emphasized | 11pt | SemiBold | 16px | 0 | Normal |
| Body/XS/Regular | 11pt | Medium | 16px | 0 | Normal |
| Caption/M | 11pt | SemiBold | 13px | 1px | UPPER |
| Caption/S | 10pt | SemiBold | 14px | 1px | UPPER |
| Caption/XS | 8pt | SemiBold | 11px | 1px | UPPER |

---

## Appendix B — Radius Scale

| Token | Value | Common use |
|-------|-------|-----------|
| `radius/2xs` | 2px | Tags, chips |
| `radius/xs` | 4px | Small elements |
| `radius/sm` | 8px | Inputs (tight), list rows |
| `radius/md` | 12px | Inputs, cards, modals |
| `radius/lg` | 16px | Large cards |
| `radius/xl` | 20px | Sheet top corners |
| `radius/2xl` | 24px | — |
| `radius/3xl` | 32px | — |
| `radius/4xl` | 40px | — |
| `radius/full` | 9999px | Buttons (pill), toggles, handles |

---

## Appendix C — Figma Component IDs

| Component | Set ID | Page |
|-----------|--------|------|
| Button | `6:1467` | Buttons |
| Ghost Button | *(Ghost Button set)* | Buttons |
| Link | *(Link set)* | Buttons |
| Toggle | `401:64` | Controls |
| Radio Button | `404:105` | Controls |
| Input | `37:1539` | Inputs |
| Textarea | `37:1672` | Inputs |
| Heading | `444:280` | Heading |
| Card | *(Card set)* | Card |
| Bottom Nav | `79:187` | Navigation |
| Action Sheet | `211:66` | Sheets |

---

## Appendix D — Builder Rules

1. **Always bind colours to tokens** — never use hex directly. If a token doesn't exist for your use case, create one in the `Tokens` collection pointing to a `Primitives` value.
2. **Pill buttons** — set `cornerRadius = 999`. Figma auto-clamps to half height.
3. **Glass surfaces** — use `surface/overlay/lg` fill + `BACKGROUND_BLUR` effect at 24px.
4. **Secondary buttons** — use `surface/secondary` fill + `BACKGROUND_BLUR` at 12px.
5. **Input border weight changes with state** — Default = 0.5px, Focused = 1.5px, Error/Success = 1px.
6. **Ghost Button icon sizing** — text+icon variants match Button icon sizes; icon-only variants are one step larger.
7. **Caption vs Body/XS** — both are 11pt. Use `Caption/M` for labels/tags/eyebrows (UPPERCASE, 1px LS). Use `Body/XS` for small body copy (normal case).
8. **Selected state icons** — always use Filled Phosphor variant. Inactive state uses Outlined.
9. **Heading buttons** — always Medium Ghost (44px tall). Do not substitute Small Ghost.
10. **Sheet overlay** — use `overlay/scrim` (`neutral/black/50`) for modal backdrops, not a raw hex or opacity on a black fill.
