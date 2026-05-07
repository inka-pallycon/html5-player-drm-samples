const player = videojs('my-player');

function extractChallengeOnly(keyMessage) {
    try {
        if (typeof keyMessage === 'string') {
            // Remove and normalise all non-standard characters
            keyMessage = keyMessage.split('').map(char => {
                const code = char.charCodeAt(0);
                // Keep only common ASCII characters
                return (code > 31 && code < 127) ? char : '';
            }).join('');

            // Extracting the Challenge tag and content inside a PlayReadyKeyMessage
            const challengeRegex = /<PlayReadyKeyMessage.*?><LicenseAcquisition.*?><Challenge\s+encoding="base64encoded">(.*?)<\/Challenge>/s;
            const match = keyMessage.match(challengeRegex);
            
            if (match && match[1]) {
                return match[1];
            }

            console.warn('Challenge content not found');
            return keyMessage;
        } else {
            const keyMessageString = String.fromCharCode.apply(null, new Uint8Array(keyMessage));
            return extractChallengeOnly(keyMessageString);
        }
    } catch (error) {
        console.error('Error extracting Challenge:', error);
        return keyMessage;
    }
}

function configureDRM() {
    player.ready(async function () {
        let playerConfig;
        player.eme();

        if ('FairPlay' === activeDrm.type) {
            playerConfig = {
                src: hlsUri,
                type: 'application/x-mpegurl',
                keySystems: {
                    [activeDrm.keySystem]: {
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
        } else if ('PlayReady' === activeDrm.type) {
            playerConfig = {
                src: getDashUri(),
                type: 'application/dash+xml',
            };

            if (supportSl3000) {
                playerConfig.keySystems = {
                    [activeDrm.keySystem]: {
                        getLicense: (emeOptions, keyMessage, callback) => {
                            // In the getLicense callback, the entire PlayReadyKeyMessage data is passed to keyMessage, so only the Challenge payload should be parsed and requested.
                            const modifiedMessage = extractChallengeOnly(keyMessage);
                            const decodedMessage = atob(modifiedMessage);
                            const uint8Array = new Uint8Array(decodedMessage.length);
                            for (let i = 0; i < decodedMessage.length; i++) {
                                uint8Array[i] = decodedMessage.charCodeAt(i);
                            }

                            videojs.xhr({
                                url: licenseUri,
                                method: 'POST',
                                responseType: 'arraybuffer',
                                body: uint8Array,
                                headers: {
                                    'Content-Type': 'text/xml; charset=utf-8',
                                    'pallycon-customdata-v2': getPlayReadyToken(),
                                }
                            }, function(err, response, responseBody) {
                                if (err) {
                                    callback(err);
                                    return;
                                }
                                callback(null, responseBody);
                            });
                        }
                    }
                };
            } else {
                playerConfig.keySystems = {
                    [activeDrm.keySystem]: {
                        url: licenseUri,
                        licenseHeaders: {
                            'pallycon-customdata-v2': getPlayReadyToken()
                        }
                    }
                };
            }
        } else if ('Widevine' === activeDrm.type) {
            playerConfig = {
                src: getDashUri(),
                type: 'application/dash+xml',
                keySystems: {},
            };

            // Set the highest player robustness.
            const widevineSecureConfig = await getWidevineHighestSecurityConfig();

            playerConfig.keySystems[activeDrm.keySystem] = {
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
                    'pallycon-customdata-v2': getWidevineToken()
                },
                persistentState: 'required',
                videoRobustness: widevineSecureConfig.videoRobustness,
                audioRobustness: widevineSecureConfig.audioRobustness
            };
        } else {
            console.log("No DRM supported in this browser");
        }
        player.src(playerConfig);
    });
}

checkSupportedDRM().then(() => {
    checkBrowser();
    player.ready(function(){
        configureDRM();
    });
    player.play();
})
