var config = {
    // TODO: You need to input your bitmovin license key here.
    key: 'YOUR_BITMOVIN_LICENSE_KEY'
}

var source = {
    dash: dashUri,
    hls: hlsUri,
    drm: {
        widevine: {
            LA_URL: licenseUri,
            headers: {
                'pallycon-customdata-v2': widevineToken
            }
        },
        playready: {
            LA_URL: licenseUri,
            headers: {
                'pallycon-customdata-v2': playreadyToken
            }
        },
        fairplay: {
            LA_URL: licenseUri,
            certificateURL: fairplayCertUri,
            headers: {
                'pallycon-customdata-v2': fairplayToken
            },
            prepareContentId: function (contentId) {
                return contentId.substring(contentId.indexOf('skd://') + 6);
            },
            prepareCertificate: function (rawResponse) {
                var responseText = String.fromCharCode.apply(null, new Uint8Array(rawResponse));
                var raw = window.atob(responseText);
                var rawLength = raw.length;
                var certificate = new Uint8Array(new ArrayBuffer(rawLength));

                for (var i = 0; i < rawLength; i++)
                    certificate[i] = raw.charCodeAt(i);

                return certificate;
            },
            useUint16InitData: true
        }
    }
};

var container = document.getElementById('my-player');
var player = new bitmovin.player.Player(container, config);

if ('YOUR_BITMOVIN_LICENSE_KEY' === config.key)
    window.alert('To run this sample, you need to input your bitmovin license key in bitmovin-sample.js file.');

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