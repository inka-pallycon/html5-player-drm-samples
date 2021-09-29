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
            }, {
                "file": hlsUri,
                "drm": {
                    "fairplay": {
                        "certificateUri": "https://license-global.pallycon.com/ri/fpsCert.do?siteId=DEMO", // fairplayCertUri
                        "extractContentId": function (initDataUri) {
                            const contentId = initDataUri.substring(initDataUri.indexOf('skd://') + 6);
                            console.log('extractContentId - initDataUri: ' + initDataUri + ' contentId: ' + contentId);
                            return contentId;
                            /*
                            console.log(initDataUri);
                            var uriParts = initDataUri.split('://', 2);
                            var protocol = uriParts[0].slice(-3);
                            console.log(protocol);
                            var contentId = uriParts[1];
                            return protocol.toLowerCase() == 'skd' ? contentId : '';
                            */
                        },
                        "processSpcUri": licenseUri,
                        "licenseResponseType": "blob",
                        "licenseRequestHeaders": [{
                            "name": "Content-type",
                            "value": "application/octet-stream"
                        }],
                        "licenseRequestMessage": function(message) {
                            console.log('licenseRequestMessage');
                            return new Blob([message], {
                                type: 'application/octet-binary'
                            });
                        },
                        "extractKey": function(response) {
                            return new Promise(function(resolve, reject) {
                                var reader = new FileReader();
                                reader.addEventListener('loadend', function() {
                                    resolve(new Uint8Array(reader.result));
                                });
                                reader.addEventListener('error', function() {
                                    reject(reader.error);
                                });
                                reader.readAsArrayBuffer(response);
                            });
                        },                        
                        /*
                        "licenseResponseType": "text",
                        "licenseRequestHeaders": [{
                            "name": "Content-type",
                            "value": "application/x-www-form-urlencoded"
                        }],
                        "licenseRequestMessage": function(message, session) {
                            console.log('licenseRequestMessage - contentId: '+ this.contentId);
                            console.log('&assetId='+encodeURIComponent(this.contentId));
                            return 'spc='+base64EncodeUint8Array(message)+'&assetId='+encodeURIComponent(this.contentId);
                        },
                        "extractKey": function(ckc) {
                            console.log('extractKey');
                            var base64EncodedKey = ckc.trim();
                            if (base64EncodedKey.substr(0, 5) === '' && base64EncodedKey.substr(-6) === '') {
                                base64EncodedKey = base64EncodedKey.slice(5, -6);
                            }
                            return base64EncodedKey;
                        },
                        */                        
                        "headers": [{
                            "name": "pallycon-customdata-v2",
                            "value": fairplayToken
                        }]
                    }
                }
            }]
        }]
    });
}

function configurePlayer2() {
    jwplayer("myPlayer").setup({
        "playlist": [{
            "sources": [{
                "file": "https://live.unified-streaming.com/scte35/scte35.isml/.mpd"
            }, {
                "file": hlsUri
            }]
        }]
    });
}

checkBrowser();
configurePlayer();