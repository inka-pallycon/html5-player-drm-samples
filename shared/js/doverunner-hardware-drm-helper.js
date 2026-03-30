// =====================================================
// DoveRunner Hardware DRM Extension Helper
// Requires: doverunner-base-helper.js loaded first
// =====================================================

// Hardware DRM support flags
let supportSl3000 = false;  // PlayReady SL3000 support
let supportL1 = false;      // Widevine L1 support

// Content URIs for hardware/software DRM
const dashUriForHardwareDrm = 'https://drm-contents.doverunner.com/DEMO/app/tearsofsteel-multimanifests/dash/stream_HD.mpd';
const dashUriForSoftwareDrm = 'https://drm-contents.doverunner.com/DEMO/app/tearsofsteel-multimanifests/dash/stream_SD.mpd';
// Override hlsUri from base helper
const hlsUriHardware = 'https://drm-contents.doverunner.com/DEMO/app/tearsofsteel-multimanifests/hls/master_HD.m3u8';

// Tokens for software/hardware DRM
let widevineTokenForSoftwareDrm = 'eyJrZXlfcm90YXRpb24iOmZhbHNlLCJyZXNwb25zZV9mb3JtYXQiOiJvcmlnaW5hbCIsInVzZXJfaWQiOiJ1dSIsImRybV90eXBlIjoid2lkZXZpbmUiLCJzaXRlX2lkIjoiREVNTyIsImhhc2giOiJGYndcL0MwYWNocUkwSXZhWEhcL09xbmR0eTRibFFJQjhkbDhMUURYQXAwMG89IiwiY2lkIjoidGVhcnNvZnN0ZWVsIiwicG9saWN5IjoiOVdxSVdrZGhweFZHSzhQU0lZY25Kc2N2dUE5c3hndWJMc2QrYWp1XC9ib2x5QTB6THVJT0VFNll4MlRiWVdCTG9OaGFjU0ViN0F4c0FVQ3JBQ3VTOFVUSzVIaGo1QXZ4VHhUREhsdFRcL0lvdTJ6XC95QUZCZE5CbDVkK1ByYWxXc2djNlRocEhsRFNHWFYwYWx5cG5iR2UyYkZuQ1wvRGZpbHlUTHVFcFdKZXNMdXd1R05RNHhOVndNT0o1WWxcL3pOc1FkMWY1YyttTWFYRXdleEZrUXRVUG5mdUk2WFdDVlBHWjZcL1NoZFBtbzlWM2FWRTJzMk5HWXgwK0FFcDlCNnVrN2lLcExTSjc5bFVQeHZkTnV4S3psQUlXNzcrUEZadnY0RTZBZ0NKTUk4b3M2XC9manNqanNlaWNCbzNNalM0T1FDNUwxS2VhdDU4K3p2c3FCYlFcL1JSOVhEZ2tieU1zeXlmNWxJUDlxMTBcL0FNREtyMWhXWG5qXC9MYkhqcDU4VVU4aG5WcVBBbk5ja25NVXMrOWNXbWlTTTdwRnFqZU1QMTFGbXBpTzVSeXZ5dE1OWXRreGY3UFBSK29WYTVBbTkxZ0pyWmxYa1JGZmZyeWF0NmtHd0orOSswXC9CSXZXUkQyaDN2WmJuRFdZQUFqND0iLCJ0aW1lc3RhbXAiOiIyMDI1LTAxLTMxVDExOjM1OjM5WiJ9';
let widevineTokenForHardwareDrm = 'eyJrZXlfcm90YXRpb24iOmZhbHNlLCJyZXNwb25zZV9mb3JtYXQiOiJvcmlnaW5hbCIsInVzZXJfaWQiOiJ1dSIsImRybV90eXBlIjoid2lkZXZpbmUiLCJzaXRlX2lkIjoiREVNTyIsImhhc2giOiJ4ODdFVVQ0a1wveW5KTFwva2dHODk3MzhIeWhMMHRqa1ViU2kwaFhwbmpLeEk9IiwiY2lkIjoidGVhcnNvZnN0ZWVsIiwicG9saWN5IjoiOVdxSVdrZGhweFZHSzhQU0lZY25Kc2N2dUE5c3hndWJMc2QrYWp1XC9ib2x5QTB6THVJT0VFNll4MlRiWVdCTG9OaGFjU0ViN0F4c0FVQ3JBQ3VTOFVUSzVIaGo1QXZ4VHhUREhsdFRcL0lvdTJ6XC95QUZCZE5CbDVkK1ByYWxXc2djNlRocEhsRFNHWFYwYWx5cG5iR2UyYkZuQ1wvRGZpbHlUTHVFcFdKZXNMdXd1R05RNHhOVndNT0o1WWxcL3pOc1FkMWY1YyttTWFYRXdleEZrUXRVUG5mdUk2WFdDVlBHWjZcL1NoZFBtbzlWM2FWRTJzMk5HWXgwK0FFcDlCNnVrNysrNURQRmVDYXgwQWQ2MitYaW9FZVwvS1AxVzZPbDRJVkRrcFQzMHBhZWxDTlJsK0hlV250a3BTcFVDNVwvUkFHSGFmYmVETU1DQzQ0K2tCSTlGVlhianZ6MTgycWFoY2tWT2VZMEx2aE9hQVBnYlJpeDVKbFYyMFhTXC9iM0tpcEsxa0NCSFA4NktzM3E4emNCem44ZXZJMDdcL3ZVZ09RclBQeXJtRkp4NmRjY0FXbkJYMkhITlBpdngwMGM4RklMS2preUg2MlNaZG85UGcwK2pHR09wOUs4cHRyRkkzNDFyVVU5UjlkK2JRYktHRDBDVkplSWpSYXhLbzRQMUFFdmFEZHJ0bXdjYXNVU2xScEhPZTZwWlBNWTg2dFMwSko4N0F5ZjUxNTNcL2kxU3hraWRqSWluSEJUcHRiaXhtXC94MVwvdkNRR1FaWithWnJNQmQzNjZTUGlEZkR3TWRLRDlWZ1VYUHhhTjFGMjlxVytrZTd2UkFpa3JBQ01PbXltd25QR1hrdFlCSlJzMm1EUHhpbkgwN240SkUzTDlORUYyNGdFellGeU9kK0hkRXNXTVlOTTlXcmVER1ZRd21wZVhiSDZDK3VxeFZCMEZKSGNxOUNDaytVWTJ0aFBicWRuaHNhelZSWm9odGtXU2ZBbz0iLCJ0aW1lc3RhbXAiOiIyMDI1LTAxLTMxVDEwOjQ3OjMyWiJ9';
let playreadyTokenForSoftwareDrm = 'eyJrZXlfcm90YXRpb24iOmZhbHNlLCJyZXNwb25zZV9mb3JtYXQiOiJvcmlnaW5hbCIsInVzZXJfaWQiOiJ1dSIsImRybV90eXBlIjoicGxheXJlYWR5Iiwic2l0ZV9pZCI6IkRFTU8iLCJoYXNoIjoiNFY2TkZNYUI4T29PY3I4RHE5Z3cxenFKZGNuRFZqRmk3b3lKRFlGc0NCUT0iLCJjaWQiOiJ0ZWFyc29mc3RlZWwiLCJwb2xpY3kiOiI5V3FJV2tkaHB4VkdLOFBTSVljbkpzY3Z1QTlzeGd1YkxzZCthanVcL2Jva0M5UzIreEFQWVJibWZ6OHRvRUIzODRsSjV1XC9mdlV5OVJLc3cwUDRVMzFsU0cxTVliXC80U0F2TW1Cc0hhZjU2TWFCdW9DUzR4UWNnZkxCRGhIWjRRVUVoMXF1TDg1VG1MVGZoSFFVRnNYbUE3a29UOHdoYytXSUNBaHNVNjhkSUwrcncrN1l3SWRtQW40NFJxR2duZmt0dHJjSlIyQkI1cG92MitEU3dTMzIrcnRcL1IydmtNUDhPSmtKTmFDY2k2NzIwMnlrYVwvTDJqNmp0bEg0T1wvejhYeWFZRDBmUEJHVlpUYjBCUURtQU5VZ3NaXC9jZzdrTlllVG1lZW9FNnhaWDA4VVM3VVJCb29xWlpqRDRwcGwyR2NiMDVrYlwvN3E2aUJFNDVsWXArM0d1czdKODdiRW9raTNGU1RZTnlcL1psdjlTYjV6OEo3dGtvY2VqdVZzcmZhdTdoUHFjT09SY1hPUCtjQlc0SVI1cGI3cmNqOFRTZEpXazRjZlZBUVlzaEhiU1lsOFYrMHNTV2gxV3FXeVhCWlwvbmZwdnJDUnM5Q21vQkY0SjZrU0hKSmFKZkhqclF1NE5WYzhaNE9sSGJ6bWFBNUFGNVo1N29jd1kzTDZDMXNGUzFwRkZ6XC9CT3dxa2tpcHhVZERUZFVpT0kwbkxLWmdQRkNoR2pCTmdZbmlxST0iLCJ0aW1lc3RhbXAiOiIyMDI1LTAxLTMxVDExOjM1OjUxWiJ9';
let playreadyTokenForHardwareDrm = 'eyJrZXlfcm90YXRpb24iOmZhbHNlLCJyZXNwb25zZV9mb3JtYXQiOiJvcmlnaW5hbCIsInVzZXJfaWQiOiJ1dSIsImRybV90eXBlIjoicGxheXJlYWR5Iiwic2l0ZV9pZCI6IkRFTU8iLCJoYXNoIjoidlo1aHgrZUoyczRTeEQyOXJid2FFWk1zcEo0TFcwc1ByaUg2aWtUV2w3ST0iLCJjaWQiOiJ0ZWFyc29mc3RlZWwiLCJwb2xpY3kiOiI5V3FJV2tkaHB4VkdLOFBTSVljbkpzY3Z1QTlzeGd1YkxzZCthanVcL2Jva0M5UzIreEFQWVJibWZ6OHRvRUIzODRsSjV1XC9mdlV5OVJLc3cwUDRVMzFsU0cxTVliXC80U0F2TW1Cc0hhZjU2TWFCdW9DUzR4UWNnZkxCRGhIWjRRVUVoMXF1TDg1VG1MVGZoSFFVRnNYbUE3a29UOHdoYytXSUNBaHNVNjhkSUwrcncrN1l3SWRtQW40NFJxR2duZmt0dHJjSlIyQkI1cG92MitEU3dTMzIrcnRcL1IydmtNUDhPSmtKTmFDY2k2NzIwMnlrYVwvTDJqNmp0bEg0T1wvejhYeWFZRDBmUEJHVlpUYjBCUURtQU5VZ3NaXC9jZzdrTlllVG1lZW9FNnhaWDA4VVM3VVJCb29xWlpqRDRwcGwyR2NKZFBCNjlsekJzRngzUks2QTEyME9YME16UFFSUkI5blcySXJRSUNFTzMxOHJHb3dFWmdkUE5lRU5SVHhXXC91UTFVQkthajl4WWVaR055dGFMbXJZVDlla1lkNGhqYzdrWmlKMTF3S284SDF4d1RUVVkyb1VMNGN0TjNsSExOSTRHWU1DM0VQTlFrY2FBUUNrcUErMjhYc2FhdTFYUG5xWVlRTW42USt1NkJiTVwvNVYzWHh2ZFNXNzdmcWVBdzZ3emVUWUM5bm93Qnk5THVkRGxDWmpXMVNLblRxT3VRclNzRm9CR21OSVR1Z0R5QjNGZEdpaXNMNFB2N2NqbWxEUlN1UVRUekxaVWt4UDZhaXBRMitpWlczeit0RTUrNUhrRUpcL1cxNFhXdU9Cb2FLbUd2QXZlZ0JaRWx0QTFLOVJqYXQ1THVjMDZtblQ4cDFZbDcwTE11YUk2eGwraWV1VndjTHkyNGxvaGRTV2FRMmNJbFwvRFp0bE83N3hVMHFrRmdScmdrOWdlN3BnemEwVDJYYUU3TVEwbHl3ZStPaTJ1ZHJLd1lRQXREVmx4UEhZYTZUY3VoSTdwWmxoU00zbTk5UnFMQzNnNEJiWTFjcStkUnJCZGdJRjJWNWV5MkRpYmpFaG9FcEhRVDg2c3BlQkl4Um5id25hQnpFQk91ZU1ab09ZMDF0Nnc0SDF2R3ZIVmZkMThJT2FnPT0iLCJ0aW1lc3RhbXAiOiIyMDI1LTAxLTMxVDEwOjQ4OjA0WiJ9';
// fairplayToken uses base helper value

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
  const keySystem = 'com.widevine.alpha';

  // Widevine robustness levels in descending order
  const robustnessLevels = [
    'HW_SECURE_ALL',
    'HW_SECURE_DECODE',
    'HW_SECURE_CRYPTO',
    'SW_SECURE_DECODE',
    'SW_SECURE_CRYPTO'
  ];

  // Try with robustness levels
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

  // Try without robustness if all failed
  const succeed = await tryKeySystemAccess(keySystem, baseEmeConfig);
  if (succeed) {
    return { keySystem, videoRobustness: null, audioRobustness: null };
  }

  return null;
}

// Override checkSupportedDRM to detect SL3000
// Store reference to base function before overriding
const _baseCheckSupportedDRM = checkSupportedDRM;

checkSupportedDRM = async function() {
  // DRM systems ordered by security priority (hardware DRM first)
  const drmSystems = [
    { type: 'FairPlay', keySystem: 'com.apple.fps' },
    { type: 'PlayReady', keySystem: 'com.microsoft.playready.recommendation.3000', isSl3000: true },
    { type: 'PlayReady', keySystem: 'com.microsoft.playready' },
    { type: 'Widevine', keySystem: 'com.widevine.alpha' }
  ];

  for (const drm of drmSystems) {
    try {
      const supported = await tryKeySystemAccess(drm.keySystem, baseEmeConfig);
      if (supported) {
        activeDrm = drm;
        if (drm.isSl3000) {
          supportSl3000 = true;
        }
        console.log(`${activeDrm.type} supported (${activeDrm.keySystem})${drm.isSl3000 ? ' (SL3000)' : ''}`);
        return;
      }
    } catch (e) {
      // DRM not supported is expected - continue to next DRM system
      console.log(`${drm.type} (${drm.keySystem})${drm.isSl3000 ? ' SL3000' : ''} not supported`);
    }
  }
};

// Helper functions for DRM configuration
function getPlayReadyToken() {
  return supportSl3000 ? playreadyTokenForHardwareDrm : playreadyTokenForSoftwareDrm;
}

function getWidevineToken() {
  return supportL1 ? widevineTokenForHardwareDrm : widevineTokenForSoftwareDrm;
}

function getDashUri() {
  if (activeDrm.type === 'PlayReady') {
    return supportSl3000 ? dashUriForHardwareDrm : dashUriForSoftwareDrm;
  }
  if (activeDrm.type === 'Widevine') {
    return supportL1 ? dashUriForHardwareDrm : dashUriForSoftwareDrm;
  }
  return dashUriForHardwareDrm;
}
