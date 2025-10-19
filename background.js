// Background service worker (MV3)
// - Adds context menu on images to block avatar by src URL
// - Persists blocked list in chrome.storage.local under key 'blockedAvatars'
// - Responds to messages from content script to fetch/update list

const STORAGE_KEY = 'blockedAvatars';
const MENU_ID_BLOCK = 'nozh_block_avatar';

function normalizeAvatarUrl(input) {
  try {
    const u = new URL(input);
    const path = u.pathname || '';
    const last = path.split('/').filter(Boolean).pop() || path;
    return last.toLowerCase();
  } catch (_) {
    const s = String(input || '')
      .split('?')[0]
      .split('#')[0];
    const last = s.split('/').filter(Boolean).pop() || s;
    return last.toLowerCase();
  }
}

async function getBlockedSet() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const list = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
  // list may contain raw urls (legacy). Convert to normalized keys.
  const keys = list.map((x) => normalizeAvatarUrl(String(x)));
  return new Set(keys);
}

async function saveBlockedSet(blockedSet) {
  await chrome.storage.local.set({ [STORAGE_KEY]: Array.from(blockedSet) });
}

function isLikelyAvatarUrl(url) {
  try {
    const u = new URL(url);
    const path = u.pathname.toLowerCase();
    return /(avatar|profile|head|face|icon)/.test(path) || /\.(png|jpg|jpeg|gif|webp|svg)(?:\?|$)/.test(path);
  } catch (_) {
    return false;
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID_BLOCK,
    title: 'Block this avatar',
    contexts: ['image']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID_BLOCK) return;
  const srcUrl = info.srcUrl;
  if (!srcUrl) return;
  if (!isLikelyAvatarUrl(srcUrl)) {
    // Still allow manual block even if heuristic fails
  }

  const blocked = await getBlockedSet();
  blocked.add(normalizeAvatarUrl(srcUrl));
  await saveBlockedSet(blocked);

  if (tab && tab.id != null) {
    chrome.tabs.sendMessage(tab.id, { type: 'avatar-blocked', url: srcUrl }).catch(() => {});
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (message?.type === 'get-blocked-avatars') {
      const blocked = await getBlockedSet();
      sendResponse({ urls: Array.from(blocked) });
    } else if (message?.type === 'unblock-avatar' && typeof message.url === 'string') {
      const blocked = await getBlockedSet();
      blocked.delete(normalizeAvatarUrl(message.url));
      await saveBlockedSet(blocked);
      sendResponse({ ok: true });
    }
  })();
  return true; // keep message channel open for async sendResponse
});


