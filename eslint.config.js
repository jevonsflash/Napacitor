"use strict";

const tseslint = require("typescript-eslint");

// 最小化配置(根 package.json 为 CJS,故用 require;规则采用 typescript-eslint 推荐)
// 放宽项参照 v-frontend-partner:桥接层常用 any;未用变量降为警告,不阻断提交
module.exports = tseslint.config(
  tseslint.configs.recommended,
  {
    files: ["cli/src/**/*.ts", "core/src/**/*.ts", "plugins/*/src/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn"
    }
  },
  {
    // .d.ts 环境声明惯用 declare var,no-var 属误报
    files: ["**/*.d.ts"],
    rules: {
      "no-var": "off"
    }
  }
);
