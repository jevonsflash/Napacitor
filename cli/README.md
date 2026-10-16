# @napacitor/cli

Napacitor 的 **命令行工具**(`nap` 命令),对应 Capacitor 仓库中 `cli/`(`@capacitor/cli`)的角色。

## 与 Capacitor CLI 的命令对照

| Capacitor | Napacitor | 说明 |
|---|---|---|
| `cap init` | `nap init [appId] [appName] [--web-dir]` | 写 napacitor.config.json(非交互,缺省有默认值) |
| `cap add android` | `nap add maui` | 从 `assets/maui-template` 复制宿主模板并替换令牌;webDir 已构建时自动 sync |
| `cap copy android` | `nap copy [maui]` | Web 产物 → 宿主 wwwroot + 宿主化改造 index.html |
| `cap sync android` | `nap sync [maui]` | copy + 重新生成 napacitor.build.props |
| `cap open android` | `nap open maui` | 系统默认方式打开宿主工程 |
| `cap run android` | `nap run [maui] [--target] [-c]` | `dotnet build -t:Run -f <TFM>` |
| `cap ls` | `nap list` | 列出已安装 @napacitor/* 包 |

## copy 的宿主化改造(与 Capacitor 的差异点)

`nap copy` 不只是复制文件,还对 index.html 做改造:

1. **收集并摘除** 本地 `<script src>`(远程 http(s) 脚本保留)→ 写入 `napacitor.entries.json`(字符串数组,按文档序),由 C# 运行时在注入原生桥后按序 `import()`;
2. **注入** `<div id="napacitor-root">`(Blazor 根组件挂载点)与缺失的 `<script src="_framework/blazor.webview.js">`(幂等);
3. **拷入** napacitor.config.json。

这对应 Capacitor 在 Android 端由 WebViewLocalServer 注入 server 对象的做法 —— Napacitor 用"摘除脚本 + 原生按序导入"实现同等启动模型。

## 零 npm 依赖

与 Capacitor CLI(fs-extra、minimist、@ionic/utils-* 等)不同,Napacitor CLI **零 npm 运行时依赖**(连 devDependencies 也没有):文件操作基于 `node:fs/promises`,子进程基于 `node:child_process`,argv 解析自实现,Node API 类型声明内置于 `src/typings.d.ts`。偏离点是有意为之,以 monorepo 自包含为优先。

## 结构

```
cli/
├── bin/nap.js             # 启动 shim(纯 JS,镜像 capacitor 的 bin/capacitor)
├── src/
│   ├── index.ts           # 命令分发 + help + argv 解析
│   ├── config.ts          # napacitor.config.json 读取与校验
│   ├── definitions.ts     # CLIConfig 等类型
│   ├── common.ts          # fatal / runTask / check
│   ├── colors.ts          # 轻量 ANSI 颜色
│   ├── typings.d.ts       # 最小 Node API 类型声明(零 @types/node)
│   ├── util/{fs,subprocess}.ts
│   ├── tasks/{init,add,copy,sync,open,run,list}.ts
│   └── maui/{common,add,copy,update,open,run}.ts   # 平台实现(镜像 cli/src/android/)
├── assets/maui-template/  # 宿主模板(由 scripts/sync-maui-template.mjs 同步)
├── dist/                  # 构建产物(CJS,已提交)
└── package.json           # bin: nap
```

`dist/` 为已提交的 tsc 等价产物,可用 `npm run build` 再生成。
