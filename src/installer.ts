import {AppInfo, DownloadInfo} from './types'
import {ActionsCore} from './adapters/core'
import {ActionsToolCache} from './adapters/cache'
import {FileSystem} from './adapters/fs'
import {ReleasesService} from './releases_service'
import * as crypto from 'crypto'

function describe(app: AppInfo): string {
  return `${app.name} ${app.version}`
}

export class Installer {
  private _core: ActionsCore
  private _cache: ActionsToolCache
  private _fs: FileSystem
  private _releasesService: ReleasesService

  constructor(
    core: ActionsCore,
    cache: ActionsToolCache,
    fs: FileSystem,
    releasesService: ReleasesService
  ) {
    this._core = core
    this._cache = cache
    this._fs = fs
    this._releasesService = releasesService
  }

  async installApp(app: AppInfo): Promise<void> {
    const downloadInfo = await this._releasesService.getDownloadInfo(app)

    // note: app.version and downloadInfo.version may be different:
    // if app.version is 'latest' then downloadInfo.version will be the concrete version
    let binPath = this._cache.find(app.name, downloadInfo.version)

    if (!binPath) {
      this._core.info(
        `Downloading ${app.name} ${downloadInfo.version} from ${downloadInfo.url}`
      )
      const downloadPath = await this._cache.downloadTool(downloadInfo.url)

      this.verifyChecksum(downloadPath, downloadInfo)

      this._fs.chmodSync(downloadPath, '755')
      binPath = await this._cache.cacheFile(
        downloadPath,
        app.name,
        app.name,
        downloadInfo.version
      )
      this._core.info(`Cached ${app.name} ${downloadInfo.version}`)
    } else {
      this._core.info(
        `${app.name} ${downloadInfo.version} already in tool cache`
      )
    }

    this._core.addPath(binPath)
    this._core.info(`Added ${binPath} to path`)
  }

  async installAll(apps: Array<AppInfo>) {
    this._core.info(
      'Installing ' +
        apps.map((app: AppInfo) => `${app.name}:${app.version}`).join(', ')
    )
    await Promise.all(apps.map((app: AppInfo) => this.installApp(app)))
  }

  private verifyChecksum(path: string, info: DownloadInfo) {
    const data = this._fs.readFileSync(path)
    const digest = crypto.createHash('sha256').update(data).digest('hex')
    const expectedChecksum = `${digest}  ./${info.assetName}`
    if (info.releaseNotes.includes(expectedChecksum)) {
      this._core.info(`✅  Verified checksum: "${expectedChecksum}"`)
    } else {
      throw new Error(
        `Unable to verify checksum for ${info.assetName}. Expected to find "${expectedChecksum}" in release notes.`
      )
    }
  }
}
