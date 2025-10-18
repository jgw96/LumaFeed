# PWA Install Prompt Updates

## Changes Made

### 1. Mobile-First Bottom Positioning ✅

**Mobile (< 768px):**

- Position: `bottom: 0; left: 0; right: 0;`
- Full-width at the bottom of the screen
- Rounded top corners only (`border-radius: 16px 16px 0 0`)
- Slides up from bottom with shadow above

**Desktop (≥ 768px):**

- Centered with max-width: 400px
- `bottom: 1rem` with margin from edges
- Fully rounded corners (`border-radius: 16px`)
- Positioned above bottom nav

### 2. Maskable Icon ✅

Changed from: `/feedings-65.png`
Changed to: `/maskable_icon_x128.png`

This uses the proper maskable icon from your manifest for better visual consistency across platforms.

## Visual Behavior

### Mobile:

```
┌─────────────────────┐
│                     │
│   Page Content      │
│                     │
├─────────────────────┤ ← Prompt slides up from here
│ [Icon] Install App  │
│ Description text    │
│ [Not now] [Install] │
└─────────────────────┘
```

### Desktop:

```
         Page Content

    ┌─────────────┐ ← Centered, floating
    │ Install App │
    │ [Buttons]   │
    └─────────────┘
        Bottom
```

## Testing

All 9 tests passing ✅
TypeScript checks passing ✅

Test in browser with:

```javascript
const prompt = document.querySelector('app-root').shadowRoot.querySelector('pwa-install-prompt');
sessionStorage.removeItem('pwa-install-dismissed');
prompt.visible = true;
```

## Responsive Behavior

- **Mobile**: Full width, bottom sheet style (similar to native app install prompts)
- **Desktop**: Centered card with shadows, positioned above bottom margin
- **Dark mode**: Updated shadows for both mobile and desktop
