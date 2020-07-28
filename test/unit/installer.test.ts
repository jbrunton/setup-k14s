import { Installer } from '../../src/installer'
import { mock, MockProxy } from 'jest-mock-extended'
import { ActionsCore } from '../../src/adapters/core'
import { ActionsToolCache } from '../../src/adapters/cache'
import { FileSystem } from '../../src/adapters/fs'
import { ReleasesService } from '../../src/releases_service'
import { DownloadInfo } from '../../src/types'

describe('Installer', () => {
  const app = { name: "ytt", version: "0.28.0" }
  const downloadUrl = "example.com/ytt/0.28.0/ytt-linux-amd64"
  const downloadPath = "/downloads/ytt-linux-amd64"
  const binPath = "/bin/ytt"

  let installer: Installer
  let core: MockProxy<ActionsCore>
  let cache: MockProxy<ActionsToolCache>
  let fs: MockProxy<FileSystem>

  beforeEach(() => {
    core = mock<ActionsCore>()
    cache = mock<ActionsToolCache>()
    fs = mock<FileSystem>()
    const releasesService = mock<ReleasesService>()

    installer = new Installer(core, cache, fs, releasesService)

    const downloadInfo: DownloadInfo = {
      version: "0.28.0",
      url: downloadUrl
    }
    releasesService.getDownloadUrl
      .calledWith(app)
      .mockReturnValue(new Promise(resolve => resolve(downloadInfo)))
  })

  test('it installs a new app', async () => {
    cache.downloadTool
      .calledWith(downloadUrl)
      .mockReturnValue(new Promise(resolve => resolve(downloadPath)))
    cache.cacheFile
      .calledWith(downloadPath, "ytt", "ytt", "0.28.0")
      .mockReturnValue(new Promise (resolve => resolve(binPath)))

    await installer.installApp(app)

    expect(core.info).toHaveBeenCalledWith("Cache miss for ytt 0.28.0")
    expect(fs.chmodSync).toHaveBeenCalledWith(downloadPath, "755")
    expect(core.addPath).toHaveBeenCalledWith(binPath)
  })

  test('it adds a cached app to the path', async () => {
    cache.find.calledWith("ytt", "0.28.0").mockReturnValue(binPath)

    await installer.installApp(app)

    expect(core.info).toHaveBeenCalledWith("Cache hit for ytt 0.28.0")
    expect(cache.downloadTool).not.toHaveBeenCalled()
    expect(core.addPath).toHaveBeenCalledWith(binPath)
  })
})
