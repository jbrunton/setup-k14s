import * as core from '@actions/core';
import * as github from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';
import { RestEndpointMethodTypes } from '@octokit/rest'

import { Endpoints } from "@octokit/types";

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

export type ListReleasesParameters = Endpoints["GET /repos/:owner/:repo/releases"]["parameters"];
