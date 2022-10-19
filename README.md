# PallyCon Multi-DRM integration samples for HTML5 Players

These samples show how to play streaming content (DASH or HLS) protected with multi-DRM (PlayReady, Widevine, FairPlay Streaming) using the HTML5 player from the web page of the service site.

1. MPEG-DASH CENC content
- DASH streaming content protected by PlayReady and Widevine DRM encrypted under the Common Encryption standard. Depending on your browser, PlayReady (Edge) or Widevine (Chrome, FireFox) DRM is applied.

2. HLS FPS(FairPlay Streaming) content
- HTTP Live Streaming content encrypted with Sample AES and protected by FairPlay Streaming. Applies to Safari browsers running on Mac OS X (10.10 or later).

3. Widevine Desktop's Unique DeviceId
- To use Widevine CSL, PersistentState must be enabled on the player.
- Add some samples.
- Shaka Player config : ([docs](https://shaka-player-demo.appspot.com/docs/api/shaka.extern.html#.AdvancedDrmConfiguration))
```javascript
'com.widevine.alpha': {
    'persistentStateRequired': true
}
```

- Bitmovin Player config : ([docs](https://bitmovin.com/docs/player/api-reference/web/web-sdk-api-reference-v8#/player/web/8/docs/enums/drm.mediakeysystemconfig.persistentstate.html))
```javascript
widevine: {
    'mediaKeySystemConfig': {
        'persistentState':'required'
    }
}
```

- VideoJS Player config reference : ([github](https://github.com/videojs/videojs-contrib-eme/blob/main/src/eme.js#L64))
```javascript
{
    name: 'com.widevine.alpha',
    options: {
        persistentState: 'required'
    }
}
```


## Extension
- [CSL (Concurrent Stream Limiting)](extension/csl/README.md)
