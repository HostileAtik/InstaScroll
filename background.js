/* ============================================================
   InstaScroll — Background Service Worker
   ============================================================ */

// Badge state
function setBadge(isOn) {
  const text = isOn ? 'ON' : '';
  const color = isOn ? '#dd2a7b' : '#52525b';
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
}

// Listen for status updates from content script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'STATUS') {
    setBadge(msg.scrolling);
  }
  sendResponse({ ok: true });
});

// On install / update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings
    chrome.storage.local.set({
      speed: 2,
      pauseOnHover: true,
    });
  }
  setBadge(false);
});
