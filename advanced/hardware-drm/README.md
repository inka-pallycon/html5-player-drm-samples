# DoveRunner Multi-DRM HTML5 Player Samples for Hardware DRM

Play streaming content protected by hardware-level DRM in HTML5 players.

> **Note:** If hardware DRM is not supported, playback automatically falls back to software DRM (Widevine L3 or PlayReady SL2000).

## Supported DRM

| DRM | Security Level | Browser/Platform |
|-----|----------------|------------------|
| PlayReady | SL3000 | Windows (Edge, Chrome) |
| Widevine | L1 | Chrome, Android |
| FairPlay | - | Safari (macOS, iOS) |

## DRM Priority

**PlayReady SL3000 is now prioritized** over Widevine L1 for better hardware DRM support on Windows Chrome:

```
Detection order:
1. FairPlay (Safari only)
2. PlayReady SL3000 (com.microsoft.playready.recommendation.3000)
3. PlayReady (com.microsoft.playready)
4. Widevine (com.widevine.alpha)
```

## Player Configuration

### Shaka Player

```javascript
// PlayReady SL3000
drm: {
    servers: { 'com.microsoft.playready': licenseUri },
    preferredKeySystems: [
        'com.microsoft.playready.recommendation.3000',
        'com.microsoft.playready.recommendation',
        'com.microsoft.playready'
    ],
    keySystemsMapping: {
        'com.microsoft.playready': 'com.microsoft.playready.recommendation.3000'
    }
}

// Widevine (auto robustness detection)
drm: {
    servers: { 'com.widevine.alpha': licenseUri },
    advanced: {
        'com.widevine.alpha': {
            persistentStateRequired: true,
            videoRobustness: 'HW_SECURE_ALL',
            audioRobustness: 'HW_SECURE_CRYPTO',
            serverCertificateUri: widevineCertUri
        }
    }
}
```

### VideoJS

```javascript
keySystems: {
    // PlayReady SL3000
    'com.microsoft.playready.recommendation.3000': {
        url: licenseUri,
        licenseHeaders: { 'pallycon-customdata-v2': playreadyToken }
    },
    // Widevine
    'com.widevine.alpha': {
        url: licenseUri,
        licenseHeaders: { 'pallycon-customdata-v2': widevineToken },
        persistentState: 'required',
        videoRobustness: 'HW_SECURE_ALL',
        audioRobustness: 'HW_SECURE_CRYPTO'
    }
}
```

### Bitmovin Player

```javascript
drm: {
    playready: {
        LA_URL: licenseUri
    },
    widevine: {
        LA_URL: licenseUri,
        videoRobustness: 'HW_SECURE_ALL',
        audioRobustness: 'HW_SECURE_CRYPTO',
        mediaKeySystemConfig: { persistentState: 'required' }
    }
}
```

## Content Requirements

- Multi-key content with each track encrypted separately
- Audio track is unencrypted
- Security policy per track via [DoveRunner license token](https://docs.doverunner.com/content-security/multi-drm/license/license-token/#security_policy)
