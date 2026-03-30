let hls;
let player;

// DRM license tracking metrics
let drmLicenseMetrics = {
    requestTimestamp: null,
    responseTimestamp: null,
    requestCount: 0,
    latencies: [],
    errorCodes: [],
    serverResponseCodes: []
};

let cmcdSessionId = null;


// Initialize the sample
function initSample() {
    player = document.getElementById('my-player');
    updateCmcdUrlDisplay('cmcd-reporting-url');

    if (Hls.isSupported()) {
        log('HLS.js is supported in this browser');

        const drmSystems = {};
        // As PlayReady is not supported in HLS.js, 
        // if the DRM type is PlayReady, set it to Widevine, as this indicates the browser is Chrome or Edge.
        if ('Widevine' === activeDrm.type
            || 'PlayReady' === activeDrm.type
        ) {
            drmSystems['com.widevine.alpha'] = {
                licenseUrl: licenseUri,
                serverCertificateUrl: widevineCertUri
            };
        }
        else if ('FairPlay' === activeDrm.type) {
            drmSystems[activeDrm.keySystem] = {
                licenseUrl: licenseUri,
                serverCertificateUrl: fairplayCertDerUri
            };
        }

        hls = new Hls({
            debug: false, // Set to true for detailed HLS.js logs
            enableWorker: true,
            emeEnabled: true,
            drmSystems,
            licenseXhrSetup: function (xhr, url, keyContext, licenseChallenge) {
                // Track license request start
                drmLicenseMetrics.requestTimestamp = performance.now();
                drmLicenseMetrics.requestCount++;
                log('License request #' + drmLicenseMetrics.requestCount + ' started at: ' + drmLicenseMetrics.requestTimestamp + 'ms');

                const applyHeaders = function() {
                    try {
                        xhr.responseType = 'arraybuffer';
                        const ks = keyContext && (keyContext.keySystem || keyContext.mediaKeySystemDomain);
                        if (ks === 'com.widevine.alpha') {
                            xhr.setRequestHeader('pallycon-customdata-v2', widevineToken);
                        } else if (ks === 'com.microsoft.playready') {
                            xhr.setRequestHeader('pallycon-customdata-v2', playreadyToken);
                        } else if (ks === 'com.apple.fps') {
                            xhr.setRequestHeader('pallycon-customdata-v2', fairplayToken);

                            if (licenseChallenge && licenseChallenge.byteLength > 0) {
                                const spcData = new Uint8Array(licenseChallenge);
                                const base64Spc = btoa(String.fromCharCode.apply(null, spcData));
                                const formData = 'spc=' + encodeURIComponent(base64Spc);
                                const originalSend = xhr.send.bind(xhr);
                                xhr.send = function(data) {
                                    log('Sending FairPlay SPC as form data');
                                    originalSend(formData);
                                };
                            }
                        }

                        if (cmcdSessionId) {
                            xhr.setRequestHeader('CMCD-Session', 'sid="' + cmcdSessionId + '"');
                            log('CMCD Session ID added to license request headers: ' + cmcdSessionId);
                        }
                    } catch (e) {
                        console.warn('Failed to set license request headers:', e);
                    }
                };

                const originalOnLoadEnd = xhr.onloadend;
                xhr.onloadend = function(event) {
                    drmLicenseMetrics.responseTimestamp = performance.now();
                    
                    if (drmLicenseMetrics.requestTimestamp) {
                        const latency = drmLicenseMetrics.responseTimestamp - drmLicenseMetrics.requestTimestamp;
                        drmLicenseMetrics.latencies.push(latency);
                        log('License response received at: ' + drmLicenseMetrics.responseTimestamp + 'ms (latency: ' + latency.toFixed(2) + 'ms)');
                    }

                    if (xhr.status >= 200 && xhr.status < 300) {
                        drmLicenseMetrics.errorCodes.push(0);
                        drmLicenseMetrics.serverResponseCodes.push(xhr.status);
                        log('License request successful with status: ' + xhr.status);
                    } else {
                        drmLicenseMetrics.errorCodes.push(xhr.status || -1);
                        drmLicenseMetrics.serverResponseCodes.push(xhr.status || -1);
                        log('License request failed with status: ' + xhr.status);
                    }

                    if (originalOnLoadEnd) {
                        originalOnLoadEnd.call(this, event);
                    }
                };

                if (xhr && typeof xhr.open === 'function') {
                    const originalOpen = xhr.open.bind(xhr);
                    xhr.open = function(method, requestUrl, async, user, password) {
                        originalOpen(method, requestUrl, async, user, password);
                        applyHeaders();
                    };
                } else {
                    // Fallback: try immediately (in case it's already OPENED)
                    applyHeaders();
                }
            },
            licenseResponseCallback: function(xhr, url, keyContext) {
                        log('licenseResponseCallback called');
                        log('Response status: ' + xhr.status);

                        const keySystem = keyContext && keyContext.keySystem;

                        if (keySystem === 'com.apple.fps' && xhr.status >= 200 && xhr.status < 300) {
                            try {
                                let responseText;
                                if (xhr.response instanceof ArrayBuffer) {
                                    responseText = new TextDecoder().decode(xhr.response);
                                } else {
                                    responseText = xhr.responseText || xhr.response;
                                }

                                responseText = responseText.trim();
                                log('CKC response text length: ' + responseText.length);

                                try {
                                    const errorObj = JSON.parse(responseText);
                                    if (errorObj && errorObj.errorCode) {
                                        log('License server error: ' + errorObj.message + ' (' + errorObj.errorCode + ')');
                                        return null;
                                    }
                                } catch (e) {
                                    log('Processing as base64 CKC data');
                                }

                                const binaryString = atob(responseText);
                                const ckcData = new Uint8Array(binaryString.length);
                                for (let i = 0; i < binaryString.length; i++) {
                                    ckcData[i] = binaryString.charCodeAt(i);
                                }

                                log('CKC decoded length: ' + ckcData.length);
                                return ckcData;

                            } catch (error) {
                                log('Failed to process CKC response: ' + error.message);
                                return null;
                            }
                        }

                        if (xhr.response instanceof ArrayBuffer) {
                            return new Uint8Array(xhr.response);
                        }
                        return null;
                    }
        });

        hls.attachMedia(player);

        const cmcdConfig = {
            url: CMCD_REPORTING_SERVER_URL,
            reportingMode: 'event',
            transmissionMode: 'json',     // Use JSON for batch transmission
            batchSize: 100,               // Send batch when 100 events accumulated
            batchTimer: 30,               // Also send batch every 30 seconds
            timeInterval: 10,             // Add periodic time interval event every 10 seconds

            beforeSend: function(cmcdBatch) {
                // Add custom data to batch before sending
                addCustomDataToCmcdBatch(cmcdBatch);
            }
        };

        window.hlsCmcdV2Plugin.enableCmcdV2(hls, cmcdConfig);

        cmcdSessionId = hls.sessionId;
        log('Using hls.js built-in session ID: ' + cmcdSessionId);

        loadSampleContent();
        
    } else {
        log('HLS is not supported in this browser');
    }
}

function addCustomDataToCmcdBatch(cmcdBatch) {
    try {
        if (!Array.isArray(cmcdBatch) || cmcdBatch.length === 0) {
            log('No CMCD batch to modify');
            return;
        }

        log('Adding custom data to CMCD batch (' + cmcdBatch.length + ' events)');

        // Prepare base custom data (common for all events)
        const baseCustomData = {
            'sid': cmcdSessionId,
            'com.doverunner.device-id': getDeviceId(),
            'com.doverunner.player.device-type': getDeviceType(),
            'com.doverunner.player.browser-type': getBrowserName() + '-' + getBrowserVersion(),
            'com.doverunner.drm-auth-data': getDrmAuthData()
        };

        // Check if first event already has license data (from previous failed transmission)
        const firstEventHasLicenseData = cmcdBatch[0]['com.doverunner.drm-license-requested-count'] !== undefined &&
            cmcdBatch[0]['com.doverunner.drm-license-requested-count'] > 0;

        // Prepare license data (only for first event in batch)
        let licenseDataToAdd = null;
        const currentRequestCount = drmLicenseMetrics.requestCount;

        if (currentRequestCount > 0 && !firstEventHasLicenseData) {
            log('Preparing license metrics for first event: requestCount=' + currentRequestCount);

            while (drmLicenseMetrics.errorCodes.length < currentRequestCount) {
                drmLicenseMetrics.latencies.push(-1);
                drmLicenseMetrics.errorCodes.push(-1);
                drmLicenseMetrics.serverResponseCodes.push(-1);
            }

            licenseDataToAdd = {
                'com.doverunner.drm-license-requested-count': currentRequestCount
            };

            for (let i = 0; i < drmLicenseMetrics.latencies.length; i++) {
                const requestNum = i + 1;
                licenseDataToAdd['com.doverunner.drm-license-latency-' + requestNum] = drmLicenseMetrics.latencies[i].toFixed(2);
                licenseDataToAdd['com.doverunner.drm-error-code-' + requestNum] = drmLicenseMetrics.errorCodes[i];
                licenseDataToAdd['com.doverunner.drm-server-response-code-' + requestNum] = drmLicenseMetrics.serverResponseCodes[i];
            }
        } else if (firstEventHasLicenseData) {
            log('First event already has license data (retry transmission), skipping addition');
        }

        // Add custom data to each event in the batch
        cmcdBatch.forEach((cmcdObj, index) => {
            if (cmcdObj && typeof cmcdObj === 'object') {
                // Add base custom data to all events
                Object.assign(cmcdObj, baseCustomData);

                // ONLY the first event gets license data
                if (index === 0 && licenseDataToAdd) {
                    Object.assign(cmcdObj, licenseDataToAdd);
                    log('License data (count=' + currentRequestCount + ' + details) added to first event (index 0)');
                } else if (!cmcdObj['com.doverunner.drm-license-requested-count']) {
                    // All other events (including first event if no license data) get count = 0 (if not already set)
                    cmcdObj['com.doverunner.drm-license-requested-count'] = 0;
                }
            }
        });

        // Reset DRM metrics immediately after adding to batch (before transmission)
        if (licenseDataToAdd) {
            resetDrmMetrics();
            log('DRM metrics reset immediately after adding to batch (requestCount now 0)');
        }

        log('First event: ' + JSON.stringify(cmcdBatch[0]));
        if (cmcdBatch.length > 1) {
            log('Second event (should not have license details): ' + JSON.stringify(cmcdBatch[1]));
        }
    } catch (e) {
        log('Error adding custom data to CMCD batch: ' + e);
        console.error('Error details:', e);
    }
}

function getDrmAuthData() {
    if (activeDrm.type === 'Widevine'
        || activeDrm.type === 'PlayReady'
    ) {
        return widevineToken;
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
}

function loadSampleContent() {
    if (hls) {
        hls.loadSource(cmafUri);
        
        hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
            log('Manifest parsed, found ' + data.levels.length + ' quality levels');
        });

        hls.on(Hls.Events.ERROR, function (event, data) {
            if (data.fatal) {
                log('Fatal error: ' + data.type + ' - ' + data.details);
            }
        });
    } else {
        log('HLS.js instance not available');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkSupportedDRM().then(() => {
        initSample();
        checkBrowser();
    });
});
