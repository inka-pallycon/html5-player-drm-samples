# Concurrent Stream Limiting (CSL)

License renewal during playback to check concurrent streams per user. Shorter intervals provide more accurate checks but increase license requests.

## Overview

| DRM | Renewal Method | Supported Players |
|-----|----------------|-------------------|
| Widevine | Auto (CDM) | All players |
| PlayReady | Manual | Shaka (5.0+), Bitmovin |
| FairPlay | Manual | Shaka (5.0+), VideoJS, FPS SDK |

> **Note:** Widevine license renewal is handled automatically by the CDM. Manual implementation is only required for FairPlay and PlayReady.

## Shaka Player (5.0+)

Uses the built-in `renewalIntervalSec` configuration and `licenserenewal` event.

```javascript
// Configure license renewal interval
player.configure({
    drm: {
        servers: { [keySystem]: licenseUri },
        renewalIntervalSec: 600  // 10 minutes
    }
});

// Listen for renewal events
player.addEventListener('licenserenewal', (event) => {
    console.log('License renewed:', event);
});
```

**Sample:** [shaka-renewal-sample.js](./shaka/js/shaka-renewal-sample.js)

## Bitmovin Player

Uses `player.drm.renewLicense()` with manual timer for PlayReady.

```javascript
player.on(bitmovin.player.PlayerEvent.DrmLicenseAdded, (event) => {
    const licenseId = event.license.id;
    setTimeout(() => {
        player.drm.renewLicense(licenseId);
    }, 600000);  // 10 minutes
});
```

**Sample:** [bitmovin-renewal-sample.js](./bitmovin/js/bitmovin-renewal-sample.js)

## VideoJS

Uses MediaKeySession update for FairPlay license renewal.

```javascript
const renewalInterval = 600000; // 10 minutes

function startLicenseRenewal(session) {
    setInterval(async () => {
        // Trigger license renewal via session update
    }, renewalInterval);
}
```

**Sample:** [videojs-renewal-sample.js](./videojs/js/videojs-renewal-sample.js)

## FPS SDK (Safari)

Native FairPlay implementation with manual renewal.

```javascript
async function renewLicense() {
    await delay(600000);  // 10 minutes
    // Request new license
}
```

**Sample:** [fps_safari_support.js](./fps-sdk/js/fps_safari_support.js)


