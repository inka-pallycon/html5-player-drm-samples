# Concurrent Stream Limiting (CSL)
-  Sets the interval to renew the DRM license while playback to check the number of concurrent streams per user. The shorter the interval, the more accurate the check. But the DRM service fee may increase due to the high number of license requests.

## Player Manual Setting ( Renewal )
- FairPlay and Playready do not renew when using other players, so you cannot check simultaneous access after the time specified by the console after the initial license is issued.
- Widevine occurs automatically in the DRM ( It's possible in any player )
- Renewal Interval -> Please specify the same as the console. The license server extends the session for a specified amount of time on the console.

|    DRM    |       Manual Setting       | Sample Code                                                          |
|:---------:|:--------------------------:|:---------------------------------------------------------------------|
| Widevine  |  :heavy_multiplication_x:  | [Bitmovin Player](./bitmovin-player/bitmovin-player-pallycon-renewal-sample.html) | 
| PlayReady |     :heavy_check_mark:     | [Bitmovin Player](./bitmovin-player/bitmovin-player-pallycon-renewal-sample.html)  |
| FairPlay  |     :heavy_check_mark:     | [FPS SDK (Safari)](./fps-sdk/fps_safari_hls_key_renewal-sample.html) | 





## TODO List
- Set Renewal Interval


### Widevine
- No Setting


### PlayReady 
- [bitmovin-renewal-sample.js](./bitmovin-player/bitmovin-renewal-sample.js#L10)
```javascript
setTimeout(() => {
    player.drm.renewLicense(licenseId)
}, 600000);  // TODO set Renewal Interval milliseconds ( 10 minute )
```


### FairPlay 
- [fps_safari_support.js](./fps-sdk/fps_safari_support.js#L59)
```javascript
await delay(600000);  // TODO set Renewal Interval milliseconds ( 10 minute )
```

