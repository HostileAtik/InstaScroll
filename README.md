# 🔥 InstaScroll — Instagram Reels Doomscroller

<div align="center">

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-34A853?style=for-the-badge)
![License MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0.0-dd2a7b?style=for-the-badge)

**Auto-advance through Instagram Reels, one by one. Hit Doomscroll and let it ride.**

[Features](#-features) • [Install](#-install) • [Usage](#-usage) • [Shortcuts](#-keyboard-shortcuts) • [Contributing](#-contributing)

</div>

---

## ✨ Features

- 🎬 **One-Click Doomscroll** — Press the button, get taken to Reels, and watch them auto-advance
- ⏭️ **Smart Auto-Advance** — Detects when a reel finishes playing and scrolls to the next one
- ⏱️ **Configurable Delay** — Set 0–15 seconds between reels (default: 3s)
- ⏩ **Skip Button** — Skip the current reel instantly
- 🎯 **Floating Control Pill** — Unobtrusive on-screen controls while browsing
- ⌨️ **Keyboard Shortcuts** — Space, Arrow Right, Escape
- 🌙 **Premium Dark UI** — Glassmorphic popup with Instagram-gradient accents
- 💾 **Persistent Settings** — Your preferences are saved between sessions
- 🔒 **Privacy-First** — No data collection, no analytics, no external requests

## 📦 Install

### Chrome / Edge / Brave (any Chromium browser)

1. **Download** this repository:
   - Click the green **Code** button → **Download ZIP**
   - Or clone: `git clone https://github.com/HostileAtik/instascroll.git`

2. **Open** your browser's extension page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`

3. **Enable** Developer Mode (toggle in the top-right corner)

4. Click **Load unpacked** and select the `instascroll` folder

5. ✅ You're ready! The InstaScroll icon will appear in your toolbar

## 🚀 Usage

1. **Go to Instagram** (or just click the extension — it'll take you there)
2. Click the **InstaScroll** icon in your toolbar
3. Hit the **DOOMSCROLL** button
4. Sit back — reels auto-advance after each one finishes 🍿

### Popup Controls

| Control | What it does |
|---|---|
| **DOOMSCROLL** button | Start/stop auto-advancing reels |
| **Delay slider** | Time to wait between reels (0–15s) |
| **Skip button** | Skip the current reel immediately |

### Floating Pill (on Instagram)

A small floating control pill appears in the bottom-right corner of Instagram with:
- ▶️ Play/Pause toggle
- ⏭️ Skip to next reel
- Reel counter

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `Space` | Toggle doomscrolling on/off |
| `→` (Right Arrow) | Skip to next reel |
| `Escape` | Stop doomscrolling |

## 🛠️ Tech Stack

- **Manifest V3** — Latest Chrome extension standard
- **Vanilla JS/CSS** — Zero dependencies, minimal footprint
- **Chrome Storage API** — Persistent settings
- **requestAnimationFrame** — Smooth, battery-efficient operation

## 📁 Project Structure

```
instascroll/
├── manifest.json       # Extension configuration
├── background.js       # Service worker (badge management)
├── content.js          # Core logic (reel detection + auto-advance)
├── content.css         # Floating pill styles
├── popup.html          # Extension popup
├── popup.css           # Premium dark theme
├── popup.js            # Popup controls + state sync
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. **Fork** this repository
2. **Create** a branch: `git checkout -b feature/my-feature`
3. **Commit** your changes: `git commit -m 'Add some feature'`
4. **Push** to the branch: `git push origin feature/my-feature`
5. **Open** a Pull Request

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for doomscrollers everywhere**

⭐ Star this repo if you find it useful!

</div>
