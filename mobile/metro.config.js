// The app is its own npm project (React Native can't share the root node_modules with Next.js),
// but it reads two folders from the rest of the repo, so web and app never drift apart:
// - ui/messages: the en / si / ta text the website uses
// - api/src/config: shared enums (statuses, categories, report types)
// - api/src/utils: pure helpers the server also uses (phone numbers)
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [
  path.join(repoRoot, "ui", "messages"),
  path.join(repoRoot, "api", "src", "config"),
  path.join(repoRoot, "api", "src", "utils"),
];
// Shared files import nothing themselves, but Babel adds helper imports (@babel/runtime) when it
// compiles them. Those resolve from the shared file's folder, which has no node_modules on CI or
// EAS (only mobile/ is installed), so fall back to the app's own packages.
config.resolver.nodeModulesPaths = [path.join(projectRoot, "node_modules")];

module.exports = config;
