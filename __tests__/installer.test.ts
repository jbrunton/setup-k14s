import {wait} from '../src/wait'
import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import { Installer, k14sApps } from '../src/installer'
import { Logger } from '../src/logger'
import { Input } from '../src/input'
import { mock, MockProxy } from 'jest-mock-extended';
import { AppInfo } from '../src/types'
import { stringify } from 'querystring'

describe('Installer', () => {
  function createInstaller(inputString: string = "", versions?: Map<string, string>): Installer {
    const logger = mock<Logger>()
    const input = mock<Input>()
    input.getInput.calledWith('only').mockReturnValue(inputString)
    for (let appName of k14sApps) {
      if (versions != undefined) {
        const version = versions.get(appName)
        if (version != undefined) {
          input.getInput.calledWith(appName).mockReturnValue(version)
          continue
        }
      }
      input.getInput.calledWith(appName).mockReturnValue('latest')
    }
    return new Installer(logger, input)
  }

  describe('getAppsToDownload()', () => {
    test('defaults to all', () => {
      const installer = createInstaller()
    
      const apps = installer.getAppsToDownload()
    
      expect(apps).toEqual([
        { name: "ytt", "version": "latest" },
        { name: "kbld", "version": "latest" },
        { name: "kapp", "version": "latest" },
        { name: "kwt", "version": "latest" },
        { name: "imgpkg", "version": "latest" },
        { name: "vendir", "version": "latest" }
      ])
    })

    test('allows version overrides', () => {
      const installer = createInstaller("", new Map<string, string>([["ytt", "0.28.0"]]))
    
      const apps = installer.getAppsToDownload()
    
      expect(apps).toEqual([
        { name: "ytt", "version": "0.28.0" },
        { name: "kbld", "version": "latest" },
        { name: "kapp", "version": "latest" },
        { name: "kwt", "version": "latest" },
        { name: "imgpkg", "version": "latest" },
        { name: "vendir", "version": "latest" }
      ])
    })

    test('allows for app list override', () => {
      const installer = createInstaller("ytt, kbld", new Map<string, string>([["ytt", "0.28.0"]]))
    
      const apps = installer.getAppsToDownload()
    
      expect(apps).toEqual([
        { name: "ytt", "version": "0.28.0" },
        { name: "kbld", "version": "latest" }
      ])
    })

    test('validates app names', () => {
      const installer = createInstaller("ytt, kbl")    
      expect(() => installer.getAppsToDownload()).toThrowError("Unknown app: kbl")
    }) 
  })
})
