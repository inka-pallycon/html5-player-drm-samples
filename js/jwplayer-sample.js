function configurePlayer() {
    jwplayer("myPlayer").setup({
        "playlist": [{
            "sources": [{
                "file": dashUri,
                "drm": {
                    "widevine": {
                        "url": licenseUri,
                        "headers": [{
                            "name": "pallycon-customdata-v2",
                            "value": widevineToken
                        }]
                    },
                    "playready": {
                        "url": licenseUri,
                        "headers": [{
                            "name": "pallycon-customdata-v2",
                            "value": playreadyToken
                        }]
                    }
                }
            }]
        }, {
            "sources": [{
                "file": hlsUri,
                "drm": {
                    "fairplay": {
                        "certificateUrl": fairplayCertDerUri,
                        "extractContentId": function (initDataUri) {
                            const contentId = initDataUri.substring(initDataUri.indexOf('skd://') + 6);
                            return contentId;
                        },
                        "processSpcUrl": licenseUri,
                        "licenseResponseType": "text",
                        "licenseRequestHeaders": [{
                                "name": "Content-type",
                                "value": "application/x-www-form-urlencoded"
                            },
                            {
                                "name": "pallycon-customdata-v2",
                                "value": fairplayToken
                            }
                        ],
                        "licenseRequestMessage": function (message, session) {
                            var payload = "spc=" + base64EncodeUint8Array(message);
                            return payload;
                        },
                        "extractKey": function (response) {
                            console.log('license Response : ', response);
                            return base64DecodeUint8Array(response);
                        },

                    }
                }
            }]
        }]
    });
}

checkBrowser();
configurePlayer();