// TODO: You need to set your THEOplayer license key here.
let theoplayerKey = "YOUR_THEOPLAYER_LICENSE_KEY";

function configurePlayer() {
    var element = document.querySelector(".my-player");
    var player = new THEOplayer.Player(element, {
        libraryLocation: "https://cdn.theoplayer.com/dash/theoplayer/",
        license: theoplayerKey
    });

    if ('FairPlay' === drmType) {
        player.network.addResponseInterceptor(function (response) {
            if (response.url == fairplayCertUri) {
                let rawResponse = response.body;
                var responseText = String.fromCharCode.apply(null, new Uint8Array(rawResponse));
                var raw = window.atob(responseText);
                var rawLength = raw.length;
                var certificate = new Uint8Array(new ArrayBuffer(rawLength));
    
                for (var i = 0; i < rawLength; i++)
                    certificate[i] = raw.charCodeAt(i);
                response.respondWith({
                    body: certificate
                })
            }
        });
    
        let drmConfiguration = {
            fairplay: {
                headers: {
                    'pallycon-customdata-v2': fairplayToken
                },
                licenseAcquisitionURL: licenseUri,
                certificateURL: fairplayCertUri
            }    
        };

        player.source = {
            sources: {
                // FPS
                src: hlsUri,
                type: 'application/x-mpegurl',
                contentProtection: drmConfiguration
            }
        }
    } else {
        let drmConfiguration = {
            playready: {
                headers: {
                    'pallycon-customdata-v2': playreadyToken
                },
                licenseAcquisitionURL: licenseUri
            },
            widevine: {
                headers: {
                    'pallycon-customdata-v2': widevineToken
                },
                licenseAcquisitionURL: licenseUri
            }        
        };

        player.source = {
            sources: {
                // DASH
                src: dashUri,
                type: 'application/dash+xml',
                contentProtection: drmConfiguration
            }
        };
    } 

    player.autoplay = true;
}

checkBrowser();
configureDRM();

if ('YOUR_THEOPLAYER_LICENSE_KEY' === theoplayerKey)
    window.alert('To run this sample, you need to input your theoplayer license key in theoplayer-sample.js file.');
