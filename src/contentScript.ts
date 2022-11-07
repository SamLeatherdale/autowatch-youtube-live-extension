import { checkStatus, findStreams } from './client';
import { getStorageData, StorageType } from './storage';
import { logColor, logStatusMessage, wait } from './utils';

let didTryLogin = true;
let interval = 0;

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
    return await goToChannelPage(channelUrl);
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
      logColor('yellow', `Could not find any streams right now`);
      await wait(1000 * 30);
      window.location.reload();
    }
  }

  if (status.isStream) {
    if (status.isStreamWaiting) {
      logStatusMessage('blue', 'Waiting for stream to begin...');
    } else if (status.isStreamRewards) {
      logStatusMessage('green', `Stream has begun and rewards detected`);
    } else {
      logStatusMessage('yellow', `Stream has begun but no rewards detected`);
      if (reloadNoRewards) {
        await wait(1000 * 30);
        window.location.reload();
      }
    }
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
