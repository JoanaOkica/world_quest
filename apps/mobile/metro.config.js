// Metro config for the pnpm monorepo. Metro must watch the repo root so it can
// resolve the `@terra/core` workspace package, and be told where to find hoisted
// node_modules. See https://docs.expo.dev/guides/monorepos/.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];
// Don't let Metro walk up past the app for its own package resolution.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
