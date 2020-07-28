import * as tc from '@actions/tool-cache';
import * as fs from 'fs';
import { core } from './adapters/core';
import { AppInfo } from './types';
import { Inputs } from './inputs';
import { ReleasesService } from './releases_service';
import { Installer } from './installer'
import { createOctokit } from './adapters/octokit'
import { NodeEnvironment } from './environment';

const octokit = createOctokit();
const releasesService = new ReleasesService(process, core, octokit);
const installer = new Installer(core, tc, releasesService)

async function run(): Promise<void> {
  try {
    console.time('download apps');
    const apps = new Inputs(core).getAppsToDownload()
    await installer.installAll(apps);
    console.timeEnd('download apps');  
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
