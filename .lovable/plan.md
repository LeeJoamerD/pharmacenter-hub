

# Fix: PWA Workbox Cache Blocking All Updates

## Root Cause (DEFINITIVE)

The JS bundle is **27 MB**. Workbox's default `maximumFileSizeToCacheInBytes` is **2 MB**. When the service worker tries to precache the new bundle, it silently skips it because it exceeds the size limit. The browser keeps serving the OLD cached bundle (`index-DwXCAMfH.js`). This is why **zero code changes have been visible** for 10+ iterations.

## Fix

### `vite.config.ts` - Add `maximumFileSizeToCacheInBytes` to workbox config

Add one line in the `workbox` object:

```typescript
workbox: {
  skipWaiting: true,
  clientsClaim: true,
  maximumFileSizeToCacheInBytes: 30 * 1024 * 1024, // 30 MB
  cleanupOutdatedCaches: true,
  globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
  ...
}
```

This tells Workbox to accept the 27MB bundle for precaching and to clean up old cached files.

### No changes needed in `ReceptionExcelImport.tsx`
The button code is already correct (lines 2287-2308). It just hasn't been served to the browser yet.

## After deployment
The user will need one hard reload (Ctrl+Shift+R) to pick up the new service worker with the increased size limit. After that, all future updates will auto-apply.

