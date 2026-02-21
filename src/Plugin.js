import _c$Container from "./components/Container.html";
import _c$NewApp from "./components/NewApp.html";
import _c$App from "./components/App.html";

import _s$MainStyle from "./styles/main.css";

const sideBarApps = acode.require('sidebarApps');
const Select = acode.require('select');
const Prompt = acode.require('prompt');
const fs = acode.require('fs');
const FileBrowser = acode.require('fileBrowser');
const AURL = acode.require("URL");

export class BetterAppsLauncher {
  static SIDEBAR_APP_ID = "better-apps-launcher";
  static SIDEBAR_APP_TITLE = "Better Apps Launcher";
  static STYLE_ID = "better-apps-launcher-style";
  static DEFAULT_CONFIG = {
    sortAlphabet: false,
    hideLabels: false,
    floatingNewApp: false,
    shortcutApps: []
  };

  _config = {};
  _holdTimer = null;
  _currentAppEl = null;
  _currentAppIndex = null;

  constructor() {
    this.$style = tag("style", {
      innerHTML: _s$MainStyle,
      id: BetterAppsLauncher.STYLE_ID
    });
  }

  async init(baseUrl, $page, { cacheFileUrl, cacheFile, firstInit }) {
    this._config = this.getConfig();
    document.head.append(this.$style);
    sideBarApps.add(
      'play_arrow',
      BetterAppsLauncher.SIDEBAR_APP_ID,
      BetterAppsLauncher.SIDEBAR_APP_TITLE,
      this.onInitSidebarApp.bind(this),
      false,
      this.onSelectSidebarApp.bind(this)
    );
  }

  async destroy() {
    this.$style.remove();
    sideBarApps.remove(BetterAppsLauncher.SIDEBAR_APP_ID);
    this.config.shortcutApps.forEach(async (_, i) => await this.removeApp(i));
    delete localStorage.__$better_apps_launcher$_config;
  }

  get config() {
    return this._config;
  }

  getConfig() {
    if (localStorage.__$better_apps_launcher$_config) {
      return {
        ...BetterAppsLauncher.DEFAULT_CONFIG, 
        ...JSON.parse(localStorage.__$better_apps_launcher$_config)
      };
    } else {
      const config = structuredClone(BetterAppsLauncher.DEFAULT_CONFIG);
      localStorage.__$better_apps_launcher$_config = JSON.stringify(config);
      return config;
    }
  }

  saveConfig() {
    localStorage.__$better_apps_launcher$_config = JSON.stringify(this._config);
  }

  async onInitSidebarApp(container) {
    this.$container = container;
    this.$container.classList.add(BetterAppsLauncher.SIDEBAR_APP_ID);
    this.$container.innerHTML = _c$Container
      .replace("{s-active}", this.config.sortAlphabet ? "active" : "")
      .replace("{h-active}", this.config.hideLabels ? "active" : "")
      .replace("{f-active}", this.config.floatingNewApp ? "active" : "");

    this.$container.addEventListener("click", this.onClickApp.bind(this));

    this.$container.addEventListener("touchstart", this.onHoldStart.bind(this));
    this.$container.addEventListener("touchend", this.onHoldEnd.bind(this));
    this.$container.addEventListener("mousedown", this.onHoldStart.bind(this));
    this.$container.addEventListener("mouseup", this.onHoldEnd.bind(this));

    const $appsList = this.$container.querySelector(".apps-list");
    $appsList.setAttribute("hide-labels", this.config.hideLabels ? "active" : "");
    $appsList.innerHTML = await this.getAppsList();
  }

  async onSelectSidebarApp(container) {
    const $appsList = this.$container.querySelector(".apps-list");
    $appsList.setAttribute("hide-labels", this.config.hideLabels ? "active" : "");
    $appsList.innerHTML = await this.getAppsList();
  }

  async getAppsList() {
    const sorted = [...this.config.shortcutApps].sort((a, b) => {
      if (!this.config.sortAlphabet) return 0;
      return a.label.localeCompare(b.label);
    });

    const appElements = await Promise.all(sorted.map(this.getAppElement.bind(this)));
    return appElements.join("") + _c$NewApp.replace("{floating}", this.config.floatingNewApp);
  }

  async getAppElement(app) {
    return _c$App
      .replace("{package-name}", app.packageName)
      .replace("{main-activity}", app.mainActivity)
      .replace(
        "{has-icon}", 
        app.icon
          ? '<img class="app-icon" src="{icon}" /><span class="app-label">{label}</span>'
          : '<div class="app-icon"><span class="app-label">{label}</span></div>'
      )
      .replace("{icon}", app.icon ? (await acode.toInternalUrl(app.icon)) : null)
      .replace("{label}", app.label)
  }

  onHoldStart(e) {
    const appEl = e.target.closest(".app:not(.new-app)");
    if (!appEl) return;

    this._currentAppEl = appEl;

    const packageName = appEl.getAttribute("package-name");
    this._currentAppIndex = this.config.shortcutApps.findIndex(
      app => app.packageName === packageName
    );

    this._holdTimer = setTimeout(async () => {
      await this.showAppDialog(this._currentAppEl, this._currentAppIndex);
    }, 800);
  }

  onHoldEnd() {
    if (this._holdTimer) {
      clearTimeout(this._holdTimer);
      this._holdTimer = null;
    }
    this._currentAppEl = null;
    this._currentAppIndex = null;
  } 

  async showAppDialog(appEl, appIndex) {
    const app = this.config.shortcutApps[appIndex];
    const action = await Select("App Options", [
      { text: "Edit", value: "edit" },
      { text: "Remove", value: "remove" },
    ]);
    if (!action) return;
    if (action === "remove") {
      await this.removeApp(appIndex);
    } else {
      await this.editApp(appIndex);
    }
  }

  async removeApp(index) {
    if (this.config.shortcutApps[index]?.icon) {
      await fs(this.config.shortcutApps[index]?.icon).delete();
      delete this.config.shortcutApps[index].icon;
    }
    this.config.shortcutApps.splice(index, 1);
    this.saveConfig();
    this.onSelectSidebarApp();
  }

  async editApp(appIndex) {
    const app = this.config.shortcutApps[appIndex];
    const action = await Select("Edit App", [
      { text: "Change Label", value: "label" },
      { text: `${app.icon ? "Remove" : "Add"} Custom Icon`, value: `icon-${app.icon ? "remove" : "add"}` },
      { text: "Change Activity", value: "activity" },
    ]);
    if (!action) return;
    if (action === "label") {
      const newLabel = await Prompt("Label", app.packageName, "text", { required: true });
      this.config.shortcutApps[appIndex].label = newLabel;
    } else if (action === "activity") {
      const newActivity = await Prompt("Activity", app.mainActivity, "text", { required: true });
      this.config.shortcutApps[appIndex].mainActivity = newActivity;
    } else if (action === "icon-remove") {
      await fs(app.icon).delete();
      delete this.config.shortcutApps[appIndex].icon;
    } else if (action === "icon-add") {
      const icon = await FileBrowser("file", "Choose app icon");
      if (!icon) return;

      const iconDirPath = PLUGIN_DIR + "/" + PLUGIN.id;
      const iconFileName = app.packageName + AURL.extname(icon.name);
      const iconPath = iconDirPath + "/" + iconFileName;

      const iconfs = fs(icon.url);
      const dirfs = fs(iconDirPath);
      await dirfs.createFile(iconFileName, "");

      await fs(iconPath).writeFile((await iconfs.readFile()));
      this.config.shortcutApps[appIndex].icon = iconPath;
    }
    this.saveConfig();
    this.onSelectSidebarApp();
  }

  async onClickApp(e) {
    if (this._holdStartTime && Date.now() - this._holdStartTime > 500) {
      return;
    }

    const appEl = e.target.closest("[action]");
    if (!appEl) return;
    const action = appEl.getAttribute("action");
    switch (action) {
      case "open-app":
        await this.openApp({
          packageName: appEl.getAttribute("package-name"),
          mainActivity: appEl.getAttribute("main-activity")
        });
        break;
      case "add-app":
        await this.addApp();
        break;
      case "sort-alphabet":
        this.config.sortAlphabet = !this.config.sortAlphabet;
        if (this.config.sortAlphabet) appEl.classList.add("active")
        else appEl.classList.remove("active")
        this.saveConfig();
        this.onSelectSidebarApp();
        break;
      case "floating":
        this.config.floatingNewApp = !this.config.floatingNewApp;
        if (this.config.floatingNewApp) appEl.classList.add("active")
        else appEl.classList.remove("active")
        this.saveConfig();
        this.onSelectSidebarApp();
        break;
      case "hide-labels":
        this.config.hideLabels = !this.config.hideLabels;
        if (this.config.hideLabels) appEl.classList.add("active")
        else appEl.classList.remove("active")
        this.saveConfig();
        this.onSelectSidebarApp();
        break;
    }
  }

  async openApp({ packageName, mainActivity }) {
    system.launchApp(
      packageName,
      mainActivity,
      {},
      console.log,
      toast
    );
  }

  async addApp() {
    const packageName = await Select(
      "Select app to be added in the launcher",
      await this.getInstallAppsList());
    if (!packageName) return;
    if (this.config.shortcutApps.find(s => s.packageName === packageName)) return;

    let activity = await this.getPackageActivity(packageName);
    if (!activity) return;

    this.config.shortcutApps.push({
      packageName: packageName,
      mainActivity: activity,
      label: packageName.split(".").slice(1).join(".")
    });
    this.saveConfig();
    this.onSelectSidebarApp();
  }

  async getInstallAppsList() {
    const packages = await Executor.BackgroundExecutor.execute("cmd package query-activities --user 0 --brief -a android.intent.action.MAIN -c android.intent.category.LAUNCHER | awk -F/ 'NF==2 {print $1}'");
    return packages.split("\n").map(p => p.trim());
  }

  async getPackageActivity(pack) {
    const activity = await Executor.BackgroundExecutor.execute(`cmd package resolve-activity --user 0 --brief ${pack}`, true);
    return this.resolveActivity(activity.split("\n").pop());
  }

  resolveActivity(activity) {
    activity = activity.trim();

    const slashIndex = activity.indexOf("/");
    if (slashIndex === -1) return activity;

    const packageName = activity.slice(0, slashIndex);
    let className = activity.slice(slashIndex + 1);

    if (className.startsWith(".")) {
      className = packageName + className;
    } else if (!className.includes(".")) {
      className = packageName + "." + className;
    }
    return className;
  }
}

