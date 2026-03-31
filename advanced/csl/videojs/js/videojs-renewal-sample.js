const player = videojs('my-player');
const default_renewal_interval = 600_000; // 10 minutes

function startLicenseRenewal(player, session, interval = default_renewal_interval) {
    let isRenewalStarted = false;
    let renewalTimer = null;
    let isPlayerPlaying = false;

    const renewLicense = async () => {
        if (!isPlayerPlaying) {
            renewalTimer = setTimeout(renewLicense, interval);
            return;
        }

        try {        
            await session.update(stringToUInt8Array('renew'));
            console.log('License renewal triggered');
            
            if (renewalTimer) {
                clearTimeout(renewalTimer);
            }
            renewalTimer = setTimeout(renewLicense, interval);
        } catch (error) {
            console.error('System: License renewal error:', error);
        }
    };

    player.on('playing', () => {
        isPlayerPlaying = true;
        if (isRenewalStarted && !renewalTimer) {
            renewLicense();
        }
    });

    player.on('pause', () => {
        isPlayerPlaying = false;
        if (renewalTimer) {
            clearTimeout(renewalTimer);
            renewalTimer = null;
        }
    });

    player.on('ended', () => {
        isPlayerPlaying = false;
        if (renewalTimer) {
            clearTimeout(renewalTimer);
            renewalTimer = null;
        }
    });
        
    if (session.keyStatuses.size > 0) {
      session.keyStatuses.forEach((status, keyId) => {
        if (status === 'usable' && !isRenewalStarted) {
            console.log(`Initial usable status, keyId: ${arrayBufferToString(keyId)}`);
            isRenewalStarted = true;
            renewLicense();
        }
      });
    } else {
      console.log('Waiting for keystatuseschange event');
    }

    session.addEventListener('keystatuseschange', () => {
        session.keyStatuses.forEach((status, keyId) => {
            // For the MediaKeyStatus value, refer to https://www.w3.org/TR/encrypted-media-2/#dom-mediakeystatus
            if (status === 'usable' && !isRenewalStarted) {
                console.log(`Starting renewal for session, keyId: ${arrayBufferToString(keyId)}`);
                isRenewalStarted = true;
                renewLicense();
            } else if (status === 'expired' || status === 'released') {
                console.log(`Session expired/released, keyId: ${arrayBufferToString(keyId)}`);                
                if (renewalTimer) {
                    clearTimeout(renewalTimer);
                }
                session.close().catch(err => console.error('Error closing session:', err));
                isRenewalStarted = false;
            }
        });
    });
}


function configureDRM() {
    player.eme();

    let playerConfig;

    if ('FairPlay' === activeDrm.type) {
        playerConfig = {
            src: hlsUri,
            type: 'application/x-mpegurl',
            keySystems: {
                'com.apple.fps': {
                    getCertificate: function (emeOptions, callback) {
                        videojs.xhr({
                            url: fairplayCertUri,
                            method: 'GET',
                        }, function (err, response, responseBody) {
                            if (err) {
                                callback(err)
                                return
                            }
                            callback(null, base64DecodeUint8Array(responseBody));
                        })
                    },
                    getContentId: function (emeOptions, initData) {
                        const contentId = arrayToString(initData);
                        return contentId.substring(contentId.indexOf('skd://') + 6);
                    },
                    getLicense: function (emeOptions, contentId, keyMessage, callback) {
                        videojs.xhr({
                            url: licenseUri,
                            method: 'POST',
                            responseType: 'text',
                            body: 'spc=' + base64EncodeUint8Array(keyMessage),
                            headers: {
                                'Content-type': 'application/x-www-form-urlencoded',
                                'pallycon-customdata-v2': fairplayToken
                            }
                        }, function (err, response, responseBody) {
                            if (err) {
                                callback(err)
                                return
                            }
                            callback(null, base64DecodeUint8Array(responseBody))
                        })
                    }
                }
            }
        };
    } else {
        if ('PlayReady' === activeDrm.type) {
            console.log('PlayReady is not supported for this sample. Widevine DRM will be applied instead.');
        }
        playerConfig = {
            src: dashUri,
            type: 'application/dash+xml',
            keySystems: {
                'com.widevine.alpha': {
                    getCertificate: function (emeOptions, callback) {
                        videojs.xhr({
                            url: widevineCertUri,
                            method: 'GET',
                            responseType: 'arraybuffer',
                        }, function (err, response, responseBody) {
                            if (err) {
                                callback(err)
                                return
                            }
                            callback(null, responseBody);
                        })
                    },
                    url: licenseUri,
                    licenseHeaders: {
                        'pallycon-customdata-v2': widevineToken
                    },
                    persistentState: 'required',
                }
            },
        };
    }

    player.tech().on('keysessioncreated', function(keySession) {
        console.log('Key session created:', keySession.keySession);
        if (keySession.keySession) {
            startLicenseRenewal(player, keySession.keySession);
        }
    });

    player.src(playerConfig);
}

checkSupportedDRM().then(() => {
    checkBrowser();
    player.ready(() => {
        configureDRM();
        player.play();
    });
})