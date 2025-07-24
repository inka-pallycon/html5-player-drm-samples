var default_renewal_interval_sec = 600; // 10 minutes
let timer = null;
let isPlaying = false;

async function startLicenseRenewal() {
    timer = new shaka.util.Timer(async () => {
        if (!isPlaying) return;
        try {
            // This is the instance approach for license renewal operations in the Shaka Player, but not valid for a public production build.
            const drmEngine = player.getDrmEngine();
            const sessions = Array.from(drmEngine.activeSessions_.keys());
            if (sessions.length === 0) {
                console.error('No active DRM sessions');
                return;
            }
            for (const session of sessions) {
                try {
                    await session.update(shaka.util.StringUtils.toUTF8('renew'));
                    console.log('License renewal triggered');
                } catch (e) {
                    console.error('License renewal error:', error);
                }
            }
        } catch (e) {
        console.error('Renewal failed:', e);
        }
    });
    
    if (isPlaying) {
        timer.tickEvery(default_renewal_interval_sec);
    }
}

function stopLicenseRenewal() {
    if (timer) {
        timer.stop();
        console.log('License renewal stopped');
    }
}

function initApp() {
    shaka.polyfill.installAll();
    if (shaka.Player.isBrowserSupported()) {        
        checkSupportedDRM().then(()=> {
            checkBrowser();
            initPlayer();
        })

    } else {
        console.error('Browser not supported!');
    }
}

async function initPlayer() {    
    const video = document.getElementById('my-player');
    let player = new shaka.Player(video);

    window.player = player;

    player.addEventListener('error', onErrorEvent);
    
    if ('FairPlay' !== drmType) {
        console.error('This sample only supports FairPlay DRM.');
        document.getElementById('browserCheckResult').innerHTML = 'Error: Only FairPlay DRM is supported.';
        return;
    }

    let contentUri = hlsUri;
    const fairplayCert = getFairplayCert();
    
    player.configure({
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
        // streaming: {
        //     useNativeHlsForFairPlay: false
        // }
    });

    player.getNetworkingEngine().registerRequestFilter(function (type, request, context) {
        if (type == shaka.net.NetworkingEngine.RequestType.LICENSE) {
            console.log('License request context:', context);
            const originalPayload = new Uint8Array(request.body);
            const base64Payload = shaka.util.Uint8ArrayUtils.toBase64(originalPayload);
            const params = 'spc=' + encodeURIComponent(base64Payload);

            request.body = shaka.util.StringUtils.toUTF8(params);
            request.headers['Content-Type'] = 'application/x-www-form-urlencoded';
            request.headers['pallycon-customdata-v2'] = fairplayToken;
        }
    });

    player.getNetworkingEngine().registerResponseFilter(function (type, response) {
        if (type == shaka.net.NetworkingEngine.RequestType.LICENSE) {
            const responseText = shaka.util.StringUtils.fromUTF8(response.data).trim();
            response.data = shaka.util.Uint8ArrayUtils.fromBase64(responseText).buffer;
            parsingResponse(response);
        }
    });

    // Add event listeners for play, pause, and ended events
    video.addEventListener('play', () => {
        isPlaying = true;
        if (timer) {
            timer.tickEvery(default_renewal_interval_sec);
            console.log('License renewal started');
        }
    });

    video.addEventListener('pause', () => {
        isPlaying = false;
        stopLicenseRenewal();
    });

    video.addEventListener('ended', () => {
        isPlaying = false;
        stopLicenseRenewal();
    });

    player.setTextTrackVisibility(true);
    player.load(contentUri).then(function () {
        console.log('The video has now been loaded!');
        startLicenseRenewal();
    }).catch(function(e){onError(e); console.log(contentUri)});
}

function parsingResponse(response) {
    let responseText = arrayBufferToString(response.data);
    responseText = responseText.trim();

    console.log('responseText :: ', responseText);

    try {
        const doverunnerObj = JSON.parse(responseText);
        if (doverunnerObj && doverunnerObj.errorCode && doverunnerObj.message) {
            if ("8002" != errorCode) {
                alert("DoveRunner Error : " + doverunnerObj.message + "(" + doverunnerObj.errorCode + ")");
            } else {
                var errorObj = JSON.parse(doverunnerObj.message);
                alert("Error : " + errorObj.MESSAGE + "(" + errorObj.ERROR + ")");
            }
        }
    } catch (e) {}
}

function onErrorEvent(event) {
    console.error('Error code', event.detail.code, 'object', event.detail);

    if (6006 === event.detail.code && supportSl3000) {
        window.player.destroy();
        supportSl3000 = false;
        setTimeout(() => {
            initPlayer();
        }, 500);
    }

    onError(event.detail);
}

function onError(error) {
    console.error('Error code', error.code, 'object', error);
}

document.addEventListener('DOMContentLoaded', initApp);