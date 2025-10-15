# Quick Test Guide for PWA Install Prompt

## Easiest Way to Test Right Now

### 1. Start the dev server
```bash
npm run dev
```

### 2. Open http://localhost:5173 in Chrome

### 3. Open DevTools Console (F12) and run this:

```javascript
// Get the component (it's in app-root's shadow DOM)
const prompt = document.querySelector('app-root').shadowRoot.querySelector('pwa-install-prompt');

// Force it to show (Chrome/Edge UI)
sessionStorage.removeItem('pwa-install-dismissed');
prompt.visible = true;
prompt.isIOS = false;
```

**To test iOS UI:**
```javascript
const prompt = document.querySelector('app-root').shadowRoot.querySelector('pwa-install-prompt');
sessionStorage.removeItem('pwa-install-dismissed');
prompt.visible = true;
prompt.isIOS = true;  // Shows iOS instructions
```

**To hide it:**
```javascript
const prompt = document.querySelector('app-root').shadowRoot.querySelector('pwa-install-prompt');
prompt.visible = false;
```

### 4. To test the REAL install flow (with actual beforeinstallprompt):

```bash
# Build for production
npm run build

# Preview the production build
npm run preview
```

Then visit http://localhost:4173 (or whatever port it shows).

The production build has better service worker support, so the `beforeinstallprompt` event is more likely to fire.

**Note:** The prompt will auto-show after 2 seconds if the browser supports PWA installation.

---

## What to Look For

### Chrome/Edge Version:
- App icon with name "LumaFeed"
- Description text
- "Not now" and "Install" buttons
- Close button (X)
- Material 3 styled card at bottom of screen

### iOS Version:
- Same header with app info
- Instructions box showing:
  - "Tap the Share button" 
  - "Scroll down and tap 'Add to Home Screen'"
- Only close button (no install button, since iOS doesn't support programmatic install)

---

## Troubleshooting

**Component not found?**
```javascript
// It's in app-root's shadow DOM
const appRoot = document.querySelector('app-root');
const prompt = appRoot.shadowRoot.querySelector('pwa-install-prompt');
console.log('Prompt element:', prompt);  // Should return the element
```

**Still not showing after setting visible = true?**
Check the component state:
```javascript
const prompt = document.querySelector('app-root').shadowRoot.querySelector('pwa-install-prompt');
console.log('Visible:', prompt.visible);
console.log('Is iOS:', prompt.isIOS);
console.log('Is Standalone:', prompt.isStandalone);
console.log('Dismissed:', sessionStorage.getItem('pwa-install-dismissed'));
```

**To reset everything:**
```javascript
sessionStorage.clear();
location.reload();
```
