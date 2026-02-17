import { AcodePluginTemplate } from './Plugin.js';

if (window.acode) {
  const mPlugin = new AcodePluginTemplate(PLUGIN);
  acode.setPluginInit(PLUGIN.id, mPlugin.init.bind(mPlugin), mPlugin.pSettings);
  acode.setPluginUnmount(PLUGIN.id, mPlugin.destroy.bind(mPlugin));
}
