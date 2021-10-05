function initApp() {
    // Install built-in polyfills to patch browser incompatibilities.
    shaka.polyfill.installAll();

    // Check to see if the browser supports the basic APIs Shaka needs.
    if (shaka.Player.isBrowserSupported()) {
        // Everything looks good!
        initPlayer();
    } else {
        // This browser does not have the minimum set of APIs we need.
        console.error('Browser not supported!');
    }
}

function initPlayer() {
    let contentUri, playerConfig;
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
                    'com.apple.fps.1_0': licenseUri
                },
                advanced: {
                    'com.apple.fps.1_0': {
                        serverCertificate: fairplayCert
                    }
                }
            }
        };

        player.configure('drm.initDataTransform', function (initData, initDataType){
            const skdUri = shaka.util.StringUtils.fromBytesAutoDetect(initData);
            console.log('skdUri : ' + skdUri);
            const contentId = skdUri.substring(skdUri.indexOf('skd://') + 6);
            console.log('contentId : ', contentId);
            const cert = player.drmInfo().serverCertificate;
            return shaka.util.FairPlayUtils.initDataTransform(initData, contentId, cert);
        });

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
            const base64Cert = 'CsECCAMSEBcFuRfMEgSGiwYzOi93KowYgrSCkgUijgIwggEKAoIBAQCZ7Vs7Mn2rXiTvw7YqlbWYUgrVvMs3UD4GRbgU2Ha430BRBEGtjOOtsRu4jE5yWl5KngeVKR1YWEAjp+GvDjipEnk5MAhhC28VjIeMfiG/+/7qd+EBnh5XgeikX0YmPRTmDoBYqGB63OBPrIRXsTeo1nzN6zNwXZg6IftO7L1KEMpHSQykfqpdQ4IY3brxyt4zkvE9b/tkQv0x4b9AsMYE0cS6TJUgpL+X7r1gkpr87vVbuvVk4tDnbNfFXHOggrmWEguDWe3OJHBwgmgNb2fG2CxKxfMTRJCnTuw3r0svAQxZ6ChD4lgvC2ufXbD8Xm7fZPvTCLRxG88SUAGcn1oJAgMBAAE6FGxpY2Vuc2Uud2lkZXZpbmUuY29tEoADrjRzFLWoNSl/JxOI+3u4y1J30kmCPN3R2jC5MzlRHrPMveoEuUS5J8EhNG79verJ1BORfm7BdqEEOEYKUDvBlSubpOTOD8S/wgqYCKqvS/zRnB3PzfV0zKwo0bQQQWz53ogEMBy9szTK/NDUCXhCOmQuVGE98K/PlspKkknYVeQrOnA+8XZ/apvTbWv4K+drvwy6T95Z0qvMdv62Qke4XEMfvKUiZrYZ/DaXlUP8qcu9u/r6DhpV51Wjx7zmVflkb1gquc9wqgi5efhn9joLK3/bNixbxOzVVdhbyqnFk8ODyFfUnaq3fkC3hR3f0kmYgI41sljnXXjqwMoW9wRzBMINk+3k6P8cbxfmJD4/Paj8FwmHDsRfuoI6Jj8M76H3CTsZCZKDJjM3BQQ6Kb2m+bQ0LMjfVDyxoRgvfF//M/EEkPrKWyU2C3YBXpxaBquO4C8A0ujVmGEEqsxN1HX9lu6c5OMm8huDxwWFd7OHMs3avGpr7RP7DUnTikXrh6X0';
            const serverCertificate = base64DecodeUint8Array(base64Cert);

            playerConfig = {
                drm: {
                    servers: {
                        'com.widevine.alpha': licenseUri,
                    },
                    advanced: {
                        'com.widevine.alpha': {
                            'serverCertificate': serverCertificate
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
        } else {
            playerConfig = {
                drm: {
                    servers: {
                        'com.microsoft.playready': licenseUri
                    }
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

    // Try to load a manifest.
    // This is an asynchronous process.
    player.load(contentUri).then(function () {
        // This runs if the asynchronous load is successful.
        console.log('The video has now been loaded!');
    }).catch(onError); // onError is executed if the asynchronous load fails.

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

checkBrowser();
document.addEventListener('DOMContentLoaded', initApp);