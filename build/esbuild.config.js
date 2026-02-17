import * as esbuild from 'esbuild';
import fs from "node:fs/promises";
import path from "node:path";

import BuildPlugin from "./plugins/BuildPlugin.js";

// constants
const _portArg = process.argv.find(arg => arg.startsWith('--port='));
const PORT = _portArg ? parseInt(_portArg.split('=')[1]) : 3000;
const IS_SERVE = process.argv.includes('--serve');

// plugin manifest
const _package = await getJsonFile(path.join(process.cwd(), "package.json"));
const plugin = await getJsonFile(path.join(process.cwd(), _package["acode-plugin"]));

try {
  if (await fs.access(path.dirname(plugin.output))) {
    await fs.rm(path.dirname(plugin.output), { recursive: true, force: true });
  }
} catch (_) {/* ignore */}

// esbuild config
const buildConfig = {
  entryPoints: [plugin.entry],
  outfile: plugin.output,
  bundle: true,
  minify: true,
  logLevel: 'info',
  color: true,
  plugins: [BuildPlugin(plugin)],
  loader: {
    ".html": "text",
    ".css": "text"
  }
};

// Main function to handle both serve and production builds
(async function () {
  if (IS_SERVE) {
    console.log('\nStarting development server...\n');
    // Watch and Serve Mode
    const ctx = await esbuild.context(buildConfig);
    await ctx.watch();
    const { host } = await ctx.serve({
      servedir: '.',
      port: PORT
    });
    console.log(`\nDevelopment server running on http://localhost:${PORT}\n`);
  } else {
    console.log('\nBuilding for production...\n');
    await esbuild.build(buildConfig);
    console.log('\nProduction build complete.');
  }
})();

async function getJsonFile(path) {
  try {
    const json = await fs.readFile(path, "utf8");
    return JSON.parse(json);
  } catch (_) {
    console.error("Couldn't read json file path: ", path);
    return {};
  }
}