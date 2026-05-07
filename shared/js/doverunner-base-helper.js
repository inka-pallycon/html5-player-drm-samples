// =====================================================
// DoveRunner Multi-DRM Sample Base Helper
// =====================================================

// Active DRM system detected by checkSupportedDRM()
// - activeDrm.type: 'FairPlay', 'PlayReady', 'Widevine'
// - activeDrm.keySystem: 'com.apple.fps', 'com.microsoft.playready.recommendation.3000', etc.
let activeDrm = { type: 'No DRM', keySystem: '' };

// Replace the DASH and HLS URIs when you test your own content.
const cmafUri = 'https://drm-contents.doverunner.com/DEMO/app/big_buck_bunny/cmaf/master.m3u8';
const dashUri = 'https://drm-contents.doverunner.com/DEMO/app/big_buck_bunny/dash/stream.mpd';
const hlsUri = 'https://drm-contents.doverunner.com/DEMO/app/big_buck_bunny/hls/master.m3u8';

const licenseUri = 'https://drm-license.doverunner.com/ri/licenseManager.do';

const widevineCertUri = 'https://drm-license.doverunner.com/ri/widevineCert.do?siteId=DEMO'; // for cert

// Replace the DEMO site ID with yours when you test your own FPS content.
const fairplayCertUri = 'https://drm-license.doverunner.com/ri/fpsKeyManager.do?siteId=DEMO'; // for base64 encoded binary cert data
const fairplayCertDerUri = 'https://drm-license.doverunner.com/ri/fpsCert.do?siteId=DEMO'; // for cert .der file download

// Create and set the license tokens when you test your own content.
let widevineToken = 'eyJrZXlfcm90YXRpb24iOmZhbHNlLCJyZXNwb25zZV9mb3JtYXQiOiJvcmlnaW5hbCIsInVzZXJfaWQiOiJ1dSIsImRybV90eXBlIjoid2lkZXZpbmUiLCJzaXRlX2lkIjoiREVNTyIsImhhc2giOiI3MGhpMHcwbmFNUHM2c0hiMHYxS1lvbXFxVkZNYzJ6XC96Z1VoWlRJVlN0Yz0iLCJjaWQiOiJkZW1vLWJiYi1zaW1wbGUiLCJwb2xpY3kiOiI5V3FJV2tkaHB4VkdLOFBTSVljbkpzY3Z1QTlzeGd1YkxzZCthanVcL2JvbVFaUGJxSSt4YWVZZlFvY2NrdnVFZnhEY2NtN2NXZFZYcXJkTWdBUWptcVo5bzdYTEZ6MjBOaG1Kdklpd1FidWhLaCtDMmZJSEw5T3UxU09Bc2hQU0FWZHhhWVVKSnJsWjVVMXU1UGNlcjE0NVpCczdnc3ZRc0lsbDlGVHZXanQ3bWhaOHJ3ejdybVNYcURBdEdqYTRsYmVrUnhcL1pyRWx4dkJhWXV0YWFvdVlISWpkNlZpRWVXZEVpRzJIV0VIMGczcW1LYW1QbUp2VUluN0tVODZrUDQiLCJ0aW1lc3RhbXAiOiIyMDI1LTAxLTMxVDAyOjA2OjM4WiJ9';
let playreadyToken = 'eyJrZXlfcm90YXRpb24iOmZhbHNlLCJyZXNwb25zZV9mb3JtYXQiOiJvcmlnaW5hbCIsInVzZXJfaWQiOiJ1dSIsImRybV90eXBlIjoicGxheXJlYWR5Iiwic2l0ZV9pZCI6IkRFTU8iLCJoYXNoIjoiamtncG1YY09QMG9wVnBOQ0xNd0JtWSs1MTlnNFpncFpnYVlsME9xcHdMdz0iLCJjaWQiOiJkZW1vLWJiYi1zaW1wbGUiLCJwb2xpY3kiOiI5V3FJV2tkaHB4VkdLOFBTSVljbkpzY3Z1QTlzeGd1YkxzZCthanVcL2JvbVFaUGJxSSt4YWVZZlFvY2NrdnVFZnhEY2NtN2NXZFZYcXJkTWdBUWptcVo5bzdYTEZ6MjBOaG1Kdklpd1FidWhLaCtDMmZJSEw5T3UxU09Bc2hQU0FWZHhhWVVKSnJsWjVVMXU1UGNlcjE0NVpCczdnc3ZRc0lsbDlGVHZXanQ3bWhaOHJ3ejdybVNYcURBdEdqYTRsYmVrUnhcL1pyRWx4dkJhWXV0YWFvdVlISWpkNlZpRWVXZEVpRzJIV0VIMGczcW1LYW1QbUp2VUluN0tVODZrUDQiLCJ0aW1lc3RhbXAiOiIyMDI1LTAxLTMxVDAyOjA2OjI3WiJ9';
let fairplayToken = 'eyJrZXlfcm90YXRpb24iOmZhbHNlLCJyZXNwb25zZV9mb3JtYXQiOiJvcmlnaW5hbCIsInVzZXJfaWQiOiJ1dSIsImRybV90eXBlIjoiZmFpcnBsYXkiLCJzaXRlX2lkIjoiREVNTyIsImhhc2giOiJJYTdobWpGY3NxekN6dGUzTW0wdnlLaFZnZXRvZ256OWs3QkVRK3hcL3Vtaz0iLCJjaWQiOiJkZW1vLWJiYi1zaW1wbGUiLCJwb2xpY3kiOiI5V3FJV2tkaHB4VkdLOFBTSVljbkpzY3Z1QTlzeGd1YkxzZCthanVcL2JvbVFaUGJxSSt4YWVZZlFvY2NrdnVFZnhEY2NtN2NXZFZYcXJkTWdBUWptcVo5bzdYTEZ6MjBOaG1Kdklpd1FidWhLaCtDMmZJSEw5T3UxU09Bc2hQU0FWZHhhWVVKSnJsWjVVMXU1UGNlcjE0NVpCczdnc3ZRc0lsbDlGVHZXanQ3bWhaOHJ3ejdybVNYcURBdEdqYTRsYmVrUnhcL1pyRWx4dkJhWXV0YWFvdVlISWpkNlZpRWVXZEVpRzJIV0VIMGczcW1LYW1QbUp2VUluN0tVODZrUDQiLCJ0aW1lc3RhbXAiOiIyMDI1LTAxLTMxVDAyOjA2OjU0WiJ9';

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
  let detectedBrowser = 'Unknown';

  if (agent.includes('trident') || agent.includes('edge/')) {
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

  const result = `Running in ${detectedBrowser}. ${activeDrm.type} supported.`;
  const browserCheckElement = document.getElementById('browserCheckResult');
  if (browserCheckElement) browserCheckElement.innerHTML = result;
  console.log(result);

  return detectedBrowser;
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

// Request media key system access
async function tryKeySystemAccess(keySystem, config) {
  try {
      await navigator.requestMediaKeySystemAccess(keySystem, config);
      return true;
  } catch {
      return false;
  }
}

async function checkSupportedDRM() {
  // DRM systems ordered by security priority (hardware DRM first)
  const drmSystems = [
    { type: 'FairPlay', keySystem: 'com.apple.fps' },
    { type: 'PlayReady', keySystem: 'com.microsoft.playready.recommendation.3000' },
    { type: 'PlayReady', keySystem: 'com.microsoft.playready' },
    { type: 'Widevine', keySystem: 'com.widevine.alpha' }
  ];

  for (const drm of drmSystems) {
    try {
      await navigator.requestMediaKeySystemAccess(drm.keySystem, baseEmeConfig);
      activeDrm = drm;
      console.log(`${activeDrm.type} supported (${activeDrm.keySystem})`);
      return;
    } catch (e) {
      // DRM not supported is expected - continue to next DRM system
      console.log(`${drm.type} (${drm.keySystem}) not supported`);
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

// String util functions
function arrayToString(array) {
  const uint16array = new Uint16Array(array.buffer);
  return String.fromCharCode.apply(null, uint16array);
}

function arrayBufferToString(buffer) {
  const arr = new Uint8Array(buffer);
  const str = String.fromCharCode.apply(String, arr);
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
  const raw = window.atob(input);
  const rawLength = raw.length;
  const array = new Uint8Array(new ArrayBuffer(rawLength));

  for (let i = 0; i < rawLength; i++)
    array[i] = raw.charCodeAt(i);

  return array;
}
