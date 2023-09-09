import { CheckStatusResult, FindStreamResult } from './types';

function getParentLink(el: HTMLElement) {
  return (getParentEl(el, 'a') as HTMLAnchorElement | undefined)?.href;
}

function getParentEl(el: HTMLElement, tagName: string) {
  let parent: HTMLElement | null | undefined = el;

  while (parent && parent.tagName !== tagName.toUpperCase()) {
    parent = parent?.parentElement;
  }
  return parent;
}

export function findStreams(): FindStreamResult {
  console.log(`[agent] finding livestreams...`);

  const live = document.querySelector<HTMLElement>('[overlay-style=LIVE]');
  let link;

  if (live) {
    link = getParentLink(live);
  } else {
    const scheduled = document.querySelectorAll<HTMLElement>(
      '[overlay-style=UPCOMING]',
    );
    const sorted = Array.from(scheduled)
      .map((el: HTMLElement) => {
        const parent = getParentEl(el, 'ytd-grid-video-renderer');
        if (!parent) {
          throw new Error('No video parent');
        }
        const metadata = parent.querySelector<HTMLDivElement>('#metadata-line');
        if (!metadata) {
          return undefined;
        }
        const text = metadata.innerText;
        const items = text.split(/(Premieres|Scheduled\s+for)\s+/);
        if (items.length < 2) {
          return undefined;
        }
        const date = items[items.length - 1];
        return {
          el,
          date: new Date(date),
        };
      })
      .sort((a?: { date?: Date }, b?: { date?: Date }) => {
        const [dateA, dateB] = [a, b].map((el) => el?.date);
        if (dateA === dateB) {
          return 0;
        }
        if (!dateA) {
          return 1;
        }
        if (!dateB) {
          return -1;
        }
        return dateA < dateB ? -1 : 1;
      });
    console.log(sorted);
    const [firstScheduled] = sorted;
    console.log(firstScheduled);
    link = firstScheduled ? getParentLink(firstScheduled.el) : undefined;
  }

  const result = {
    isLive: !!live,
    url: link,
  };
  console.log(`[agent]`, result);
  return result;
}

export function checkStatus(): CheckStatusResult {
  console.log(`[agent] checking status...`);
  const rewardsButton = document.querySelector<HTMLElement>(
    '.ytd-account-link-button-renderer',
  );
  const loginButton = document.querySelector<HTMLElement>(
    '.ytd-masthead [href^="https://accounts.google.com"]',
  );
  const videoId = document.querySelector<HTMLMetaElement>(
    'meta[itemprop=videoId]',
  )?.content;
  const channelId = document.querySelector<HTMLMetaElement>(
    'meta[itemprop=channelId]',
  )?.content;
  const urlVideoId = new URLSearchParams(window.location.search).get('v');
  const isLiveStream = document.querySelector<HTMLMetaElement>(
    'meta[itemprop=isLiveBroadcast]',
  );
  const isPastLiveStream = document.querySelector<HTMLMetaElement>(
    '[itemprop=publication] meta[itemprop=endDate]',
  );
  const isLiveNowButton = document.querySelector<HTMLElement>('.ytp-live');
  const premierTrailerOverlay = document.querySelector<HTMLElement>(
    '.ytp-offline-slate-premiere-trailer',
  );
  if (isLiveStream) {
    // Try to hide chat to fix memory leak
    const button = document.querySelector<HTMLButtonElement>(
      'ytd-live-chat-frame yt-button-shape button',
    );
    if (
      button &&
      button
        .querySelector<HTMLElement>('.yt-core-attributed-string')
        ?.innerText.toUpperCase() === 'HIDE CHAT'
    ) {
      button.click();
    }
  }

  const result = {
    isChannelPage: !!document.querySelector('#channel-container'),
    loginUrl: loginButton ? getParentLink(loginButton) : undefined,
    isStream: !!isLiveStream && !isPastLiveStream,
    isStreamWaiting:
      (!!isLiveNowButton && isLiveNowButton.style.display === 'none') ||
      (!!premierTrailerOverlay &&
        premierTrailerOverlay.style.display !== 'none'),
    isStreamRewards: rewardsButton?.innerText?.toUpperCase() === 'CONNECTED',
    channelId,
    videoId,
    urlVideoId,
    isVideoIdMismatch: !!videoId && !!urlVideoId && videoId !== urlVideoId,
  };
  console.log(`[agent]`, result);
  return result;
}
