import {wait} from '../src/wait'
import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import { ReleasesService } from '../src/releases_service'
import { Logger } from '../src/logger'
import { Input } from '../src/input'
import { Environment } from '../src/environment'
import { mock, MockProxy } from 'jest-mock-extended';
import { AppInfo } from '../src/types'
import { stringify } from 'querystring'
import { GitHub } from '@actions/github/lib/utils';

describe('ReleasesService', () => {

  function createService(platform: string) {
    const env = { platform: platform }
    const logger = mock<Logger>()
    const octokit = mock<InstanceType<typeof GitHub>>()
    return new ReleasesService(env, logger, octokit)
  }

  test('getAssetInfo', () => {
    {
      const service = createService("linux")
      const appInfo = { name: "ytt", version: "0.28.0" }
      const val = service["getAssetInfo"](appInfo)
      expect(val).toEqual({"app": {"name": "ytt", "version": "0.28.0"}, "name": "ytt-linux-amd64"})
    }
    {
      const service = createService("win32")
      const appInfo = { name: "kbld", version: "0.28.0" }
      const val = service["getAssetInfo"](appInfo)
      expect(val).toEqual({"app": {"name": "kbld", "version": "0.28.0"}, "name": "kbld-windows-amd64.exe"})
    }
    {
      const service = createService("darwin")
      const appInfo = { name: "kapp", version: "0.10.0" }
      const val = service["getAssetInfo"](appInfo)
      expect(val).toEqual({"app": {"name": "kapp", "version": "0.10.0"}, "name": "kapp-darwin-amd64"})
    }
  })
})
