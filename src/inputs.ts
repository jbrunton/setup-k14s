import {ActionsCore} from './adapters/core'
import {AppInfo} from './types'

export const k14sApps = ['ytt', 'kbld', 'kapp', 'kwt', 'imgpkg', 'vendir']

export class Inputs {
  private _apps?: AppInfo[]
  private _core: ActionsCore

  constructor(core: ActionsCore) {
    this._core = core
  }

  public getAppsToDownload(): AppInfo[] {
    const apps = this.parseAppsList()

    if (apps.length == 0) {
      // if no options specified, download all
      apps.push(...k14sApps)
    }

    this._apps = apps.map((appName: string) => {
      if (!k14sApps.includes(appName)) {
        throw Error(`Unknown app: ${appName}`)
      }
      return {name: appName, version: this._core.getInput(appName)}
    })

    return this._apps
  }

  private parseAppsList(): string[] {
    return this._core
      .getInput('only')
      .split(',')
      .map((appName: string) => appName.trim())
      .filter((appName: string) => appName != '')
  }
}
