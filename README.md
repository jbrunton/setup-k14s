# setup-k14s

A Github Action to setup k14s apps.

## Usage

By default, installs latest versions of `ytt`, `kbld`, `kapp`, `kwt`, `imgpkg` and `vendir`.

```yaml
steps:
- uses: jbrunton/checkout@v2
- uses: actions/setup-k14s@master
- run: |
    ytt version
    kbld version
```

To install only specific apps:

```yaml
steps:
- uses: jbrunton/checkout@v2
- uses: actions/setup-k14s@master
  with:
    only: ytt, kbld
- run: |
    ytt version
    kbld version
```

To use a specific version of an app:

```yaml
steps:
- uses: jbrunton/checkout@v2
- uses: actions/setup-k14s@master
  with:
    only: ytt, kbld
    kbld: v0.28.0
- run: |
    ytt version
    kbld version
```
