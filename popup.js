/* ============================================================
   InstaScroll — Popup JS (Reels Doomscroller)
   ============================================================ */

(() => {
  'use strict';

  // ── DOM refs ───────────────────────────────────────────────
  const doomBtn      = document.getElementById('doomscroll-btn');
  const doomText     = document.getElementById('doomscroll-text');
  const iconStart    = document.getElementById('icon-start');
  const iconStop     = document.getElementById('icon-stop');
  const statusCard   = document.getElementById('status-card');
  const statusDot    = document.getElementById('status-dot');
  const statusText   = document.getElementById('status-text');
  const reelCounter  = document.getElementById('reel-counter');
  const reelCountVal = document.getElementById('reel-count-value');
  const delaySlider  = document.getElementById('delay-slider');
  const delayDisplay = document.getElementById('delay-display');
  const skipBtn      = document.getElementById('skip-btn');

  let isActive = false;

  // ── UI Updates ─────────────────────────────────────────────
  function updateUI(active, reelCount = 0) {
    isActive = active;

    if (active) {
      doomBtn.classList.add('active');
      doomText.textContent = 'STOP';
      iconStart.style.display = 'none';
      iconStop.style.display = 'inline';
      statusCard.classList.add('active');
      statusText.textContent = 'Doomscrolling reels…';
      reelCounter.style.display = 'flex';
      reelCountVal.textContent = `${reelCount} reel${reelCount !== 1 ? 's' : ''} watched`;
      skipBtn.disabled = false;
    } else {
      doomBtn.classList.remove('active');
      doomText.textContent = 'DOOMSCROLL';
      iconStart.style.display = 'inline';
      iconStop.style.display = 'none';
      statusCard.classList.remove('active');
      statusText.textContent = 'Ready to doomscroll';
      reelCounter.style.display = 'none';
      skipBtn.disabled = true;
    }
  }

  function updateDelay(val) {
    delaySlider.value = val;
    delayDisplay.textContent = val === 0 ? 'Instant' : `${val}s`;
  }

  // ── Send message to content script ─────────────────────────
  function sendToContent(msg, cb) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]?.id) {
        // Not on Instagram — navigate there first
        if (msg.type === 'DOOMSCROLL') {
          chrome.tabs.update(tabs[0].id, { url: 'https://www.instagram.com/reels/' }, () => {
            // Content script will auto-start after page load via the popup re-opening
          });
        }
        return;
      }
      chrome.tabs.sendMessage(tabs[0].id, msg, (res) => {
        if (chrome.runtime.lastError) {
          // Content script not injected — maybe not on Instagram
          if (msg.type === 'DOOMSCROLL') {
            chrome.tabs.update(tabs[0].id, { url: 'https://www.instagram.com/reels/' });
          }
          return;
        }
        if (cb) cb(res);
      });
    });
  }

  // ── Init: get current state ────────────────────────────────
  sendToContent({ type: 'GET_STATE' }, (res) => {
    if (!res) return;
    updateUI(res.active, res.reelCount);
    updateDelay(res.delay);
  });

  chrome.storage.local.get(['delay'], (data) => {
    if (data.delay !== undefined) updateDelay(data.delay);
  });

  // ── Listen for state updates from content script ───────────
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'STATE_UPDATE') {
      updateUI(msg.active, msg.reelCount);
      if (msg.delay !== undefined) updateDelay(msg.delay);
    }
  });

  // ── Events ─────────────────────────────────────────────────

  // Doomscroll button
  doomBtn.addEventListener('click', () => {
    if (isActive) {
      sendToContent({ type: 'STOP' }, (res) => {
        if (res) updateUI(false);
      });
      updateUI(false);
    } else {
      sendToContent({ type: 'DOOMSCROLL' }, (res) => {
        if (res) updateUI(res.active, res.reelCount);
      });
      updateUI(true, 0);
    }
  });

  // Delay slider
  delaySlider.addEventListener('input', () => {
    const delay = parseInt(delaySlider.value, 10);
    updateDelay(delay);
    sendToContent({ type: 'SET_DELAY', delay });
    chrome.storage.local.set({ delay });
  });

  // Skip button
  skipBtn.addEventListener('click', () => {
    sendToContent({ type: 'SKIP' });
  });

})();
