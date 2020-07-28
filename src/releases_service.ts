import {AppInfo, AssetInfo, DownloadInfo} from './types'
import {ActionsCore} from './adapters/core'
import {Environment} from './adapters/environment'
import {
  Octokit,
  ReposListReleasesItem,
  ReposListReleasesResponseData,
} from './adapters/octokit'
import * as semver from 'semver'

export class ReleasesService {
  private _env: Environment
  private _core: ActionsCore
  private _octokit: Octokit

  constructor(env: Environment, core: ActionsCore, octokit: Octokit) {
    this._env = env
    this._core = core
    this._octokit = octokit
  }

  async getDownloadUrl(app: AppInfo): Promise<DownloadInfo> {
    const asset = this.getAssetInfo(app)
    const repo = {owner: 'k14s', repo: app.name}

    const response = await this._octokit.repos.listReleases(repo)
    const releases: ReposListReleasesResponseData = response.data

    if (app.version == 'latest') {
      const release = releases.sort((release1, release2) => {
        return -semver.compare(release1.name, release2.name)
      })[0]
      this._core.info(`Using latest version for ${app.name} (${release.name})`)
      return this.getDownloadUrlForAsset(asset, release)
    }

    for (const candidate of releases) {
      if (candidate.name == app.version) {
        return this.getDownloadUrlForAsset(asset, candidate)
      }
    }

    throw new Error(`Could not find version "${app.version}" for ${app.name}`)
  }

  private getDownloadUrlForAsset(
    asset: AssetInfo,
    release: ReposListReleasesItem
  ): DownloadInfo {
    for (const candidate of release.assets) {
      if (candidate.name == asset.name) {
        this._core.info(
          `Found executable ${asset.name} for ${describe(asset.app)}`
        )
        return {version: release.name, url: candidate.browser_download_url}
      }
    }
    throw new Error(
      `Could not find executable ${asset.name} for ${describe(asset.app)}`
    )
  }

  private getAssetInfo(app: AppInfo): AssetInfo {
    const name = `${app.name}-${this.getAssetSuffix()}`
    return {app, name}
  }

  private getAssetSuffix(): string {
    switch (this._env.platform) {
      case 'win32':
        return 'windows-amd64.exe'
      case 'darwin':
        return 'darwin-amd64'
      default:
        return 'linux-amd64'
    }
  }
}

function describe(app: AppInfo): string {
  return `${app.name} ${app.version}`
}
