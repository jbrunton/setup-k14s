import { Inputs, k14sApps } from '../../src/inputs'
import { ActionsCore } from '../../src/adapters/core'
import { mock } from 'jest-mock-extended';

describe('Inputs', () => {
  function createInputs(platform: string, inputs: {[key: string]: string} = {}): Inputs {
    const core = mock<ActionsCore>()
    core.getInput.calledWith('only').mockReturnValue(inputs.only || '')
    for (let appName of k14sApps) {
      core.getInput.calledWith(appName).mockReturnValue(inputs[appName] || 'latest')
    }
    return new Inputs(core, { platform: platform })
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
      const inputs = createInputs("linux", { ytt: "0.28.0" })
    
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
      const inputs = createInputs("linux", { only: "ytt, kbld", ytt: "0.28.0" })
    
      const apps = inputs.getAppsToDownload()
    
      expect(apps).toEqual([
        { name: "ytt", "version": "0.28.0" },
        { name: "kbld", "version": "latest" }
      ])
    })

    test('validates app names', () => {
      const inputs = createInputs("linux", { only: "ytt, kbl" })    
      expect(() => inputs.getAppsToDownload()).toThrowError("Unknown app: kbl")
    }) 
  })
})
