import { ReleasesService } from '../../src/releases_service'
import { ActionsCore } from '../../src/adapters/core'
import { mock } from 'jest-mock-extended';
import { ReposListReleasesItem } from '../../src/adapters/octokit'
import { TestOctokit, createTestOctokit } from '../fixtures/test_octokit'

describe('ReleasesService', () => {

  function createService(platform: string, octokit: TestOctokit = createTestOctokit()) {
    const env = { platform: platform }
    const core = mock<ActionsCore>()
    return new ReleasesService(env, core, octokit)
  }

  test('getAssetInfo()', () => {
    {
      const service = createService("linux")
      const appInfo = { name: "ytt", version: "0.28.0" }
      const assetInfo = service["getAssetInfo"](appInfo)
      expect(assetInfo).toEqual({ app: appInfo, name: "ytt-linux-amd64" })
    }
    {
      const service = createService("win32")
      const appInfo = { name: "kbld", version: "0.28.0" }
      const assetInfo = service["getAssetInfo"](appInfo)
      expect(assetInfo).toEqual({ app: appInfo, name: "kbld-windows-amd64.exe" })
    }
    {
      const service = createService("darwin")
      const appInfo = { name: "kapp", version: "0.10.0" }
      const assetInfo = service["getAssetInfo"](appInfo)
      expect(assetInfo).toEqual({ app: appInfo, name: "kapp-darwin-amd64" })
    }
  })

  function releaseJsonFor(app: string, version: string): ReposListReleasesItem {
    return {
      name: version,
      assets: [{
        browser_download_url: `https://example.com/k14s/ytt/releases/download/v${version}/ytt-darwin-amd64`,
        name: `${app}-linux-amd64`
      }]
    } as ReposListReleasesItem
  }

  describe('getDownloadUrlForAsset()', () => {
    let service: ReleasesService
    let octokit: TestOctokit

    function stubListReleasesResponse(releases: Array<ReposListReleasesItem>) {
      const params = { owner: "k14s", repo: "ytt" }
      octokit.stubListReleasesResponse(params, releases)
    }

    beforeEach(() => {
      octokit = createTestOctokit()      
      service = createService("linux", octokit)
    })

    test('it returns the asset for the specific version, if given', async () => {
      stubListReleasesResponse([
        releaseJsonFor("ytt", "0.28.0"),
        releaseJsonFor("ytt", "0.27.0")
      ])
      const downloadInfo = await service.getDownloadUrl({ name: "ytt", version: "0.27.0" })
      expect(downloadInfo).toEqual({
        version: "0.27.0",
        url: "https://example.com/k14s/ytt/releases/download/v0.27.0/ytt-darwin-amd64",
      })
    })

    test('it returns the latest version', async () => {
      stubListReleasesResponse([
        releaseJsonFor("ytt", "0.1.2"), // check we ignore patches for older versions
        releaseJsonFor("ytt", "0.28.0"),
        releaseJsonFor("ytt", "0.27.0")
      ])
      const downloadInfo = await service.getDownloadUrl({ name: "ytt", version: "latest" })
      expect(downloadInfo).toEqual({
        version: "0.28.0",
        url: "https://example.com/k14s/ytt/releases/download/v0.28.0/ytt-darwin-amd64",
      })
    })

    test('errors if it cannot find the version', async () => {
      stubListReleasesResponse([
        releaseJsonFor("ytt", "0.28.0"),
        releaseJsonFor("ytt", "0.27.0")
      ])
      const result = service.getDownloadUrl({ name: "ytt", version: "not-a-version" })
      await expect(result).rejects.toThrowError('Could not find version "not-a-version" for ytt')
    })
  })

  describe('sortReleases()', () => {
    test('it sorts non-semver names last', () => {
      const service = createService("linux", createTestOctokit())
      const releases = [
        releaseJsonFor("ytt", "0.1.2"),
        releaseJsonFor("ytt", "0.28.0"),
        releaseJsonFor("ytt", "0.2.0 - initial release"), // some apps have a "0.1.0 - initial release" version
        releaseJsonFor("ytt", "0.27.0")
      ]

      const orderedResults = service["sortReleases"](releases).map(result => result.name)
      
      expect(orderedResults).toEqual(["0.28.0", "0.27.0", "0.1.2", "0.2.0 - initial release"])
    })
  })
})
