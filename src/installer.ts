import { Logger } from './logger';
import { Input } from './input';
import { AppInfo } from './types';

export const k14sApps = [
  'ytt',
  'kbld',
  'kapp',
  'kwt',
  'imgpkg',
  'vendir'
]

export class Installer {
  private _apps?: AppInfo[]
  private _logger: Logger
  private _input: Input

  constructor(logger: Logger, input: Input) {
    this._logger = logger
    this._input = input
  }

  public getAppsToDownload(): AppInfo[] {
    const apps = this.parseAppsList()
    
    if (apps.length == 0) {
      // if no options specified, download all
      apps.push(...k14sApps);
    }
  
    this._apps = apps.map((appName: string) => {
      if (!k14sApps.includes(appName)) {
        throw Error(`Unknown app: ${appName}`);
      }
      return { name: appName, version: this._input.getInput(appName) };
    });

    return this._apps
  }

  private parseAppsList(): string[] {
    return this._input.getInput("only")
        .split(',')
        .map((appName: string) => appName.trim())
        .filter((appName: string) => appName != '');
  }
}
