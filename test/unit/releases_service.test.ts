import { ReleasesService } from '../../src/releases_service'
import { Logger } from '../../src/logger'
import { mock, mockDeep, MockProxy } from 'jest-mock-extended';
import { AppInfo, ReposListReleasesResponseData, ReposListReleasesItem } from '../../src/types'
import { stringify } from 'querystring'
import { GitHub } from '@actions/github/lib/utils';
import type { OctokitResponse, RequestParameters } from "@octokit/types";

import { Matcher } from 'jest-mock-extended';
import { equals } from 'expect/build/jasmineUtils';
import { Octokit, ReposListReleasesParameters } from '../../src/octokit'
import { isEqual } from '../fixtures/matchers'
import { createTestOctokit } from '../fixtures/test_octokit'

describe('ReleasesService', () => {

  function createService(platform: string, octokit?: MockProxy<Octokit>) {
    const env = { platform: platform }
    const logger = mock<Logger>()
    if (octokit == undefined) {
      octokit = mock<InstanceType<typeof GitHub>>()
    }
    return new ReleasesService(env, logger, octokit)
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

  test('getDownloadUrlForAsset()', async () => {
    const octokit = createTestOctokit()
    const release = {
      name: "0.28.0",
      assets: [{
        browser_download_url: "https://example.com/k14s/ytt/releases/download/v0.28.0/ytt-darwin-amd64",
        name: "ytt-linux-amd64"
      }]
    } as ReposListReleasesItem;
    octokit.stubListReleasesResponse({ owner: "k14s", repo: "ytt" }, [release])
    const service = createService("linux", octokit)

    const downloadInfo = await service.getDownloadUrl({ name: "ytt", version: "0.28.0" })

    expect(downloadInfo).toEqual({
      version: "0.28.0",
      url: "https://example.com/k14s/ytt/releases/download/v0.28.0/ytt-darwin-amd64",
    })
  })
})
