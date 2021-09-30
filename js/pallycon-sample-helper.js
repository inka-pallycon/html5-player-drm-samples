var browser = 'Non-DRM browser';
var drmType = 'No DRM';

// Replace the DASH and HLS URIs when you test your own content. 
var dashUri = 'https://contents.pallycon.com/bunny/stream.mpd';
var hlsUri = 'https://contents.pallycon.com/bunny/hls/master.m3u8';

var licenseUri = 'https://license-global.pallycon.com/ri/licenseManager.do';

// Replace the DEMO site ID with yours when you test your own FPS content.
var fairplayCertUri = 'https://license-global.pallycon.com/ri/fpsKeyManager.do?siteId=DEMO'; // for base64 encoded binary cert data
var fairplayCertDerUri = 'https://license-global.pallycon.com/ri/fpsCert.do?siteId=DEMO'; // for cert .der file download 

// Create and set the license tokens when you test your own content.
var widevineToken = 'eyJrZXlfcm90YXRpb24iOmZhbHNlLCJyZXNwb25zZV9mb3JtYXQiOiJvcmlnaW5hbCIsInVzZXJfaWQiOiJ0ZXN0LXVzZXIiLCJkcm1fdHlwZSI6IldpZGV2aW5lIiwic2l0ZV9pZCI6IkRFTU8iLCJoYXNoIjoiRFNEQ0JwWmhJYVR5VG1MMzlCXC9Yb2IyNzRobWpWXC9oWEp4T1V0K29hZ1pjPSIsImNpZCI6ImJpZ2J1Y2tidW5ueSIsInBvbGljeSI6Im41eDI4dVltRGRQQ0ZpbW9NM25HTnc9PSIsInRpbWVzdGFtcCI6IjIwMjEtMDEtMDZUMDk6MjI6MzZaIn0=';
var playreadyToken = 'eyJrZXlfcm90YXRpb24iOmZhbHNlLCJyZXNwb25zZV9mb3JtYXQiOiJvcmlnaW5hbCIsInVzZXJfaWQiOiJ0ZXN0LXVzZXIiLCJkcm1fdHlwZSI6IlBsYXlSZWFkeSIsInNpdGVfaWQiOiJERU1PIiwiaGFzaCI6IllDRjViUE9UVHFjZWZDUnlBQks3Rnl0V21mNUJ0T3RhcGo4dVI0QXc2S1E9IiwiY2lkIjoiYmlnYnVja2J1bm55IiwicG9saWN5IjoibjV4Mjh1WW1EZFBDRmltb00zbkdOdz09IiwidGltZXN0YW1wIjoiMjAyMS0wMS0wNlQwOToyNDowN1oifQ==';
var fairplayToken = 'eyJrZXlfcm90YXRpb24iOmZhbHNlLCJyZXNwb25zZV9mb3JtYXQiOiJvcmlnaW5hbCIsInVzZXJfaWQiOiJ0ZXN0LXVzZXIiLCJkcm1fdHlwZSI6IkZhaXJQbGF5Iiwic2l0ZV9pZCI6IkRFTU8iLCJoYXNoIjoiY21NZkZPUExrakErbTVLZ3BKS09vVnVmRTVTc3hKdVlTUm1jUWM1dmlVUT0iLCJjaWQiOiJiaWdidWNrYnVubnkiLCJwb2xpY3kiOiJuNXgyOHVZbURkUENGaW1vTTNuR053PT0iLCJ0aW1lc3RhbXAiOiIyMDIxLTAxLTA2VDA5OjI0OjI4WiJ9';

// Detect the browser and set proper DRM type
function checkBrowser() {
  var agent = navigator.userAgent.toLowerCase(),
    name = navigator.appName,
    browser;

  if (name === 'Microsoft Internet Explorer' || agent.indexOf('trident') > -1 || agent.indexOf('edge/') > -1) {
    browser = 'ie';
    if (name === 'Microsoft Internet Explorer') { // IE old version (IE 10 or Lower)
      agent = /msie ([0-9]{1,}[\.0-9]{0,})/.exec(agent);
      // browser += parseInt(agent[1]);
    } else if (agent.indexOf('edge/') > -1) { // Edge
      browser = 'Edge';
    }
    drmType = "PlayReady";
  } else if (agent.indexOf('safari') > -1) { // Chrome or Safari
    if (agent.indexOf('opr') > -1) { // Opera
      browser = 'Opera';
      drmType = 'Widevine';
    } else if (agent.indexOf('whale') > -1) { // Chrome
      browser = 'Whale';
      drmType = 'Widevine';
    } else if (agent.indexOf('edg/') > -1 || agent.indexOf('Edge/') > -1) { // Chrome
      browser = 'Edge';
      drmType = "PlayReady";
    } else if (agent.indexOf('chrome') > -1) { // Chrome
      browser = 'Chrome';
      drmType = 'Widevine';
    } else { // Safari
      browser = 'Safari';
      drmType = "FairPlay";
    }
  } else if (agent.indexOf('firefox') > -1) { // Firefox
    browser = 'firefox';
    drmType = 'Widevine';
  }

  // The below three lines are for the sample code only. May need to be removed.
  var result = "Running in " + browser + ". " + drmType + " supported.";
  document.getElementById("browserCheckResult").innerHTML = result;
  console.log(result);

  return browser;
}

function arrayToString(array) {
  var uint16array = new Uint16Array(array.buffer);
  return String.fromCharCode.apply(null, uint16array);
}

function arrayBufferToString(buffer) {
  var arr = new Uint8Array(buffer);
  var str = String.fromCharCode.apply(String, arr);
  // if(/[\u0080-\uffff]/.test(str)){
  //     throw new Error("this string seems to contain (still encoded) multibytes");
  // }
  return str;
}

function base64DecodeUint8Array(input) {
  var raw = window.atob(input);
  var rawLength = raw.length;
  var array = new Uint8Array(new ArrayBuffer(rawLength));

  for (i = 0; i < rawLength; i++)
    array[i] = raw.charCodeAt(i);

  return array;
}

function base64EncodeUint8Array(input) {
  var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  var output = "";
  var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
  var i = 0;

  while (i < input.length) {
    chr1 = input[i++];
    chr2 = i < input.length ? input[i++] : Number.NaN;
    chr3 = i < input.length ? input[i++] : Number.NaN;

    enc1 = chr1 >> 2;
    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
    enc4 = chr3 & 63;

    if (isNaN(chr2)) {
      enc3 = enc4 = 64;
    } else if (isNaN(chr3)) {
      enc4 = 64;
    }
    output += keyStr.charAt(enc1) + keyStr.charAt(enc2) +
      keyStr.charAt(enc3) + keyStr.charAt(enc4);
  }
  return output;
}

function getFairplayCert() {
  var xmlhttp;
  if (window.XMLHttpRequest) {
    xmlhttp = new XMLHttpRequest();
  } else {
    xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
  }
  xmlhttp.open("GET", fairplayCertUri, false);
  xmlhttp.send();
  console.log('fpsCert : ', xmlhttp.responseText);
  var fpsCert = shaka.util.Uint8ArrayUtils.fromBase64(xmlhttp.responseText);
  console.log('fpsCert decrypt : ', fpsCert);
  return fpsCert;
}

// global variant to store the name of detected DRM
let supportedDRM = "no support";

// checks which DRM is supported by the browser
function checkSupportedDRM() {
  console.log("checkSupportedDRM start");

  var configCENC = [{
    "initDataTypes": ["cenc"],
    "audioCapabilities": [{
      "contentType": "audio/mp4;codecs=\"mp4a.40.2\""
    }],
    "videoCapabilities": [{
      "contentType": "video/mp4;codecs=\"avc1.42E01E\""
    }]
  }];

  var configFPS = [{
    "audioCapabilities": [{
      "contentType": "audio/mp4;codecs=\"mp4a.40.2\""
    }],
    "videoCapabilities": [{
      "contentType": "video/mp4;codecs=\"avc1.42E01E\""
    }]
  }];

  // Checks if the browser support PlayReady DRM
  try {
    navigator.
    requestMediaKeySystemAccess("com.microsoft.playready", configCENC).
    then(function (mediaKeySystemAccess) {
      console.log('playready support ok');
      supportedDRM = "PlayReady";
      return; // Stops the checking here because we found PlayReady DRM 
    }).catch(function (e) {
      console.log('no playready support');
      console.log(e);
    });
  } catch (e) {
    console.log('no playready support');
    console.log(e);
  }

  // If no PlayReady, checks if there's Widevine DRM
  try {
    navigator.
    requestMediaKeySystemAccess("com.widevine.alpha", configCENC).
    then(function (mediaKeySystemAccess) {
      console.log('widevine support ok');
      supportedDRM = "Widevine";
      return; // Stops when Widevine DRM is found
    }).catch(function (e) {
      console.log('no widevine support');
      console.log(e);
    });
  } catch (e) {
    console.log('no widevine support');
    console.log(e);
  }

  /* Below code doesn't work on Safari browser. Commenting out for later use.
  try {
    navigator.
    requestMediaKeySystemAccess("com.apple.fps.1_0", configFPS).
    then(function (mediaKeySystemAccess) {
      console.log('fairplay support ok');
      supportedDRM = "FairPlay";
      return;
    }).catch(function (e) {
      console.log('no fairplay support');
      console.log(e);
    });
  } catch (e) {
    console.log('no fairplay support');
    console.log(e);
  }
  */

  // Couldn't find either PlaReady nor Widevine.
  // Let's just consider the browser supports FairPlay for now..
  console.log('seems the browser is safari (fairplay supported)');
  supportedDRM = "FairPlay";
}

/* Commenting out the below code since it doesn't work well on Safari

// EME Check
var keySystems = {
  widevine: ['com.widevine.alpha'],
  playready: ['com.microsoft.playready'],
  fairplay: ['com.apple.fairplay', 'com.apple.fps.1_0', 'com.apple.fps.2_0']
};

var keySystemsCount = (function () {
  var count = 0;
  for (keysys in keySystems) {
    if (keySystems.hasOwnProperty(keysys)) {
      count += keySystems[keysys].length;
    }
  }
  return count;
})();

var testVideoElement = document.createElement('video');
var supportedSystems = [];
var unsupportedSystems = [];

var supportsEncryptedMediaExtension = function () {
  if (!testVideoElement.mediaKeys) {
    if (window.navigator.requestMediaKeySystemAccess) {
      if (typeof window.navigator.requestMediaKeySystemAccess === 'function') {
        console.log('found default EME');
        hasEME = true;

        var isKeySystemSupported = function (keySystem) {
          var config = [{
            "initDataTypes": ["cenc"],
            "audioCapabilities": [{
              "contentType": "audio/mp4;codecs=\"mp4a.40.2\""
            }],
            "videoCapabilities": [{
              "contentType": "video/mp4;codecs=\"avc1.42E01E\""
            }]
          }];

          if (window.navigator.requestMediaKeySystemAccess) {
            window.navigator.requestMediaKeySystemAccess(keySystem, config).then(function (keySystemAccess) {
              supportedSystems.push(keySystem);
              supportedDRM = keySystem;
              console.log(`supported drm: ${keySystem}`);
            }).catch(function () {
              unsupportedSystems.push(keySystem);
            });
          }
        };

        var keysys, dummy, i;
        for (keysys in keySystems) {
          if (keySystems.hasOwnProperty(keysys)) {
            for (dummy in keySystems[keysys]) {
              isKeySystemSupported(keySystems[keysys][dummy]);
            }
          }
        }
      }
    } else if (window.MSMediaKeys) {
      if (typeof window.MSMediaKeys === 'function') {
        console.log('found MS-EME');
        hasEME = true;
        var keysys, dummy, i;
        for (keysys in keySystems) {
          if (keySystems.hasOwnProperty(keysys)) {
            for (dummy in keySystems[keysys]) {
              if (MSMediaKeys.isTypeSupported(keySystems[keysys][dummy])) {
                supportedSystems.push(keySystems[keysys][dummy]);
                console.log('playready support ok');
                supportedDRM = "PlayReady";
              } else {
                unsupportedSystems.push(keySystems[keysys][dummy]);
              }
            }
          }
        }
      }
    } else if (testVideoElement.webkitGenerateKeyRequest) {
      if (typeof testVideoElement.webkitGenerateKeyRequest === 'function') {
        console.log('found WebKit EME');
        hasEME = true;
        var keysys, dummy, i;
        for (keysys in keySystems) {
          if (keySystems.hasOwnProperty(keysys)) {
            for (dummy in keySystems[keysys]) {
              if (testVideoElement.canPlayType('video/mp4', keySystems[keysys][dummy])) {
                supportedSystems.push(keySystems[keysys][dummy]);
                console.log('fairplay support ok');
                supportedDRM = "FairPlay";
              } else {
                unsupportedSystems.push(keySystems[keysys][dummy]);
              }
            }
          }
        }
      }
    } else {
      console.log('no supported EME implementation found');
      hasEME = false;
    }
  }
}
*/