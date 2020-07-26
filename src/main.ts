import * as core from '@actions/core';
import * as github from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';
import * as tc from '@actions/tool-cache';
import * as fs from 'fs';
import { DefaultLogger } from './logger';
import { DefaultInput } from './input';
import { AppInfo, AssetInfo, DownloadInfo, ReposListReleasesItem, ReposGetLatestReleaseResponseData, ReposListReleasesResponseData } from './types';
import {Installer} from './installer';
import { ReleasesService } from './releases_service';

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
const releasesService = new ReleasesService(process, DefaultLogger, octokit);

function describe(app: AppInfo): string {
  return `${app.name} ${app.version}`;
}

async function installApp(app: AppInfo): Promise<void> {
  core.info(`Installing ${describe(app)}...`);
  const { version, url } = await releasesService.getDownloadUrl(app);

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
