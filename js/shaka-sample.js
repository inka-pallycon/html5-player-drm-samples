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
            }
        };


        player.getNetworkingEngine().registerRequestFilter(function (type, request) {
            if (type == shaka.net.NetworkingEngine.RequestType.LICENSE) {
                const originalPayload = new Uint8Array(request.body);
                const base64Payload = shaka.util.Uint8ArrayUtils.toBase64(originalPayload);
                const params = 'spc=' + encodeURIComponent(base64Payload);

                request.body = shaka.util.StringUtils.toUTF8(params);
                request.headers['pallycon-customdata-v2'] = fairplayToken;
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
                }
            };

            player.getNetworkingEngine().registerRequestFilter(function (type, request) {
                // Only add headers to license requests:
                if (type == shaka.net.NetworkingEngine.RequestType.LICENSE) {
                    console.log("request :" + request.body);
                    request.headers['pallycon-customdata-v2'] = widevineToken;
                }
            });
        } else if ('PlayReady' === drmType) {
            playerConfig = {
                drm: {
                    servers: {
                        'com.microsoft.playready': {
                            serverURL: licenseUri,
                            systemStringPriority: [
                                'com.microsoft.playready.recommendation',
                                'com.microsoft.playready',
                            ],
                        },
                    },
                }
            };

            player.getNetworkingEngine().registerRequestFilter(function (type, request) {
                // Only add headers to license requests:
                if (type == shaka.net.NetworkingEngine.RequestType.LICENSE) {
                    console.log("request :" + request.body);
                    request.headers['pallycon-customdata-v2'] = playreadyToken;
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