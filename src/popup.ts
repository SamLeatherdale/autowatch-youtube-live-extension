import '@fortawesome/fontawesome-free/js/solid';
import '@fortawesome/fontawesome-free/js/fontawesome';
import '../styles/popup.scss';
import { getStorageData, setStorageData } from './storage';
import { Payload } from './types';
import { wait } from './utils';

document
  .querySelector<HTMLButtonElement>('#go-to-options')
  .addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

const start = document.querySelector<HTMLInputElement>('#options-start');
getStorageData().then((storage) => {
  start.checked = storage.start;
  if (storage.channelUrl) {
    const el = document.createElement('div');
    el.innerText = `Watching channel ${storage.channelUrl}`;
    document.querySelector('.container').appendChild(el);
  }
});

async function connect() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const [tab] = tabs;
    if (!tab) {
      throw new Error("Couldn't find active tab");
    }
    const port = chrome.tabs.connect(tab.id);
    port.onMessage.addListener((payload: Payload) => {
      const { type } = payload;
      if (type === 'status') {
        const { status, icon, message } = payload;
        showStatus(message, icon);
      }
    });
    port.onDisconnect.addListener(async () => {
      showStatus('Page disconnected...', 'fa-triangle-exclamation');
      await wait(1000);
      connect();
    });
  } catch (e) {
    console.error(e);
    await wait(1000);
    connect();
  }
}
connect();

start.addEventListener('change', async () => {
  await setStorageData({ start: start.checked });
});

function showStatus(message = '', icon = '') {
  const section = document.querySelector('#status-section');
  section.innerHTML = '';

  const elIcon = document.createElement('i');
  elIcon.id = 'status-icon';
  elIcon.className = icon;
  elIcon.classList.add('fa-solid');
  section.appendChild(elIcon);

  const elMessage = document.createElement('p');
  elMessage.id = 'status-message';
  elMessage.innerText = message;
  section.appendChild(elMessage);
}
