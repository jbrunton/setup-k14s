import * as core from '@actions/core';
import * as github from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';
import { RestEndpointMethodTypes } from '@octokit/rest'

import { Endpoints } from "@octokit/types";

type ArrayElement<A> = A extends readonly (infer T)[] ? T : never

// list releases types
export type ReposListReleasesParameters = Endpoints["GET /repos/:owner/:repo/releases"]["parameters"];
import { ReposListReleasesResponseData } from "@octokit/types";
export { ReposListReleasesResponseData }
export type ReposListReleasesItem = ArrayElement<ReposListReleasesResponseData>

// latest releases
export type ReposGetLatestReleaseParameters = Endpoints["GET /repos/:owner/:repo/releases/latest"]["parameters"]
export { ReposGetLatestReleaseResponseData } from "@octokit/types";

// Octokit
export { OctokitResponse } from '@octokit/types'
export type Octokit = InstanceType<typeof GitHub>

export function createOctokit() {
  const token = core.getInput('token');
  if (token) {
    return github.getOctokit(token);
  } else {
    core.warning('No token set, you may experience rate limiting. Set "token: ${{ secrets.GITHUB_TOKEN }}" if you have problems.');
    return new GitHub();
  }
}
