const config = [{
    "initDataTypes": ["cenc"],
    "audioCapabilities": [{
        "contentType": "audio/mp4;codecs=\"mp4a.40.2\""
    }],
    "videoCapabilities": [{
        "contentType": "video/mp4;codecs=\"avc1.42E01E\""
    }]
}];
const extractContentId = function (initData) {
    const contentId = arrayToString(initData);
    return contentId.substring(contentId.indexOf('skd://') + 6);
};

function configureDRM() {
    if('FairPlay' === drmType){
        initPlayer('FairPlay');
    }else{
        checkWidevineSupport();
    }
}
// We need to test what DRM is supported (Widevine first, PlayReady second)
// Based on the result of that detection we will init the player with the correct DRM token
const prepareCertificate = function (rawResponse) {
    const responseText = String.fromCharCode.apply(null, new Uint8Array(rawResponse));
    const raw = window.atob(responseText);
    const rawLength = raw.length;
    const certificate = new Uint8Array(new ArrayBuffer(rawLength));
    for (let i = 0; i < rawLength; i++) {
        certificate[i] = raw.charCodeAt(i);
    }
    return certificate;
};

const initPlayer = function (drmType) {
    let settings = {
        licenseKey: '',
        autoHeightMode: true,
        autoHeightModeRatio: 1.77,
    };
    console.log(drmType);
    if('FairPlay' === drmType) {
        settings.src = {fps: hlsUri};
        settings.fpsDrm = {
            certificatePath: fairplayCertUri,
            prepareCertificate: prepareCertificate,
            processSpcPath: licenseUri,
            licenseRequestHeaders: [
                {
                    name: 'pallycon-customdata-v2',
                    value: fairplayToken
                },
                {
                    name: 'Content-type',
                    value: 'application/x-www-form-urlencoded'
                }
            ],
            extractContentId: extractContentId
        }
    }else if ('Widevine' === drmType) {
        settings.src = {dash: dashUri};
        settings.shakaDrm = {
            servers: {
                "com.widevine.alpha": licenseUri
            }
        };
        settings.shakaRequestConfiguration = {
            license: {
                headers: {
                    'pallycon-customdata-v2': widevineToken
                }
            }
        };
    } else if ('PlayReady' === drmType) {
        settings.src = {dash: dashUri};
        settings.shakaDrm = {
            servers: {
                "com.microsoft.playready": licenseUri
            }
        };
        settings.shakaRequestConfiguration = {
            license: {
                headers: {
                    'pallycon-customdata-v2': playreadyToken
                }
            }
        };
    }
    console.log('settings : ', settings);
    const elementID = 'my-player';
    const rmp = new RadiantMP(elementID);
    rmp.init(settings);
};

const checkPlayReadySupport = function () {
    navigator.
    requestMediaKeySystemAccess("com.microsoft.playready", config).
    then(mediaKeySystemAccess => {
        console.log('PlayReady DRM is supported');
        initPlayer('PlayReady');
    }).catch(e => {
        console.log('PlayReady DRM is NOT supported');
        console.log(e);
    });
};

const checkWidevineSupport = function () {
    if (typeof navigator.requestMediaKeySystemAccess === 'function') {
        navigator.
        requestMediaKeySystemAccess("com.widevine.alpha", config).
        then(mediaKeySystemAccess => {
            console.log('Widevine DRM is supported');
            initPlayer('Widevine');
        }).catch(e => {
            console.log('Widevine DRM is NOT supported - checking for PlayReady DRM');
            console.log(e);
            checkPlayReadySupport();
        });
    } else {
        console.log('Missing requestMediaKeySystemAccess support');
    }
};

checkBrowser();
configureDRM();
