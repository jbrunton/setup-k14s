import {
  Octokit,
  OctokitResponse,
  
  ReposListReleasesItem,
  ReposListReleasesParameters,
  ReposListReleasesResponseData,

  ReposGetLatestReleaseParameters,
  ReposGetLatestReleaseResponseData
} from '../../src/octokit';
import { MockProxy, mockDeep } from 'jest-mock-extended';
import { isEqual } from './matchers'

interface TestMethods {
  stubListReleasesResponse(params: ReposListReleasesParameters, releases: Array<ReposListReleasesItem>): void
  stubLatestReleaseResponse(params: ReposGetLatestReleaseParameters, release: ReposListReleasesItem): void
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

  octokit.stubLatestReleaseResponse = function(params: ReposGetLatestReleaseParameters, release: ReposListReleasesItem) {
    const response = {
      data: release
    } as OctokitResponse<ReposGetLatestReleaseResponseData>
    octokit.repos.getLatestRelease
      .calledWith(isEqual(params))
      .mockReturnValue(new Promise((resolve) => {
        resolve(response)
      }))
    }

  return octokit as TestOctokit
}
