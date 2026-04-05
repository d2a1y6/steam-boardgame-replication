import tsParser from "@typescript-eslint/parser";

const typescriptFiles = ["**/*.ts", "**/*.tsx"];

export default [
  {
    ignores: [
      "node_modules/**",
      "apps/web/dist/**",
      "docs/**",
      "archive/**",
      "**/*.d.ts",
    ],
  },
  {
    files: typescriptFiles,
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  {
    files: ["apps/web/src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@steam/game-core/src/*",
                "@steam/game-content/src/*",
                "../../packages/*",
                "../../../packages/*",
                "../../../../packages/*",
              ],
              message: "apps/web 只能通过包入口引用 @steam/game-core 和 @steam/game-content。",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/game-content/src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@steam/web",
                "../../apps/web/*",
                "../../../apps/web/*",
                "../../../../apps/web/*",
              ],
              message: "game-content 不能依赖 apps/web。",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/game-core/src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react",
              message: "game-core 不能依赖 React。",
            },
            {
              name: "react-dom",
              message: "game-core 不能依赖 react-dom。",
            },
          ],
          patterns: [
            {
              group: [
                "@steam/web",
                "../../apps/web/*",
                "../../../apps/web/*",
                "../../../../apps/web/*",
              ],
              message: "game-core 不能依赖 apps/web。",
            },
          ],
        },
      ],
    },
  },
];
