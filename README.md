# github-actions
collection of reusable github actions
these actions were generally intended to be used together, so they provide some features/assumptions which allow them to work together, sparing some configuration tedium.

| name | description | readme |
| --- | --- | --- |
| changes | identify directories with changes, used to drive a job matrix | [documentation](https://github.com/frozengoats/github-actions/blob/main/changes/README.md) |
| version | ensure that releases are properly versioned, used in conjunction with `release` | [documentation](https://github.com/frozengoats/github-actions/blob/main/version/README.md) |
| release | perform tagging and release generation upon merge to parent branch, used in conjunction with `version` | [documentation](https://github.com/frozengoats/github-actions/blob/main/release/README.md) |

for a full illustration of these actions used together as a matrix, see the [workflow](https://github.com/frozengoats/github-actions/blob/main/.github/workflows/release.yaml) for this repository
