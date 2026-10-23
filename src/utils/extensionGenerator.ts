import JSZip from 'jszip';

export const BOOKMARKLET_CODE = `javascript:(function(){
  if (window.__prismmark_active) {
    var existing = document.getElementById('prismmark-floating-bar');
    if (existing) { existing.remove(); window.__prismmark_active = false; return; }
  }
  window.__prismmark_active = true;

  var bar = document.createElement('div');
  bar.id = 'prismmark-floating-bar';
  bar.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:2147483647;background:#0f172a;color:#f8fafc;padding:10px 16px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.35);font-family:system-ui,-apple-system,sans-serif;font-size:13px;display:flex;align-items:center;gap:10px;border:1px solid rgba(255,255,255,0.15);';

  var label = document.createElement('span');
  label.innerHTML = '<strong>Markwise</strong> Highlighter:';
  bar.appendChild(label);

  var colors = [
    { name: 'yellow', bg: '#fef08a', border: '#eab308' },
    { name: 'green', bg: '#bbf7d0', border: '#22c55e' },
    { name: 'blue', bg: '#bfdbfe', border: '#3b82f6' },
    { name: 'pink', bg: '#fbcfe8', border: '#ec4899' },
    { name: 'purple', bg: '#e9d5ff', border: '#a855f7' },
    { name: 'orange', bg: '#fed7aa', border: '#f97316' }
  ];

  var currentColor = 'yellow';

  colors.forEach(function(c) {
    var btn = document.createElement('button');
    btn.title = 'Highlight ' + c.name;
    btn.style.cssText = 'width:20px;height:20px;border-radius:50%;background:' + c.bg + ';border:2px solid ' + c.border + ';cursor:pointer;outline:none;transition:transform 0.1s;';
    btn.onclick = function() {
      currentColor = c.name;
      highlightSelectedText(c.bg);
    };
    bar.appendChild(btn);
  });

  var sep = document.createElement('span');
  sep.style.cssText = 'width:1px;height:18px;background:rgba(255,255,255,0.2);margin:0 4px;';
  bar.appendChild(sep);

  var readerBtn = document.createElement('button');
  readerBtn.innerText = 'Reader View';
  readerBtn.style.cssText = 'background:#334155;color:#fff;border:none;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:500;';
  readerBtn.onclick = function() {
    toggleReaderMode();
  };
  bar.appendChild(readerBtn);

  var copyBtn = document.createElement('button');
  copyBtn.innerText = 'Export Highlights';
  copyBtn.style.cssText = 'background:#2563eb;color:#fff;border:none;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:500;';
  copyBtn.onclick = function() {
    exportHighlights();
  };
  bar.appendChild(copyBtn);

  var closeBtn = document.createElement('button');
  closeBtn.innerText = '✕';
  closeBtn.title = 'Close highlighter';
  closeBtn.style.cssText = 'background:none;border:none;color:#94a3b8;cursor:pointer;font-size:14px;margin-left:6px;';
  closeBtn.onclick = function() {
    bar.remove();
    window.__prismmark_active = false;
  };
  bar.appendChild(closeBtn);

  document.body.appendChild(bar);

  function highlightSelectedText(bgColor) {
    var sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    var range = sel.getRangeAt(0);
    var mark = document.createElement('mark');
    mark.className = 'prismmark-highlight';
    mark.style.cssText = 'background-color:' + bgColor + ';border-radius:2px;padding:1px 2px;cursor:pointer;';
    try {
      range.surroundContents(mark);
      sel.removeAllRanges();
    } catch(e) {
      document.execCommand('hiliteColor', false, bgColor);
    }
  }

  function toggleReaderMode() {
    var id = 'prismmark-reader-overlay';
    var existing = document.getElementById(id);
    if (existing) { existing.remove(); return; }
    var article = document.querySelector('article') || document.querySelector('main') || document.body;
    var clone = article.cloneNode(true);
    var overlay = document.createElement('div');
    overlay.id = id;
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#fbf0d9;color:#2c2416;z-index:2147483640;overflow-y:auto;padding:60px 24px;box-sizing:border-box;font-family:Georgia,serif;font-size:19px;line-height:1.75;';
    var container = document.createElement('div');
    container.style.cssText = 'max-width:720px;margin:0 auto;';
    var close = document.createElement('button');
    close.innerText = '← Exit Reader Mode';
    close.style.cssText = 'position:fixed;top:20px;left:24px;background:#433422;color:#fbf0d9;border:none;padding:8px 14px;border-radius:6px;font-size:13px;cursor:pointer;font-family:sans-serif;';
    close.onclick = function() { overlay.remove(); };
    container.appendChild(clone);
    overlay.appendChild(close);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
  }

  function exportHighlights() {
    var hls = document.querySelectorAll('.prismmark-highlight, mark');
    var texts = [];
    hls.forEach(function(h) { texts.push('> ' + h.innerText.trim()); });
    var payload = '# Highlights from ' + document.title + '\\nURL: ' + window.location.href + '\\n\\n' + texts.join('\\n\\n');
    navigator.clipboard.writeText(payload).then(function() {
      alert('Copied ' + hls.length + ' highlights to clipboard in Markdown format!');
    }).catch(function() {
      prompt('Highlights:', payload);
    });
  }

  document.addEventListener('mouseup', function() {
    var sel = window.getSelection();
    if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) {
      // ready to highlight
    }
  });
})();`;

export async function generateChromeOperaExtensionZip(): Promise<Blob> {
  const zip = new JSZip();

  const manifest = {
    manifest_version: 3,
    name: 'Markwise - Web Highlighter & Reader',
    version: '1.0.0',
    description: 'Multi-color web highlighter, bookmark manager, and distraction-free reader mode for Chrome and Opera.',
    permissions: ['activeTab', 'storage', 'contextMenus'],
    action: {
      default_popup: 'popup.html',
      default_title: 'Markwise Highlighter',
    },
    content_scripts: [
      {
        matches: ['<all_urls>'],
        js: ['content.js'],
        css: ['content.css'],
        run_at: 'document_idle',
      },
    ],
    background: {
      service_worker: 'background.js',
    },
  };

  const contentCss = `
.prismmark-floating-bar {
  position: absolute;
  z-index: 2147483647;
  display: flex;
  align-items: center;
  gap: 6px;
  background: #0f172a;
  color: #f8fafc;
  padding: 6px 10px;
  border-radius: 9999px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.15);
  transform: translate(-50%, -100%);
  margin-top: -10px;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 12px;
  pointer-events: auto;
  user-select: none;
}

.prismmark-color-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

.prismmark-color-dot:hover {
  transform: scale(1.25);
}

.prismmark-hl-yellow { background-color: rgba(254, 240, 138, 0.7); box-shadow: 0 1px 0 rgba(234, 179, 8, 0.4); border-radius: 2px; }
.prismmark-hl-green { background-color: rgba(187, 247, 208, 0.75); box-shadow: 0 1px 0 rgba(34, 197, 94, 0.4); border-radius: 2px; }
.prismmark-hl-blue { background-color: rgba(191, 219, 254, 0.75); box-shadow: 0 1px 0 rgba(59, 130, 246, 0.4); border-radius: 2px; }
.prismmark-hl-pink { background-color: rgba(251, 207, 232, 0.75); box-shadow: 0 1px 0 rgba(236, 72, 153, 0.4); border-radius: 2px; }
.prismmark-hl-purple { background-color: rgba(233, 213, 255, 0.75); box-shadow: 0 1px 0 rgba(168, 85, 247, 0.4); border-radius: 2px; }
.prismmark-hl-orange { background-color: rgba(254, 215, 170, 0.8); box-shadow: 0 1px 0 rgba(249, 115, 22, 0.4); border-radius: 2px; }

.prismmark-reader-view {
  position: fixed !important;
  inset: 0 !important;
  z-index: 2147483640 !important;
  background: #fbf0d9 !important;
  color: #2b2114 !important;
  overflow-y: auto !important;
  padding: 64px 24px !important;
  font-family: 'Georgia', 'Source Serif 4', serif !important;
  font-size: 20px !important;
  line-height: 1.8 !important;
}
`;

  const contentJs = `// Markwise Chrome & Opera Content Script
(function() {
  const COLORS = {
    yellow: { bg: 'rgba(254, 240, 138, 0.7)', border: '#eab308' },
    green: { bg: 'rgba(187, 247, 208, 0.75)', border: '#22c55e' },
    blue: { bg: 'rgba(191, 219, 254, 0.75)', border: '#3b82f6' },
    pink: { bg: 'rgba(251, 207, 232, 0.75)', border: '#ec4899' },
    purple: { bg: 'rgba(233, 213, 255, 0.75)', border: '#a855f7' },
    orange: { bg: 'rgba(254, 215, 170, 0.8)', border: '#f97316' },
  };

  let floatingToolbar = null;
  let activeSelectionRange = null;

  function createFloatingToolbar() {
    if (floatingToolbar) return floatingToolbar;
    floatingToolbar = document.createElement('div');
    floatingToolbar.className = 'prismmark-floating-bar';
    floatingToolbar.style.display = 'none';

    Object.keys(COLORS).forEach(colorKey => {
      const dot = document.createElement('div');
      dot.className = 'prismmark-color-dot';
      dot.style.backgroundColor = COLORS[colorKey].bg;
      dot.style.border = '2px solid ' + COLORS[colorKey].border;
      dot.title = 'Highlight ' + colorKey;
      dot.addEventListener('mousedown', (e) => {
        e.preventDefault();
        applyHighlight(colorKey);
      });
      floatingToolbar.appendChild(dot);
    });

    const divider = document.createElement('div');
    divider.style.width = '1px';
    divider.style.height = '16px';
    divider.style.backgroundColor = 'rgba(255,255,255,0.2)';
    floatingToolbar.appendChild(divider);

    const noteBtn = document.createElement('button');
    noteBtn.innerText = 'Note';
    noteBtn.style.background = 'none';
    noteBtn.style.border = 'none';
    noteBtn.style.color = '#e2e8f0';
    noteBtn.style.cursor = 'pointer';
    noteBtn.style.fontSize = '11px';
    noteBtn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const note = prompt('Add note to highlight:');
      if (note) applyHighlight('yellow', note);
    });
    floatingToolbar.appendChild(noteBtn);

    document.body.appendChild(floatingToolbar);
    return floatingToolbar;
  }

  function applyHighlight(color, note = '') {
    if (!activeSelectionRange) return;
    const selectedText = activeSelectionRange.toString().trim();
    if (!selectedText) return;

    const span = document.createElement('mark');
    span.className = 'prismmark-hl-' + color;
    span.dataset.prismmarkId = 'hl_' + Date.now();
    span.dataset.color = color;
    if (note) span.dataset.note = note;

    try {
      activeSelectionRange.surroundContents(span);
    } catch(err) {
      document.execCommand('hiliteColor', false, COLORS[color].bg);
    }

    saveHighlightToStorage({
      id: span.dataset.prismmarkId || ('hl_' + Date.now()),
      url: window.location.href,
      title: document.title,
      text: selectedText,
      color: color,
      note: note,
      createdAt: new Date().toISOString()
    });

    hideToolbar();
    window.getSelection()?.removeAllRanges();
  }

  function saveHighlightToStorage(item) {
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['prismmark_highlights'], (res) => {
        const list = res.prismmark_highlights || [];
        list.push(item);
        chrome.storage.local.set({ prismmark_highlights: list });
      });
    }
  }

  function hideToolbar() {
    if (floatingToolbar) floatingToolbar.style.display = 'none';
    activeSelectionRange = null;
  }

  document.addEventListener('mouseup', (e) => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      hideToolbar();
      return;
    }

    const range = sel.getRangeAt(0);
    activeSelectionRange = range.cloneRange();
    const rect = range.getBoundingClientRect();

    const tb = createFloatingToolbar();
    tb.style.display = 'flex';
    tb.style.top = (window.scrollY + rect.top) + 'px';
    tb.style.left = (window.scrollX + rect.left + (rect.width / 2)) + 'px';
  });

  document.addEventListener('mousedown', (e) => {
    if (floatingToolbar && !floatingToolbar.contains(e.target)) {
      hideToolbar();
    }
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'GET_PAGE_DATA') {
      sendResponse({
        url: window.location.href,
        title: document.title,
        highlightsCount: document.querySelectorAll('[class*="prismmark-hl-"]').length
      });
    }
    if (request.action === 'TOGGLE_READER_MODE') {
      let r = document.getElementById('prismmark-reader-view-root');
      if (r) {
        r.remove();
        sendResponse({ readerActive: false });
      } else {
        const overlay = document.createElement('div');
        overlay.id = 'prismmark-reader-view-root';
        overlay.className = 'prismmark-reader-view';

        const main = document.querySelector('article') || document.querySelector('main') || document.body;
        const inner = document.createElement('div');
        inner.style.maxWidth = '720px';
        inner.style.margin = '0 auto';
        inner.innerHTML = '<h1>' + document.title + '</h1>' + main.innerHTML;
        overlay.appendChild(inner);
        document.body.appendChild(overlay);
        sendResponse({ readerActive: true });
      }
    }
  });
})();
`;

  const popupHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { width: 320px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 16px; background: #0f172a; color: #f8fafc; }
    h2 { margin: 0 0 12px 0; font-size: 15px; font-weight: 600; display: flex; align-items: center; justify-content: space-between; }
    .status-badge { font-size: 11px; padding: 2px 6px; background: #334155; border-radius: 4px; color: #94a3b8; }
    .btn { display: block; width: 100%; box-sizing: border-box; text-align: center; background: #2563eb; color: #fff; padding: 8px 12px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 500; border: none; cursor: pointer; margin-top: 8px; }
    .btn-secondary { background: #1e293b; border: 1px solid #334155; color: #cbd5e1; }
    .btn:hover { opacity: 0.95; }
    .palette { display: flex; gap: 8px; justify-content: center; margin: 12px 0; }
    .palette-circle { width: 24px; height: 24px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); }
    .meta { font-size: 12px; color: #94a3b8; line-height: 1.5; margin-bottom: 12px; }
  </style>
</head>
<body>
  <h2>Markwise <span class="status-badge" id="hl-count">0 Highlights</span></h2>
  <div class="meta" id="page-title">Detecting page...</div>
  <div class="palette">
    <div class="palette-circle" style="background:#fef08a;"></div>
    <div class="palette-circle" style="background:#bbf7d0;"></div>
    <div class="palette-circle" style="background:#bfdbfe;"></div>
    <div class="palette-circle" style="background:#fbcfe8;"></div>
    <div class="palette-circle" style="background:#e9d5ff;"></div>
    <div class="palette-circle" style="background:#fed7aa;"></div>
  </div>
  <button id="reader-btn" class="btn btn-secondary">Toggle Reader Mode</button>
  <button id="copy-btn" class="btn btn-secondary">Copy Highlights (Markdown)</button>
  <button id="open-app-btn" class="btn">Open Markwise Dashboard</button>
  <script src="popup.js"></script>
</body>
</html>`;

  const popupJs = `
document.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'GET_PAGE_DATA' }, (response) => {
        if (response) {
          document.getElementById('page-title').innerText = response.title || 'Current Webpage';
          document.getElementById('hl-count').innerText = (response.highlightsCount || 0) + ' Highlights';
        }
      });
    }
  });

  document.getElementById('reader-btn').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'TOGGLE_READER_MODE' });
      }
    });
  });

  document.getElementById('copy-btn').addEventListener('click', () => {
    chrome.storage.local.get(['prismmark_highlights'], (res) => {
      const items = res.prismmark_highlights || [];
      const text = items.map(h => '> ' + h.text + (h.note ? ' (' + h.note + ')' : '')).join('\\n\\n');
      navigator.clipboard.writeText(text).then(() => {
        alert('Copied ' + items.length + ' highlights to clipboard!');
      });
    });
  });

  document.getElementById('open-app-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://ais-dev-w3oyyezgh3okk5lipgzihv-883918763937.asia-southeast1.run.app' });
  });
});
`;

  const backgroundJs = `
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'prismmark-highlight-yellow',
    title: 'Highlight in Yellow',
    contexts: ['selection']
  });
  chrome.contextMenus.create({
    id: 'prismmark-reader-mode',
    title: 'Open in Reader Mode',
    contexts: ['page']
  });
});
`;

  const readmeMd = `# Markwise Web Highlighter for Google Chrome & Opera

Install in 30 seconds:

## Chrome Instructions
1. Open Google Chrome.
2. Navigate to \`chrome://extensions\` in the URL bar.
3. Enable **Developer mode** toggle in the top-right corner.
4. Click **Load unpacked** button.
5. Select this unzipped folder!

## Opera Instructions
1. Open Opera.
2. Navigate to \`opera://extensions\` in the URL bar.
3. Enable **Developer Mode** toggle in the top-right corner.
4. Click **Load unpacked** and select this unzipped folder!

## Features
- Multi-color floating text highlighter (Yellow, Green, Blue, Pink, Purple, Orange)
- Add annotations and notes to any highlight
- Instant distraction-free Reader Mode for any article
- Export highlights directly into Markdown or Notion/Obsidian
`;

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  zip.file('content.js', contentJs);
  zip.file('content.css', contentCss);
  zip.file('popup.html', popupHtml);
  zip.file('popup.js', popupJs);
  zip.file('background.js', backgroundJs);
  zip.file('README.md', readmeMd);

  return await zip.generateAsync({ type: 'blob' });
}
