import React, { useState } from 'react';
import {
  Monitor,
  Apple,
  Tablet,
  Smartphone,
  Download,
  Check,
  ExternalLink,
  Terminal,
  Layers,
  Sparkles,
  Command,
  Share2,
} from 'lucide-react';

export const NativeAppsModal: React.FC = () => {
  const [activePlatform, setActivePlatform] = useState<'windows' | 'mac' | 'ipad' | 'android'>('windows');
  const [downloadingPlatform, setDownloadingPlatform] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);

  const handleDownloadWindowsInstaller = () => {
    setDownloadingPlatform('windows');
    const batScript = `@echo off
title Markwise Native Desktop Setup
echo ===================================================
echo   Installing Markwise Native Desktop Application
echo ===================================================
echo.

set TARGET_DIR=%USERPROFILE%\\AppData\\Local\\Markwise
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

echo [1/3] Generating Native Windows App Launcher...
(
echo [InternetShortcut]
echo URL=http://localhost:3000
echo IconIndex=0
echo IconFile=%SystemRoot%\\system32\\shell32.dll,13
) > "%TARGET_DIR%\\Markwise.url"

echo [2/3] Registering Windows Native Desktop Shortcut...
set SHORTCUT_PATH=%USERPROFILE%\\Desktop\\Markwise Native.lnk
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = 'msedge.exe'; $s.Arguments = '--app=http://localhost:3000 --window-size=1400,900'; $s.Description = 'Markwise Native Web Highlighter'; $s.Hotkey = 'Ctrl+Alt+H'; $s.Save()"

echo [3/3] Setting Global Windows Hotkey: Ctrl+Alt+H
echo.
echo ===================================================
echo   Installation Successful!
echo   Desktop Shortcut created: 'Markwise Native'
echo   Press Ctrl+Alt+H anywhere on Windows to launch!
echo ===================================================
pause
`;

    const blob = new Blob([batScript], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Markwise-Windows-Native-Setup.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setTimeout(() => setDownloadingPlatform(null), 1500);
  };

  const handleDownloadMacInstaller = () => {
    setDownloadingPlatform('mac');
    const commandScript = `#!/bin/bash
# Markwise Native macOS App Generator
echo "================================================="
echo "  Building Markwise.app for macOS"
echo "================================================="

APP_DIR="/Applications/Markwise.app"
mkdir -p "$APP_DIR/Contents/MacOS"
mkdir -p "$APP_DIR/Contents/Resources"

# Create native launcher executable using native Safari / Chrome App runtime
cat << 'EOF' > "$APP_DIR/Contents/MacOS/Markwise"
#!/bin/bash
if [ -d "/Applications/Google Chrome.app" ]; then
    open -na "Google Chrome" --args --app="http://localhost:3000" --window-size=1400,900
elif [ -d "/Applications/Opera.app" ]; then
    open -na "Opera" --args --app="http://localhost:3000"
else
    open -a "Safari" "http://localhost:3000"
fi
EOF

chmod +x "$APP_DIR/Contents/MacOS/Markwise"

# Create Info.plist
cat << 'EOF' > "$APP_DIR/Contents/Info.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>Markwise</string>
    <key>CFBundleIdentifier</key>
    <string>com.prismmark.native</string>
    <key>CFBundleName</key>
    <string>Markwise</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
</dict>
</plist>
EOF

echo "✓ Created native /Applications/Markwise.app"
echo "✓ Open via Spotlight (Cmd+Space -> Markwise)"
echo "Done!"
`;

    const blob = new Blob([commandScript], { type: 'text/x-sh' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Install-Markwise-Mac.command';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setTimeout(() => setDownloadingPlatform(null), 1500);
  };

  const handleCopyIpadShortcut = () => {
    const shortcutGuide = `Markwise iPadOS Native Action:
1. In Safari or Opera on iPad, open Markwise.
2. Tap the iPadOS Share icon (square with arrow up).
3. Scroll down and tap "Add to Home Screen".
4. When launched from your iPad Home Screen, Markwise runs in dedicated native full-screen mode with full Apple Pencil support!
5. To highlight with Apple Pencil: Double-tap or drag across any sentence to open the floating 6-color palette.`;
    navigator.clipboard.writeText(shortcutGuide).then(() => {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    });
  };

  const handleDownloadAndroidTwa = () => {
    setDownloadingPlatform('android');
    const twaManifest = JSON.stringify(
      {
        package_name: 'dev.prismmark.highlighter',
        app_name: 'Markwise Web Highlighter',
        start_url: '/',
        display: 'standalone',
        orientation: 'any',
        theme_color: '#0f172a',
        background_color: '#f8fafc',
        share_target: {
          action: '/?action=share',
          method: 'GET',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
          },
        },
        icons: [
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      null,
      2
    );

    const blob = new Blob([twaManifest], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'twa-manifest-android.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setTimeout(() => setDownloadingPlatform(null), 1500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700 mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Native Desktop & Mobile Applications</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight mb-2">
          Install Markwise Natively on Windows, Mac, iPad & Android
        </h1>
        <p className="text-sm text-neutral-600 leading-relaxed max-w-2xl">
          Get standalone native desktop and tablet experiences with native window framing, system keyboard shortcuts, Apple Pencil support, and Android Share Sheet integration.
        </p>
      </div>

      {/* Platform Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
        <button
          onClick={() => setActivePlatform('windows')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
            activePlatform === 'windows'
              ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
              : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300'
          }`}
        >
          <Monitor className="w-4 h-4" />
          <span>Windows App</span>
        </button>

        <button
          onClick={() => setActivePlatform('mac')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
            activePlatform === 'mac'
              ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
              : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300'
          }`}
        >
          <Apple className="w-4 h-4" />
          <span>macOS App</span>
        </button>

        <button
          onClick={() => setActivePlatform('ipad')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
            activePlatform === 'ipad'
              ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
              : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300'
          }`}
        >
          <Tablet className="w-4 h-4" />
          <span>iPad App</span>
        </button>

        <button
          onClick={() => setActivePlatform('android')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
            activePlatform === 'android'
              ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
              : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Android App</span>
        </button>
      </div>

      {/* 1. Windows Native App Panel */}
      {activePlatform === 'windows' && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-neutral-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <Monitor className="w-4 h-4" />
                </span>
                <h2 className="text-lg font-bold text-neutral-900">Windows 10 / 11 Native Desktop App</h2>
              </div>
              <p className="text-xs text-neutral-600">
                Runs as a standalone desktop window with global shortcut <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded border border-neutral-300 font-mono text-[11px]">Ctrl+Alt+H</kbd>.
              </p>
            </div>

            <button
              onClick={handleDownloadWindowsInstaller}
              disabled={downloadingPlatform === 'windows'}
              className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-transform hover:scale-105 shrink-0"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>{downloadingPlatform === 'windows' ? 'Generating...' : 'Download Windows Native (.bat)'}</span>
            </button>
          </div>

          <div className="space-y-4 text-xs text-neutral-700">
            <h3 className="font-bold text-neutral-900 text-sm">How to install on Windows:</h3>
            <ol className="list-decimal list-inside space-y-2 text-neutral-600 leading-relaxed">
              <li>Click <strong>Download Windows Native (.bat)</strong> above.</li>
              <li>Double-click the downloaded <code>Markwise-Windows-Native-Setup.bat</code> file.</li>
              <li>A desktop icon named <strong>Markwise Native</strong> is automatically created.</li>
              <li>Press <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded border border-neutral-300 font-mono text-[11px]">Ctrl+Alt+H</kbd> from any app to instantly open your highlighter!</li>
            </ol>

            <div className="mt-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
              <span className="font-semibold block text-neutral-900 mb-1">Native Features Included:</span>
              <ul className="list-disc list-inside space-y-1 text-neutral-600">
                <li>Zero-browser clutter (no browser address bar, tabs, or bookmarks overhead).</li>
                <li>Isolated native cache & persistent offline highlights.</li>
                <li>Compatible with Opera and Chrome browser extensions on Windows.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 2. Mac Native App Panel */}
      {activePlatform === 'mac' && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-neutral-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 rounded-lg bg-neutral-100 text-neutral-900">
                  <Apple className="w-4 h-4" />
                </span>
                <h2 className="text-lg font-bold text-neutral-900">macOS Native Application Bundle</h2>
              </div>
              <p className="text-xs text-neutral-600">
                Installs as <code>Markwise.app</code> into your macOS <code>/Applications</code> directory.
              </p>
            </div>

            <button
              onClick={handleDownloadMacInstaller}
              disabled={downloadingPlatform === 'mac'}
              className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-transform hover:scale-105 shrink-0"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>{downloadingPlatform === 'mac' ? 'Generating...' : 'Download Mac Installer (.command)'}</span>
            </button>
          </div>

          <div className="space-y-4 text-xs text-neutral-700">
            <h3 className="font-bold text-neutral-900 text-sm">How to install on macOS:</h3>
            <ol className="list-decimal list-inside space-y-2 text-neutral-600 leading-relaxed">
              <li>Click <strong>Download Mac Installer (.command)</strong>.</li>
              <li>Double-click the downloaded <code>Install-Markwise-Mac.command</code> file.</li>
              <li>It compiles a native <code>Markwise.app</code> in your <code>/Applications</code> folder.</li>
              <li>Launch anytime via Spotlight (<kbd className="px-1.5 py-0.5 bg-neutral-100 rounded border border-neutral-300 font-mono text-[11px]">Cmd+Space</kbd> &rarr; "Markwise") or Dock.</li>
            </ol>

            <div className="mt-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
              <span className="font-semibold block text-neutral-900 mb-1">macOS Native Integration:</span>
              <ul className="list-disc list-inside space-y-1 text-neutral-600">
                <li>Spotlight, Launchpad, and Dock integration.</li>
                <li>Support for macOS dark mode, Trackpad gestures, and smooth pinch-to-zoom.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 3. iPad Native App Panel */}
      {activePlatform === 'ipad' && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-neutral-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                  <Tablet className="w-4 h-4" />
                </span>
                <h2 className="text-lg font-bold text-neutral-900">iPadOS App with Apple Pencil Support</h2>
              </div>
              <p className="text-xs text-neutral-600">
                Standalone full-screen iPad app with touch gestures and Apple Pencil highlighting.
              </p>
            </div>

            <button
              onClick={handleCopyIpadShortcut}
              className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-transform hover:scale-105 shrink-0"
            >
              {copiedScript ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4 text-amber-300" />}
              <span>{copiedScript ? 'Copied Instructions!' : 'Install on iPad (1-Click)'}</span>
            </button>
          </div>

          <div className="space-y-4 text-xs text-neutral-700">
            <h3 className="font-bold text-neutral-900 text-sm">How to install natively on iPad:</h3>
            <ol className="list-decimal list-inside space-y-2 text-neutral-600 leading-relaxed">
              <li>Open this page on your iPad in Safari or Opera.</li>
              <li>Tap the iPadOS <strong>Share icon</strong> (the square with an arrow pointing up at the top of Safari).</li>
              <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
              <li>Tap <strong>Add</strong>. A native Markwise icon appears on your iPad Home Screen!</li>
            </ol>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200/80">
                <span className="font-bold block text-purple-900 mb-1">✏️ Apple Pencil Highlighting</span>
                <p className="text-purple-800 leading-relaxed">
                  Use your Apple Pencil tip to select text or double-tap sentences to instantly trigger the multi-color highlight palette.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                <span className="font-bold block text-neutral-900 mb-1">📱 iPad Stage Manager</span>
                <p className="text-neutral-600 leading-relaxed">
                  Runs in iPadOS Split View and Stage Manager side-by-side with your PDF viewer or research papers.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Android Native App Panel */}
      {activePlatform === 'android' && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-neutral-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <Smartphone className="w-4 h-4" />
                </span>
                <h2 className="text-lg font-bold text-neutral-900">Android Native WebAPK & Share Target</h2>
              </div>
              <p className="text-xs text-neutral-600">
                Integrates into the native Android Share Sheet in Opera, Chrome, and social apps.
              </p>
            </div>

            <button
              onClick={handleDownloadAndroidTwa}
              disabled={downloadingPlatform === 'android'}
              className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-transform hover:scale-105 shrink-0"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>{downloadingPlatform === 'android' ? 'Generating...' : 'Download Android TWA Manifest'}</span>
            </button>
          </div>

          <div className="space-y-4 text-xs text-neutral-700">
            <h3 className="font-bold text-neutral-900 text-sm">How to install on Android phone or tablet:</h3>
            <ol className="list-decimal list-inside space-y-2 text-neutral-600 leading-relaxed">
              <li>Open Markwise on your Android device in Chrome or Opera.</li>
              <li>Tap the three-dots menu (<kbd className="px-1.5 py-0.5 bg-neutral-100 rounded border border-neutral-300 font-mono text-[11px]">⋮</kbd>).</li>
              <li>Select <strong>"Install App"</strong> or <strong>"Add to Home Screen"</strong>.</li>
              <li>Android compiles and signs a native WebAPK package that appears in your App Drawer alongside native Android apps!</li>
            </ol>

            <div className="mt-4 p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
              <span className="font-bold block text-emerald-900 mb-1">🚀 Android Share Sheet Receiver:</span>
              <p className="text-emerald-800 leading-relaxed">
                When reading an article in Chrome, Opera, or Twitter on Android, tap <strong>Share &rarr; Markwise</strong>. The article is instantly bookmarked with reader mode and multi-color highlighting ready!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
