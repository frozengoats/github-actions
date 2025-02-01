const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('node:fs');
const path = require('node:path');

const tomlKeySplitter = new RegExp(/^(\w+)\s*=\s*(.+)$/g)
const sectionMatcher = new RegExp(/^\s*\[+([^\]]+)]+\s*$/g)

async function action() {
  try {
    let workingDir = core.getInput('working-directory')
    if (workingDir == '') {
      workingDir = process.env.GITHUB_WORKSPACE
    }

    const filename = core.getInput('filename')
    const fullPath = path.normalize(path.join(workingDir, filename))

    if (!fs.existsSync(fullPath)) {
      throw new Error(`unable to locate version file ${fullPath}`)
    }

    let data = fs.readFileSync(fullPath)
    let dataString = data.toString('utf8')
    dataString = dataString.trim()

    const parts = fullPath.split(".")
    const extension = parts[parts.length - 1]
    let version = undefined

    if (extension === "json") {
      const jsonKey = core.getInput('json-key')
      if (jsonKey === '') {
        throw new Error("json-key was not specified with json file type")
      }

      const jsonKeyParts = jsonKey.split(".")
      let jsonBody = JSON.parse(dataString)
      for (let jsonKey of jsonKeyParts) {
        jsonBody = jsonBody[jsonKey]
        if (jsonBody === undefined) {
          throw new Error(`could not locate json sub-key: ${jsonKey}`)
        }
      }

      version = jsonBody.toString()
    } else if (extension === "toml") {
      let curSection = undefined
      const section = core.getInput('toml-section')
      if (section === '') {
        throw new Error("toml-section was not specified with toml file type")
      }
      const key = core.getInput('toml-key')
      if (key === '') {
        throw new Error("toml-key was not specified with toml file type")
      }

      const lines = dataString.split("\n")
      for (let line of lines) {
        if (curSection !== section) {
          const matches = [...line.matchAll(sectionMatcher)]
          if (matches.length !== 0) {
            curSection = matches[0][1].trim()
            continue
          }
        }

        const matches = [...line.matchAll(tomlKeySplitter)]
        if (matches.length === 0) {
          continue
        }

        if (matches[0][1].trim() === key) {
          version = matches[0][2].trim()
          break
        }
      }
    } else {
      // no known format, just return the first line
      const lines = dataString.split("\n")
      version = lines[0].trim()
    }

    if (version === undefined) {
      throw new Error(`unable to determine version from file ${fullPath}`)
    }

    if (version.startsWith('"') && version.endsWith('"')) {
      version = version.substring(1, version.length - 1);
    }

    const commitSha = process.env.GITHUB_SHA
    const shortSha = commitSha.substring(0, 10)
    const branch = process.env.GITHUB_REF.replace("refs/heads/", "")

    const commitVersion = `${version}.dev.${shortSha}`
    const branchVersion = `${version}.dev.${branch}`
    const timestampVersion = `${version}.dev${Math.floor(new Date().getTime() / 1000)}`
    const versionTag = `${core.getInput('tag-prefix')}${version}`
    const versionTagMajor = `${core.getInput('tag-prefix')}${version.split(".")[0]}`

    const githubToken = core.getInput('github-token')
    const octokit = github.getOctokit(githubToken)

    let versionTagExists = false
    try {
      await octokit.rest.checks.listForRef({
        owner:  github.context.payload.repository.owner.login,
        repo: github.context.payload.repository.name,
        ref: `tags/${versionTag}`,
      })
      versionTagExists = true
    } catch (error) {
      // no problem here, the tag is not supposed to exist
    }

    if (versionTagExists === true) {
      throw new Error("this version already exists, please increment the version")
    }

    core.setOutput('version', version)
    core.setOutput('version-commit', commitVersion)
    core.setOutput('version-branch', branchVersion)
    core.setOutput('version-timestamp', timestampVersion)
    core.setOutput('version-tag', versionTag)
    core.setOutput('version-tag-major', versionTagMajor)

    core.exportVariable('VERSION', version);
    core.exportVariable('VERSION_COMMIT', commitVersion);
    core.exportVariable('VERSION_BRANCH', branchVersion);
    core.exportVariable('VERSION_TIMESTAMP', timestampVersion);
    core.exportVariable('VERSION_TAG', versionTag);
    core.exportVariable('VERSION_TAG_MAJOR', versionTagMajor);
  } catch (error) {
    core.setFailed(error.message);
  }
}

action();