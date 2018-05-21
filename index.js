const configName = 'homebrew-release.yml'
const configPath = `.github/${configName}`

const crypto = require('crypto')
const compareVersions = require('compare-versions')
const request = require('request')

module.exports = robot => {
  const urlHash = (url) => {
    robot.log(`Calculating sha256 hash of ${url}`)
    return new Promise((resolve, reject) =>
      request
        .get(url)
        .on('error', reject)
        .pipe(crypto.createHash('sha256').setEncoding('hex'))
        .once('finish', function () {
          resolve(this.read())
        })
    )
  }

  const updateTemplate = async (template, prefix, version, url) => (
    template
      .replace(`\${${prefix}_VERSION}`, version)
      .replace(`\${${prefix}_URL}`, url)
      .replace(`\${${prefix}_SHA256}`, await urlHash(url))
  )

  const run = async context => {
    const { asset, tap, template } = await context.config(configName, {})
    const [ owner, repo, path ] = tap && tap.split('/')

    if (!asset || !owner || !repo || !path || !template) {
      robot.log(`No valid config found in ${configPath}`)
      return
    }

    const releases =
      (await context.github.paginate(
        context.github.repos.getReleases(context.repo()),
        res => res.data))
      .filter(release => !release.draft)
      .sort((r1, r2) => (compareVersions(r2.tag_name, r1.tag_name)))

    const latestStable = releases.filter(release => !release.prerelease)[0]
    const latestPrerelease = releases.filter(release => release.prerelease)[0]

    let renderedTemplate = template

    if (latestStable) {
      const stableAsset = latestStable.assets.find(a => a.name === asset)
      if (stableAsset) {
        renderedTemplate = await updateTemplate(renderedTemplate, 'STABLE', latestStable.tag_name, stableAsset.browser_download_url)
      }
    }

    if (latestPrerelease) {
      const prereleaseAsset = latestPrerelease.assets.find(a => a.name === asset)
      if (prereleaseAsset) {
        renderedTemplate = await updateTemplate(renderedTemplate, 'DEVEL', latestPrerelease.tag_name, prereleaseAsset.browser_download_url)
      }
    }

    robot.log(`Updating ${owner}/${repo}/${path}`)

    await context.github.repos.updateFile({
      owner,
      repo,
      path,
      message: `Updated ${path} formula`,
      content: Buffer.from(renderedTemplate).toString('base64'),
      sha: (await context.github.repos.getContent({ owner, repo, path })).data.sha
    })

    robot.log(`Updated ${owner}/${repo}/${path}`)
  }

  robot.on('release', run)

  robot.on('push', async context => {
    if (context.payload.commits.some(commit => (
      commit.added.includes(configPath) ||
      commit.removed.includes(configPath) ||
      commit.modified.includes(configPath)
    ))) {
      return run(context)
    } else {
      robot.log(`Ignoring push that didn't modify ${configPath}`)
    }
  })
}
