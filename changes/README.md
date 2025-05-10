# changes
detect changes in a multi-tenant repository, for use with a matrix style workflow where each changed directory will spawn a concurrent job.
see [action.yml](https://github.com/frozengoats/github-actions/blob/main/changes/action.yml) for detailed configuration

## example
```
name: execute publish job against each directory containing changes
permissions:
  contents: write
  checks: read

on:
  push:
    branches:
    - "**"

jobs:
  get-changes:
    runs-on: ubuntu-24.04
    name: generate-changed-dir-matrix
    outputs:
      directories: ${{ steps.check-changes.outputs.directories }}
    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
    - id: check-changes
      uses: frozengoats/github-actions/changes@changes-v1
      with:
        exclude: .git*
        must-contain: VERSION

  publish:
    needs: get-changes
    runs-on: ubuntu-24.04
    if: needs.get-changes.outputs.directories != '[]'
    strategy:
      matrix:
        item: ${{ fromJson(needs.get-changes.outputs.directories) }}
    defaults:
      run:
        working-directory: ${{ matrix.item.path }}
    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
    - name: build docker image
      run: make build
```
