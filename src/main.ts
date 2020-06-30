const core = require('@actions/core');
const axios = require('axios').default;
const tc = require('@actions/tool-cache');
const fs = require('fs')

function getAssetSuffix() {
  if (process.platform === 'win32') {
    return 'windows-amd64.exe';
  } else if (process.platform === 'darwin') {
    return 'darwin-amd64';
  } else {
    return 'linux-amd64';
  }
}

function getAssetName(app: string) {
  return `${app}-${getAssetSuffix()}`;
}

async function getDownloadUrl(app: string, version?: string) {
  const assetName = getAssetName(app);
  const response = await axios.get(`https://api.github.com/repos/k14s/${app}/releases`);

  if (!version) {
    version = response.data[0].name;
    console.log(`No version set for ${app}, defaulting to ${version}`);
  }

  for (const release of response.data) {
    if (release.name == version) {
      for (const asset of release.assets) {
        if (asset.name == assetName) {
          console.log(`Matching asset ${assetName} for ${app} ${version}`);
          return {
            downloadUrl: asset.browser_download_url,
            downloadVersion: version
          };
        }
      }
      throw new Error(`Could not find asset ${assetName} for ${app} ${version}`);
    }
  }
  throw new Error(`Could not find version ${version} for ${app}`);
}

const k14sApps = [
  'ytt',
  'kbld',
  'kapp',
  'kwt',
  'imgpkg',
  'vendir'
]

async function downloadApp(app: string) {
  const { downloadUrl, downloadVersion } = await getDownloadUrl(app, undefined);
  const path = await tc.downloadTool(downloadUrl);
  fs.chmodSync(path, "755")
  const cachedPath = await tc.cacheFile(path, app, app, downloadVersion);
  core.addPath(cachedPath);
}

function parseInputApps() {
  return core.getInput('only').split(',').map((s: string) => s.trim());
}

async function downloadApps() {
  //const apps = parseInputApps() || k14sApps;
  console.log('downloading apps: ' + k14sApps.join(', '));
  await Promise.all(k14sApps.map((app: string) => downloadApp(app)))
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
