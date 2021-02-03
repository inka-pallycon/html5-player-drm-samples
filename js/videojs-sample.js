var player = videojs('my-player');

function configureDRM() {
    player.ready(function () {
        let playerConfig;
        player.eme();
        if ('FairPlay' === drmType) {
            playerConfig = {
                src: hlsUri,
                type: 'application/x-mpegurl',
                keySystems: {
                    'com.apple.fps.1_0': {
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
                keySystems: {
                    'com.microsoft.playready': {
                        url: licenseUri,
                        licenseHeaders: {
                            'pallycon-customdata-v2': playreadyToken
                        }
                    }
                }
            };
        } else if ('Widevine' === drmType) {
            playerConfig = {
                src: dashUri,
                type: 'application/dash+xml',
                keySystems: {
                    'com.widevine.alpha': {
                        url: licenseUri,
                        licenseHeaders: {
                            'pallycon-customdata-v2': widevineToken
                        }
                    }
                }
            };
        } else {
            console.log("No DRM supported in this browser");
        }

        player.src(playerConfig);
    });
}

checkBrowser();
configureDRM();

player.play();
