import '../styles/popup.scss';
import { getStorageData, setStorageData } from './storage';

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
start.addEventListener('change', async () => {
  await setStorageData({ start: start.checked });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    console.log('Sending messsage...');
    chrome.tabs.sendMessage(tab.id, { type: 'start' });
  }
});
