import * as core from '@actions/core';

export interface Logger {
  info(message: string | Error): void
}

export const DefaultLogger = {
  info: core.info
}
