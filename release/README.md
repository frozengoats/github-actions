# release
tag and publish a release, based on the detected version  (see `frozengoats/github-actions/version`)
see [action.yml](https://github.com/frozengoats/github-actions/blob/main/release/action.yml) for detailed configuration

## example
```
name: publish release

on:
  push:
    branches:
    - "**"

jobs:

  publish:
    runs-on: ubuntu-22.04
    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0

    - name: check code formatting
      run: make check-format

    - name: get version
      uses: frozengoats/github-actions/version
      with:
        filename: Cargo.toml
        toml-section: 'package'
        toml-key: 'version'

    - name: run tests
      run: make test

    - uses: frozengoats/github-actions/release
      with:
        create-release: true
        create-version-tag: true
```