/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  options: {
    tsConfig: {
      fileName: "./tsconfig.json",
    },
    doNotFollow: {
      path: "node_modules",
    },
    exclude: {
      path: ["^docs/", "^archive/"],
    },
  },
  forbidden: [
    {
      name: "no-web-to-package-internals",
      severity: "error",
      from: { path: "^apps/web/src" },
      to: {
        path: "^packages/(game-core|game-content)/src/",
        pathNot: "^packages/(game-core|game-content)/src/index\\.ts$",
      },
    },
    {
      name: "no-core-to-web",
      severity: "error",
      from: { path: "^packages/game-core/src" },
      to: { path: "^apps/web/" },
    },
    {
      name: "no-content-to-web",
      severity: "error",
      from: { path: "^packages/game-content/src" },
      to: { path: "^apps/web/" },
    },
    {
      name: "no-core-react",
      severity: "error",
      from: { path: "^packages/game-core/src" },
      to: { path: "^(react|react-dom)$" },
    },
  ],
};
