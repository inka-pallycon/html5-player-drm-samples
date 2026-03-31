(() => {
    const _enableEventMode = (player, config) => {
        const currentMode = config.mode || 'json';
        const cmcdBatchArray = (currentMode === 'json') ? [] : null;
        const videoElement = player.getMediaElement();
        let isSending = false;

        let sequenceNumber = 0;
        let timePlay = null;
        let msd = null;
        let msdSent = false;
        let batchTimer = null;

        if (config.batchTimer && config.batchTimer > 0 && currentMode === 'json') {
            batchTimer = setInterval(() => {
                if (cmcdBatchArray.length > 0 && !isSending) {
                    sendCmcdReport();
                }
            }, config.batchTimer * 1000);
        }

        videoElement.addEventListener('play', function () {
            if (timePlay == null) timePlay = new Date().getTime();
        });

        videoElement.addEventListener('playing', function () {
            if (msd == null) msd = new Date().getTime() - timePlay;
        });

        function sendCmcdReport() {
            if (currentMode == 'json') {
                if (!cmcdBatchArray || cmcdBatchArray.length === 0) return;
                if (isSending) return;

                isSending = true;
                const reportingUrl = new URL(config.url);

                const batchToSend = cmcdBatchArray.splice(0, cmcdBatchArray.length);

                if (config.beforeSend && typeof config.beforeSend === 'function') {
                    try {
                        config.beforeSend(batchToSend);
                    } catch (e) {
                        console.error('[Event Mode] Error in beforeSend callback:', e);
                    }
                }

                console.log(`[Event Mode] Sending batch of ${batchToSend.length} CMCD events.`);
                fetch(reportingUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(batchToSend),
                })
                .then(reportResponse => {
                    if (reportResponse.ok) {
                        console.log('[Event Mode] CMCD batch data reported successfully.');

                        if (config.afterSend && typeof config.afterSend === 'function') {
                            try {
                                config.afterSend(reportResponse);
                            } catch (e) {
                                console.error('[Event Mode] Error in afterSend callback:', e);
                            }
                        }
                    } else {
                        console.warn(`[Event Mode] Reporting server responded with error: ${reportResponse.status}`);

                        const currentBatchSize = cmcdBatchArray.length;
                        const totalSize = currentBatchSize + batchToSend.length;

                        if (totalSize > config.batchSize) {
                            const overflow = totalSize - config.batchSize;
                            const trimmedBatch = batchToSend.slice(overflow);
                            console.warn(`[Event Mode] After retry, would exceed limit. Trimmed ${overflow} oldest event(s) from failed batch`);
                            cmcdBatchArray.unshift(...trimmedBatch);
                        } else {
                            cmcdBatchArray.unshift(...batchToSend);
                        }
                    }
                })
                .catch(error => {
                    console.error('[Event Mode] Error sending CMCD batch data to reporting server:', error);

                    const currentBatchSize = cmcdBatchArray.length;
                    const totalSize = currentBatchSize + batchToSend.length;

                    if (totalSize > config.batchSize) {
                        const overflow = totalSize - config.batchSize;
                        const trimmedBatch = batchToSend.slice(overflow);
                        console.warn(`[Event Mode] After retry, would exceed limit. Trimmed ${overflow} oldest event(s) from failed batch`);
                        cmcdBatchArray.unshift(...trimmedBatch);
                    } else {
                        cmcdBatchArray.unshift(...batchToSend);
                    }
                })
                .finally(() => {
                    isSending = false;
                });
            } else if (currentMode === 'query') {
                const reportingUrl = new URL(config.url);

                console.log(`[Event Mode] Sending CMCD report via query: ${reportingUrl.toString()}`);
                fetch(reportingUrl, {
                    method: 'GET',
                })
                .then(reportResponse => {
                    console.log(reportResponse.ok ? '[Event Mode] CMCD query data reported successfully.' : `[Event Mode] Reporting server responded with an error`);
                })
                .catch(error => {
                    console.error('[Event Mode] Error sending CMCD query data to reporting server:', error);
                });
            }
        }

        function getPlayerState(player) {
            const video = player.getMediaElement();
            if (!video) return;
            if (video.seeking) return 'k';
            if (player.isBuffering()) return 'r';
            if (video.ended) return 'e';
            if (video.paused) {
                if (video.currentTime === 0 && video.played.length === 0) {
                    return 'd'; // Preloading
                }
                return 'a'; // Paused
            }
            if (video.readyState < 3) {
                return 's'; // Starting
            }
            return 'p'; // Playing
        }

        function shouldIncludeKey(key) {
            return config.includeKeys === undefined || config.includeKeys.includes(key);
        }

        function shouldIncludeEvent(eventType) {
            return config.events === undefined || config.events.includes(eventType);
        }

        function getCommonCmcdData() {
            const cmcdData = {};

            const playerConfig = player.getConfiguration();
            if (playerConfig.cmcd) {
                if (shouldIncludeKey('v') && playerConfig.cmcd.version) {
                    cmcdData.v = playerConfig.cmcd.version;
                }
                if (shouldIncludeKey('sid') && playerConfig.cmcd.sessionId) {
                    cmcdData.sid = playerConfig.cmcd.sessionId;
                }
                if (shouldIncludeKey('cid') && playerConfig.cmcd.contentId) {
                    cmcdData.cid = playerConfig.cmcd.contentId;
                }
            }

            if (shouldIncludeKey('sf')) {
                try {
                    const manifestUri = (typeof player.getAssetUri === 'function')
                        ? player.getAssetUri()
                        : (typeof player.getManifestUri === 'function')
                            ? player.getManifestUri()
                            : null;

                    if (manifestUri) {
                        if (manifestUri.includes('.mpd')) {
                            cmcdData.sf = 'd'; // DASH
                        } else if (manifestUri.includes('.m3u8')) {
                            cmcdData.sf = 'h'; // HLS
                        }
                    }
                } catch (e) {}
            }

            if (shouldIncludeKey('mtp')) {
                try {
                    const stats = player.getStats();
                    const bandwidth = stats ? stats.estimatedBandwidth : null;
                    if (bandwidth) {
                        cmcdData.mtp = Math.round(bandwidth / 100) * 100;
                    }
                } catch (e) {}
            }

            if (shouldIncludeKey('pr')) {
                const playbackRate = player.getPlaybackRate();
                if (playbackRate !== 1) {
                    cmcdData.pr = playbackRate;
                }
            }

            if (shouldIncludeKey('bg') && document.hidden) {
                cmcdData.bg = true;
            }

            if (shouldIncludeKey('st')) {
                cmcdData.st = player.isLive() ? 'l' : 'v';
            }

            if (shouldIncludeKey('ltc')) {
                try {
                    if (player.isLive()) {
                        const stats = player.getStats();
                        const liveLatency = stats ? stats.liveLatency : null;
                        if (liveLatency && liveLatency > 0) {
                            cmcdData.ltc = Math.round(liveLatency * 1000);
                        }
                    }
                } catch (e) {}
            }

            if (shouldIncludeKey('pt')) {
                try {
                    if (player.isLive() && typeof player.getPlayheadTimeAsDate === 'function') {
                        const playheadDate = player.getPlayheadTimeAsDate();
                        if (playheadDate) {
                            cmcdData.pt = playheadDate.getTime();
                        }
                    } else {
                        const currentTime = videoElement.currentTime;
                        if (currentTime > 0) {
                            cmcdData.pt = Math.round(currentTime);
                        }
                    }
                } catch (e) {
                    const currentTime = videoElement.currentTime;
                    if (currentTime > 0) {
                        cmcdData.pt = Math.round(currentTime);
                    }
                }
            }

            if (shouldIncludeKey('msd') && !msdSent && msd) {
                cmcdData.msd = msd;
                msdSent = true;
            }

            if (shouldIncludeKey('df')) {
                try {
                    if (videoElement && typeof videoElement.getVideoPlaybackQuality === 'function') {
                        const quality = videoElement.getVideoPlaybackQuality();
                        const droppedFrames = quality ? quality.droppedVideoFrames : 0;
                        if (droppedFrames > 0) {
                            cmcdData.df = droppedFrames;
                        }
                    }
                } catch (e) {}
            }

            return cmcdData;
        }

        function sendEventData(eventType, additionalData = {}) {
            if (!shouldIncludeEvent(eventType)) {
                return;
            }

            const cmcdData = getCommonCmcdData();

            if (shouldIncludeKey('ts')) {
                cmcdData.ts = Date.now();
            }

            if (shouldIncludeKey('e')) {
                cmcdData.e = eventType;
            }

            if (eventType === 'ps' && shouldIncludeKey('sta')) {
                cmcdData.sta = additionalData.sta || getPlayerState(player);
            }

            if (eventType === 'e' && shouldIncludeKey('ec') && additionalData.ec) {
                cmcdData.ec = additionalData.ec;
            }

            if (shouldIncludeKey('sn')) {
                cmcdData.sn = sequenceNumber++;
            }

            Object.assign(cmcdData, additionalData);

            if (currentMode === 'json') {
                cmcdBatchArray.push(cmcdData);

                if (cmcdBatchArray.length > config.batchSize) {
                    const overflow = cmcdBatchArray.length - config.batchSize;
                    const removed = cmcdBatchArray.splice(0, overflow);
                    console.warn(`[Event Mode] Batch exceeded limit (${cmcdBatchArray.length + overflow}), removed ${removed.length} oldest event(s)`);
                }

                console.log(`[Event Mode] CMCD data added to batch. Current batch size: ${cmcdBatchArray.length}. Event: ${eventType}`);

                if (cmcdBatchArray.length >= config.batchSize && !isSending) {
                    sendCmcdReport();
                }
            } else if (currentMode === 'query') {
                const queryPairs = [];
                for (const [key, value] of Object.entries(cmcdData)) {
                    if (typeof value === 'string') {
                        const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
                        queryPairs.push(`${key}="${escaped}"`);
                    } else if (typeof value === 'boolean') {
                        queryPairs.push(key);
                    } else {
                        queryPairs.push(`${key}=${value}`);
                    }
                }
                const cmcdString = queryPairs.join(',');
                reportUrl.searchParams.set('CMCD', cmcdString);
                sendCmcdReport(cmcdString, reportUrl);
            }
        }

        videoElement.addEventListener('play', () => {
            sendEventData('ps', { sta: 's' });
        });

        videoElement.addEventListener('playing', () => {
            sendEventData('ps', { sta: 'p' });
        });

        videoElement.addEventListener('pause', () => {
            sendEventData('ps', { sta: 'a' });
        });

        videoElement.addEventListener('waiting', () => {
            sendEventData('ps', { sta: 'w' });
        });

        videoElement.addEventListener('seeking', () => {
            sendEventData('ps', { sta: 'k' });
        });

        videoElement.addEventListener('ended', () => {
            sendEventData('ps', { sta: 'e' });
        });

        player.addEventListener('buffering', (event) => {
            if (event.buffering) {
                sendEventData('ps', { sta: 'r' });
            }
        });

        videoElement.addEventListener('volumechange', () => {
            if (videoElement.muted) {
                sendEventData('m');
            } else {
                sendEventData('um');
            }
        });

        document.addEventListener('fullscreenchange', () => {
            if (document.fullscreenElement) {
                sendEventData('pe');
            } else {
                sendEventData('pc');
            }
        });

        videoElement.addEventListener('enterpictureinpicture', () => {
            sendEventData('pe');
        });

        videoElement.addEventListener('leavepictureinpicture', () => {
            sendEventData('pc');
        });

        document.addEventListener('visibilitychange', () => {
            sendEventData('b', { bg: document.hidden });
        });

        player.addEventListener('error', (event) => {
            sendEventData('e', { ec: event.detail.code });
        });

        let timeIntervalTimer = null;
        if (config.timeInterval && config.timeInterval > 0) {
            timeIntervalTimer = setInterval(() => {
                sendEventData('t');
            }, config.timeInterval * 1000);
        }

        const cleanup = () => {
            if (batchTimer) {
                clearInterval(batchTimer);
                batchTimer = null;
            }
            if (timeIntervalTimer) {
                clearInterval(timeIntervalTimer);
                timeIntervalTimer = null;
            }
            if (cmcdBatchArray && cmcdBatchArray.length > 0) {
                sendCmcdReport(cmcdBatchArray.slice(), new URL(config.url));
                cmcdBatchArray.length = 0;
            }
        };

        player.addEventListener('unloading', cleanup);

        return cleanup;
    };

    window.eventModePlugin = {
        enableEventMode(player, config) {
            return _enableEventMode(player, config);
        }
    };
})();
