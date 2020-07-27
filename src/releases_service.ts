import * as github from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';
import { AppInfo, AssetInfo, ReposListReleasesItem, DownloadInfo, ReposGetLatestReleaseResponseData, ReposListReleasesResponseData } from './types';
import { Logger } from './logger';
import { Environment } from './environment';
import { Octokit, ListReleasesParameters } from './octokit'

export class ReleasesService {
  private _env: Environment
  private _logger: Logger
  private _octokit: Octokit

  constructor(env: Environment, logger: Logger, octokit: Octokit) {
    this._env = env
    this._logger = logger
    this._octokit = octokit
  }

  async getDownloadUrl(app: AppInfo): Promise<DownloadInfo> {
    const asset = this.getAssetInfo(app);
    const repo = { owner: 'k14s', repo: app.name };
  
    if (app.version == 'latest') {
      const response = await this._octokit.repos.getLatestRelease(repo);
      const release: ReposGetLatestReleaseResponseData = response.data;
      this._logger.info(`Using latest version for ${app.name} (${release.name})`);
      return this.getDownloadUrlForAsset(asset, release);
    }
  
    const args: ListReleasesParameters = { owner: 'k14s', repo: app.name }
    const response = await this._octokit.repos.listReleases(args);
    const releases: ReposListReleasesResponseData = response.data;
    for (const candidate of releases) {
      if (candidate.name == app.version) {
        return this.getDownloadUrlForAsset(asset, candidate);
      }
    }
  
    throw new Error(`Could not find version "${app.version}" for ${app.name}`);
  }

  private getDownloadUrlForAsset(asset: AssetInfo, release: ReposListReleasesItem): DownloadInfo {
    for (const candidate of release.assets) {
      if (candidate.name == asset.name) {
        this._logger.info(`Found executable ${asset.name} for ${describe(asset.app)}`);
        return { version: release.name, url: candidate.browser_download_url };
      }
    }
    throw new Error(`Could not find executable ${asset.name} for ${describe(asset.app)}`);
  }

  private getAssetInfo(app: AppInfo): AssetInfo {
    const name = `${app.name}-${this.getAssetSuffix()}`;
    return { app, name };
  }

  private getAssetSuffix(): string {
    switch (this._env.platform) {
      case 'win32': return 'windows-amd64.exe';
      case 'darwin': return 'darwin-amd64';
      default: return 'linux-amd64'
    }
  }
}

function describe(app: AppInfo): string {
  return `${app.name} ${app.version}`;
}

