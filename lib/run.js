const getConfig = require('probot-config')
const compareVersions = require('compare-versions')
const hashUrl = require('./hash-url')

module.exports = async ({ robot, context, configName }) => {
  const config = await getConfig(context, configName) || {}
  let { asset, tap, template, branches } = config
  const [ owner, repo, path ] = (tap && tap.split('/')) || []

  if (!branches) {
    branches = ['master']
  }

  if (!owner || !repo || !path || !template) {
    robot.log(`No valid config found`)
    return
  }

  if (context.event === 'push') {
    const branch = context.payload.ref.replace(/^refs\/heads\//, '')
    if (branches.indexOf(branch) === -1) {
      robot.log(`Ignoring push. ${branch} is not one of: ${branches.join(', ')}`)
      return
    }
  }

  let releases = await context.github.paginate(
    context.github.repos.getReleases(context.repo()),
    res => res.data
  )

  releases = releases
    .filter(r => !r.draft)
    .sort((r1, r2) => compareVersions(r2.tag_name, r1.tag_name))

  if (releases.length === 0) {
    robot.log(`No releases found`)
    return
  }

  let renderedTemplate = template
    .replace('$REPO_DESCRIPTION', context.payload.repository.description)
    .replace('$REPO_WEBSITE', context.payload.repository.website || context.payload.repository.url)

  const latest = releases.filter(r => !r.prerelease)[0]
  const latestPre = releases.filter(r => r.prerelease)[0]

  if (latest) {
    renderedTemplate = renderedTemplate
      .replace('$STABLE_VERSION', latest.tag_name)
  }

  if (latestPre) {
    renderedTemplate = renderedTemplate
      .replace('$DEVEL_VERSION', latestPre.tag_name)
  }

  if (asset) {
    if (latest) {
      const stableAsset = latest.assets.find(a => a.name === asset)

      if (stableAsset) {
        const url = stableAsset.browser_download_url
        robot.log(`Calculating hash for ${url}`)
        renderedTemplate = renderedTemplate
          .replace('$STABLE_URL', url)
          .replace('$STABLE_SHA256', await hashUrl({ url }))
      }
    }

    if (latestPre) {
      const develAsset = latestPre.assets.find(a => a.name === asset)

      if (develAsset) {
        const url = develAsset.browser_download_url
        robot.log(`Calculating hash for ${url}`)
        renderedTemplate = renderedTemplate
          .replace('$DEVEL_URL', url)
          .replace('$DEVEL_SHA256', await hashUrl({ url }))
      }
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
