import {wait} from '../src/wait'
import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import { Installer } from '../src/installer'
import { Logger } from '../src/logger'
import { Input } from '../src/input'
import { mock } from 'jest-mock-extended';

test('throws invalid number', async () => {
  const input = parseInt('foo', 10)
  await expect(wait(input)).rejects.toThrow('milliseconds not a number')
})

test('wait 500 ms', async () => {
  const start = new Date()
  await wait(500)
  const end = new Date()
  var delta = Math.abs(end.getTime() - start.getTime())
  expect(delta).toBeGreaterThan(450)
})

test('installer', () => {
  const logger = mock<Logger>()
  const input = mock<Input>()
  input.getInput.calledWith('only').mockReturnValue('ytt')
  const installer = new Installer(logger, input)

  const apps = installer.getAppsToDownload()

  expect(apps).toEqual([{ name: "ytt", "version": undefined }])
})

// shows how the runner will run a javascript action with env / stdout protocol
// test('test runs', () => {
//   process.env['INPUT_MILLISECONDS'] = '500'
//   const ip = path.join(__dirname, '..', 'lib', 'main.js')
//   const options: cp.ExecSyncOptions = {
//     env: process.env
//   }
//   console.log(cp.execSync(`node ${ip}`, options).toString())
// })
