const configPath = '.github/homebrew-tap-release.yml'

const compareVersions = require('compare-versions')

module.exports = robot => {
  const run = async context => {
    const { asset, tap, template } = await context.config('homebrew-tap-release.yml', {})
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

    console.log({ latestStable, latestPrerelease })

    // TODO: gsub the following
    //   $STABLE_URL
    //   $STABLE_VERSION
    //   $STABLE_SHA256
    //   $DEVEL_URL
    //   $DEVEL_VERSION
    //   $DEVEL_SHA256

    robot.log(`Updating ${owner}/${repo}/${path}`)

    const existingFile = await context.github.repos.getContent({ owner, repo, path })

    await context.github.repos.updateFile({
      owner,
      repo,
      path,
      message: `Updated ${path} formula`,
      content: Buffer.from(template).toString('base64'),
      sha: existingFile.data.sha
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
