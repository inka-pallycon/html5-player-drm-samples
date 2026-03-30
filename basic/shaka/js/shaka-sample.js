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

async function initPlayer() {
    let contentUri, playerConfig = {};
    // Create a Player instance.
    const video = document.getElementById('my-player');
    let player = new shaka.Player(video);

    // Attach player to the window to make it easy to access in the JS console.
    window.player = player;

    // Listen for error events.
    player.addEventListener('error', onErrorEvent);

    if ('FairPlay' === activeDrm.type) {
        contentUri = hlsUri;
        const fairplayCert = getFairplayCert();

        playerConfig = {
            drm: {
                servers: {
                    [activeDrm.keySystem]: licenseUri
                },
                advanced: {
                    [activeDrm.keySystem]: {
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

        if ('Widevine' === activeDrm.type) {
            playerConfig = {
                drm: {
                    servers: {
                        [activeDrm.keySystem]: licenseUri,
                    },
                    advanced: {
                        [activeDrm.keySystem]: {
                            'persistentStateRequired': true,
                            'serverCertificateUri': widevineCertUri,
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
        } else if ('PlayReady' === activeDrm.type) {
            playerConfig = {
                drm: {
                    servers: {
                        'com.microsoft.playready': licenseUri,
                    },
                },
                streaming: {
                    autoLowLatencyMode: true,
                },
            };

            if (activeDrm.keySystem === 'com.microsoft.playready.recommendation.3000') {
                playerConfig.drm.preferredKeySystems = [
                    'com.microsoft.playready.recommendation.3000',
                    'com.microsoft.playready.recommendation',
                    'com.microsoft.playready',
                ];
                playerConfig.drm.keySystemsMapping = {
                    'com.microsoft.playready': 'com.microsoft.playready.recommendation.3000',
                };
            }

            player.getNetworkingEngine().registerRequestFilter(function (type, request) {
                // Only add headers to license requests:
                if (type == shaka.net.NetworkingEngine.RequestType.LICENSE) {
                    console.log("request :" + request.body);
                    setCustomData(request);
                }
            });

        }

        player.getNetworkingEngine().registerResponseFilter(function (type, response) {
            // Alias some utilities provided by the library.
            if (type == shaka.net.NetworkingEngine.RequestType.LICENSE) {
                parsingResponse(response);
            }
        });
    }
        // Try to load a manifest.
        // This is an asynchronous process.
        player.load(contentUri).then(function () {
            // This runs if the asynchronous load is successful.
            console.log('The video has now been loaded!');
        }).catch(function(e){onError(e); console.log(contentUri)}); // onError is executed if the asynchronous load fails.

        player.configure(playerConfig);

}

// If You Use Token Reset During Playback Such As CSL or KeyRotation or AirPlay,
// Continue to create new tokens and Set them.
function setCustomData(request) {
    if ('Widevine' === activeDrm.type) {
        // const newWidevineToken = '';
        // setWidevineToken(newWidevineToken);
        request.headers['pallycon-customdata-v2'] = widevineToken;
    }
    else if ('PlayReady' === activeDrm.type) {
        // const newPlayReadyToken = '';
        // setPlayReadyToken(newPlayReadyToken);
        request.headers['pallycon-customdata-v2'] = playreadyToken;
    }
    else if ('FairPlay' === activeDrm.type) {
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
        const doverunnerObj = JSON.parse(responseText);
        if (doverunnerObj && doverunnerObj.errorCode && doverunnerObj.message) {
            if ("8002" != doverunnerObj.errorCode) {
                alert("DoveRunner Error : " + doverunnerObj.message + "(" + doverunnerObj.errorCode + ")");
            } else {
                const errorObj = JSON.parse(doverunnerObj.message);
                alert("Error : " + errorObj.MESSAGE + "(" + errorObj.ERROR + ")");
            }
        }
    } catch (e) {
        // Non-JSON response is expected for successful license responses
    }
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
