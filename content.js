/* ============================================================
   InstaScroll — Content Script (Reels Doomscroller)
   Auto-advances reels one-by-one after each finishes playing
   ============================================================ */

(() => {
  'use strict';

  const STATE = {
    active: false,
    delay: 3,
    reelCount: 0,
    pollTimer: null,
    advanceTimer: null,
    lastVideoSrc: null,
    hasCompletedOnce: false,
    highWaterMark: 0,       // highest currentTime seen for this video
  };

  // ── Navigate to Reels ──────────────────────────────────────
  function goToReels() {
    if (!window.location.pathname.startsWith('/reels')) {
      window.location.href = 'https://www.instagram.com/reels/';
    }
  }

  // ── Find the currently visible reel video ──────────────────
  function getCurrentVideo() {
    const videos = document.querySelectorAll('video');
    if (videos.length === 0) return null;

    const centerY = window.innerHeight / 2;
    let best = null;
    let bestDist = Infinity;

    for (const video of videos) {
      const rect = video.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      const mid = (rect.top + rect.bottom) / 2;
      const dist = Math.abs(mid - centerY);
      if (rect.bottom > 0 && rect.top < window.innerHeight && dist < bestDist) {
        bestDist = dist;
        best = video;
      }
    }
    return best;
  }

  // ── Scroll to the next reel — tries EVERYTHING ─────────────
  function advanceToNextReel() {
    if (!STATE.active) return;

    // Reset state for next reel
    STATE.hasCompletedOnce = false;
    STATE.lastVideoSrc = null;
    STATE.highWaterMark = 0;
    STATE.reelCount++;
    syncPill();
    notifyPopup();

    const currentVideo = getCurrentVideo();

    // STRATEGY 1: Find the next video element and scrollIntoView
    if (currentVideo) {
      const allVideos = Array.from(document.querySelectorAll('video'));
      const idx = allVideos.indexOf(currentVideo);
      if (idx >= 0 && idx < allVideos.length - 1) {
        const nextVideo = allVideos[idx + 1];
        try {
          nextVideo.scrollIntoView({ behavior: 'smooth', block: 'center' });
          console.log('[InstaScroll] Advanced via scrollIntoView on next video');
          return;
        } catch (e) {}
      }
    }

    // STRATEGY 2: Walk up from current video, find scrollable ancestor, scroll it
    if (currentVideo) {
      let el = currentVideo.parentElement;
      let depth = 0;
      while (el && el !== document.body && depth < 20) {
        const sh = el.scrollHeight;
        const ch = el.clientHeight;
        if (sh > ch + 100) {
          const scrollAmount = ch > 100 ? ch : window.innerHeight;
          el.scrollBy({ top: scrollAmount, behavior: 'smooth' });
          console.log('[InstaScroll] Advanced via ancestor scrollBy', el.tagName, el.className?.substring(0, 30));
          return;
        }
        el = el.parentElement;
        depth++;
      }
    }

    // STRATEGY 3: Try all scrollable elements on the page
    const allEls = document.querySelectorAll('div, section, main');
    for (const el of allEls) {
      if (el.scrollHeight > el.clientHeight + 200) {
        const style = window.getComputedStyle(el);
        const oy = style.overflowY;
        if (oy === 'auto' || oy === 'scroll' || oy === 'hidden') {
          const scrollAmount = el.clientHeight > 100 ? el.clientHeight : window.innerHeight;
          el.scrollBy({ top: scrollAmount, behavior: 'smooth' });
          console.log('[InstaScroll] Advanced via generic scrollable element', el.tagName, el.className?.substring(0, 30));
          return;
        }
      }
    }

    // STRATEGY 4: Just scroll the window
    window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
    console.log('[InstaScroll] Advanced via window.scrollBy');
  }

  // ── Poll video progress to detect reel completion ──────────
  // Instagram reels LOOP — "ended" event doesn't fire.
  // We detect one full play by tracking currentTime:
  //   - Record the highest currentTime seen ("high water mark")
  //   - When currentTime drops significantly below it → video looped
  function startPolling() {
    STATE.pollTimer = setInterval(() => {
      if (!STATE.active) return;

      const video = getCurrentVideo();
      if (!video) return;

      const src = video.currentSrc || video.src || video.querySelector('source')?.src || '';
      const duration = video.duration;
      const ct = video.currentTime;

      // New video detected
      if (src && src !== STATE.lastVideoSrc) {
        STATE.lastVideoSrc = src;
        STATE.hasCompletedOnce = false;
        STATE.highWaterMark = 0;
        clearTimeout(STATE.advanceTimer);
        return;
      }

      // Not enough metadata
      if (!duration || !isFinite(duration) || duration < 0.5) return;

      // Track high water mark
      if (ct > STATE.highWaterMark) {
        STATE.highWaterMark = ct;
      }

      // DETECT LOOP: highWaterMark was near end, and currentTime jumped back
      const nearEnd = STATE.highWaterMark >= duration - 0.8;
      const jumpedBack = ct < STATE.highWaterMark - 2;

      if (nearEnd && jumpedBack && !STATE.hasCompletedOnce) {
        STATE.hasCompletedOnce = true;
        console.log('[InstaScroll] Reel completed! duration:', duration, 'hwm:', STATE.highWaterMark, 'ct:', ct);

        clearTimeout(STATE.advanceTimer);
        STATE.advanceTimer = setTimeout(() => {
          if (STATE.active) advanceToNextReel();
        }, STATE.delay * 1000);
      }

      // FALLBACK: If video is very short or weird, use a time-based approach
      // If we've been watching for > duration * 1.5, consider it done
      if (!STATE.hasCompletedOnce && duration < 60 && STATE.highWaterMark >= duration * 0.9) {
        // Check if we reached 90%+ of duration and it seems stuck there (near the end)
        if (ct >= duration - 0.3) {
          STATE.hasCompletedOnce = true;
          console.log('[InstaScroll] Reel near-end detected, advancing. duration:', duration, 'ct:', ct);

          clearTimeout(STATE.advanceTimer);
          STATE.advanceTimer = setTimeout(() => {
            if (STATE.active) advanceToNextReel();
          }, STATE.delay * 1000);
        }
      }
    }, 250);
  }

  function stopPolling() {
    clearInterval(STATE.pollTimer);
    clearTimeout(STATE.advanceTimer);
    STATE.pollTimer = null;
    STATE.advanceTimer = null;
  }

  // ── Start / Stop ───────────────────────────────────────────
  function start() {
    if (STATE.active) return;
    STATE.active = true;
    STATE.reelCount = 0;
    STATE.hasCompletedOnce = false;
    STATE.lastVideoSrc = null;
    STATE.highWaterMark = 0;

    goToReels();
    startPolling();
    syncPill();
    notifyPopup();
    try { chrome.runtime.sendMessage({ type: 'STATUS', scrolling: true }); } catch (_) {}
  }

  function stop() {
    STATE.active = false;
    stopPolling();
    STATE.hasCompletedOnce = false;
    STATE.lastVideoSrc = null;
    STATE.highWaterMark = 0;
    syncPill();
    notifyPopup();
    try { chrome.runtime.sendMessage({ type: 'STATUS', scrolling: false }); } catch (_) {}
  }

  function toggle() {
    STATE.active ? stop() : start();
  }

  function setDelay(val) {
    STATE.delay = Math.max(0, Math.min(15, val));
  }

  function skipReel() {
    clearTimeout(STATE.advanceTimer);
    STATE.hasCompletedOnce = false;
    STATE.highWaterMark = 0;
    STATE.lastVideoSrc = null;

    // If not active, start first
    if (!STATE.active) {
      STATE.active = true;
      STATE.reelCount = 0;
      goToReels();
      startPolling();
      syncPill();
      notifyPopup();
      try { chrome.runtime.sendMessage({ type: 'STATUS', scrolling: true }); } catch (_) {}
    }

    advanceToNextReel();
  }

  function notifyPopup() {
    try {
      chrome.runtime.sendMessage({
        type: 'STATE_UPDATE',
        active: STATE.active,
        reelCount: STATE.reelCount,
        delay: STATE.delay,
      });
    } catch (_) {}
  }

  // ── Floating Pill ──────────────────────────────────────────
  function createPill() {
    const pill = document.createElement('div');
    pill.id = 'instascroll-pill';
    pill.innerHTML = `
      <button id="instascroll-toggle" title="Toggle doomscroll (Space)">
        <svg id="instascroll-icon-play" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
        <svg id="instascroll-icon-pause" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style="display:none">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
        </svg>
      </button>
      <span id="instascroll-label">OFF</span>
      <button id="instascroll-skip" title="Skip to next reel (→)">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
        </svg>
      </button>
      <span id="instascroll-count"></span>
    `;
    document.body.appendChild(pill);

    document.getElementById('instascroll-toggle').addEventListener('click', toggle);
    document.getElementById('instascroll-skip').addEventListener('click', (e) => {
      e.stopPropagation();
      skipReel();
    });
    syncPill();
  }

  function syncPill() {
    const label = document.getElementById('instascroll-label');
    const playIcon = document.getElementById('instascroll-icon-play');
    const pauseIcon = document.getElementById('instascroll-icon-pause');
    const pill = document.getElementById('instascroll-pill');
    const skipBtn = document.getElementById('instascroll-skip');
    const countEl = document.getElementById('instascroll-count');

    if (!label) return;

    if (STATE.active) {
      label.textContent = 'DOOMSCROLLING';
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'inline';
      pill.classList.add('active');
      if (skipBtn) skipBtn.style.display = 'flex';
      countEl.textContent = `#${STATE.reelCount}`;
    } else {
      label.textContent = 'OFF';
      playIcon.style.display = 'inline';
      pauseIcon.style.display = 'none';
      pill.classList.remove('active');
      if (skipBtn) skipBtn.style.display = 'flex'; // always show skip
      countEl.textContent = '';
    }
  }

  // ── Keyboard Shortcuts ─────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        toggle();
        break;
      case 'ArrowRight':
        e.preventDefault();
        skipReel();
        break;
      case 'Escape':
        stop();
        break;
    }
  });

  // ── Message Handling ───────────────────────────────────────
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    switch (msg.type) {
      case 'DOOMSCROLL':
        start();
        break;
      case 'STOP':
        stop();
        break;
      case 'TOGGLE':
        toggle();
        break;
      case 'SKIP':
        skipReel();
        break;
      case 'SET_DELAY':
        setDelay(msg.delay);
        break;
      case 'GET_STATE':
        sendResponse({
          active: STATE.active,
          reelCount: STATE.reelCount,
          delay: STATE.delay,
        });
        return true;
    }
    sendResponse({ ok: true, active: STATE.active, reelCount: STATE.reelCount });
  });

  // ── Observe URL changes (SPA) ──────────────────────────────
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      if (STATE.active) {
        STATE.hasCompletedOnce = false;
        STATE.lastVideoSrc = null;
        STATE.highWaterMark = 0;
      }
    }
  }).observe(document.body, { childList: true, subtree: true });

  // ── Load saved settings ────────────────────────────────────
  chrome.storage.local.get(['delay'], (data) => {
    if (data.delay !== undefined) STATE.delay = data.delay;
  });

  // ── Init ───────────────────────────────────────────────────
  if (!document.getElementById('instascroll-pill')) {
    createPill();
  }
})();
