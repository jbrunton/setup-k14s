import { Installer } from '../../src/installer'
import { mock, MockProxy } from 'jest-mock-extended'
import { ActionsCore } from '../../src/adapters/core'
import { ActionsToolCache } from '../../src/adapters/cache'
import { FileSystem } from '../../src/adapters/fs'
import { ReleasesService } from '../../src/releases_service'
import { DownloadInfo } from '../../src/types'

describe('Installer', () => {
  const app = { name: "ytt", version: "0.28.0" }
  const assetNameLinux = "ytt-linux-amd64"
  const assetNameWindows = "ytt-windows-amd64.exe"
  const downloadUrlLinux = "example.com/ytt/0.28.0/ytt-linux-amd64"
  const downloadUrlWindows = "example.com/ytt/0.28.0/ytt-windows-amd64.exe"
  const downloadPathLinux = "/downloads/ytt-linux-amd64"
  const downloadPathWindows = "/downloads/ytt-windows-amd64.exe"
  const binPathLinux = "/bin/ytt"
  const binPathWindows = "/bin/ytt.exe"
  const expectedContent = "foo bar baz"
  const expectedLinuxChecksum = '"dbd318c1c462aee872f41109a4dfd3048871a03dedd0fe0e757ced57dad6f2d7  ./ytt-linux-amd64"'
  const expectedWindowsChecksum = '"dbd318c1c462aee872f41109a4dfd3048871a03dedd0fe0e757ced57dad6f2d7  ./ytt-windows-amd64.exe"'

  let installer: Installer
  let core: MockProxy<ActionsCore>
  let cache: MockProxy<ActionsToolCache>
  let fs: MockProxy<FileSystem>

  beforeEach(() => {
    core = mock<ActionsCore>()
    cache = mock<ActionsToolCache>()
    fs = mock<FileSystem>()   
  })

  function createInstaller(platform: string): Installer {
    const env = { platform: platform }
    const releasesService = mock<ReleasesService>()
    installer = new Installer(core, cache, fs, env, releasesService)

    const expectedChecksum = platform == "win32" ? expectedWindowsChecksum : expectedLinuxChecksum
    const downloadInfo: DownloadInfo = {
      version: "0.28.0",
      url: platform == "win32" ? downloadUrlWindows : downloadUrlLinux,
      assetName: platform == "win32" ? assetNameWindows : assetNameLinux,
      releaseNotes: `* some cool stuff\n${expectedChecksum}`
    }
    releasesService.getDownloadInfo
      .calledWith(app)
      .mockReturnValue(Promise.resolve(downloadInfo))
    
    return installer
  }

  test('it installs a new app', async () => {
    const installer = createInstaller('linux')
    cache.downloadTool
      .calledWith(downloadUrlLinux)
      .mockReturnValue(Promise.resolve(downloadPathLinux))
    cache.cacheFile
      .calledWith(downloadPathLinux, "ytt", "ytt", "0.28.0")
      .mockReturnValue(Promise.resolve(binPathLinux))
    fs.readFileSync
      .calledWith(downloadPathLinux)
      .mockReturnValue(new Buffer(expectedContent, "utf8"))

    await installer.installApp(app)

    expect(core.info).toHaveBeenCalledWith("Downloading ytt 0.28.0 from example.com/ytt/0.28.0/ytt-linux-amd64")
    expect(core.info).toHaveBeenCalledWith(`✅  Verified checksum: "dbd318c1c462aee872f41109a4dfd3048871a03dedd0fe0e757ced57dad6f2d7  ./ytt-linux-amd64"`)
    expect(fs.chmodSync).toHaveBeenCalledWith(downloadPathLinux, "755")
    expect(core.addPath).toHaveBeenCalledWith(binPathLinux)
  })

  test('it installs a new app on windows', async () => {
    const installer = createInstaller('win32')
    cache.downloadTool
      .calledWith(downloadUrlWindows)
      .mockReturnValue(Promise.resolve(downloadPathWindows))
    cache.cacheFile
      .calledWith(downloadPathWindows, "ytt.exe", "ytt.exe", "0.28.0")
      .mockReturnValue(Promise.resolve(binPathWindows))
    fs.readFileSync
      .calledWith(downloadPathWindows)
      .mockReturnValue(new Buffer(expectedContent, "utf8"))

    await installer.installApp(app)

    expect(core.info).toHaveBeenCalledWith("Downloading ytt 0.28.0 from example.com/ytt/0.28.0/ytt-windows-amd64.exe")
    expect(core.info).toHaveBeenCalledWith(`✅  Verified checksum: "dbd318c1c462aee872f41109a4dfd3048871a03dedd0fe0e757ced57dad6f2d7  ./ytt-windows-amd64.exe"`)
    expect(fs.chmodSync).toHaveBeenCalledWith(downloadPathWindows, "755")
    expect(core.addPath).toHaveBeenCalledWith(binPathWindows)
  })

  test('it adds a cached app to the path', async () => {
    const installer = createInstaller('linux')
    cache.find.calledWith("ytt", "0.28.0").mockReturnValue(binPathLinux)

    await installer.installApp(app)

    expect(core.info).toHaveBeenCalledWith("ytt 0.28.0 already in tool cache")
    expect(cache.downloadTool).not.toHaveBeenCalled()
    expect(core.addPath).toHaveBeenCalledWith(binPathLinux)
  })

  test('it verifies the checksum', async () => {
    const installer = createInstaller('linux')
    cache.downloadTool
      .calledWith(downloadUrlLinux)
      .mockReturnValue(Promise.resolve(downloadPathLinux))
    cache.cacheFile
      .calledWith(downloadPathLinux, "ytt", "ytt", "0.28.0")
      .mockReturnValue(Promise.resolve(binPathLinux))
    fs.readFileSync
      .calledWith(downloadPathLinux)
      .mockReturnValue(new Buffer("unexpected content", "utf8"))

    const result = installer.installApp(app)

    await expect(result).rejects.toThrowError('Unable to verify checksum for ytt-linux-amd64. Expected to find "70f71fa558520b944152eea2ec934c63374c630302a981eab010e0da97bc2f24  ./ytt-linux-amd64" in release notes.')
  })
})
