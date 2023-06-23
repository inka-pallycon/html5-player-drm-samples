var licenseId;
var config =  {
    // TODO: You need to input your bitmovin license key here.
    key: 'YOUR_BITMOVIN_LICENSE_KEY',
    network: {
        preprocessHttpRequest: function(type, request) {
            // Setting pallycon customData.
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


var source = {
    dash: dashUri,
    drm: {
        widevine: {
            LA_URL: licenseUri,
            mediaKeySystemConfig: {
                persistentState: 'required'
            }
        },
        playready: {
            LA_URL: licenseUri,
        }
    }
};

var container = document.getElementById('my-player');
var player = new bitmovin.player.Player(container, config);

if ('YOUR_BITMOVIN_LICENSE_KEY' === config.key)
    window.alert('To run this sample, you need to input your bitmovin license key in bitmovin-renewal-sample.js file.');



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

// If You Use Token Reset During Playback Suck As CSL or KeyRotation or AirPlay,
// Continue to create new tokens and Set them.
function setCustomData(type, request) {
    if (type === bitmovin.player.HttpRequestType.DRM_LICENSE_WIDEVINE) {
        // let newWidevineToken = '';
        // setWidevineToken(newWidevineToken);
        request.headers['pallycon-customdata-v2'] = widevineToken;
    }
    else if (type === bitmovin.player.HttpRequestType.DRM_LICENSE_PLAYREADY) {
        // let newPlayReadyToken = '';
        // setPlayReadyToken(newPlayReadyToken);
        request.headers['pallycon-customdata-v2'] = playreadyToken;
    }
    else if (type === bitmovin.player.HttpRequestType.DRM_LICENSE_FAIRPLAY) {
        // let newFairPlayToken = '';
        // setFairPlayToken(newFairPlayToken);
        request.headers['pallycon-customdata-v2'] = fairplayToken;
    }
}

checkSupportedDRM().then(()=> {
    checkBrowser();
    player.load(source).then(
        function () {
            console.log('Successfully created Bitmovin Player instance');
            player.play();
        },
        function (reason) {
            console.log('Error while creating Bitmovin Player instance');
        }
    );
})

