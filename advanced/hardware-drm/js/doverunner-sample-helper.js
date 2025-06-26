var browser = 'Non-DRM browser';
var drmType = 'No DRM';
var supportSl3000 = false;
var supportL1 = false;

// Replace the DASH and HLS URIs when you test your own content. 
var dashUriForHardwareDrm = 'https://drm-contents.doverunner.com/DEMO/app/tearsofsteel-multimanifests/dash/stream_HD.mpd';
var dashUriForSoftwareDrm = 'https://drm-contents.doverunner.com/DEMO/app/tearsofsteel-multimanifests/dash/stream_SD.mpd';
var hlsUri = 'https://drm-contents.doverunner.com/DEMO/app/tearsofsteel-multimanifests/hls/master_HD.m3u8';

var licenseUri = 'https://drm-license.doverunner.com/ri/licenseManager.do';

var widevineCertUri = 'https://drm-license.doverunner.com/ri/widevineCert.do?siteId=DEMO'; // for cert

// Replace the DEMO site ID with yours when you test your own FPS content.
var fairplayCertUri = 'https://drm-license.doverunner.com/ri/fpsKeyManager.do?siteId=DEMO'; // for base64 encoded binary cert data
var fairplayCertDerUri = 'https://drm-license.doverunner.com/ri/fpsCert.do?siteId=DEMO'; // for cert .der file download 

// Create and set the license tokens when you test your own content.
var widevineTokenForSoftwareDrm = 'eyJrZXlfcm90YXRpb24iOmZhbHNlLCJyZXNwb25zZV9mb3JtYXQiOiJvcmlnaW5hbCIsInVzZXJfaWQiOiJ1dSIsImRybV90eXBlIjoid2lkZXZpbmUiLCJzaXRlX2lkIjoiREVNTyIsImhhc2giOiJGYndcL0MwYWNocUkwSXZhWEhcL09xbmR0eTRibFFJQjhkbDhMUURYQXAwMG89IiwiY2lkIjoidGVhcnNvZnN0ZWVsIiwicG9saWN5IjoiOVdxSVdrZGhweFZHSzhQU0lZY25Kc2N2dUE5c3hndWJMc2QrYWp1XC9ib2x5QTB6THVJT0VFNll4MlRiWVdCTG9OaGFjU0ViN0F4c0FVQ3JBQ3VTOFVUSzVIaGo1QXZ4VHhUREhsdFRcL0lvdTJ6XC95QUZCZE5CbDVkK1ByYWxXc2djNlRocEhsRFNHWFYwYWx5cG5iR2UyYkZuQ1wvRGZpbHlUTHVFcFdKZXNMdXd1R05RNHhOVndNT0o1WWxcL3pOc1FkMWY1YyttTWFYRXdleEZrUXRVUG5mdUk2WFdDVlBHWjZcL1NoZFBtbzlWM2FWRTJzMk5HWXgwK0FFcDlCNnVrN2lLcExTSjc5bFVQeHZkTnV4S3psQUlXNzcrUEZadnY0RTZBZ0NKTUk4b3M2XC9manNqanNlaWNCbzNNalM0T1FDNUwxS2VhdDU4K3p2c3FCYlFcL1JSOVhEZ2tieU1zeXlmNWxJUDlxMTBcL0FNREtyMWhXWG5qXC9MYkhqcDU4VVU4aG5WcVBBbk5ja25NVXMrOWNXbWlTTTdwRnFqZU1QMTFGbXBpTzVSeXZ5dE1OWXRreGY3UFBSK29WYTVBbTkxZ0pyWmxYa1JGZmZyeWF0NmtHd0orOSswXC9CSXZXUkQyaDN2WmJuRFdZQUFqND0iLCJ0aW1lc3RhbXAiOiIyMDI1LTAxLTMxVDExOjM1OjM5WiJ9';
var widevineTokenForHardwareDrm = 'eyJrZXlfcm90YXRpb24iOmZhbHNlLCJyZXNwb25zZV9mb3JtYXQiOiJvcmlnaW5hbCIsInVzZXJfaWQiOiJ1dSIsImRybV90eXBlIjoid2lkZXZpbmUiLCJzaXRlX2lkIjoiREVNTyIsImhhc2giOiJ4ODdFVVQ0a1wveW5KTFwva2dHODk3MzhIeWhMMHRqa1ViU2kwaFhwbmpLeEk9IiwiY2lkIjoidGVhcnNvZnN0ZWVsIiwicG9saWN5IjoiOVdxSVdrZGhweFZHSzhQU0lZY25Kc2N2dUE5c3hndWJMc2QrYWp1XC9ib2x5QTB6THVJT0VFNll4MlRiWVdCTG9OaGFjU0ViN0F4c0FVQ3JBQ3VTOFVUSzVIaGo1QXZ4VHhUREhsdFRcL0lvdTJ6XC95QUZCZE5CbDVkK1ByYWxXc2djNlRocEhsRFNHWFYwYWx5cG5iR2UyYkZuQ1wvRGZpbHlUTHVFcFdKZXNMdXd1R05RNHhOVndNT0o1WWxcL3pOc1FkMWY1YyttTWFYRXdleEZrUXRVUG5mdUk2WFdDVlBHWjZcL1NoZFBtbzlWM2FWRTJzMk5HWXgwK0FFcDlCNnVrNysrNURQRmVDYXgwQWQ2MitYaW9FZVwvS1AxVzZPbDRJVkRrcFQzMHBhZWxDTlJsK0hlV250a3BTcFVDNVwvUkFHSGFmYmVETU1DQzQ0K2tCSTlGVlhianZ6MTgycWFoY2tWT2VZMEx2aE9hQVBnYlJpeDVKbFYyMFhTXC9iM0tpcEsxa0NCSFA4NktzM3E4emNCem44ZXZJMDdcL3ZVZ09RclBQeXJtRkp4NmRjY0FXbkJYMkhITlBpdngwMGM4RklMS2preUg2MlNaZG85UGcwK2pHR09wOUs4cHRyRkkzNDFyVVU5UjlkK2JRYktHRDBDVkplSWpSYXhLbzRQMUFFdmFEZHJ0bXdjYXNVU2xScEhPZTZwWlBNWTg2dFMwSko4N0F5ZjUxNTNcL2kxU3hraWRqSWluSEJUcHRiaXhtXC94MVwvdkNRR1FaWithWnJNQmQzNjZTUGlEZkR3TWRLRDlWZ1VYUHhhTjFGMjlxVytrZTd2UkFpa3JBQ01PbXltd25QR1hrdFlCSlJzMm1EUHhpbkgwN240SkUzTDlORUYyNGdFellGeU9kK0hkRXNXTVlOTTlXcmVER1ZRd21wZVhiSDZDK3VxeFZCMEZKSGNxOUNDaytVWTJ0aFBicWRuaHNhelZSWm9odGtXU2ZBbz0iLCJ0aW1lc3RhbXAiOiIyMDI1LTAxLTMxVDEwOjQ3OjMyWiJ9';
var playreadyTokenForSoftwareDrm = 'eyJrZXlfcm90YXRpb24iOmZhbHNlLCJyZXNwb25zZV9mb3JtYXQiOiJvcmlnaW5hbCIsInVzZXJfaWQiOiJ1dSIsImRybV90eXBlIjoicGxheXJlYWR5Iiwic2l0ZV9pZCI6IkRFTU8iLCJoYXNoIjoiNFY2TkZNYUI4T29PY3I4RHE5Z3cxenFKZGNuRFZqRmk3b3lKRFlGc0NCUT0iLCJjaWQiOiJ0ZWFyc29mc3RlZWwiLCJwb2xpY3kiOiI5V3FJV2tkaHB4VkdLOFBTSVljbkpzY3Z1QTlzeGd1YkxzZCthanVcL2Jva0M5UzIreEFQWVJibWZ6OHRvRUIzODRsSjV1XC9mdlV5OVJLc3cwUDRVMzFsU0cxTVliXC80U0F2TW1Cc0hhZjU2TWFCdW9DUzR4UWNnZkxCRGhIWjRRVUVoMXF1TDg1VG1MVGZoSFFVRnNYbUE3a29UOHdoYytXSUNBaHNVNjhkSUwrcncrN1l3SWRtQW40NFJxR2duZmt0dHJjSlIyQkI1cG92MitEU3dTMzIrcnRcL1IydmtNUDhPSmtKTmFDY2k2NzIwMnlrYVwvTDJqNmp0bEg0T1wvejhYeWFZRDBmUEJHVlpUYjBCUURtQU5VZ3NaXC9jZzdrTlllVG1lZW9FNnhaWDA4VVM3VVJCb29xWlpqRDRwcGwyR2NiMDVrYlwvN3E2aUJFNDVsWXArM0d1czdKODdiRW9raTNGU1RZTnlcL1psdjlTYjV6OEo3dGtvY2VqdVZzcmZhdTdoUHFjT09SY1hPUCtjQlc0SVI1cGI3cmNqOFRTZEpXazRjZlZBUVlzaEhiU1lsOFYrMHNTV2gxV3FXeVhCWlwvbmZwdnJDUnM5Q21vQkY0SjZrU0hKSmFKZkhqclF1NE5WYzhaNE9sSGJ6bWFBNUFGNVo1N29jd1kzTDZDMXNGUzFwRkZ6XC9CT3dxa2tpcHhVZERUZFVpT0kwbkxLWmdQRkNoR2pCTmdZbmlxST0iLCJ0aW1lc3RhbXAiOiIyMDI1LTAxLTMxVDExOjM1OjUxWiJ9';
var playreadyTokenForHardwareDrm = 'eyJrZXlfcm90YXRpb24iOmZhbHNlLCJyZXNwb25zZV9mb3JtYXQiOiJvcmlnaW5hbCIsInVzZXJfaWQiOiJ1dSIsImRybV90eXBlIjoicGxheXJlYWR5Iiwic2l0ZV9pZCI6IkRFTU8iLCJoYXNoIjoidlo1aHgrZUoyczRTeEQyOXJid2FFWk1zcEo0TFcwc1ByaUg2aWtUV2w3ST0iLCJjaWQiOiJ0ZWFyc29mc3RlZWwiLCJwb2xpY3kiOiI5V3FJV2tkaHB4VkdLOFBTSVljbkpzY3Z1QTlzeGd1YkxzZCthanVcL2Jva0M5UzIreEFQWVJibWZ6OHRvRUIzODRsSjV1XC9mdlV5OVJLc3cwUDRVMzFsU0cxTVliXC80U0F2TW1Cc0hhZjU2TWFCdW9DUzR4UWNnZkxCRGhIWjRRVUVoMXF1TDg1VG1MVGZoSFFVRnNYbUE3a29UOHdoYytXSUNBaHNVNjhkSUwrcncrN1l3SWRtQW40NFJxR2duZmt0dHJjSlIyQkI1cG92MitEU3dTMzIrcnRcL1IydmtNUDhPSmtKTmFDY2k2NzIwMnlrYVwvTDJqNmp0bEg0T1wvejhYeWFZRDBmUEJHVlpUYjBCUURtQU5VZ3NaXC9jZzdrTlllVG1lZW9FNnhaWDA4VVM3VVJCb29xWlpqRDRwcGwyR2NKZFBCNjlsekJzRngzUks2QTEyME9YME16UFFSUkI5blcySXJRSUNFTzMxOHJHb3dFWmdkUE5lRU5SVHhXXC91UTFVQkthajl4WWVaR055dGFMbXJZVDlla1lkNGhqYzdrWmlKMTF3S284SDF4d1RUVVkyb1VMNGN0TjNsSExOSTRHWU1DM0VQTlFrY2FBUUNrcUErMjhYc2FhdTFYUG5xWVlRTW42USt1NkJiTVwvNVYzWHh2ZFNXNzdmcWVBdzZ3emVUWUM5bm93Qnk5THVkRGxDWmpXMVNLblRxT3VRclNzRm9CR21OSVR1Z0R5QjNGZEdpaXNMNFB2N2NqbWxEUlN1UVRUekxaVWt4UDZhaXBRMitpWlczeit0RTUrNUhrRUpcL1cxNFhXdU9Cb2FLbUd2QXZlZ0JaRWx0QTFLOVJqYXQ1THVjMDZtblQ4cDFZbDcwTE11YUk2eGwraWV1VndjTHkyNGxvaGRTV2FRMmNJbFwvRFp0bE83N3hVMHFrRmdScmdrOWdlN3BnemEwVDJYYUU3TVEwbHl3ZStPaTJ1ZHJLd1lRQXREVmx4UEhZYTZUY3VoSTdwWmxoU00zbTk5UnFMQzNnNEJiWTFjcStkUnJCZGdJRjJWNWV5MkRpYmpFaG9FcEhRVDg2c3BlQkl4Um5id25hQnpFQk91ZU1ab09ZMDF0Nnc0SDF2R3ZIVmZkMThJT2FnPT0iLCJ0aW1lc3RhbXAiOiIyMDI1LTAxLTMxVDEwOjQ4OjA0WiJ9';
var fairplayToken = 'eyJrZXlfcm90YXRpb24iOmZhbHNlLCJyZXNwb25zZV9mb3JtYXQiOiJvcmlnaW5hbCIsInVzZXJfaWQiOiJ1dSIsImRybV90eXBlIjoiZmFpcnBsYXkiLCJzaXRlX2lkIjoiREVNTyIsImhhc2giOiJubW9sMmJ3VEcycVNwR2tPdXpcLzBtVFc4eExMemdrTnRlaWNXYmhDNjZVMD0iLCJjaWQiOiJ0ZWFyc29mc3RlZWwiLCJwb2xpY3kiOiI5V3FJV2tkaHB4VkdLOFBTSVljbkpzY3Z1QTlzeGd1YkxzZCthanVcL2JvbVFaUGJxSSt4YWVZZlFvY2NrdnVFZnhEY2NtN2NXZFZYcXJkTWdBUWptcVo5bzdYTEZ6MjBOaG1Kdklpd1FidWhLaCtDMmZJSEw5T3UxU09Bc2hQU0FWZHhhWVVKSnJsWjVVMXU1UGNlcjE0NVpCczdnc3ZRc0lsbDlGVHZXanQ3bWhaOHJ3ejdybVNYcURBdEdqYTRsYmVrUnhcL1pyRWx4dkJhWXV0YWFvdVlISWpkNlZpRWVXZEVpRzJIV0VIMGczcW1LYW1QbUp2VUluN0tVODZrUDQiLCJ0aW1lc3RhbXAiOiIyMDI1LTAxLTMxVDEwOjM5OjA5WiJ9';

function setWidevineToken(newWidevineToken) {
  widevineToken = newWidevineToken;
}

function setPlayReadyToken(newPlayReadyToken) {
  playreadyToken = newPlayReadyToken;
}

function setFairPlayToken(newFairPlayToken) {
  fairplayToken = newFairPlayToken;
}

// Detect the browser and set proper DRM type
function checkBrowser() {
  const agent = navigator.userAgent.toLowerCase();
  const name = navigator.appName;
  let detectedBrowser = 'Unknown';

  if (name === 'Microsoft Internet Explorer' || agent.includes('trident') || agent.includes('edge/')) {
    detectedBrowser = agent.includes('edge/') ? 'Edge' : 'IE';
  } else if (agent.includes('safari')) {
    if (agent.includes('opr')) detectedBrowser = 'Opera';
    else if (agent.includes('whale')) detectedBrowser = 'Whale';
    else if (agent.includes('edg/') || agent.includes('Edge/')) detectedBrowser = 'Edge';
    else if (agent.includes('chrome')) detectedBrowser = 'Chrome';
    else detectedBrowser = 'Safari';
  } else if (agent.includes('firefox')) {
    detectedBrowser = 'Firefox';
  }

  browser = detectedBrowser;
  const result = `Running in ${browser}. ${drmType} supported.`;
  const browserCheckElement = document.getElementById('browserCheckResult');
  if (browserCheckElement) browserCheckElement.innerHTML = result;
  console.log(result);

  return browser;
}

function isWindowsChrome() {
  return navigator.userAgent.indexOf("Windows") > -1 && navigator.userAgent.indexOf("Chrome") > -1;
}

// Request media key system access
async function tryKeySystemAccess(keySystem, config) {
  try {
      await navigator.requestMediaKeySystemAccess(keySystem, config);
      return true;
  } catch {
      return false;
  }
}

// Base EME configuration
const baseEmeConfig = [{
  initDataTypes: ['cenc'],
  videoCapabilities: [{
      contentType: 'video/mp4;codecs="avc1.42E01E"'
  }],
  audioCapabilities: [{
      contentType: 'audio/mp4;codecs="mp4a.40.2"'
  }]
}];

// Create EME config with robustness
function createEmeConfigWithRobustness(videoRobustness, audioRobustness) {
  return [{
      ...baseEmeConfig[0],
      videoCapabilities: [{
          ...baseEmeConfig[0].videoCapabilities[0],
          robustness: videoRobustness
      }],
      audioCapabilities: [{
          ...baseEmeConfig[0].audioCapabilities[0],
          robustness: audioRobustness
      }]
  }];
}

async function getWidevineHighestSecurityConfig() {
  const keySystems = isWindowsChrome() ? 
      ['com.widevine.alpha.experiment', 'com.widevine.alpha'] : 
      ['com.widevine.alpha'];

  // Widevine robustness levels in descending order
  const robustnessLevels = [
    'HW_SECURE_ALL',
    'HW_SECURE_DECODE', 
    'HW_SECURE_CRYPTO',
    'SW_SECURE_DECODE',
    'SW_SECURE_CRYPTO'
  ];

  // Try with robustness levels
  for (const keySystem of keySystems) {
    for (const videoRobustness of robustnessLevels) {
        for (const audioRobustness of robustnessLevels) {
            const succeed = await tryKeySystemAccess(
                keySystem, 
                createEmeConfigWithRobustness(videoRobustness, audioRobustness)
            );
            
            if (succeed) {
                if (videoRobustness.startsWith('HW_SECURE_') || audioRobustness.startsWith('HW_SECURE_')) {
                    supportL1 = true;
                }
                return { keySystem, videoRobustness, audioRobustness };
            }
        }
    }
  }

  // Try without robustness if all failed
  for (const keySystem of keySystems) {
    const succeed = await tryKeySystemAccess(keySystem, baseEmeConfig);
    if (succeed) {
        return { keySystem, videoRobustness: null, audioRobustness: null };
    }
  }

  return null;
}

async function checkSupportedDRM() {
  const drm = {
      Widevine: { name: 'Widevine', mediaKey: 'com.widevine.alpha' },
      PlayReady: { name: 'PlayReady', mediaKey: 'com.microsoft.playready' },
      FairPlay: { name: 'FairPlay', mediaKey: 'com.apple.fps.1_0' }
  };

  for (const key in drm) {
      try {
          const supported = await tryKeySystemAccess(drm[key].mediaKey, baseEmeConfig);
          if (supported) {
              drmType = drm[key].name;
              console.log(`${drmType} support ok`);

              if (drm[key].name === 'PlayReady') {
                supportSl3000 = await tryKeySystemAccess('com.microsoft.playready.recommendation.3000', baseEmeConfig);
              }
          }
      } catch (e) {
          console.log(`${key} :: ${e}`);
      }
  }
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

  var fpsCert = shaka.util.Uint8ArrayUtils.fromBase64(xmlhttp.responseText);
  return fpsCert;
}

// get widevine certificate binary data
async function getWidevineCertBinary() {
  let widevineCert;
  const response = await fetch(widevineCertUri);
  await response.body
      .getReader()
      .read()
      .then((res) => {
        widevineCert = new Uint8Array(res.value);
      });

  return widevineCert;
}

// get widevine certificate base64 encoded data
async function getWidevineCertBase64() {
  let widevineCert;
  const response = await fetch(widevineCertUri);
  await response.body
      .getReader()
      .read()
      .then((res) => {
        widevineCert = btoa(String.fromCharCode(...new Uint8Array(res.value)))
      });
  return widevineCert;
}