// Content script
// - Hides <img> elements whose src is in blocked list
// - Observes DOM mutations to apply hiding dynamically
// - Listens for background message to hide newly blocked URL immediately

const HIDDEN_CLASS = 'nozh-avatar-hidden';

function normalizeAvatarUrl(input) {
  try {
    const u = new URL(input, document.baseURI);
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

function hideImg(img) {
  if (!img || img.classList.contains(HIDDEN_CLASS)) return;
  img.style.filter = 'grayscale(1) brightness(0)';
  img.style.opacity = '0';
  img.style.pointerEvents = 'none';
  img.classList.add(HIDDEN_CLASS);
}

function matchesBlocked(img, blockedSet) {
  if (!(img instanceof HTMLImageElement)) return false;
  const candidates = new Set();
  if (img.src) candidates.add(img.src);
  // consider data-src or lazy attributes
  ['data-src', 'data-original'].forEach((attr) => {
    const val = img.getAttribute(attr);
    if (val) candidates.add(val);
  });
  // parse srcset into URLs
  const srcset = img.getAttribute('srcset');
  if (srcset) {
    srcset.split(',').forEach((item) => {
      const url = item.trim().split(/\s+/)[0];
      if (url) candidates.add(url);
    });
  }

  for (const s of candidates) {
    const key = normalizeAvatarUrl(s);
    if (blockedSet.has(key)) return true;
  }
  return false;
}

function scanAndHide(blockedSet) {
  const imgs = document.images;
  for (const img of imgs) {
    if (matchesBlocked(img, blockedSet)) hideImg(img);
  }
}

async function init() {
  const resp = await chrome.runtime.sendMessage({ type: 'get-blocked-avatars' }).catch(() => null);
  const blockedSet = new Set((resp?.urls || []).map((x) => String(x)));

  scanAndHide(blockedSet);

  const mo = new MutationObserver(() => scanAndHide(blockedSet));
  mo.observe(document.documentElement || document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['src', 'data-src', 'data-original', 'srcset']
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === 'avatar-blocked' && typeof msg.url === 'string') {
      blockedSet.add(normalizeAvatarUrl(msg.url));
      scanAndHide(blockedSet);
    }
  });
}

init();


