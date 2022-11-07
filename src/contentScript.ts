import { checkStatus, findStreams } from './client';
import { getStorageData, StorageType } from './storage';
import { CheckStatusResult, Payload } from './types';
import { log, logColor, logError, logStatusMessage, wait } from './utils';

let didTryLogin = true;
let interval = 0;
let port: chrome.runtime.Port;

getStorageData().then((storage) => {
  console.log(storage);
  if (storage.start) {
    start(false, storage);
  }
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  console.log('Received message', message, sender);
  sendResponse('ack');
  if (message?.type === 'start') {
    const storage = await getStorageData();
    if (storage.start) {
      start(true, storage);
    } else {
      stop();
    }
  }
});

chrome.runtime.onConnect.addListener((connectPort) => {
  log('Connected to popup');
  port = connectPort;
  port.onDisconnect.addListener(() => {
    log('Disconnected from popup');
    port = undefined;
  });
});
console.log('Ready for messages');

function start(now: boolean, storage: StorageType) {
  if (now) {
    loop(storage);
  }
  interval = window.setInterval(() => {
    getStorageData().then(loop);
  }, 5000);
}
function stop() {
  window.clearInterval(interval);
}

async function loop(options: StorageType) {
  const { channelUrl, reloadNoRewards } = options;
  console.log('Running...');
  const status = checkStatus();
  sendStatus(status);

  if (status.isVideoIdMismatch) {
    logColor(
      'yellow',
      `Video ID ${status.videoId} does not match URL ${status.urlVideoId}, refreshing page for updated metadata`,
    );
    return window.location.reload();
  }

  if (status.loginUrl && !didTryLogin) {
    didTryLogin = true;
    logColor('yellow', `User not logged in. Prompting in browser for login...`);
    const confirm = window.confirm(
      `[Autowatch Live] It looks like you're not logged in. You can't earn rewards without being logged in. Would you like to login now?`,
    );

    if (confirm) {
      return window.location.assign(status.loginUrl);
    }
  }

  if (!status.isStream && !status.isChannelPage) {
    return goToChannelPage(channelUrl);
  }

  if (status.isChannelPage) {
    const streams = findStreams();

    if (streams?.url) {
      logColor(
        'green',
        `${streams.isLive ? 'Live' : 'Scheduled'} stream detected, going to ${
          streams.url
        }`,
      );
      window.location.assign(streams.url);
    } else {
      const msg = `Waiting for channel to begin streaming...`;
      logColor('yellow', msg);
      sendStatus(status, msg, 'fa-circle-notch fa-spin');
      await wait(1000 * 30);
      window.location.reload();
    }
  }

  if (status.isStream) {
    let msg;
    if (status.isStreamWaiting) {
      msg = 'Waiting for scheduled stream to begin...';
      logStatusMessage('blue', msg);
      sendStatus(status, msg, 'hourglass-start');
    } else if (status.isStreamRewards) {
      msg = `Stream has begun and rewards detected`;
      logStatusMessage('green', msg);
      sendStatus(status, msg, 'fa-gem');
    } else {
      msg = `Stream has begun but no rewards detected`;
      logStatusMessage('yellow', msg, 'fa-triangle-exclamation');
      sendStatus(status, msg);
      if (reloadNoRewards) {
        await wait(1000 * 30);
        window.location.reload();
      }
    }
  }
}

function sendStatus(
  status: CheckStatusResult,
  message?: string,
  icon?: string,
) {
  if (!port) {
    return;
  }
  try {
    port.postMessage({
      type: 'status',
      status,
      message,
      icon,
    } as Payload);
  } catch (e) {
    logError(e);
  }
}

function goToChannelPage(channel: string) {
  // Go to the channel and look for a stream
  const videosPage = channel.endsWith('/streams')
    ? channel
    : `${channel}/streams`;
  logColor('yellow', `No live stream detected, going to channel ${videosPage}`);
  window.location.assign(videosPage);
}
