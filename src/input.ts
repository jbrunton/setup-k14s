import * as core from '@actions/core';

export interface Input {
  getInput(name: string, options?: core.InputOptions): string
}

export const DefaultInput = {
  getInput: core.getInput
}
