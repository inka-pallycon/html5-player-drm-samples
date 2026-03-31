let licenseId;
const config = {
    // TODO: You need to input your bitmovin license key here.
    key: 'YOUR_BITMOVIN_LICENSE_KEY',
    network: {
        preprocessHttpRequest: function(type, request) {
            // Setting doverunner customData.
            setCustomData(type, request);
            return Promise.resolve(request);
        },
        preprocessHttpResponse: function(type, response) {
            if (type === bitmovin.player.HttpRequestType.DRM_LICENSE_PLAYREADY) {
                
                // Something to extracts expiration dates.
                setTimeout(() => {player.drm.renewLicense(licenseId)}, 600000);  // TODO set Renewal Interval milliseconds ( 10 minute )

            }
        }
    }
}


const source = {
    dash: dashUri,
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
        }
    }
};

const container = document.getElementById('my-player');
const player = new bitmovin.player.Player(container, config);

// Check supported DRM type
if (activeDrm.type === 'FairPlay') {
    console.error('This sample does not support FairPlay DRM.');
    document.getElementById('browserCheckResult').innerHTML = 'Error: FairPlay DRM is not supported for this sample.';
    throw new Error('Unsupported DRM type');
}

if ('YOUR_BITMOVIN_LICENSE_KEY' === config.key && location.hostname !== 'localhost') {
    window.alert('To run this sample, you need to input your bitmovin license key in bitmovin-renewal-sample.js file.');
}



player.on(bitmovin.player.PlayerEvent.Playing, function () {
    console.log('player is playing')

});

player.on(bitmovin.player.PlayerEvent.PlaybackFinished, function () {
    console.log('player is PlaybackFinished')
});

player.on(bitmovin.player.PlayerEvent.DrmLicenseAdded, function(drmLicense){
    licenseId = drmLicense.license.id;
    console.log('DrmLicenseAdded ');
});

// If You Use Token Reset During Playback Such As CSL or KeyRotation or AirPlay,
// Continue to create new tokens and Set them.
function setCustomData(type, request) {
    if (type === bitmovin.player.HttpRequestType.DRM_LICENSE_WIDEVINE) {
        // let newWidevineToken = '';
        // setWidevineToken(newWidevineToken);
        request.headers['pallycon-customdata-v2'] = widevineToken;
    } else if (type === bitmovin.player.HttpRequestType.DRM_LICENSE_PLAYREADY) {
        // let newPlayReadyToken = '';
        // setPlayReadyToken(newPlayReadyToken);
        request.headers['pallycon-customdata-v2'] = playreadyToken;
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