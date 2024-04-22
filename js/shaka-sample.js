function initApp() {
    // Install built-in polyfills to patch browser incompatibilities.
    shaka.polyfill.installAll();

    // Check to see if the browser supports the basic APIs Shaka needs.
    if (shaka.Player.isBrowserSupported()) {
        // Everything looks good!
        checkSupportedDRM().then(()=> {
            checkBrowser();
            initPlayer();
        })

    } else {
        // This browser does not have the minimum set of APIs we need.
        console.error('Browser not supported!');
    }
}

function initPlayer() {
    let contentUri, playerConfig = {};
    // Create a Player instance.
    const video = document.getElementById('my-player');
    let player = new shaka.Player(video);

    // Attach player to the window to make it easy to access in the JS console.
    window.player = player;

    // Listen for error events.
    player.addEventListener('error', onErrorEvent);

    if ('FairPlay' === drmType) {
        contentUri = hlsUri;
        const fairplayCert = getFairplayCert();

        playerConfig = {
            drm: {
                servers: {
                    'com.apple.fps': licenseUri
                },
                advanced: {
                    'com.apple.fps': {
                        serverCertificate: fairplayCert
                    }
                }
            },
            streaming: {
                autoLowLatencyMode: true,
            },
        };


        player.getNetworkingEngine().registerRequestFilter(function (type, request) {
            if (type == shaka.net.NetworkingEngine.RequestType.LICENSE) {
                const originalPayload = new Uint8Array(request.body);
                const base64Payload = shaka.util.Uint8ArrayUtils.toBase64(originalPayload);
                const params = 'spc=' + encodeURIComponent(base64Payload);

                request.body = shaka.util.StringUtils.toUTF8(params);
                request.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                setCustomData(request);
            }
        });

        player.getNetworkingEngine().registerResponseFilter(function (type, response) {
            // Alias some utilities provided by the library.
            if (type == shaka.net.NetworkingEngine.RequestType.LICENSE) {
                const responseText = shaka.util.StringUtils.fromUTF8(response.data).trim();
                response.data = shaka.util.Uint8ArrayUtils.fromBase64(responseText).buffer;
                parsingResponse(response);
            }
        });
    } else {
        contentUri = dashUri;

        if ('Widevine' === drmType) {
            playerConfig = {
                drm: {
                    servers: {
                        'com.widevine.alpha': licenseUri,
                    },
                    advanced: {
                        'com.widevine.alpha': {
                            'persistentStateRequired': true
                        }
                    }
                },
                streaming: {
                    autoLowLatencyMode: true,
                },
            };

            player.getNetworkingEngine().registerRequestFilter(function (type, request) {
                // Only add headers to license requests:
                if (type == shaka.net.NetworkingEngine.RequestType.LICENSE) {
                    console.log("request :" + request.body);
                    setCustomData(request);
                }
            });
        } else if ('PlayReady' === drmType) {
            playerConfig = {
                drm: {
                    servers: {
                        'com.microsoft.playready.recommendation':
                        licenseUri,
                    },
                    preferredKeySystems: [
                        'com.microsoft.playready.recommendation.3000',
                        'com.microsoft.playready.recommendation',
                        'com.microsoft.playready',
                    ],
                    keySystemsMapping: {
                        'com.microsoft.playready':
                            'com.microsoft.playready.recommendation.3000',
                    },
                },
                manifest: {
                    dash: {
                        keySystemsByURI: {
                            'urn:uuid:9a04f079-9840-4286-ab92-e65be0885f95':
                                'com.microsoft.playready.recommendation',
                            'urn:uuid:79f0049a-4098-8642-ab92-e65be0885f95':
                                'com.microsoft.playready.recommendation',
                        },
                    },
                },
                streaming: {
                    autoLowLatencyMode: true,
                },
            };

            player.getNetworkingEngine().registerRequestFilter(function (type, request) {
                // Only add headers to license requests:
                if (type == shaka.net.NetworkingEngine.RequestType.LICENSE) {
                    console.log("request :" + request.body);
                    setCustomData(request);
                }
            });

        };

        player.getNetworkingEngine().registerResponseFilter(function (type, response) {
            // Alias some utilities provided by the library.
            if (type == shaka.net.NetworkingEngine.RequestType.LICENSE) {
                parsingResponse(response);
            }
        });
    }

        // This is caption option.
        player.setTextTrackVisibility(true);

        // Try to load a manifest.
        // This is an asynchronous process.
        player.load(contentUri).then(function () {
            // This runs if the asynchronous load is successful.
            console.log('The video has now been loaded!');
        }).catch(function(e){onError(e); console.log(contentUri)}); // onError is executed if the asynchronous load fails.

        player.configure(playerConfig);

}

// If You Use Token Reset During Playback Suck As CSL or KeyRotation or AirPlay,
// Continue to create new tokens and Set them.
function setCustomData(request) {
    if ('Widevine' === drmType) {
        // const newWidevineToken = '';
        // setWidevineToken(newWidevineToken);
        request.headers['pallycon-customdata-v2'] = widevineToken;
    }
    else if ('PlayReady' === drmType) {
        // const newPlayReadyToken = '';
        // setPlayReadyToken(newPlayReadyToken);
        request.headers['pallycon-customdata-v2'] = playreadyToken;
    }
    else if ('FairPlay' === drmType) {
        // const newFairPlayToken = '';
        // setFairPlayToken(newFairPlayToken);
        request.headers['pallycon-customdata-v2'] = fairplayToken;
    }
}

function parsingResponse(response) {
    let responseText = arrayBufferToString(response.data);
    // Trim whitespace.
    responseText = responseText.trim();

    console.log('responseText :: ', responseText);

    try {
        const pallyconObj = JSON.parse(responseText);
        if (pallyconObj && pallyconObj.errorCode && pallyconObj.message) {
            if ("8002" != errorCode) {
                alert("PallyCon Error : " + pallyconObj.message + "(" + pallyconObj.errorCode + ")");
                //window.alert('No Rights. Server Response ' + responseText);
            } else {
                var errorObj = JSON.parse(pallyconObj.message);
                alert("Error : " + errorObj.MESSAGE + "(" + errorObj.ERROR + ")");
            }
        }
    } catch (e) {}
}

function onErrorEvent(event) {
    // Extract the shaka.util.Error object from the event.
    console.error('Error code', event.detail.code, 'object', event.detail);
    onError(event.detail);
}

function onError(error) {
    // Log the error.
    console.error('Error code', error.code, 'object', error);
}

document.addEventListener('DOMContentLoaded', initApp);
