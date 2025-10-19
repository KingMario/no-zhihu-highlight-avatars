# No Zhihu Highlight Avatars

Hide overly highlighted avatars on webpages via a right‑click context menu. Blocked URLs are stored persistently in the extension storage.

## Install (Developer Mode)

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable Developer mode in the top right.
3. Click “Load unpacked” and select this project directory.

## Usage

- Right‑click an avatar image on a page and choose “Block this avatar”.
- The avatar is hidden immediately and will stay hidden on future visits.
- In the extension Options page you can view/remove/add blocked avatar URLs.

## How it works

- The background Service Worker adds a context menu for images. When selected, it saves the image `src` URL to `chrome.storage.local` under `blockedAvatars`.
- The content script loads the blocked list on start, scans `<img>` elements and hides matches (by making them transparent and non‑clickable). It also observes DOM mutations and reacts to background messages to hide newly blocked avatars.

## Permissions

- storage: Persist the list of blocked avatar URLs.
- contextMenus: Show a right‑click menu item on images.
- scripting / host_permissions: Allow working on all pages.

## Compatibility

- Built with Manifest V3 for modern Chrome versions.

## Notes

- Blocking uses exact URL matching. If a site serves avatars with dynamic signatures or multiple sizes/crops, you may need to add multiple URLs.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

Copyright (c) 2025–2026 Mario-Studio
