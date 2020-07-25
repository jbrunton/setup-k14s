import * as core from '@actions/core';

import {
  ReposListReleasesResponseData,
  ReposGetLatestReleaseResponseData
} from "@octokit/types";

export type ArrayElement<A> = A extends readonly (infer T)[] ? T : never

export type ReposListReleasesItem = ArrayElement<ReposListReleasesResponseData>

export {ReposGetLatestReleaseResponseData, ReposListReleasesResponseData}

export interface AppInfo {
  name: string,
  version: string
}

export interface AssetInfo {
  app: AppInfo,
  name: string
}

export interface DownloadInfo {
  version: string,
  url: string
}
