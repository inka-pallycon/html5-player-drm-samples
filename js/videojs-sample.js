var player = videojs('my-player');

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

        if ('FairPlay' === drmType) {
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
        } else if ('PlayReady' === drmType) {
            playerConfig = {
                src: dashUri,
                type: 'application/dash+xml',
            };
            
            if (supportSl3000) {
                playerConfig.keySystems = {
                    'com.microsoft.playready.recommendation.3000': {
                        getLicense: (emeOptions, keyMessage, callback) => {
                            // Modify the keyMessage to parse and request only the Challenge, as the SL3000 key system requests the full PlayReadyKeyMessage data.
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
                                    'pallycon-customdata-v2': playreadyToken,
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
                    'com.microsoft.playready': {
                        url: licenseUri,
                        licenseHeaders: {
                            'pallycon-customdata-v2': playreadyToken
                        }
                    }
                };
            }
        } else if ('Widevine' === drmType) {
            playerConfig = {
                src: dashUri,
                type: 'application/dash+xml',
                keySystems: {},
            };

            // Set the highest player robustness.
            const widevineSecureConfig = await getWidevineHighestSecurityConfig();
            
            if(supportL1 && isWindowsChrome()) {
                playerConfig.keySystems['com.widevine.alpha.experiment'] = {
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
                    licenseHeaders:{
                        'pallycon-customdata-v2': widevineToken
                    },
                    persistentState: 'required',
                    videoRobustness: widevineSecureConfig.videoRobustness,
                    audioRobustness: widevineSecureConfig.audioRobustness
                };
            }
            
            // There is an issue with the videojs eme plugin setup, so the default key system should be applied AFTER the experiment key system if it is possible to set it up.
            playerConfig.keySystems['com.widevine.alpha'] = {
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
                licenseHeaders:{
                    'pallycon-customdata-v2': widevineToken
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
