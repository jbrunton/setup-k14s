import * as core from '@actions/core';
import * as github from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';
import * as tc from '@actions/tool-cache';
import * as fs from 'fs';
import { DefaultLogger } from './logger';
import { DefaultInput } from './input';
import { AppInfo, AssetInfo, DownloadInfo, ReposListReleasesItem, ReposGetLatestReleaseResponseData, ReposListReleasesResponseData } from './types';
import {Installer} from './installer';

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
    core.info(`Cache miss for ${app.name} ${version}`);
    const downloadPath = await tc.downloadTool(url);
    fs.chmodSync(downloadPath, "755")  
    binPath = await tc.cacheFile(downloadPath, app.name, app.name, version);
  } else {
    core.info(`Cache hit for ${app.name} ${version}`);
  }

  core.addPath(binPath);
}

async function downloadApps() {
  const installer = new Installer(DefaultLogger, DefaultInput)
  const appInfos = installer.getAppsToDownload()
  core.info('Installing apps: ' + appInfos.map((app: AppInfo) => `${app.name}:${app.version}`).join(', '));
  await Promise.all(appInfos.map((app: AppInfo) => installApp(app)))
}

async function run(): Promise<void> {
  try {
    console.time('download apps');
    await downloadApps();
    console.timeEnd('download apps');  
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
