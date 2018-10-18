const getConfig = require('probot-config')
const compareVersions = require('compare-versions')
const hashUrl = require('./hash-url')
const log = require('./log')

module.exports = async ({ app, context, configName }) => {
  const config = await getConfig(context, configName) || {}
  let { asset, url, tap, template, branches } = config
  const [ owner, repo, path ] = (tap && tap.split('/')) || []

  if (!branches) {
    branches = ['master']
  }

  if (!owner || !repo || !path || !template) {
    log({ app, context, message: `No valid config found` })
    return
  }

  if (context.event === 'push') {
    const branch = context.payload.ref.replace(/^refs\/heads\//, '')
    if (branches.indexOf(branch) === -1) {
      log({ app, context, message: `Ignoring push. ${branch} is not one of: ${branches.join(', ')}` })
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
    log({ app, context, message: `No releases found` })
    return
  }

  let renderedTemplate = template
    .replace('$REPO_DESCRIPTION', context.payload.repository.description)
    .replace('$REPO_WEBSITE', context.payload.repository.website || context.payload.repository.html_url)

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
        const stableUrl = stableAsset.browser_download_url
        log({ app, context, message: `Calculating hash for ${stableUrl}` })
        renderedTemplate = renderedTemplate
          .replace('$STABLE_URL', stableUrl)
          .replace('$STABLE_SHA256', await hashUrl({ url: stableUrl }))
      }
    }

    if (latestPre) {
      const develAsset = latestPre.assets.find(a => a.name === asset)

      if (develAsset) {
        const develUrl = develAsset.browser_download_url
        log({ app, context, message: `Calculating hash for ${develUrl}` })
        renderedTemplate = renderedTemplate
          .replace('$DEVEL_URL', develUrl)
          .replace('$DEVEL_SHA256', await hashUrl({ url: develUrl }))
      }
    }
  }

  if (url) {
    if (latest) {
      const stableUrl = url
        .replace('$VERSION_NUMBER', latest.tag_name.replace(/^v/, ''))
        .replace('$VERSION', latest.tag_name)
      log({ app, context, message: `Calculating hash for ${stableUrl}` })
      renderedTemplate = renderedTemplate
        .replace('$STABLE_URL', stableUrl)
        .replace('$STABLE_SHA256', await hashUrl({ url: stableUrl }))
    }

    if (latestPre) {
      const develUrl = url
        .replace('$VERSION_NUMBER', latestPre.tag_name.replace(/^v/, ''))
        .replace('$VERSION', latestPre.tag_name)
      log({ app, context, message: `Calculating hash for ${develUrl}` })
      renderedTemplate = renderedTemplate
        .replace('$DEVEL_URL', develUrl)
        .replace('$DEVEL_SHA256', await hashUrl({ url: develUrl }))
    }
  }

  log({ app, context, message: `Updating ${owner}/${repo}/${path}`, { renderedTemplate } })

  await context.github.repos.updateFile({
    owner,
    repo,
    path,
    message: `Updated ${path} formula`,
    content: Buffer.from(renderedTemplate).toString('base64'),
    sha: (await context.github.repos.getContent({ owner, repo, path })).data.sha
  })

  log({ app, context, message: `Updated ${owner}/${repo}/${path}` })
}
