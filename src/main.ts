const core = require('@actions/core');
const github = require('@actions/github');
const { GitHub } = require('@actions/github/lib/utils');
const tc = require('@actions/tool-cache');
const fs = require('fs')

import {
  ReposListReleasesResponseData,
  ReposGetLatestReleaseResponseData
} from "@octokit/types";

type ArrayElement<A> = A extends readonly (infer T)[] ? T : never

type ReposListReleasesItem = ArrayElement<ReposListReleasesResponseData>;

interface AppInfo {
  name: string,
  version: string
}

interface AssetInfo {
  app: AppInfo,
  name: string
}

interface DownloadInfo {
  version: string,
  url: string
}

const k14sApps = [
  'ytt',
  'kbld',
  'kapp',
  'kwt',
  'imgpkg',
  'vendir'
]

function createOctokit() {
  const token = core.getInput('token');
  if (token) {
    return github.getOctokit(token);
  } else {
    core.warning('No token set, you may experience rate limiting. Set "token: ${{ secrets.GITHUB_TOKEN }}" if you have problems.');
    return new GitHub();
  }
}

const octokit = createOctokit();

function describe(app: AppInfo): string {
  return `${app.name} ${app.version}`;
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

function getAssetInfo(app: AppInfo): AssetInfo {
  const name = `${app.name}-${getAssetSuffix()}`;
  return { app, name };
}

async function getDownloadUrlForAsset(asset: AssetInfo, release: ReposListReleasesItem): Promise<DownloadInfo> {
  for (const candidate of release.assets) {
    if (candidate.name == asset.name) {
      core.info(`Found executable ${asset.name} for ${describe(asset.app)}`);
      return { version: release.name, url: candidate.browser_download_url };
    }
  }
  throw new Error(`Could not find executable ${asset.name} for ${describe(asset.app)}`);
}

async function getDownloadUrl(app: AppInfo): Promise<DownloadInfo> {
  const asset = getAssetInfo(app);
  const repo = { owner: 'k14s', repo: app.name };

  if (app.version == 'latest') {
    const response = await octokit.repos.getLatestRelease(repo);
    const release: ReposGetLatestReleaseResponseData = response.data;
    core.info(`Using latest version for ${app.name} (${release.name})`);
    return getDownloadUrlForAsset(asset, release);
  }

  const response = await octokit.repos.listReleases({ owner: 'k14s', repo: app.name });
  const releases: ReposListReleasesResponseData = response.data;
  for (const candidate of releases) {
    if (candidate.name == app.version) {
      return getDownloadUrlForAsset(asset, candidate);
    }
  }

  throw new Error(`Could not find version "${app.version}" for ${app.name}`);
}

async function installApp(app: AppInfo): Promise<void> {
  core.info(`Installing ${describe(app)}...`);
  const { version, url } = await getDownloadUrl(app);

  let binPath = tc.find(app.name, version);
  
  if (!binPath) {
    core.info(`Cache miss for ${app} ${version}`);
    const downloadPath = await tc.downloadTool(url);
    fs.chmodSync(downloadPath, "755")  
    binPath = await tc.cacheFile(downloadPath, app.name, app.name, version);
  } else {
    core.info(`Cache hit for ${app} ${version}`);
  }

  core.addPath(binPath);
}

function parseInput(): string[] {
  return core.getInput('only')
    .split(',')
    .map((appName: string) => appName.trim())
    .filter((appName: string) => appName != '');
}

function getAppsToDownload(): AppInfo[] {
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
  const AppInfos = getAppsToDownload();
  core.info('Installing apps: ' + AppInfos.map((app: AppInfo) => `${app.name}:${app.version}`).join(', '));
  await Promise.all(AppInfos.map((app: AppInfo) => installApp(app)))
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
