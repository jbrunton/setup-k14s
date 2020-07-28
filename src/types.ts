export interface AppInfo {
  name: string
  version: string
}

// export interface AssetInfo {
//   app: AppInfo
//   name: string
// }

export interface DownloadInfo {
  version: string
  url: string
  assetName: string
  releaseNotes: string
}
