"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMaui = updateMaui;
/**
 * `nap sync` 的 update 半边:生成 napacitor.build.props
 * (与 Capacitor 生成 capacitor.settings.gradle / capacitor.build.gradle 对应)。
 *
 * 读取应用 package.json 中全部 @napacitor/* 依赖(排除 cli/core,二者无 C# 工程),
 * 为每个包含 maui/*.csproj 的包生成 ProjectReference;运行时引用恒在。
 */
const path = __importStar(require("node:path"));
const fs = __importStar(require("node:fs/promises"));
const common_1 = require("../common");
const colors = __importStar(require("../colors"));
const fs_1 = require("../util/fs");
const common_2 = require("./common");
const NAPACITOR_SCOPE = '@napacitor/';
/** 这些包没有 C# 工程,不参与 ProjectReference 生成。 */
const NO_CS_PROJ_PACKAGES = ['@napacitor/cli', '@napacitor/core'];
async function updateMaui(config) {
    var _a, _b;
    await (0, common_2.requireHost)(config);
    const pkgPath = path.join(config.appDir, 'package.json');
    const pkg = await (0, fs_1.readJsonFile)(pkgPath);
    if (pkg === null) {
        (0, common_1.fatal)(`未找到 ${pkgPath} —— 请先在应用目录执行 npm init 并安装 @napacitor/* 包`);
    }
    const deps = {
        ...((_a = pkg.devDependencies) !== null && _a !== void 0 ? _a : {}),
        ...((_b = pkg.dependencies) !== null && _b !== void 0 ? _b : {}),
    };
    const pluginNames = Object.keys(deps)
        .filter((name) => name.startsWith(NAPACITOR_SCOPE))
        .filter((name) => !NO_CS_PROJ_PACKAGES.includes(name))
        .filter((name) => name !== '@napacitor/maui') // 运行时引用恒在,单列
        .sort();
    const hostDir = (0, common_2.hostDirAbs)(config);
    const nodeModules = path.join(config.appDir, 'node_modules');
    const refs = [];
    await (0, common_1.runTask)('生成 napacitor.build.props', async () => {
        // 运行时引用恒在(对应 Capacitor 模板对 capacitor-android 的固定引用)
        const runtimeCsproj = path.join(nodeModules, '@napacitor', 'maui', 'src', 'Napacitor.csproj');
        if (!(await (0, fs_1.pathExists)(runtimeCsproj))) {
            (0, common_1.fatal)(`未找到 ${runtimeCsproj} —— 请安装运行时包:npm install @napacitor/maui`);
        }
        refs.push({
            name: '@napacitor/maui',
            include: path.relative(hostDir, runtimeCsproj),
        });
        for (const name of pluginNames) {
            const shortName = name.slice(NAPACITOR_SCOPE.length);
            const csproj = await findPluginCsproj(path.join(nodeModules, '@napacitor', shortName));
            if (csproj === null) {
                console.log(colors.weak(`  跳过 ${name}(包内未找到 maui/*.csproj)`));
                continue;
            }
            refs.push({ name, include: path.relative(hostDir, csproj) });
        }
        await (0, fs_1.writeTextFile)(path.join(hostDir, 'napacitor.build.props'), renderBuildProps(refs));
    });
    console.log(colors.strong(`  接入的 Napacitor 工程(${refs.length}):`));
    for (const ref of refs) {
        console.log(`    ${ref.name} ${colors.weak(ref.include)}`);
    }
}
/** 在插件包根目录下定位 maui/*.csproj(取排序后的第一个)。 */
async function findPluginCsproj(packageDir) {
    const mauiDir = path.join(packageDir, 'maui');
    if (!(await (0, fs_1.pathExists)(mauiDir))) {
        return null;
    }
    const entries = (await fs.readdir(mauiDir))
        .filter((name) => name.toLowerCase().endsWith('.csproj'))
        .sort();
    if (entries.length === 0) {
        return null;
    }
    return path.join(mauiDir, entries[0]);
}
function renderBuildProps(refs) {
    const lines = refs.map((ref) => `    <ProjectReference Include="${ref.include}" />`);
    return [
        '<Project>',
        '  <!--',
        '    napacitor.build.props —— 由 `nap sync` 自动生成/更新(勿手动编辑)。',
        '    作用与 Capacitor Android 的 capacitor.settings.gradle / capacitor.build.gradle 对应:',
        '    把应用依赖的每个 @napacitor/* npm 包内的 C# 工程(及 Napacitor 运行时)接入宿主编译。',
        '  -->',
        '  <ItemGroup>',
        ...lines,
        '  </ItemGroup>',
        '</Project>',
        '',
    ].join('\n');
}
