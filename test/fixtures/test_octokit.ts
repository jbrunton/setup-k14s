import {
  Octokit,
  OctokitResponse,
  
  ReposListReleasesItem,
  ReposListReleasesParameters,
  ReposListReleasesResponseData
} from '../../src/adapters/octokit';
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
      .mockReturnValue(Promise.resolve(response)))
    }

  return octokit as TestOctokit
}
