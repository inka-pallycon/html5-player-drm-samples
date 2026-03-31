# CMCD v2 (Common Media Client Data)

These samples demonstrate CMCD v2 event mode data transmission with DRM support using various HTML5 players.

CMCD (Common Media Client Data) is a specification that enables media players to communicate playback metrics and other relevant data to CDNs and analytics services for improved streaming quality monitoring.


## Supported Players

- [Shaka Player](./shaka/)
- [VideoJS](./videojs/)
- [HLS.js](./hlsjs/)


## Features

### CMCD v2 Event Mode

- JSON batch reporting to a configurable endpoint
- Batch configuration:
  - Batch Size: 100 events
  - Batch Timer: 30 seconds
  - Time Interval: 10 seconds

### Custom Data Transmission

The following custom data fields are transmitted via JSON body:

| Field | Description |
|-------|-------------|
| `com.doverunner.device-id` | Unique device identifier (UUID, persisted in localStorage) |
| `com.doverunner.player.device-type` | Device type (windows, mac, linux, android, ios) |
| `com.doverunner.player.browser-type` | Browser name (Chrome, Safari, Firefox, Edge) |
| `com.doverunner.drm-auth-data` | DRM authentication data |
| `com.doverunner.drm-license-requested-count` | Number of license requests |
| `com.doverunner.drm-license-latency-N` | License request latency (dynamic) |
| `com.doverunner.drm-error-code-N` | DRM error codes (dynamic) |
| `com.doverunner.drm-server-response-code-N` | Server response codes (dynamic) |


## Implementation

### Shaka Player

Uses a custom event mode plugin that hooks into Shaka's network request filter.

- Plugin: [eventModePlugin.js](./shaka/lib/eventModePlugin.js)
- Sample: [shaka-eventmode-sample.js](./shaka/js/shaka-eventmode-sample.js)

```javascript
// Enable CMCD v2 event mode
enableEventMode(player, {
    url: cmcdReportingUrl,
    mode: 'json',
    batchSize: 100,
    batchTimer: 30,
    timeInterval: 10
});
```

### VideoJS

Uses a custom CMCD plugin that integrates with VideoJS's XHR hooks.

- Plugin: [videojs-cmcd.js](./videojs/lib/videojs-cmcd.js)
- Sample: [videojs-eventmode-sample.js](./videojs/js/videojs-eventmode-sample.js)

```javascript
// Enable CMCD v2 plugin
player.cmcd({
    url: cmcdReportingUrl,
    mode: 'json',
    batchSize: 100,
    batchTimer: 30
});
```

### HLS.js

Uses a custom CMCD v2 plugin with fetch override for network interception.

- Plugin: [cmcdV2Plugin.js](./hlsjs/lib/cmcdV2Plugin.js)
- Sample: [hlsjs-eventmode-sample.js](./hlsjs/js/hlsjs-eventmode-sample.js)

```javascript
// Enable CMCD v2 plugin
const cmcdPlugin = new CmcdV2Plugin(hls, {
    url: cmcdReportingUrl,
    mode: 'json',
    batchSize: 100,
    batchTimer: 30
});
```


## Shared Utilities

Common utility functions are located in [shared/js/cmcd-utilities.js](./shared/js/cmcd-utilities.js).

- Device ID generation (UUID)
- Browser type detection
- DRM metrics collection
