import * as tc from '@actions/tool-cache';
import * as fs from 'fs';
import { core } from './core';
import { AppInfo } from './types';
import { Inputs } from './inputs';
import { ReleasesService } from './releases_service';
import { createOctokit } from './octokit'

const octokit = createOctokit();
const releasesService = new ReleasesService(process, core, octokit);

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
  const inputs = new Inputs(core)
  const appInfos = inputs.getAppsToDownload()
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
