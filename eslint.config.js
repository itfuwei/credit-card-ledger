import js from "@eslint/js";
import globals from "globals";
import pluginVue from "eslint-plugin-vue";
import prettier from "eslint-config-prettier";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // JS 基础规则
  js.configs.recommended,

  // Vue3 推荐规则（比 essential 强一点但不变态）
  pluginVue.configs["flat/recommended"],

  // 浏览器环境
  {
    files: ["**/*.{js,mjs,cjs,vue}"],
    languageOptions: {
      globals: globals.browser,
    },
  },

  // 关闭和 Prettier 冲突的规则（关键）
  prettier,
]);
