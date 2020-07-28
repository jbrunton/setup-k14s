import { AppInfo } from "./types"
import { ActionsCore } from './adapters/core'
import { ActionsToolCache } from './adapters/cache'
import { ReleasesService } from "./releases_service"
import * as fs from 'fs'

function describe(app: AppInfo): string {
  return `${app.name} ${app.version}`;
}

export class Installer {
  private _core: ActionsCore
  private _cache: ActionsToolCache
  private _releasesService: ReleasesService

  constructor(core: ActionsCore, cache: ActionsToolCache, releasesService: ReleasesService) {
    this._core = core
    this._cache = cache
    this._releasesService = releasesService
  }

  async installApp(app: AppInfo): Promise<void> {
    this._core.info(`Installing ${describe(app)}...`);
    const { version, url } = await this._releasesService.getDownloadUrl(app);
  
    let binPath = this._cache.find(app.name, version);
    
    if (!binPath) {
      this._core.info(`Cache miss for ${app.name} ${version}`);
      const downloadPath = await this._cache.downloadTool(url);
      fs.chmodSync(downloadPath, "755")  
      binPath = await this._cache.cacheFile(downloadPath, app.name, app.name, version);
    } else {
      this._core.info(`Cache hit for ${app.name} ${version}`);
    }
  
    this._core.addPath(binPath);
  }
  
  async installAll(apps: Array<AppInfo>) {
    this._core.info('Installing apps: ' + apps.map((app: AppInfo) => `${app.name}:${app.version}`).join(', '));
    await Promise.all(apps.map((app: AppInfo) => this.installApp(app)))
  }
}
