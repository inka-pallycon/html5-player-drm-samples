# DoveRunner Multi-DRM HTML5 Player Samples

Play DRM-protected streaming content using various HTML5 players.

## Supported Content & DRM

| Content | DRM | Browser |
|---------|-----|---------|
| MPEG-DASH (CENC) | PlayReady, Widevine | Edge, Chrome, Firefox |
| HLS (FairPlay) | FairPlay Streaming | Safari (macOS 10.10+, iOS) |

## Supported Players

- Shaka Player
- VideoJS
- Bitmovin Player
- THEOplayer
- Radiant Media Player

## Project Structure

```
├── basic/              # Basic DRM playback samples
│   ├── shaka/
│   ├── videojs/
│   ├── bitmovin/
│   ├── theoplayer/
│   └── radiant/
├── advanced/           # Advanced DRM features
│   ├── hardware-drm/   # Widevine L1, PlayReady SL3000
│   ├── csl/            # Concurrent Stream Limiting
│   └── cmcd-v2/        # Common Media Client Data
└── shared/             # Shared helper scripts
```

## Advanced Samples

- [Hardware DRM](advanced/hardware-drm/README.md) - Hardware-level DRM (Widevine L1, PlayReady SL3000)
- [CSL (Concurrent Stream Limiting)](advanced/csl/README.md) - License renewal for concurrent stream control
- [CMCD v2](advanced/cmcd-v2/README.md) - Streaming analytics with Common Media Client Data

## Documentation

Visit [DoveRunner Docs](https://doverunner.com/docs/content-security/multi-drm/clients/html5-player/) for more information.
