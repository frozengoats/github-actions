# version
consumes version from of many supported locations and makes it available on the environment for other actions such as `frozengoats/github-actions/release`. ensures that version is incremented before publishing.
see [action.yml](https://github.com/frozengoats/github-actions/blob/main/version/action.yml) for detailed configuration

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
      uses: frozengoats/github-actions/version@version-v1
      with:
        filename: Cargo.toml
        toml-section: 'package'
        toml-key: 'version'
        changelog-enforced: true

    - name: run tests
      run: make test

    - uses: frozengoats/github-actions/release@release-v1
      with:
        create-release: true
        create-version-tag: true
```