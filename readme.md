# Better Apps Launcher

A sidebar plugin for [Acode Editor](https://acode.app/) that lets you pin and quickly launch your favorite Android apps directly from the editor's sidebar.

---

## Features

- **App Shortcuts** — Add any installed Android app to your personal launcher list
- **One-Tap Launch** — Open apps instantly from the Acode sidebar
- **Alphabetical Sorting** — Toggle A–Z sorting for your app list
- **Floating "Add" Button** — Optionally keep the "New App" button floating at the bottom
- **Edit & Remove Apps** — Hold an app icon to access options (rename label, remove)
- **Persistent Config** — Your app list and preferences are saved across sessions

---

## Installation

1. Open Acode Editor
2. Go to **Settings → Plugins**
3. Search for **Better Apps Launcher**
4. Tap **Install**

---

## Usage

### Adding an App
1. Open the **Better Apps Launcher** panel from the sidebar (▶ icon)
2. Tap the **"+ New App"** button
3. Select an installed app from the list
4. The app is added to your launcher

### Launching an App
Tap any app icon in the launcher panel to open it immediately.

### Editing or Removing an App
**Hold** an app icon for ~1 second to open the options dialog, where you can:
- **Edit** — Change the app's display label
- **Remove** — Remove it from the launcher

### Toolbar Options

| Button | Description |
|--------|-------------|
| Sort A–Z | Toggles alphabetical sorting of apps |
| Floating | Toggles the floating position of the "New App" button |

## Permissions

This plugin uses Android shell commands via `Executor` to query installed packages and resolve app activities. It requires an equivalent shell execution environment to be available in Acode. Note that not all installed apps may appear in the list — this depends on your device, Android version, and whether the app exposes a launcher activity. Apps without a launcher intent (background services, system components, etc.) will not show up. App icons are also not displayed, as reliably fetching them across all devices and Android versions is not straightforward.

## License

[MIT](https://github.com/overskul/better-apps-lancher/blob/main/LICENSE) © Better Apps Launcher
