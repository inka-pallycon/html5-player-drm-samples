var browser = 'Non-DRM browser';
var drmType = 'No DRM';

// Replace the DASH and HLS URIs when you test your own content. 
var dashUri = 'https://drm-contents.doverunner.com/DEMO/app/big_buck_bunny/dash/stream.mpd';
var hlsUri = 'https://drm-contents.doverunner.com/DEMO/app/big_buck_bunny/hls/master.m3u8';

var licenseUri = 'https://drm-license.doverunner.com/ri/licenseManager.do';

var widevineCertUri = 'https://drm-license.doverunner.com/ri/widevineCert.do?siteId=DEMO'; // for cert

// Replace the DEMO site ID with yours when you test your own FPS content.
var fairplayCertUri = 'https://drm-license.doverunner.com/ri/fpsKeyManager.do?siteId=DEMO'; // for base64 encoded binary cert data
var fairplayCertDerUri = 'https://drm-license.doverunner.com/ri/fpsCert.do?siteId=DEMO'; // for cert .der file download 

// Create and set the license tokens when you test your own content.
var widevineToken = 'eyJrZXlfcm90YXRpb24iOmZhbHNlLCJyZXNwb25zZV9mb3JtYXQiOiJvcmlnaW5hbCIsInVzZXJfaWQiOiJ1dSIsImRybV90eXBlIjoid2lkZXZpbmUiLCJzaXRlX2lkIjoiREVNTyIsImhhc2giOiI3MGhpMHcwbmFNUHM2c0hiMHYxS1lvbXFxVkZNYzJ6XC96Z1VoWlRJVlN0Yz0iLCJjaWQiOiJkZW1vLWJiYi1zaW1wbGUiLCJwb2xpY3kiOiI5V3FJV2tkaHB4VkdLOFBTSVljbkpzY3Z1QTlzeGd1YkxzZCthanVcL2JvbVFaUGJxSSt4YWVZZlFvY2NrdnVFZnhEY2NtN2NXZFZYcXJkTWdBUWptcVo5bzdYTEZ6MjBOaG1Kdklpd1FidWhLaCtDMmZJSEw5T3UxU09Bc2hQU0FWZHhhWVVKSnJsWjVVMXU1UGNlcjE0NVpCczdnc3ZRc0lsbDlGVHZXanQ3bWhaOHJ3ejdybVNYcURBdEdqYTRsYmVrUnhcL1pyRWx4dkJhWXV0YWFvdVlISWpkNlZpRWVXZEVpRzJIV0VIMGczcW1LYW1QbUp2VUluN0tVODZrUDQiLCJ0aW1lc3RhbXAiOiIyMDI1LTAxLTMxVDAyOjA2OjM4WiJ9';
var playreadyToken = 'eyJrZXlfcm90YXRpb24iOmZhbHNlLCJyZXNwb25zZV9mb3JtYXQiOiJvcmlnaW5hbCIsInVzZXJfaWQiOiJ1dSIsImRybV90eXBlIjoicGxheXJlYWR5Iiwic2l0ZV9pZCI6IkRFTU8iLCJoYXNoIjoiamtncG1YY09QMG9wVnBOQ0xNd0JtWSs1MTlnNFpncFpnYVlsME9xcHdMdz0iLCJjaWQiOiJkZW1vLWJiYi1zaW1wbGUiLCJwb2xpY3kiOiI5V3FJV2tkaHB4VkdLOFBTSVljbkpzY3Z1QTlzeGd1YkxzZCthanVcL2JvbVFaUGJxSSt4YWVZZlFvY2NrdnVFZnhEY2NtN2NXZFZYcXJkTWdBUWptcVo5bzdYTEZ6MjBOaG1Kdklpd1FidWhLaCtDMmZJSEw5T3UxU09Bc2hQU0FWZHhhWVVKSnJsWjVVMXU1UGNlcjE0NVpCczdnc3ZRc0lsbDlGVHZXanQ3bWhaOHJ3ejdybVNYcURBdEdqYTRsYmVrUnhcL1pyRWx4dkJhWXV0YWFvdVlISWpkNlZpRWVXZEVpRzJIV0VIMGczcW1LYW1QbUp2VUluN0tVODZrUDQiLCJ0aW1lc3RhbXAiOiIyMDI1LTAxLTMxVDAyOjA2OjI3WiJ9';
var fairplayToken = 'eyJrZXlfcm90YXRpb24iOmZhbHNlLCJyZXNwb25zZV9mb3JtYXQiOiJvcmlnaW5hbCIsInVzZXJfaWQiOiJ1dSIsImRybV90eXBlIjoiZmFpcnBsYXkiLCJzaXRlX2lkIjoiREVNTyIsImhhc2giOiJJYTdobWpGY3NxekN6dGUzTW0wdnlLaFZnZXRvZ256OWs3QkVRK3hcL3Vtaz0iLCJjaWQiOiJkZW1vLWJiYi1zaW1wbGUiLCJwb2xpY3kiOiI5V3FJV2tkaHB4VkdLOFBTSVljbkpzY3Z1QTlzeGd1YkxzZCthanVcL2JvbVFaUGJxSSt4YWVZZlFvY2NrdnVFZnhEY2NtN2NXZFZYcXJkTWdBUWptcVo5bzdYTEZ6MjBOaG1Kdklpd1FidWhLaCtDMmZJSEw5T3UxU09Bc2hQU0FWZHhhWVVKSnJsWjVVMXU1UGNlcjE0NVpCczdnc3ZRc0lsbDlGVHZXanQ3bWhaOHJ3ejdybVNYcURBdEdqYTRsYmVrUnhcL1pyRWx4dkJhWXV0YWFvdVlISWpkNlZpRWVXZEVpRzJIV0VIMGczcW1LYW1QbUp2VUluN0tVODZrUDQiLCJ0aW1lc3RhbXAiOiIyMDI1LTAxLTMxVDAyOjA2OjU0WiJ9';

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

async function checkSupportedDRM() {
  const drm = {
      Widevine: { name: 'Widevine', mediaKey: 'com.widevine.alpha' },
      PlayReady: { name: 'PlayReady', mediaKey: 'com.microsoft.playready' },
      FairPlay: { name: 'FairPlay', mediaKey: 'com.apple.fps' }
  };
  
  const baseEmeConfig = [{
    initDataTypes: ['cenc'],
    videoCapabilities: [{
        contentType: 'video/mp4;codecs="avc1.42E01E"'
    }],
    audioCapabilities: [{
        contentType: 'audio/mp4;codecs="mp4a.40.2"'
    }]
  }];

  for (const key in drm) {
      try {
          await navigator.requestMediaKeySystemAccess(drm[key].mediaKey, baseEmeConfig);
          // If the requestMediaKeySystemAccess succeeds, we can assume the browser supports this DRM.
          drmType = drm[key].name;
          console.log(`${drmType} support ok`);
      } catch (e) {
          console.log(`${key} :: ${e}`);
      }
  }
}

function getFairplayCert() {
  let xmlhttp;
  if (window.XMLHttpRequest) {
    xmlhttp = new XMLHttpRequest();
  } else {
    xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
  }
  xmlhttp.open("GET", fairplayCertUri, false);
  xmlhttp.send();

  let fpsCert = shaka.util.Uint8ArrayUtils.fromBase64(xmlhttp.responseText);
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

// Striung util functions
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

function uInt8ArrayToString(array) {
    return String.fromCharCode.apply(null, array);
}

function stringToUInt8Array(str)
{
    return Uint8Array.from(str, c => c.charCodeAt(0));
}

function base64EncodeUint8Array(input) {
    return btoa(uInt8ArrayToString(input));
}

function base64DecodeUint8Array(input) {
  var raw = window.atob(input);
  var rawLength = raw.length;
  var array = new Uint8Array(new ArrayBuffer(rawLength));

  for (i = 0; i < rawLength; i++)
    array[i] = raw.charCodeAt(i);

  return array;
}