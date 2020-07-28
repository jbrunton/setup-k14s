import {
  Octokit,
  OctokitResponse,
  ReposListReleasesItem,
  ReposListReleasesParameters,
  ReposListReleasesResponseData
} from '../../src/octokit';
import { MockProxy, mockDeep } from 'jest-mock-extended';
import { isEqual } from './matchers'

interface TestMethods {
  stubListReleasesResponse(params: ReposListReleasesParameters, releases: Array<ReposListReleasesItem>): void
}

export type TestOctokit = MockProxy<Octokit> & TestMethods

export function createTestOctokit(): TestOctokit {
  const octokit = mockDeep<Octokit>()
  octokit.stubListReleasesResponse = function(params: ReposListReleasesParameters, releases: Array<ReposListReleasesItem>) {
    const response = {
      data: releases
    } as OctokitResponse<ReposListReleasesResponseData>
    octokit.repos.listReleases
      .calledWith(isEqual(params))
      .mockReturnValue(new Promise((resolve) => {
        resolve(response)
      }))
  }
  return octokit as TestOctokit
}

// export function stubReleasesResponse(octokit: MockProxy<Octokit>, releases: Array<ReposListReleasesItem>) {
//   const response = {
//     data: releases
//   } as OctokitResponse<ReposListReleasesResponseData>
//   octokit.repos.listReleases
//     .calledWith(isEqual({ owner: 'k14s', repo: "ytt" }))
//     .mockReturnValue(new Promise((resolve) => {
//       resolve(response)
//     }))
// }
