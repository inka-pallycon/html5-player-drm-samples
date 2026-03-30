let player;
let eventModeCleanup; // Cleanup function from event mode plugin
// Flags to manage complex timing between async license requests and CMCD event transmissions
let isLicenseRequestPending = false; // Flag to track pending license requests
let pendingLicenseDataToSend = false; // Flag to track if license data needs to be sent
let licenseDataAlreadySent = false; // Flag to prevent duplicate license data transmission

let drmLicenseMetrics = {
    requestTimestamp: null,
    responseTimestamp: null,
    requestCount: 0,
    latencies: [],
    errorCodes: [],
    serverResponseCodes: []
};

let cmcdSessionId = null;

function init() {
    shaka.polyfill.installAll();

    if (shaka.Player.isBrowserSupported()) {
        updateCmcdUrlDisplay('cmcd-reporting-url');
        checkSupportedDRM().then(() => {
            initPlayer();
            checkBrowser();
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

    // Configure basic Shaka Player CMCD to generate sessionId
    // Note: We disable actual CMCD transmission (useHeaders: false) since we use Event Mode Plugin
    player.configure({
        cmcd: {
            enabled: true,  // Enable to generate sessionId
            version: 2,
            useHeaders: false,  // Don't send CMCD via headers (Event Mode Plugin handles it)
        }
    });

    // Setup Event Mode Plugin with JSON Batch transmission
    const eventModePluginConfig = {
        mode: 'json',              // Use JSON for batch transmission
        batchSize: 100,              // Send batch when 5 events accumulated
        batchTimer: 30,            // Also send batch every 30 seconds
        timeInterval: 10,          // Add periodic time interval event every 10 seconds
        url: CMCD_REPORTING_SERVER_URL,

        // Callback to add custom data before sending
        beforeSend: function(cmcdBatch) {
            addCustomDataToCmcdBatch(cmcdBatch);
        },

        // Callback after successful send
        afterSend: function(response) {
            if (response.ok) {
                handleSuccessfulCmcdTransmission();
            }
        }
    };

    // Enable CMCD Event Mode Plugin
    eventModeCleanup = eventModePlugin.enableEventMode(player, eventModePluginConfig);
    log('Event Mode Plugin enabled with JSON batch transmission (batchSize: 100, batchTimer: 30s, timeInterval: 10s)');

    if (activeDrm.type !== 'No DRM') {
        setupDRM();
    }

    try {
        let contentUri;
        if (activeDrm.type === 'FairPlay') {
            contentUri = hlsUri;
        } else {
            contentUri = dashUri;
        }

        await player.load(contentUri);
        log('Content loaded: ' + contentUri);

        // Get CMCD Session ID from player configuration after content is loaded
        const playerConfig = player.getConfiguration();
        if (playerConfig.cmcd && playerConfig.cmcd.sessionId) {
            cmcdSessionId = playerConfig.cmcd.sessionId;
            log('CMCD Session ID captured from Shaka Player: ' + cmcdSessionId);
        } else {
            log('WARNING: CMCD Session ID not found in player configuration');
        }
    } catch (error) {
        onError(error);
    }
}

function setupDRM() {
    let playerConfig = {};

    if (activeDrm.type === 'FairPlay') {
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
            }
        };

        player.getNetworkingEngine().registerRequestFilter(function (type, request) {
            if (type == shaka.net.NetworkingEngine.RequestType.LICENSE) {
                const originalPayload = new Uint8Array(request.body);
                const base64Payload = shaka.util.Uint8ArrayUtils.toBase64(originalPayload);
                const params = 'spc=' + encodeURIComponent(base64Payload);

                request.body = shaka.util.StringUtils.toUTF8(params);
                request.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                request.headers['pallycon-customdata-v2'] = fairplayToken;

                if (cmcdSessionId) {
                    request.headers['CMCD-Session'] = 'sid="' + cmcdSessionId + '"';
                    log('CMCD Session ID added to FairPlay license request headers: ' + cmcdSessionId);
                }

                trackLicenseRequest();
            }
        });

        player.getNetworkingEngine().registerResponseFilter(function (type, response) {
            if (type == shaka.net.NetworkingEngine.RequestType.LICENSE) {
                const responseText = shaka.util.StringUtils.fromUTF8(response.data).trim();
                response.data = shaka.util.Uint8ArrayUtils.fromBase64(responseText).buffer;
                trackLicenseResponse(response);
            }
        });
    } else if (activeDrm.type === 'Widevine') {
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
            }
        };

        player.getNetworkingEngine().registerRequestFilter(function (type, request) {
            if (type == shaka.net.NetworkingEngine.RequestType.LICENSE) {
                console.log("request :" + request.body);
                request.headers['pallycon-customdata-v2'] = widevineToken;

                if (cmcdSessionId) {
                    request.headers['CMCD-Session'] = 'sid="' + cmcdSessionId + '"';
                    log('CMCD Session ID added to Widevine license request headers: ' + cmcdSessionId);
                }

                trackLicenseRequest();
            }
        });

        player.getNetworkingEngine().registerResponseFilter(function (type, response) {
            if (type == shaka.net.NetworkingEngine.RequestType.LICENSE) {
                trackLicenseResponse(response);
            }
        });
    } else if (activeDrm.type === 'PlayReady') {
        playerConfig = {
            drm: {
                servers: {
                    [activeDrm.keySystem]: licenseUri,
                }
            },
            streaming: {
                autoLowLatencyMode: true,
            }
        };

        player.getNetworkingEngine().registerRequestFilter(function (type, request) {
            if (type == shaka.net.NetworkingEngine.RequestType.LICENSE) {
                console.log("request :" + request.body);
                request.headers['pallycon-customdata-v2'] = playreadyToken;

                if (cmcdSessionId) {
                    request.headers['CMCD-Session'] = 'sid="' + cmcdSessionId + '"';
                    log('CMCD Session ID added to PlayReady license request headers: ' + cmcdSessionId);
                }

                trackLicenseRequest();
            }
        });

        player.getNetworkingEngine().registerResponseFilter(function (type, response) {
            if (type == shaka.net.NetworkingEngine.RequestType.LICENSE) {
                trackLicenseResponse(response);
            }
        });
    }

    player.configure(playerConfig);
    player.setTextTrackVisibility(true);
}

function trackLicenseRequest() {
    isLicenseRequestPending = true;
    drmLicenseMetrics.requestTimestamp = performance.now();
    drmLicenseMetrics.requestCount++;
    log('License request #' + drmLicenseMetrics.requestCount + ' started at: ' + drmLicenseMetrics.requestTimestamp + 'ms');
}

function trackLicenseResponse(response) {
    drmLicenseMetrics.responseTimestamp = performance.now();

    if (drmLicenseMetrics.requestTimestamp) {
        const latency = drmLicenseMetrics.responseTimestamp - drmLicenseMetrics.requestTimestamp;
        drmLicenseMetrics.latencies.push(latency);
        log('License response received at: ' + drmLicenseMetrics.responseTimestamp + 'ms (latency: ' + latency.toFixed(2) + 'ms)');
    }

    // Successful license response
    drmLicenseMetrics.errorCodes.push(0);
    drmLicenseMetrics.serverResponseCodes.push(200);

    // Parse response for potential error information
    parseResponse(response);
    isLicenseRequestPending = false;
    pendingLicenseDataToSend = true; // Mark that license data is ready to send

    // Check if we should reset metrics that were deferred due to pending license request
    // This will be handled in the next CMCD event transmission
    log('License request completed - metrics will be reset in next CMCD transmission');
}

function parseResponse(response) {
    try {
        let responseText = '';
        if (response.data instanceof ArrayBuffer) {
            responseText = shaka.util.StringUtils.fromUTF8(response.data).trim();
        } else {
            responseText = response.data;
        }

        if (typeof responseText === 'string' && responseText.length > 0) {
            try {
                const doverunnerObj = JSON.parse(responseText);
                if (doverunnerObj && doverunnerObj.errorCode && doverunnerObj.message) {
                    if ("8002" !== doverunnerObj.errorCode) {
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
    } catch (e) {
        log('Error parsing response: ' + e);
    }
}

function addCustomDataToCmcdBatch(cmcdBatch) {
    try {
        if (!Array.isArray(cmcdBatch)) {
            log('WARNING: cmcdBatch is not an array!');
            return;
        }

        log('Adding custom data to CMCD batch (' + cmcdBatch.length + ' events)');

        // Prepare base custom data (common for all events in batch)
        const baseCustomData = {
            'com.doverunner.device-id': getDeviceId(),
            'com.doverunner.player.device-type': getDeviceType(),
            'com.doverunner.player.browser-type': getBrowserName() + '-' + getBrowserVersion(),
            'com.doverunner.drm-auth-data': getDrmAuthData()
        };

        // Check if we should add license metrics to ONLY THE FIRST event in this batch
        let licenseDataToAdd = null;
        let currentRequestCount = drmLicenseMetrics.requestCount; // Capture before reset

        if (!isLicenseRequestPending && currentRequestCount > 0 &&
            (pendingLicenseDataToSend || !licenseDataAlreadySent)) {

            log('Adding license metrics to FIRST event: requestCount=' + currentRequestCount +
                ', latencies=' + drmLicenseMetrics.latencies.length +
                ', pending=' + pendingLicenseDataToSend +
                ', alreadySent=' + licenseDataAlreadySent);

            // Handle case where license response filter wasn't called
            while (drmLicenseMetrics.errorCodes.length < currentRequestCount) {
                drmLicenseMetrics.latencies.push(-1);
                drmLicenseMetrics.errorCodes.push(-1);
                drmLicenseMetrics.serverResponseCodes.push(-1);
            }

            // Prepare license data
            licenseDataToAdd = {
                'com.doverunner.drm-license-requested-count': currentRequestCount
            };

            // Add individual measurements for each license request
            for (let i = 0; i < drmLicenseMetrics.latencies.length; i++) {
                const requestNum = i + 1;
                const latency = drmLicenseMetrics.latencies[i];
                licenseDataToAdd['com.doverunner.drm-license-latency-' + requestNum] =
                    (latency >= 0 ? latency.toFixed(2) : '-1');
                licenseDataToAdd['com.doverunner.drm-error-code-' + requestNum] = drmLicenseMetrics.errorCodes[i];
                licenseDataToAdd['com.doverunner.drm-server-response-code-' + requestNum] = drmLicenseMetrics.serverResponseCodes[i];
            }

            log('License data prepared, will be added to first event only');
        } else if (isLicenseRequestPending) {
            log('License request pending, deferring license metrics addition');
        } else {
            log('No license data to add (requestCount=' + currentRequestCount + ', pending=' + pendingLicenseDataToSend + ')');
        }

        // Check if first event already has license data (from previous failed transmission)
        const firstEventHasLicenseData = cmcdBatch.length > 0 &&
            cmcdBatch[0]['com.doverunner.drm-license-requested-count'] !== undefined &&
            cmcdBatch[0]['com.doverunner.drm-license-requested-count'] > 0;

        if (firstEventHasLicenseData && licenseDataToAdd) {
            log('First event already has license data (retry transmission), skipping addition');
            licenseDataToAdd = null; // Prevent duplicate addition
        }

        // Add custom data to each event in the batch
        cmcdBatch.forEach((event, index) => {
            // Add base custom data to all events
            Object.assign(event, baseCustomData);

            // ONLY the first event gets license data if available
            if (index === 0 && licenseDataToAdd) {
                // First event gets all license data (count + details)
                Object.assign(event, licenseDataToAdd);
                log('License data (count=' + currentRequestCount + ' + details) added to first event (index 0)');
            } else if (!event['com.doverunner.drm-license-requested-count']) {
                // All other events (including first event if no license data) get count = 0 (if not already set)
                event['com.doverunner.drm-license-requested-count'] = 0;
            }
        });

        // Reset metrics immediately after adding to first event (before transmission)
        if (licenseDataToAdd) {
            resetDrmMetrics();
            log('DRM metrics reset immediately after adding to first event (requestCount now 0)');
        }

        log('Custom DRM data added to CMCD batch');
        log('First event: ' + JSON.stringify(cmcdBatch[0]));
        if (cmcdBatch.length > 1) {
            log('Second event (should not have license details): ' + JSON.stringify(cmcdBatch[1]));
        }
    } catch (e) {
        log('Error adding custom data to CMCD batch: ' + e);
        console.error('Error details:', e);
    }
}

function handleSuccessfulCmcdTransmission() {
    log('CMCD batch transmitted successfully');
    // Note: DRM metrics are now reset immediately after adding to batch (in addCustomDataToCmcdBatch)
    // No need to reset here anymore
}

function getDrmAuthData() {
    if (activeDrm.type === 'Widevine') {
        return widevineToken;
    } else if (activeDrm.type === 'PlayReady') {
        return playreadyToken;
    } else if (activeDrm.type === 'FairPlay') {
        return fairplayToken;
    }
    return 'no-drm';
}

function resetDrmMetrics() {
    drmLicenseMetrics = {
        requestTimestamp: null,
        responseTimestamp: null,
        requestCount: 0,
        latencies: [],
        errorCodes: [],
        serverResponseCodes: []
    };
    pendingLicenseDataToSend = false;
    licenseDataAlreadySent = false;
}

function onErrorEvent(event) {
    console.error('Shaka Player Error:', event.detail);

    // Handle DRM license errors
    if (event.detail && event.detail.category === shaka.util.Error.Category.DRM) {
        const errorCode = event.detail.code || -1;
        let responseCode = -1;

        // Try to extract more specific error information
        if (event.detail.data && event.detail.data.length > 0) {
            const errorData = event.detail.data[0];
            if (typeof errorData === 'object' && errorData.responseCode) {
                responseCode = errorData.responseCode;
            }
        }

        drmLicenseMetrics.errorCodes.push(errorCode);
        drmLicenseMetrics.serverResponseCodes.push(responseCode);
        drmLicenseMetrics.latencies.push(-1);
        log('DRM license error recorded: errorCode=' + errorCode + ', responseCode=' + responseCode);

        isLicenseRequestPending = false;
        pendingLicenseDataToSend = true;
    }

    onError(event.detail);
}

function onError(error) {
    console.error('Error code', error.code, 'object', error);
}

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (eventModeCleanup) {
        eventModeCleanup();
    }
});

document.addEventListener('DOMContentLoaded', init);
