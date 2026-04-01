// License renewal interval in seconds (10 minutes for testing, adjust as needed)
const RENEWAL_INTERVAL_SEC = 600;

let player = null;

function initApp() {
    shaka.polyfill.installAll();
    if (shaka.Player.isBrowserSupported()) {
        checkSupportedDRM().then(() => {
            checkBrowser();
            initPlayer();
        });
    } else {
        console.error('Browser not supported!');
    }
}

async function initPlayer() {
    const video = document.getElementById('my-player');
    player = new shaka.Player();
    await player.attach(video);

    window.player = player;

    player.addEventListener('error', onErrorEvent);

    // Listen for license renewal events (Shaka 5.0+ API)
    player.addEventListener('licenserenewal', onLicenseRenewal);

    // Select content URI based on DRM type
    const contentUri = (activeDrm.type === 'FairPlay') ? hlsUri : dashUri;

    // Configure DRM based on type
    const playerConfig = {
        drm: {
            servers: {
                [activeDrm.keySystem]: licenseUri
            },
            // Automatic license renewal interval (FairPlay/PlayReady only)
            renewalIntervalSec: RENEWAL_INTERVAL_SEC
        },
        streaming: {
            autoLowLatencyMode: true,
        },
    };

    // FairPlay requires server certificate
    if (activeDrm.type === 'FairPlay') {
        const fairplayCert = getFairplayCert();
        playerConfig.drm.advanced = {
            [activeDrm.keySystem]: {
                serverCertificate: fairplayCert
            }
        };
    } else if (activeDrm.type === 'Widevine') {
        playerConfig.drm.advanced = {
            [activeDrm.keySystem]: {
                persistentStateRequired: true,
                serverCertificateUri: widevineCertUri
            }
        };
    }

    player.configure(playerConfig);
    console.log(`License renewal enabled: every ${RENEWAL_INTERVAL_SEC} seconds for ${activeDrm.type}`);

    // Request filter for license request
    player.getNetworkingEngine().registerRequestFilter((type, request) => {
        if (type === shaka.net.NetworkingEngine.RequestType.LICENSE) {
            if (activeDrm.type === 'FairPlay') {
                // FairPlay: encode SPC and set custom header
                const originalPayload = new Uint8Array(request.body);
                const base64Payload = shaka.util.Uint8ArrayUtils.toBase64(originalPayload);
                const params = 'spc=' + encodeURIComponent(base64Payload);

                request.body = shaka.util.StringUtils.toUTF8(params);
                request.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                request.headers['pallycon-customdata-v2'] = fairplayToken;
            } else if (activeDrm.type === 'PlayReady') {
                // PlayReady: just set custom header
                request.headers['pallycon-customdata-v2'] = playreadyToken;
            } else if (activeDrm.type === 'Widevine') {
                // Widevine: just set custom header
                request.headers['pallycon-customdata-v2'] = widevineToken;
            }
        }
    });

    // Response filter for license response
    player.getNetworkingEngine().registerResponseFilter((type, response) => {
        if (type === shaka.net.NetworkingEngine.RequestType.LICENSE) {
            if (activeDrm.type === 'FairPlay') {
                // FairPlay: decode base64 response
                const responseText = shaka.util.StringUtils.fromUTF8(response.data).trim();
                response.data = shaka.util.Uint8ArrayUtils.fromBase64(responseText).buffer;
            }
            parsingResponse(response);
        }
    });

    player.load(contentUri)
        .then(() => {
            console.log('The video has now been loaded!');
        })
        .catch((e) => {
            onError(e);
            console.log(contentUri);
        });
}

function onLicenseRenewal(event) {
    console.log('License renewed successfully');
    console.log('Old session:', event.oldSessionMetadata);
    console.log('New session:', event.newSessionMetadata);
}

function parsingResponse(response) {
    const responseText = arrayBufferToString(response.data).trim();
    console.log('responseText:', responseText);

    try {
        const doverunnerObj = JSON.parse(responseText);
        if (doverunnerObj && doverunnerObj.errorCode && doverunnerObj.message) {
            if ('8002' !== doverunnerObj.errorCode) {
                alert('DoveRunner Error: ' + doverunnerObj.message + '(' + doverunnerObj.errorCode + ')');
            } else {
                const errorObj = JSON.parse(doverunnerObj.message);
                alert('Error: ' + errorObj.MESSAGE + '(' + errorObj.ERROR + ')');
            }
        }
    } catch (e) {
        // Non-JSON response is expected for successful license responses
    }
}

function onErrorEvent(event) {
    console.error('Error code', event.detail.code, 'object', event.detail);
    onError(event.detail);
}

function onError(error) {
    console.error('Error code', error.code, 'object', error);
}

document.addEventListener('DOMContentLoaded', initApp);
