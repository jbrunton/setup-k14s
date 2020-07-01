# setup-k14s

A Github Action to setup k14s apps.

## Usage

By default, installs latest versions of `ytt`, `kbld`, `kapp`, `kwt`, `imgpkg` and `vendir`:

```yaml
steps:
- uses: actions/checkout@v2
- uses: jbrunton/setup-k14s@master
- run: |
    ytt version
    kbld version
```

`setup-k14s` uses the GitHub API to find information about latest releases. To avoid [rate limits](https://developer.github.com/v3/#rate-limiting) it is recommended you pass the [GITHUB_TOKEN](https://help.github.com/en/actions/configuring-and-managing-workflows/authenticating-with-the-github_token) secret:

```yaml
steps:
- uses: actions/checkout@v2
- uses: jbrunton/setup-k14s@master
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
- run: |
    ytt version
    kbld version
```

To install only specific apps:

```yaml
steps:
- uses: actions/checkout@v2
- uses: jbrunton/setup-k14s@master
  with:
    only: ytt, kbld
- run: |
    ytt version
    kbld version
```

To use a specific version of an app:

```yaml
steps:
- uses: actions/checkout@v2
- uses: jbrunton/setup-k14s@master
  with:
    only: ytt, kbld
    kbld: v0.28.0
- run: |
    ytt version
    kbld version
```
