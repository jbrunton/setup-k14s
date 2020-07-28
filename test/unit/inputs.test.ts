import { Inputs, k14sApps } from '../../src/inputs'
import { ActionsCore } from '../../src/adapters/core'
import { mock } from 'jest-mock-extended';

describe('Inputs', () => {
  function createInputs(
    platform: string,
    inputString: string = "",
    versions?: Map<string, string>
  ): Inputs {
    const core = mock<ActionsCore>()
    core.getInput.calledWith('only').mockReturnValue(inputString)
    for (let appName of k14sApps) {
      if (versions != undefined) {
        const version = versions.get(appName)
        if (version != undefined) {
          core.getInput.calledWith(appName).mockReturnValue(version)
          continue
        }
      }
      core.getInput.calledWith(appName).mockReturnValue('latest')
    }

    const env = {
      platform: platform
    }

    return new Inputs(core, env)
  }

  describe('getAppsToDownload()', () => {
    test('defaults to all', () => {
      const inputs = createInputs("linux")
    
      const apps = inputs.getAppsToDownload()
    
      expect(apps).toEqual([
        { name: "ytt", "version": "latest" },
        { name: "kbld", "version": "latest" },
        { name: "kapp", "version": "latest" },
        { name: "kwt", "version": "latest" },
        { name: "imgpkg", "version": "latest" },
        { name: "vendir", "version": "latest" }
      ])
    })

    test('excludes kwt for windows', () => {
      const inputs = createInputs("win32")
    
      const apps = inputs.getAppsToDownload()
    
      expect(apps).toEqual([
        { name: "ytt", "version": "latest" },
        { name: "kbld", "version": "latest" },
        { name: "kapp", "version": "latest" },
        { name: "imgpkg", "version": "latest" },
        { name: "vendir", "version": "latest" }
      ])
    })

    test('allows version overrides', () => {
      const inputs = createInputs("linux", "", new Map<string, string>([["ytt", "0.28.0"]]))
    
      const apps = inputs.getAppsToDownload()
    
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
      const inputs = createInputs("linux", "ytt, kbld", new Map<string, string>([["ytt", "0.28.0"]]))
    
      const apps = inputs.getAppsToDownload()
    
      expect(apps).toEqual([
        { name: "ytt", "version": "0.28.0" },
        { name: "kbld", "version": "latest" }
      ])
    })

    test('validates app names', () => {
      const inputs = createInputs("linux", "ytt, kbl")    
      expect(() => inputs.getAppsToDownload()).toThrowError("Unknown app: kbl")
    }) 
  })
})
