// TODO: You need to set your THEOplayer license key here.
let theoplayerKey = "YOUR_THEOPLAYER_LICENSE_KEY";

async function configurePlayer() {
    const element = document.querySelector(".my-player");
    const player = new THEOplayer.Player(element, {
        libraryLocation: "https://cdn.theoplayer.com/dash/theoplayer/",
        license: theoplayerKey
    });

    if ('FairPlay' === activeDrm.type) {
        player.network.addResponseInterceptor(function (response) {
            if (response.url == fairplayCertUri) {
                const rawResponse = response.body;
                const responseText = String.fromCharCode.apply(null, new Uint8Array(rawResponse));
                const raw = window.atob(responseText);
                const rawLength = raw.length;
                const certificate = new Uint8Array(new ArrayBuffer(rawLength));

                for (let i = 0; i < rawLength; i++)
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
        let drmConfiguration = {};
        if ('PlayReady' === activeDrm.type) {
            drmConfiguration = {
                playready: {
                    headers: {
                        'pallycon-customdata-v2': playreadyToken
                    },
                    licenseAcquisitionURL: licenseUri
                }
            };
        } else if ('Widevine' === activeDrm.type) {
            const widevineCert = await getWidevineCertBinary();
            drmConfiguration = {
                widevine: {
                    headers: {
                        'pallycon-customdata-v2': widevineToken
                    },
                    licenseAcquisitionURL: licenseUri,
                    certificate: widevineCert
                }
            };
        }

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

checkSupportedDRM().then(() => {
    checkBrowser();
    configurePlayer();
})

if ('YOUR_THEOPLAYER_LICENSE_KEY' === theoplayerKey)
    window.alert('To run this sample, you need to input your theoplayer license key in theoplayer-sample.js file.');
