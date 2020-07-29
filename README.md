# setup-k14s

A Github Action to setup k14s apps.

## Usage

By default, installs latest versions of `ytt`, `kbld`, `kapp`, `kwt`, `imgpkg` and `vendir`:

```yaml
steps:
- uses: jbrunton/setup-k14s@v1
- run: |
    ytt version
    kbld version
```

`setup-k14s` uses the GitHub API to find information about latest releases. To avoid [rate limits](https://developer.github.com/v3/#rate-limiting) it is recommended you pass a [token](https://help.github.com/en/actions/configuring-and-managing-workflows/authenticating-with-the-github_token):

```yaml
steps:
- uses: jbrunton/setup-k14s@v1
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
- run: |
    ytt version
    kbld version
```

To install only specific apps:

```yaml
steps:
- uses: jbrunton/setup-k14s@v1
  with:
    only: ytt, kbld
- run: |
    ytt version
    kbld version
```

To use a specific version of an app:

```yaml
steps:
- uses: jbrunton/setup-k14s@v1
  with:
    only: ytt, kbld
    kbld: v0.28.0
- run: |
    ytt version
    kbld version
```

## Development

Run tests:

    jest
    
Build all (format, build, pack, test):

    npm run all

### Running a workflow locally

If you want to run the build and test workflows locally to try out the action, install [act](https://github.com/nektos/act).

You can then run all workflows like this:

    npm run build && npm run pack && act

Note: remember to run `build` and `pack` first, as the workflow will act upon the `dist/index.js` file.

Typically, if you just want to try out the action, it's sufficient to run a single e2e test like this:

    npm run build && npm run pack && act -j test-e2e-specific-apps

This will execute the test-e2e-specific-apps job, which runs the action configured to install a couple of apps (ytt and kbld).

### Submitting PRs

Before submitting a PR, you need to:

1. Format your code.
2. Update `dist/index.js`.

You can do this with `npm run prepare`.

If you forget, the `check build up to date` build step will fail.
