# PWA Install Prompt Component

A lightweight PWA installation prompt component that shows users they can install the app.

## Features

- 🎨 Material 3 themed design
- 📱 iOS-specific instructions (share button + "Add to Home Screen")
- 💻 Chrome/Edge native install prompt integration
- 🔒 Respects user dismissal (session storage)
- ♿ Accessible with proper ARIA labels
- 🌓 Dark mode support

## Testing Locally

### For Chrome/Edge (beforeinstallprompt event):

1. **Start dev server:**

   ```bash
   npm run dev
   ```

2. **Open in Chrome/Edge:**
   - Navigate to `http://localhost:5173`
   - Open DevTools (F12)

3. **Simulate installability:**

   **Option A - Use DevTools Application Panel:**
   - Go to DevTools → Application tab
   - In the left sidebar, find "Manifest"
   - Click "Update" to reload the manifest
   - Look for a "+ Add to home screen" link or button in the Application panel
   - You should see warnings if the PWA criteria aren't met

   **Option B - Override install state in Console:**

   ```javascript
   // In DevTools Console, manually trigger the prompt to test UI:
   const prompt = document.querySelector('app-root').shadowRoot.querySelector('pwa-install-prompt');
   prompt.visible = true;
   ```

   **Option C - Test with production build:**

   ```bash
   npm run build
   npm run preview
   ```

   Then visit `http://localhost:4173` - the production build meets PWA criteria better.

4. **Check PWA Requirements:**
   The app needs to meet Chrome's installability criteria:
   - ✅ Served over HTTPS (or localhost)
   - ✅ Has a valid manifest.json
   - ✅ Has a registered service worker
   - ✅ Has icons (192px and 512px)
   - ⚠️ **The service worker must control the page** (this may not work in dev mode)

### For iOS/Safari Testing:

1. **Test on actual iOS device or simulator:**
   - Deploy to a test URL (Firebase Hosting, Netlify, etc.)
   - Open in Safari on iOS
   - The prompt will appear after 3 seconds (see `checkInstallability()`)

2. **Test iOS UI locally:**
   ```javascript
   // In DevTools Console:
   const prompt = document.querySelector('app-root').shadowRoot.querySelector('pwa-install-prompt');
   prompt.isIOS = true;
   prompt.visible = true;
   ```

### Quick Manual Testing

Add this button temporarily to your app for easy testing:

```html
<!-- Add to home-page.ts or app-root.ts render method -->
<button
  @click="${this.testPWAPrompt}"
  style="position: fixed; bottom: 200px; right: 20px; z-index: 9999;"
>
  Test PWA Prompt
</button>
```

```typescript
// Add method to show prompt
private testPWAPrompt() {
  const prompt = this.renderRoot.querySelector('pwa-install-prompt') as any;
  if (prompt) {
    sessionStorage.removeItem('pwa-install-dismissed');
    prompt.visible = true;
    prompt.isIOS = false; // or true to test iOS UI
  }
}
```

**Or from the browser console:**

```javascript
// Access from app-root's shadow DOM
const appRoot = document.querySelector('app-root');
const prompt = appRoot.shadowRoot.querySelector('pwa-install-prompt');
sessionStorage.removeItem('pwa-install-dismissed');
prompt.visible = true;
```

### Production Testing

The best way to test the **real** install flow:

1. **Deploy to Firebase Hosting:**

   ```bash
   npm run build
   firebase deploy --only hosting
   ```

2. **Open deployed URL in Chrome:**
   - Wait ~2 seconds
   - The prompt should appear automatically
   - Click "Install" to test the full flow

3. **Test installation:**
   - After installing, the app opens in standalone mode
   - The prompt won't show again (checks `isStandalone`)

### Testing User Dismissal

```javascript
// Clear dismissal to test again:
sessionStorage.removeItem('pwa-install-dismissed');

// Check if dismissed:
sessionStorage.getItem('pwa-install-dismissed'); // 'true' if dismissed
```

## Debugging Tips

### Component not showing?

Check in DevTools Console:

```javascript
const prompt = document.querySelector('app-root').shadowRoot.querySelector('pwa-install-prompt');

// Check component state:
console.log({
  visible: prompt.visible,
  isIOS: prompt.isIOS,
  isStandalone: prompt.isStandalone,
  deferredPrompt: prompt.deferredPrompt,
  dismissed: sessionStorage.getItem('pwa-install-dismissed'),
});

// Force show:
prompt.visible = true;
```

### beforeinstallprompt not firing?

Common issues:

- Service worker not active (check DevTools → Application → Service Workers)
- App already installed
- Not meeting installability criteria
- Using dev server (use `npm run preview` instead)

### Check Service Worker Status:

```javascript
// In DevTools Console:
navigator.serviceWorker.getRegistrations().then((registrations) => {
  console.log('Service Worker registrations:', registrations);
});
```

## Customization

To customize the component, edit `src/components/pwa-install-prompt.ts`:

- **Timing:** Change delays in `checkInstallability()` (currently 2-3 seconds)
- **Text:** Modify `appName`, title, and description in the render methods
- **Icons:** Update `appIcon` path
- **Persistence:** Switch from `sessionStorage` to `localStorage` for permanent dismissal
- **Styling:** Modify the `static styles` CSS

## Events

The component doesn't emit custom events currently, but you can add them:

```typescript
// Example: emit when user installs
this.dispatchEvent(
  new CustomEvent('pwa-installed', {
    bubbles: true,
    composed: true,
    detail: { platform: 'chrome' },
  })
);
```

## Browser Support

- ✅ Chrome/Edge 67+ (native install prompt)
- ✅ iOS Safari 11.3+ (manual instructions)
- ⚠️ Firefox (shows instructions for Android, no desktop support)
- ⚠️ Safari desktop (limited PWA support)
