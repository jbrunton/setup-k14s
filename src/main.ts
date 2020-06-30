const core = require('@actions/core');
const axios = require('axios').default;
const tc = require('@actions/tool-cache');
const fs = require('fs')

interface AppVersion {
  name: string,
  version: string | undefined
}

function getAssetSuffix() {
  if (process.platform === 'win32') {
    return 'windows-amd64.exe';
  } else if (process.platform === 'darwin') {
    return 'darwin-amd64';
  } else {
    return 'linux-amd64';
  }
}

function getAssetName(app: AppVersion) {
  return `${app.name}-${getAssetSuffix()}`;
}

async function getDownloadUrl(app: AppVersion): Promise<[AppVersion, string]> {
  const assetName = getAssetName(app);
  const response = await axios.get(`https://api.github.com/repos/k14s/${app.name}/releases`);

  const defaultVersion = response.data[0].name;
  const version = app.version || defaultVersion;
  if (!app.version) {
    console.log(`No version set for ${app.name}, defaulting to ${version}`);
  }

  for (const release of response.data) {
    if (release.name == version) {
      for (const asset of release.assets) {
        if (asset.name == assetName) {
          console.log(`Found executable ${assetName} for ${app.name} ${version}`);
          return [version, asset.browser_download_url];
        }
      }
      throw new Error(`Could not find executable ${assetName} for ${app.name} ${version}`);
    }
  }
  throw new Error(`Could not find version ${version} for ${app.name}`);
}

const k14sApps = [
  'ytt',
  'kbld',
  'kapp',
  'kwt',
  'imgpkg',
  'vendir'
]

async function downloadApp(app: AppVersion): Promise<void> {
  const [version, url] = await getDownloadUrl(app);
  const path = await tc.downloadTool(url);
  fs.chmodSync(path, "755")
  const cachedPath = await tc.cacheFile(path, app.name, app.name, version);
  core.addPath(cachedPath);
}

function parseInputApps(): AppVersion[] {
  if (core.getInput('all') == 'true') {
    return k14sApps.map((appName: string) => ({ name: appName, version: undefined }));
  }

  const apps: AppVersion[] = [];
  k14sApps.forEach((appName: string) => {
    const appVersion = core.getInput(appName)
    if (appVersion) {
      const app = { name: appName, version: appVersion };
      if (appVersion == 'true') {
        app.version = undefined;
      }
      apps.push(app)
    }
  })
  if (apps.length == 0) {
    throw new Error(`No apps configured to download. Set "all: true" or see the docs for more options.`)
  }
  return apps;
}

async function downloadApps() {
  const apps = parseInputApps();
  console.log('downloading apps: ' + apps.map((app: AppVersion) => `${app.name}:${app.version}`).join(', '));
  await Promise.all(apps.map((app: AppVersion) => downloadApp(app)))
}

async function run(): Promise<void> {
  try {console.time('download apps');
    await downloadApps();
    console.timeEnd('download apps');  
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
