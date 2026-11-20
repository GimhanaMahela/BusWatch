// Rebuilds package-lock.json from the registry, with every platform's optional packages.
//
// `npm install` on Linux writes the lockfile from the installed node_modules, which leaves out
// macOS-only packages such as fsevents; `npm ci` on CI then fails with "Missing: fsevents from
// lock file". Run `npm run relock` after adding or upgrading a dependency.
import { execSync } from "node:child_process";
import { existsSync, readFileSync, renameSync, rmSync } from "node:fs";

const MODULES = "node_modules";
const ASIDE = ".node_modules.relock";

if (existsSync(ASIDE)) {
  console.error(`${ASIDE} exists from an interrupted run: rename it back to ${MODULES} first.`);
  process.exit(1);
}

const hadModules = existsSync(MODULES);
if (hadModules) renameSync(MODULES, ASIDE); // a rename: no copying, no extra disk space
try {
  rmSync("package-lock.json", { force: true });
  execSync("npm install --package-lock-only --no-audit --no-fund", { stdio: "inherit" });
} finally {
  if (hadModules) renameSync(ASIDE, MODULES);
}

const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
if (!lock.packages["node_modules/fsevents"]) {
  console.error("fsevents is still missing from package-lock.json");
  process.exit(1);
}
console.log("package-lock.json rebuilt. Run `npm ci` to match node_modules to it.");
