# Napacitor

[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)](https://github.com/jevonsflash/Napacitor/blob/master/LICENSE)
![codeSize](https://img.shields.io/github/languages/code-size/jevonsflash/Napacitor.svg?style=for-the-badge)
[![](https://img.shields.io/npm/v/@napacitor/core?style=for-the-badge)](https://www.npmjs.com/package/@napacitor/core)
[![](https://img.shields.io/static/v1?label=docs&message=napacitor&color=blue&style=for-the-badge)](https://napacitor.matoapp.net/docs)
<a href="[Your AtomGit project link](https://gitcode.com/jevonsflash1/Napacitor)"><img alt="AtomGit G-Star" style="height:28px" src="https://gitcode.com/jevonsflash1/Napacitor/star/new_badge.svg"/></a>


English | [中文](README_zh.md)


Napacitor is a cross-platform native runtime that lets you use modern web tooling to easily build high-performance native apps for Android, iOS, Windows, and macOS. Napacitor is heavily inspired by [Capacitor](https://github.com/ionic-team/capacitor). The difference is that its native abstraction layer is .NET MAUI Blazor rather than a separate native project for each platform, so a single, clean C# runtime drives all platforms.

Napacitor's main features are:

- **Hybrid development**: Build apps with the web technologies you already know (vanilla JavaScript, HTML, CSS, or React, Angular, Vue), run them on iOS, Android, Windows, or macOS, and deploy easily to the App Store, Google Play, or the Microsoft Store.

- **Native access**: A cross-platform API and code execution layer makes it easy to call native SDKs from web code, and lets you write custom native plugins your app may need.

- **.NET empowerment**: The UI layer keeps using npm, TypeScript, and your favorite frameworks; the native layer brings in the C# ecosystem and engineering practices.





## Quick Start

### 1. Add Napacitor to any existing web app

```bash
npm i @napacitor/core
npm i -D @napacitor/maui @napacitor/cli
```

### 2. Initialize, sync, and create the native runtime environment

Specify the app ID, name, and web build output directory. Napacitor generates an MAUI project and packages plugins automatically.

```bash
npx nap init com.example.app "My App" --web-dir dist
npx nap add maui
```

### 3. Run on any platform

Choose the target platform: `android` / `ios` / `maccatalyst` / `windows`.

```bash
npx nap run --target android
```

---


## Plugin System

Each official plugin wraps a .NET MAUI native API in a consistent, Promise-based JavaScript interface. You can also create custom plugins as needed.

| Plugin | npm package | Description | Source / Docs |
| --- | --- | --- | --- |
| Action Sheet | `@napacitor/action-sheet` | Native action sheet that slides up from the bottom of the screen (`Page.DisplayActionSheet`). | [plugins/action-sheet](https://github.com/jevonsflash/Napacitor/tree/main/plugins/action-sheet) |
| App | `@napacitor/app` | High-level app state and events: lifecycle, deep links, language, exit. | [plugins/app](https://github.com/jevonsflash/Napacitor/tree/main/plugins/app) |
| App Actions | `@napacitor/app-actions` | Quick actions on the app icon (Android App Shortcuts, iOS Quick Actions, Windows jump lists). | [plugins/app-actions](https://github.com/jevonsflash/Napacitor/tree/main/plugins/app-actions) |
| App Info | `@napacitor/app-info` | General app information (`AppInfo`, `VersionTracking`). | [plugins/app-info](https://github.com/jevonsflash/Napacitor/tree/main/plugins/app-info) |
| App Launcher | `@napacitor/app-launcher` | Open other apps, URLs, and maps (`Launcher`, `Map`). | [plugins/app-launcher](https://github.com/jevonsflash/Napacitor/tree/main/plugins/app-launcher) |
| Battery | `@napacitor/battery` | Battery level and charging status. | [plugins/battery](https://github.com/jevonsflash/Napacitor/tree/main/plugins/battery) |
| Browser | `@napacitor/browser` | In-app browser sessions (Android Custom Tabs, iOS SFSafariViewController). | [plugins/browser](https://github.com/jevonsflash/Napacitor/tree/main/plugins/browser) |
| Camera | `@napacitor/camera` | Take photos, record video, and pick from the media library (`MediaPicker`). | [plugins/camera](https://github.com/jevonsflash/Napacitor/tree/main/plugins/camera) |
| Clipboard | `@napacitor/clipboard` | Copy to and paste from the system clipboard. | [plugins/clipboard](https://github.com/jevonsflash/Napacitor/tree/main/plugins/clipboard) |
| Connectivity | `@napacitor/connectivity` | Network status and connectivity change events. | [plugins/connectivity](https://github.com/jevonsflash/Napacitor/tree/main/plugins/connectivity) |
| Contacts | `@napacitor/contacts` | Read all contacts and use the system contact picker (`Contacts`). | [plugins/contacts](https://github.com/jevonsflash/Napacitor/tree/main/plugins/contacts) |
| Database SQLite | `@napacitor/database-sqlite` | Local SQLite database: create tables, CRUD operations, transactions (`Microsoft.Data.Sqlite`). | [plugins/database-sqlite](https://github.com/jevonsflash/Napacitor/tree/main/plugins/database-sqlite) |
| Device | `@napacitor/device` | Device model, platform, OS version, language, and region. | [plugins/device](https://github.com/jevonsflash/Napacitor/tree/main/plugins/device) |
| Dialog | `@napacitor/dialog` | Native alert, confirm, and prompt dialogs. | [plugins/dialog](https://github.com/jevonsflash/Napacitor/tree/main/plugins/dialog) |
| Display | `@napacitor/display` | Screen metrics, display change events, keep screen awake, and orientation lock. | [plugins/display](https://github.com/jevonsflash/Napacitor/tree/main/plugins/display) |
| Email | `@napacitor/email` | Open the system email compose screen. | [plugins/email](https://github.com/jevonsflash/Napacitor/tree/main/plugins/email) |
| File Viewer | `@napacitor/file-viewer` | Open files with the system viewer. | [plugins/file-viewer](https://github.com/jevonsflash/Napacitor/tree/main/plugins/file-viewer) |
| Filesystem | `@napacitor/filesystem` | App directories, bundled files, and the system file picker (`FileSystem`, `FilePicker`). | [plugins/filesystem](https://github.com/jevonsflash/Napacitor/tree/main/plugins/filesystem) |
| Flashlight | `@napacitor/flashlight` | Control the device flashlight (torch). | [plugins/flashlight](https://github.com/jevonsflash/Napacitor/tree/main/plugins/flashlight) |
| Geolocation | `@napacitor/geolocation` | Get and track the device's GPS location. | [plugins/geolocation](https://github.com/jevonsflash/Napacitor/tree/main/plugins/geolocation) |
| Haptics | `@napacitor/haptics` | Haptic and vibration feedback. | [plugins/haptics](https://github.com/jevonsflash/Napacitor/tree/main/plugins/haptics) |
| Local Notifications | `@napacitor/local-notification` | Send system notifications immediately or on a schedule, with permission requests, cancellation, and tap callbacks. | [plugins/local-notification](https://github.com/jevonsflash/Napacitor/tree/main/plugins/local-notification) |
| Motion | `@napacitor/motion` | Accelerometer, gyroscope, magnetometer, compass, and barometer sensors. | [plugins/motion](https://github.com/jevonsflash/Napacitor/tree/main/plugins/motion) |
| Phone Dialer | `@napacitor/phone-dialer` | Open the system dialer to place a phone call. | [plugins/phone-dialer](https://github.com/jevonsflash/Napacitor/tree/main/plugins/phone-dialer) |
| Preferences | `@napacitor/preferences` | Lightweight key-value persistent storage. | [plugins/preferences](https://github.com/jevonsflash/Napacitor/tree/main/plugins/preferences) |
| Security | `@napacitor/security` | Store secrets with OS-level security facilities (iOS Keychain, Android Keystore, Windows DPAPI). | [plugins/security](https://github.com/jevonsflash/Napacitor/tree/main/plugins/security) |
| Share | `@napacitor/share` | Share content through the system share sheet. | [plugins/share](https://github.com/jevonsflash/Napacitor/tree/main/plugins/share) |
| SMS | `@napacitor/sms` | Open the system SMS compose screen. | [plugins/sms](https://github.com/jevonsflash/Napacitor/tree/main/plugins/sms) |


For custom plugins, see the "Build a Napacitor Plugin" chapter in the official docs: [Build a Napacitor Plugin](https://napacitor.matoapp.net/docs/plugins/tutorial/introduction)


## How It Works

### Architecture

![alt text](/assets/arch.png)





Unlike Capacitor, which maintains a separate native project for each platform, Napacitor's native layer is **.NET MAUI Blazor** (BlazorWebView + JSInterop). A single C# runtime covers Android, iOS, Mac Catalyst, and Windows.

```text
Web app (dist/ + napacitor.config.json + node_modules/@napacitor/*)
        │  nap add maui / nap sync
        ▼
MAUI Blazor host (maui/: App.csproj, BlazorWebView, wwwroot/, napacitor.build.props)
        │
        ▼
Napacitor runtime + plugins (C#, discovered via reflection)
        │  JS ⇄ DotNet.invokeMethodAsync('Napacitor', …)
        ▼
.NET MAUI 10 (net10.0-android / -ios / -maccatalyst / -windows)
```
### Host Startup Flow

1. The BlazorWebView generated from the template loads `wwwroot/index.html`, and the root component `Main.razor` mounts to `#napacitor-root`;
2. After its first render, `Main.razor` calls `NapacitorRuntime.StartAsync(JS)`;
3. The runtime discovers `[NapacitorPlugin]` plugins via reflection, injects the native bridge `window.Napacitor`, reads the config, and loads the web entry scripts in the order defined by `napacitor.entries.json`;
4. Plugin calls are sent via `window.DotNet.invokeMethodAsync('Napacitor', 'NAP_invoke', …)` and return a `{"ok":true,"data":…}` envelope; native events are pushed back into the WebView via `NapacitorNative.__emit`.


## Supported Platforms

| Platform | TargetFramework | Minimum OS version |
|---|---|---|
| Android | `net10.0-android` | Android 7.0 (API 24) |
| iOS | `net10.0-ios` | iOS 17.0 |
| Mac Catalyst | `net10.0-maccatalyst` | macOS 13.5 |
| Windows | `net10.0-windows10.0.19041.0` | Windows 10 1809 (build 17763) |

## Requirements

- **Node.js 18+** (for the `nap` CLI)
- **.NET 10 SDK**, with the MAUI workload installed: `dotnet workload install maui`
- **Windows**: Windows 10 1809+ or Windows 11
- **Android**: Android SDK (can be specified via `ANDROID_HOME`); running requires an emulator or a physical device with USB debugging enabled
- **iOS / Mac Catalyst**: requires macOS + Xcode, and `dotnet workload install ios maccatalyst`

For more details, see the [Environment Setup](https://napacitor.matoapp.net/docs/getting-started/environment-setup) chapter in the docs.


## Documentation

[Official documentation](https://napacitor.matoapp.net/docs)
