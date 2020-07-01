const core = require('@actions/core');
const github = require('@actions/github');
const tc = require('@actions/tool-cache');
const fs = require('fs')

import { ReposListReleasesResponseData } from "@octokit/types";

interface AppVersion {
  name: string,
  version: string
}

interface DownloadInfo {
  version: string,
  url: string
}

const octokit = github.getOctokit(process.env.GITHUB_TOKEN);

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

async function getDownloadUrl(app: AppVersion): Promise<DownloadInfo> {
  const assetName = getAssetName(app);
  const response = await octokit.repos.listReleases({ owner: 'k14s', repo: app.name });
  const releases: ReposListReleasesResponseData = response.data;
  const latestVersion = releases[0].name;
  const version = app.version == 'latest' ? latestVersion : app.version;
  if (app.version == 'latest') {
    console.log(`Using latest version for ${app.name} (${version})`);
  }

  for (const release of releases) {
    if (release.name == version) {
      for (const asset of release.assets) {
        if (asset.name == assetName) {
          console.log(`Found executable ${assetName} for ${app.name} ${version}`);
          return { version, url: asset.browser_download_url };
        }
      }
      throw new Error(`Could not find executable ${assetName} for ${app.name} ${version}`);
    }
  }
  throw new Error(`Could not find version "${version}" for ${app.name}`);
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
  const { version, url } = await getDownloadUrl(app);

  const binPath = await tc.downloadTool(url);
  fs.chmodSync(binPath, "755")
  
  const cachedPath = await tc.cacheFile(binPath, app.name, app.name, version);
  core.addPath(cachedPath);
}

function parseInput(): string[] {
  return core.getInput('only')
    .split(',')
    .map((appName: string) => appName.trim())
    .filter((appName: string) => appName != '');
}

function getAppsToDownload(): AppVersion[] {
  const apps = parseInput();
  
  if (apps.length == 0) {
    // if no options specified, download all
    apps.push.apply(apps, k14sApps);
  }

  return apps.map((appName: string) => {
    if (!k14sApps.includes(appName)) {
      throw Error(`Unknown app: ${appName}`);
    }
    return { name: appName, version: core.getInput(appName) };
  });
}

async function downloadApps() {
  const appVersions = getAppsToDownload();
  console.log('Installing apps: ' + appVersions.map((app: AppVersion) => `${app.name}:${app.version}`).join(', '));
  await Promise.all(appVersions.map((app: AppVersion) => downloadApp(app)))
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
