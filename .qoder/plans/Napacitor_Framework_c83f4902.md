# Napacitor — a Capacitor-style cross-platform runtime on .NET MAUI Blazor

## Verified Environment Decisions
- **Target .NET 10 / MAUI 10.0.20** (machine workloads: android 36.1.69, ios/maccatalyst 26.5, maui-windows 10.0.20, all cached in `D:\.nuget`). The existing net7.0 project stays untouched.
- **Bridge = Blazor JSInterop** (works uniformly on all MAUI platforms — this is Napacitor's core value vs Capacitor's per-platform runtimes). JS calls `window.DotNet.invokeMethodAsync('Napacitor.Core', 'NAP_invoke', ...)`; C# pushes events via `IJSRuntime` invoking `window.NapacitorNative.__emit`.
- **Plugin libraries are plain `net10.0` class libraries** referencing `Microsoft.Maui.Essentials 10.0.20`. Verified by metadata inspection that the package's `net10.0` base asset contains all needed static facades (`DeviceInfo`, `Battery`, `Clipboard`, `Share`, `Vibration`) and enums; runtime binds to the platform assembly inside the MAUI host.
- **`Napacitor.Core` references `Microsoft.JSInterop 10.0.0`** — the exact dependency version of `Microsoft.AspNetCore.Components.WebView.Maui 10.0.20` (verified nuspec).
- **JS packages are hand-authored plain CommonJS + `.d.ts` in committed `dist/` folders** — no TypeScript build toolchain, consumable via yarn `file:` deps, exactly like published npm packages.
- **Hosting model (boot order, same pattern the current repo proves works)**: `wwwroot/index.html` loads only `_framework/blazor.webview.js`; the Blazor root component (`Main.razor`) calls `NapacitorRuntime.StartWebAppAsync()` which injects `window.NapacitorNative` (platform info + plugin list + event queue stub), then dynamically `import()`s the web app's entry scripts. This guarantees JS sees native state synchronously *before* the web app boots.

## New Repository Layout
```
Napacitor.sln                      # core + 5 plugin C# projects (old .sln untouched)
README.md                          # framework overview, quick start, plugin authoring guide
core/
  Napacitor.Core/                  # C# runtime (net7.0... no: net10.0 class library)
  napacitor-js/                    # @napacitor/core (JS)
plugins/
  device/    { Napacitor.Device/ (C#), js/ (@napacitor/device) }
  clipboard/ { Napacitor.Clipboard/, js/ }
  haptics/   { Napacitor.Haptics/, js/ }
  share/     { Napacitor.Share/, js/ }
  battery/   { Napacitor.Battery/, js/ }
cli/
  napacitor-cli/                   # @napacitor/cli — bin `nap`
    bin/nap.js
    lib/… commands …
    templates/maui-app/            # scaffold used by `nap add maui`
```
Step 0: delete temporary planning folder `.napacitor-plan/`.

## 1. `core/Napacitor.Core` (C#, namespace `Napacitor` / `Napacitor.Plugins`)
`Napacitor.Core.csproj`: `Microsoft.NET.Sdk`, `net10.0`, `<PackageReference Include="Microsoft.JSInterop" Version="10.0.0" />`. System.Text.Json is inbox.

Files and responsibilities:
- **`NapacitorBridge.cs`** — public static class, the JS entry points (static `[JSInvokable]` = callable via `DotNet.invokeMethodAsync`):
  - `NAP_invoke(pluginId, method, argsJson) -> Task<string>` — returns JSON **envelope**: `{"ok":true,"data":<result>}` or `{"ok":false,"error":{"code":"...","message":"..."}}` (structured Capacitor-style errors; JS core unpacks and throws `NapacitorException`). Error codes: `PLUGIN_NOT_FOUND`, `NOT_IMPLEMENTED`, `INVALID_ARGUMENTS`, `CANCELED`, `ERROR`, plus any custom `NapacitorException.Code`.
  - `NAP_addListener(pluginId, eventName, callbackId)`, `NAP_removeListener(callbackId)`, `NAP_removeAllListeners(pluginId, eventName?)`.
  - Delegates to `NapacitorRuntime.Current`; throws a descriptive error if not initialized.
- **`NapacitorRuntime.cs`** — DI singleton + `static NapacitorRuntime? Current`:
  - `Task StartWebAppAsync(IJSRuntime js, WebAppOptions? options = null)` — sets `Current`; `eval`s `window.NapacitorNative = { platform, native:true, version, plugins:[names], __pending:[], __emit:<queue stub> }`; fetches `napacitor.config.json` (copied into wwwroot by `nap copy`) for appId/appName/`plugins` configs; resolves entry scripts from `options.Entries` or `wwwroot/napacitor.entries.json` (written by `nap copy`); imports each via `js.InvokeAsync<IJSObjectReference>("import", entry)`. Idempotent.
  - Platform string via `OperatingSystem.IsAndroid/IsIOS/IsMacCatalyst/IsWindows` → `'android' | 'ios' | 'mac' | 'windows'` (nice Napacitor bonus: Windows is a first-class platform).
  - Listener registry `callbackId -> {plugin, eventName}`; `EmitEventAsync` calls `js.InvokeVoidAsync("NapacitorNative.__emit", callbackId, dataJson)` (works even before the JS core loads — init stub queues events, core drains them).
- **`NapacitorOptions.cs`** — `RegisterPlugin<T>()` / `RegisterPlugin(Type)`; plugin configs (`Dictionary<string, JsonElement>`).
- **`NapacitorServiceCollectionExtensions.cs`** — `services.AddNapacitor(o => o.RegisterPlugin<DevicePlugin>()...)`; registers `NapacitorRuntime` singleton; plugins instantiated lazily via `ActivatorUtilities` (constructor injection supported).
- **`Plugins/`**: `INapacitorPlugin` (`PluginName`); `[NapacitorPlugin("Battery")]` attribute (name defaults to class name minus `Plugin` suffix); `[NapacitorMethod]` attribute; **`NapacitorPluginBase`** — provides `Context` (`Runtime`, `Config`, `Services`, `Platform`), `NotifyListeners(eventName, data)` (native→JS events), virtual `OnListenerAdded/OnListenerRemoved(eventName)`, `ListenerCount(eventName)`, `NotImplemented()` helper; **`NapacitorCall`** — loose-typed access (`Data` JsonElement + `Get<T>/GetString/GetDouble...`) for methods that don't declare a typed options DTO; **`PluginRegistry`** — case-insensitive plugin lookup, method resolution (exact then ignore-case), supports 0-param, 1-typed-DTO (deserialized case-insensitively/camelCase), or 1-`NapacitorCall` signatures; unwraps `Task<T>`/`ValueTask<T>` results; serializes with camelCase `NapacitorJson` options.
- **`NapacitorException.cs`** — `Exception` with `Code`.
- **`NapacitorJson.cs`** — shared `JsonSerializerOptions` (camelCase, case-insensitive read).

## 2. `core/napacitor-js` — `@napacitor/core` (plain CJS + d.ts)
`package.json`: name `@napacitor/core`, version `0.1.0`, main/types → `dist/`.
- **`dist/bridge.js`** — `invoke(pluginId, method, options)`: `JSON.stringify` options → `window.DotNet.invokeMethodAsync('Napacitor.Core','NAP_invoke',...)` → parse envelope → resolve `data` / reject `NapacitorException(code,message)`. Listener call wrappers. Throws `BRIDGE_NOT_AVAILABLE` if `window.DotNet` missing.
- **`dist/runtime.js`** — exports the `Napacitor` global object (`getPlatform()`, `isNativePlatform()`, `isPluginAvailable(name)` — sync via `window.NapacitorNative.plugins` on native / registered web impls on web; `convertFileSrc()` passthrough; `version`), **`registerPlugin(name, impls)`** (Capacitor semantics: native wins; web uses `impls.web` lazy loader `() => import('./web')`), built-in `addListener`/`removeListener`/`removeAllListeners`, `PluginListenerHandle { remove() }`, `NapacitorException extends Error`. Uses `Proxy` when available (browserslist `not dead` guarantees it) with a non-Proxy fallback. `bindNativeBridge()` rebinds `NapacitorNative.__emit` to the real dispatcher and drains `__pending`. Sets `window.Napacitor`.
- **`dist/index.js`** — entry wiring + exports (`registerPlugin`, `Napacitor`, `NapacitorException`).
- **`.d.ts` files** — `registerPlugin<T>(name, impls): T & { addListener; removeListener; removeAllListeners }`, `PluginImplementations`, `PluginListenerHandle`, `NapacitorException { code }`, `Napacitor` interface.

## 3. Plugins (5) — each: C# net10.0 classlib + JS package, APIs match Capacitor exactly
C# csproj (all identical shape): `net10.0`; `ProjectReference` → `Napacitor.Core`; `PackageReference Microsoft.Maui.Essentials 10.0.20`. JS package: `peerDependencies: { "@napacitor/core": "^0.1.0" }`, `dist/{index.js, index.d.ts, definitions.d.ts, web.js, web.d.ts}` (web implementations mirror Capacitor's: navigator-based).

| JS package | JS API (identical shape to Capacitor) | C# (namespace `Napacitor.<X>`, `[NapacitorPlugin]`) | MAUI Essentials mapping (verified) |
|---|---|---|---|
| `@napacitor/device` | `getInfo()`, `getLanguageCode()`, `getLocale()` | `DevicePlugin.GetInfo/GetLanguageCode/GetLocale` | `DeviceInfo.Model/Manufacturer/Name/VersionString/Platform/DeviceType`; `CultureInfo` for language/locale; `isVirtual` = `DeviceType == Virtual`; platform strings `android/ios/windows/mac` |
| `@napacitor/clipboard` | `write({string})`, `read()` | `ClipboardPlugin.Write/Read` | `Clipboard.Default.SetTextAsync/GetTextAsync` (string only; image throws `NOT_IMPLEMENTED`) |
| `@napacitor/haptics` | `impact({style})`, `notification({style})`, `vibrate({duration})`, `selection()`, `selectionChanged()` | `HapticsPlugin.…` | `Vibration.Default.Vibrate(ms)/Cancel()`, guarded by `Vibration.IsSupported` (no-op + log on unsupported platforms, e.g. Windows); style→duration map LIGHT 10 / MEDIUM 25 / HEAVY 40ms, notifications 35/45/60ms |
| `@napacitor/share` | `share({title,text,url,dialogTitle})`, `canShare()` | `SharePlugin.Share/CanShare` | `Share.Default.RequestAsync(new ShareTextRequest { Subject=title, Text=text, Uri=url })`; `canShare` → `{ canShare: true }` |
| `@napacitor/battery` | `getBatteryInfo()`, `addListener('batteryStatusChange')`, `removeAllListeners()` | `BatteryPlugin.GetBatteryInfo` + lifecycle via `OnListenerAdded/Removed` | `Battery.Default.ChargeLevel` (0-1), `PowerSource != Battery` → `isCharging`; subscribes `BatteryInfoChanged` on first listener, unsubscribes on last removal → `NotifyListeners("batteryStatusChange", data)` (demonstrates the full event pipeline) |

DTO classes per plugin (e.g. `HapticsImpactOptions { Style }`, `GetBatteryInfoResult { Level, IsCharging }`) — camelCase serialized automatically.

## 4. CLI — `cli/napacitor-cli` (`@napacitor/cli`, bin `nap`, plain Node ≥16, zero dependencies)
- **`bin/nap.js`** — arg parsing + command dispatch + help.
- **`lib/config.js`** — read/validate `napacitor.config.json`: `{ appId, appName, webDir: "dist", hostDir: "maui", framework?: { source?: "<path>" }, plugins: {} }`.
- **Commands** (Capacitor CLI parity):
  - `nap init [appId] [appName] [--webDir]` — writes config.
  - `nap add maui [--source <napacitor-repo>]` — copies `templates/maui-app` → `<hostDir>/` with token replacement (`__APP_ID__`, `__APP_NAME__`); with `--source` (or config `framework.source`) emits `ProjectReference`s to core + 5 plugins, else `PackageReference` 0.1.0; records `hostDir` in config.
  - `nap copy` — the `cap copy` analog + the Napacitor hosting transform: clean host `wwwroot/`, copy `webDir/`, then patch `index.html`: **strip local app `<script src>` tags** (collected, order-preserved) and **inject** `<div id="napacitor-root"></div>`, `<script src="_framework/blazor.webview.js"></script>` if missing (idempotent); write `wwwroot/napacitor.entries.json` `{ "scripts": ["js/chunk-vendors.js","js/app.js"] }`; copy `napacitor.config.json` into wwwroot. Requires the web app be built (clear error otherwise).
  - `nap sync` — copy + plugin consistency report (compares `@napacitor/*` deps in package.json vs Napacitor references in the host csproj).
  - `nap open maui` — open the host `.sln`/`.csproj`.
  - `nap run [maui] [--target windows|android|ios|maccatalyst] [-c Debug]` — spawns `dotnet build <host> -t:Run -f net10.0-<tfm>` (windows default on Windows OS).

## 5. Host template — `cli/napacitor-cli/templates/maui-app` (scaffold for `nap add maui`)
Multi-TFM MAUI Blazor host (`net10.0-android;net10.0-ios;net10.0-maccatalyst` + conditional `net10.0-windows10.0.19041.0`), Razor SDK, `UseMaui`, `Microsoft.AspNetCore.Components.WebView.Maui 10.0.20`, ProjectReferences to all Napacitor C# projects (in `--source` mode). Key files:
- **`MauiProgram.cs`** — `AddMauiBlazorWebView()` + `AddNapacitor(o => o.RegisterPlugin<DevicePlugin>() …all five…)`.
- **`MainPage.xaml`** — `<BlazorWebView HostPage="wwwroot/index.html">` with root component selector `#napacitor-root` → `Main`.
- **`Main.razor`** — renders nothing; bootstraps:
  ```razor
  @inject IJSRuntime JS
  @inject NapacitorRuntime Napacitor
  @code {
      protected override async Task OnAfterRenderAsync(bool firstRender)
      {
          if (firstRender) await Napacitor.StartWebAppAsync(JS);
      }
  }
  ```
- **`_Imports.razor`**, `App.xaml(.cs)`, `Platforms/{Android,iOS,MacCatalyst,Windows}/…` (minimal net10-style MAUI platform files), `Resources/` (appicon/splash SVGs + OpenSans font copied from the existing host), placeholder `wwwroot/index.html` (blank shell until `nap copy`).

## 6. Solution + docs
- **`Napacitor.sln`** (new) — `Napacitor.Core` + 5 plugin projects (all net10.0; plain `Any CPU` mappings like the existing sln). Old `MAUI-Vue-Hybriddev-StandaloneHost.sln` untouched.
- **`README.md`** — what/why, architecture diagram (web app → @napacitor/* JS → JSInterop bridge → Napacitor.Core → C# plugins → MAUI → OS), quick start (npm i file: deps → `nap init` → `nap add maui --source .` → `nap sync` → `nap run`), plugin authoring walkthrough (C# + JS + registration), hosting model explanation, Capacitor ↔ Napacitor mapping table, limitation notes (Vibration unsupported on Windows, Clipboard string-only).
- Short READMEs for `@napacitor/core`, `@napacitor/cli` (commands).

## 7. Explicitly untouched
`MAUI-Vue-Hybriddev-StandaloneHost/` (existing host), `hybird-host/` (existing Vue app), `MAUI-Vue-Hybriddev-StandaloneHost.sln`, `.gitignore` (already covers bin/obj/node_modules). No example app — user will create one separately later; the template + README quick start document the full path.

## 8. Verification (per your preference: no `dotnet build`)
No compilation or npm install will be run. Verification = IDE diagnostics (GetProblems) on all new C# files + careful cross-check of every MAUI API call against the metadata dump made during planning (all APIs listed above were verified present in `Microsoft.Maui.Essentials 10.0.20`).