// TODO: You need to input your Radiant Media Player license key here.
let radiantKey = "RADIANTKEY";

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

function configurePlayer() {    
    let settings = {
        licenseKey: radiantKey,
        autoHeightMode: true,
        autoHeightModeRatio: 1.77,
    };

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
    const elementID = 'my-player';
    const rmp = new RadiantMP(elementID);
    rmp.init(settings);
};

checkBrowser();
configurePlayer();

if ('RADIANTKEY' === radiantKey)
    window.alert('To run this sample, you need to input your Radiant Media Player license key in radiant-sample.js file.');
