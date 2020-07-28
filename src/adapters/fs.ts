import * as fs from 'fs'
export * as fs from 'fs'

export interface FileSystem {
  chmodSync(path: fs.PathLike, mode: fs.Mode): void;
}
