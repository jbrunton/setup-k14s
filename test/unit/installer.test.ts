import { Installer } from '../../src/installer'
import { mock } from 'jest-mock-extended'
import { ActionsCore } from '../../src/adapters/core'
import { ActionsToolCache } from '../../src/adapters/cache'
import { FileSystem } from '../../src/adapters/fs'
import { ReleasesService } from '../../src/releases_service'
import { DownloadInfo } from '../../src/types'

describe('Installer', () => {
  test('it installs a new app', async () => {
    const core = mock<ActionsCore>()
    const cache = mock<ActionsToolCache>()
    const fs = mock<FileSystem>()
    const releasesService = mock<ReleasesService>()
    const installer = new Installer(core, cache, fs, releasesService)

    const app = { name: "ytt", version: "0.28.0" }
    const downloadUrl = "example.com/ytt/0.28.0/ytt-linux-amd64"
    const downloadPath = "/downloads/ytt-linux-amd64"
    const binPath = "/bin/ytt"
    const downloadInfo: DownloadInfo = {
      version: "0.28.0",
      url: downloadUrl
    }
    releasesService.getDownloadUrl
      .calledWith(app)
      .mockReturnValue(new Promise(resolve => resolve(downloadInfo)))
    cache.downloadTool
      .calledWith(downloadUrl)
      .mockReturnValue(new Promise(resolve => resolve(downloadPath)))
    cache.cacheFile
      .calledWith(downloadPath, "ytt", "ytt", "0.28.0")
      .mockReturnValue(new Promise (resolve => resolve(binPath)))

    await installer.installApp(app)

    expect(fs.chmodSync).toHaveBeenCalledWith(downloadPath, "755")
    expect(core.addPath).toHaveBeenCalledWith(binPath)
  })
})
