# DoveRunner Multi-DRM HTML5 Player Samples for Hardware DRM

These sample show how to play streaming content protected by hardware-level DRM in HTML5 players.



## Supported Players

- Shaka
- Video.js
- Bitmovin



## Supported DRM

- Widevine (L1)
- PlayReady (SL3000)
- FairPlay Streaming



## Prerequisites

- Chrome browser (for Widevine L1)
- Windows 10+ with Edge browser (for PlayReady SL3000)
- Safari on MacOS/iOS (for FairPlay Streaming)



## Common requirements

- The content used in the sample is a multi-key content created with [DoveRunner CLI packager](https://doverunner.com/docs/en/multidrm/packaging/cli-packager/), where the SD track and HD track are packaged with different keys. You can set different rules for each track through the [security_policy setting](https://doverunner.com/docs/en/multidrm/license/license-token/#security-policy) in the DoveRunner license token.

  - The content is unencrypted for audio.
  - For Widevine L1, there is currently an issue where license rules are not controlled per track, so the Security Level set to the highest value is applied to all tracks.
- Widevine Hardware DRM settings require video robustness to be set to `HW_SECURE_ALL` and audio robustness to be set to `HW_SECURE_CRYPTO`.
- For the PlayReady SL3000, this is only set in supported environments as there may be unsupported environments.



## Player Features

### Shaka

- Support for setting Hardware DRM key systems using *keySystemsMapping* and *preferredKeySystems*
- For Widevine L1, supported in **4.11.17** and later versions

```javascript
drm: {
    servers: {
        'com.widevine.alpha': licenseUri,
    },
    advanced: {
        'com.widevine.alpha': {
            'persistentStateRequired': true,
            videoRobustness: 'HW_SECURE_ALL',
            audioRobustness: 'HW_SECURE_CRYPTO',
            'serverCertificateUri': widevineCertUri,
        }
    },
    preferredKeySystems: [
        'com.widevine.alpha.experiment',
        'com.widevine.alpha'
    ],
    keySystemsMapping: {
        'com.widevine.alpha': 'com.widevine.alpha.experiment' // Only for Windows Chrome
    }
}
```

### Video.js

- Support through `videojs-contrib-eme` plugin
- For Widevine L1, both the `com.widevine.alpha.experiment` key system and the regular `com.widevine.alpha` key system should be set up.
- For PlayReady SL3000, setting up the `com.microsoft.playready.recommendation.3000` key system requires some modifications to the license request data.

```javascript
keySystems: {
    'com.widevine.alpha.experiment': { // Only for Windows Chrome
        url: licenseUri,
        licenseHeaders:{
            'pallycon-customdata-v2': widevineToken
        },
        persistentState: 'required',
        videoRobustness: 'HW_SECURE_ALL',     
        audioRobustness: 'HW_SECURE_CRYPTO',
    },
    'com.widevine.alpha': {
        url: licenseUri,
        licenseHeaders:{
            'pallycon-customdata-v2': widevineToken
        },
        persistentState: 'required',
    }
}
```

### Bitmovin

- Support for setting Hardware DRM key systems using *keySystemPriority*
- For Widevine L1, supported in **8.196.0** and later versions

```javascript
drm: {
        widevine: {
            LA_URL: licenseUri,
            audioRobustness: "HW_SECURE_CRYPTO", 
            videoRobustness: "HW_SECURE_ALL",
            keySystemPriority: ["com.widevine.alpha.experiment"], // Only for Windows Chrome
            mediaKeySystemConfig: {
                persistentState: 'required',
            },
            serverCertificate: '',
        }
}
```
