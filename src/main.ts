const core = require('@actions/core');
const github = require('@actions/github');
import { ReposListReleasesResponseData } from "@octokit/types";
const axios = require('axios').default;
const tc = require('@actions/tool-cache');
const fs = require('fs')

interface AppVersion {
  name: string,
  version: string
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

async function getDownloadUrl(app: AppVersion): Promise<[string, string]> {
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
          return [version, asset.browser_download_url];
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
  const [version, url] = await getDownloadUrl(app);
  console.log('Downloading ' + url);
  const path = await tc.downloadTool(url);
  fs.chmodSync(path, "755")
  const cachedPath = await tc.cacheFile(path, app.name, app.name, version);
  core.addPath(cachedPath);
}

function parseApps(): string[] {
  const onlyApps = core.getInput('only')
  if (!onlyApps) {
    return k14sApps;
  }
  const apps: string[] = [];
  onlyApps.split(',').map((appName: string) => appName.trim()).forEach((appName: string) => {
    if (!k14sApps.includes(appName)) {
      throw Error(`Unknown app: ${appName}`);
    }
    apps.push(appName);
  });
  if (apps.length == 0) {
    throw new Error(`No apps configured to download. Set "all: true" or see the docs for more options.`)
  }
  return apps;
}

function parseAppVersions(): AppVersion[] {
  const apps = parseApps();
  return apps.map((appName: string) => {
    return { name: appName, version: core.getInput(appName) };
  });
}

async function downloadApps() {
  const appVersions = parseAppVersions();
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
