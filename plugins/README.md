# 插件发布工作流(Plugin Publishing Workflow)

本文件描述如何把 `plugins/*` 下的 `@napacitor/<plugin>` 包发布到公共 npm registry。
风格参考 [Capacitor 的 Development Workflow](https://capacitorjs.com/docs/basics/workflow):
按步骤从「构建 → 校验 → 发布 → 复核」串起整条链路。工作流同形,但 Napacitor 的原生宿主是
.NET MAUI,因此发布物同时含 TS 编译产物(`dist/`)与 C# 源码(`maui/`),打包时需排除本地构建垃圾。

> 本文只讲**发包**。写插件本体(三段式 `src` / `dist` / `maui`)见根 [README.md](../README.md) 的「插件开发指南」。

## 前置:发布凭证与权限

账号 `jevonsflash` 启用了 2FA,普通密码或不含 bypass 权限的 granular token 会被 registry 拒绝
(`npm whoami` 能过,但 `npm publish` 报 403)。因此发布前必须满足:

- 使用 **Classic → Automation** token,或开启了 **bypass 2FA** 的 granular token;
- token 写入**仓库外或已被忽略**的 `.npmrc`(根 `.gitignore` 已忽略 `.npmrc`,勿提交);
- 用 `npm whoami` 确认认证为 `jevonsflash` 后再批量发布。

```bash
# 验证身份(能过不代表能发布,发布权限另判)
npm whoami
```

> **提示 · granular token 不能 unpublish**：bypass-2FA 的 granular token 可以 publish,但**无法**
> unpublish / 破坏性操作(HTTP 403)。一旦发错版本,撤销需要完整权限凭证或走带 OTP 的流程。发版号务必先核对。

## 构建插件

每个插件的 `build` 脚本是 `tsc`,产物落在 `dist/`(CJS + `.d.ts`)。`dist/` 被根 `.gitignore` 忽略、
不入库,`npm publish` 是按 `files` 字段**打包磁盘现状**,所以发布前必须先构建。

```bash
# 只构建目标插件(workspaces 路径)
npm run build --workspace plugins/app-info

# 或整仓构建全部插件
npm run build --workspaces --if-present
```

批量构建并捕获失败(任一 tsc 失败要中止,别把半成品发出去):

```powershell
$targets = @('app-info','app-launcher','connectivity','email','flashlight','motion','phone-dialer','sms')
$failed = @()
foreach ($t in $targets) {
  npm run build --workspace "plugins/$t" 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) { $failed += $t } else { Write-Host "built: $t" }
}
if ($failed) { Write-Host "FAILED: $($failed -join ', ')" }
```

## 校验打包内容(dry-run)

发布前先 dry-run 看清 tarball 里到底打了哪些文件。插件的 `files` 必须**排除本地 .NET 构建产物**
`maui/bin/`、`maui/obj/`(它们虽被 gitignore,但 `npm pack` 只看 `files`,不看 gitignore,会把
`.dll`/`.pdb`/缓存推上 npm):

```jsonc
// plugins/<x>/package.json
"files": ["dist/", "maui/", "!maui/bin/", "!maui/obj/"]
```

```bash
npm publish --dry-run --access public --workspace plugins/app-info
```

干净的 tarball 应只含约 10 个文件、~4 kB:`dist/` 六个(`index`/`definitions`/`web` 的 `.js`+`.d.ts`)、
`maui/<Plugin>Plugin.cs`、`maui/Napacitor.<Plugin>.csproj`、`package.json`、`README.md`。
若看到 `maui/bin/Debug/...`,说明 `files` 取反缺失,**先补再发**。

## 发布

按依赖顺序发布:`core → maui → cli → plugins`。插件只把 `@napacitor/core` 作为 `peerDependency`,
彼此无先后依赖,可任意顺序;但 `core` 必须在插件之前(或已存在)于 registry。

```bash
# 单个插件
npm publish --access public --workspace plugins/app-info

# 批量发布 8 个未发布插件,逐个捕获退出码
$targets = @('app-info','app-launcher','connectivity','email','flashlight','motion','phone-dialer','sms')
$failed = @()
foreach ($t in $targets) {
  $out = npm publish --access public --workspace "plugins/$t" 2>&1
  if ($LASTEXITCODE -ne 0) { $failed += $t; $out | Select-Object -Last 5 }
  else { $out | Select-String '\+ @napacitor' }
}
if ($failed) { Write-Host "FAILED: $($failed -join ', ')" } else { Write-Host 'ALL PUBLISHED' }
```

成功标志是每个包打印 `+ @napacitor/<plugin>@<version>` 且退出码 0。**这一输出即服务端已接收的权威证据。**

> **提示 · scoped 包必须 --access public**：`@napacitor/*` 是 scoped 名,不加 `--access public`
> 默认按 private 处理并可能被拒。

## 复核(注意传播延迟)

发布成功后,registry 的**元数据索引(packument / version 端点)**与 **tarball CDN** 是**独立、不均衡**
传播的,`npm view` 或版本端点在几分钟内可能返回 404——这是传播延迟,**不是包损坏**。

正确复核姿势:同时探测版本端点与 tarball 头,短暂 404 时**等待重探**,而不是急着再发一个补丁版:

```bash
$name = "@napacitor/app-info"; $ver = "0.1.2-beta.3"
$meta = Invoke-RestMethod "https://registry.npmjs.org/$name/$ver"
Invoke-WebRequest $meta.dist.tarball -Method Head   # 期望 HTTP 200
npm view $name version --prefer-online              # 强制刷新本地缓存的 packument
```

> **注意 · 别用发布补丁版来「修复」404**：刚发布就 404 通常是传播延迟。等一会儿再用「版本端点 + tarball HEAD」
> 双探测复验;过早再发一个补丁版会造成不可撤销的内容重复(bypass-2FA token 又不能 unpublish)。
> 仅当两条探测在远超传播窗口后仍失败,才判定为损坏。本地缓存若返回 `Found: ...@undefined`
> 之类的 ERESOLVE,加 `--prefer-online` 刷新即可。

## 版本约定

- 全仓插件当前统一维护同一版本号(如 `0.1.2-beta.3`),发布新版本时保持插件间版本一致,便于应用侧
  用统一的 semver 范围(`^0.1.x`)安装;
- 想先试用不覆盖 `latest`:用 `npm publish --tag next`,验证后再 `npm dist-tag add <pkg>@<ver> latest` 提升,
  无需「发—撤—再发」。

## 速查

| 步骤 | 命令 | 要点 |
|---|---|---|
| 认证 | `npm whoami` | 需 2FA-bypass / Automation token,写在被忽略的 `.npmrc` |
| 构建 | `npm run build --workspace plugins/<x>` | `dist/` 不入库,发布前必构建 |
| 校验打包 | `npm publish --dry-run --access public --workspace plugins/<x>` | `files` 排除 `!maui/bin/`、`!maui/obj/`,~4 kB / 10 文件 |
| 发布 | `npm publish --access public --workspace plugins/<x>` | 顺序 core→maui→cli→plugins;`+ pkg@ver` 即成功 |
| 复核 | 版本端点 + tarball HEAD + `npm view --prefer-online` | 404 先等再探,勿急发补丁版 |
