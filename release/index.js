const core = require('@actions/core');
const github = require('@actions/github');

async function action() {
  try {
    let parentBranch = core.getInput('parent-branch')
    if (parentBranch == '') {
      parentBranch = github.context.payload.repository.default_branch
    }

    const baseTag = core.getInput('base-tag')
    const createVersionTag = core.getBooleanInput('create-version-tag')
    const createRelease = core.getBooleanInput('create-release')
    const createMajorVersionTag = core.getBooleanInput('create-major-version-tag')
    const updateBaseTag = core.getBooleanInput('update-base-tag')
    const githubToken = core.getInput('github-token')
    const octokit = github.getOctokit(githubToken)

    if (createRelease && !createVersionTag) {
      throw new Error("create-release cannot be used without also enabling create-version-tag")
    }

    try {
      await octokit.rest.checks.listForRef({
        owner:  github.context.payload.repository.owner.login,
        repo: github.context.payload.repository.name,
        ref: `refs/heads/${parentBranch}`,
      })
    } catch (error) {
      console.error(error)
      throw new Error(`unable to locate branch named "${parentBranch}"`)
    }

    const branch = process.env.GITHUB_REF.replace("refs/heads/", "")

    const onParentBranch = (branch === parentBranch);
    const actionText = onParentBranch ? "apply" : "preview";

    // if the current branch is the parent branch, we should create the specified tags
    if (createVersionTag === true) {
      const versionTag = process.env.VERSION_TAG
      if (versionTag === undefined) {
        throw new Error("no version tag found in the environment, did you run the frozengoats/github-actions/version action?")
      }

      if (onParentBranch) {
        console.log(`attempt to ${actionText} version tag ${versionTag} against ${process.env.GITHUB_SHA}`)
        await octokit.rest.git.createRef({
          owner:  github.context.payload.repository.owner.login,
          repo: github.context.payload.repository.name,
          ref: `refs/tags/${versionTag}`,
          sha: process.env.GITHUB_SHA,
        })

        if (createRelease) {
          console.log(`attempt to ${actionText} release for tag ${versionTag} against ${process.env.GITHUB_SHA}`)
          await octokit.rest.repos.createRelease({
            owner:  github.context.payload.repository.owner.login,
            repo: github.context.payload.repository.name,
            tag_name: versionTag,
          })
        }
      }
      console.log(`${actionText} version tag ${versionTag} against ${process.env.GITHUB_SHA}`)
    }

    if (createMajorVersionTag === true) {
      const versionTag = process.env.VERSION_TAG_MAJOR
      if (versionTag === undefined) {
        throw new Error("no major version tag found in the environment, did you run the frozengoats/github-actions/version action?")
      }

      if (onParentBranch) {
        try {
          console.log(`attempting to create major version tag ${versionTag} against ${process.env.GITHUB_SHA}`)
          await octokit.rest.git.createRef({
            owner:  github.context.payload.repository.owner.login,
            repo: github.context.payload.repository.name,
            ref: `refs/tags/${versionTag}`,
            sha: process.env.GITHUB_SHA,
          })
          console.log(`created major version tag ${versionTag} against ${process.env.GITHUB_SHA}`)
        } catch(error) {
          console.log(`version tag ${versionTag} already exists, attempting to update`)
          await octokit.rest.git.updateRef({
            owner:  github.context.payload.repository.owner.login,
            repo: github.context.payload.repository.name,
            ref: `tags/${versionTag}`,
            sha: process.env.GITHUB_SHA,
          })
          console.log(`updated major version tag ${versionTag} against ${process.env.GITHUB_SHA}`)
        }
      } else {
        console.log(`preview major version tag ${versionTag} against ${process.env.GITHUB_SHA}`)
      }
    }

    if (updateBaseTag === true && onParentBranch) {
      await octokit.rest.git.updateRef({
        owner:  github.context.payload.repository.owner.login,
        repo: github.context.payload.repository.name,
        ref: `tags/${baseTag}`,
        sha: process.env.GITHUB_SHA,
      })
      console.log(`updated base tag ${baseTag} against ${process.env.GITHUB_SHA}`)
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

action();