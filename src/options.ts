import '../styles/options.scss';
import { getStorageData, setStorageData } from './storage';

getStorageData().then((storage) => {
  const inputChannel =
    document.querySelector<HTMLInputElement>('#options-channel');
  const inputRewards =
    document.querySelector<HTMLInputElement>('#options-rewards');

  inputChannel.value = storage.channelUrl || '';
  inputRewards.checked = storage.reloadNoRewards || false;

  inputChannel.addEventListener('change', () => {
    setStorageData({ channelUrl: inputChannel.value });
  });
  inputRewards.addEventListener('change', () => {
    setStorageData({ reloadNoRewards: inputRewards.checked });
  });
});
