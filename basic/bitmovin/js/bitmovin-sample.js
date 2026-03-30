const config = {
    // TODO: You need to input your bitmovin license key here.
    key: 'YOUR_BITMOVIN_LICENSE_KEY',
    network: {
        preprocessHttpRequest: function(type, request) {
            // Setting doverunner customData.
            setCustomData(type, request);
            return Promise.resolve(request);
        }
    }
};

const source = {
    dash: dashUri,
    hls: hlsUri,
    drm: {
        widevine: {
            LA_URL: licenseUri,
            mediaKeySystemConfig: {
                persistentState: 'required',
            },
            serverCertificate: ''
        },
        playready: {
            LA_URL: licenseUri,
        },
        fairplay: {
            LA_URL: licenseUri,
            certificateURL: fairplayCertUri,
            prepareContentId: function (contentId) {
                return contentId.substring(contentId.indexOf('skd://') + 6);
            },
            prepareCertificate: function (rawResponse) {
                const responseText = String.fromCharCode.apply(null, new Uint8Array(rawResponse));
                const raw = window.atob(responseText);
                const rawLength = raw.length;
                const certificate = new Uint8Array(new ArrayBuffer(rawLength));

                for (let i = 0; i < rawLength; i++)
                    certificate[i] = raw.charCodeAt(i);

                return certificate;
            },
            useUint16InitData: true
        }
    }
};

const container = document.getElementById('my-player');
const player = new bitmovin.player.Player(container, config);

function isLocalEnvironment() {
    const hostname = location.hostname;
    return hostname === 'localhost' ||
           hostname === '127.0.0.1' ||
           hostname.startsWith('192.168.') ||
           hostname.startsWith('10.') ||
           location.protocol === 'file:';
}

if ('YOUR_BITMOVIN_LICENSE_KEY' === config.key && !isLocalEnvironment()) {
    window.alert('To run this sample, you need to input your bitmovin license key in bitmovin-sample.js file.');
}

// If You Use Token Reset During Playback Such As CSL or KeyRotation or AirPlay,
// Continue to create new tokens and Set them.
function setCustomData(type, request) {
    if (type === bitmovin.player.HttpRequestType.DRM_LICENSE_WIDEVINE) {
        // const newWidevineToken = '';
        // setWidevineToken(newWidevineToken);
        request.headers['pallycon-customdata-v2'] = widevineToken;
    }
    else if (type === bitmovin.player.HttpRequestType.DRM_LICENSE_PLAYREADY) {
        // const newPlayReadyToken = '';
        // setPlayReadyToken(newPlayReadyToken);
        request.headers['pallycon-customdata-v2'] = playreadyToken;
    }
    else if (type === bitmovin.player.HttpRequestType.DRM_LICENSE_FAIRPLAY) {
        // const newFairPlayToken = '';
        // setFairPlayToken(newFairPlayToken);
        request.headers['pallycon-customdata-v2'] = fairplayToken;
    }
}

player.load(source).then(
    function () {
        console.log('Successfully created Bitmovin Player instance');
        player.play();
    },
    function (reason) {
        console.log('Error while creating Bitmovin Player instance');
    }
);
