const compareVersions = require('compare-versions')
const hashUrl = require('./hash-url')

module.exports = async ({ robot, context, configName }) => {
  const { asset, tap, template } = await context.config(configName, {})
  const [ owner, repo, path ] = (tap && tap.split('/')) || []

  if (!asset || !owner || !repo || !path || !template) {
    robot.log(`No valid config found`)
    return
  }

  let releases = await context.github.paginate(
    context.github.repos.getReleases(context.repo()),
    res => res.data
  )

  releases = releases
    .filter(r => !r.draft)
    .sort((r1, r2) => compareVersions(r2.tag_name, r1.tag_name))

  const latest = releases.filter(r => !r.prerelease)[0]
  const stableAsset = latest && latest.assets.find(a => a.name === asset)

  const latestPre = releases.filter(r => r.prerelease)[0]
  const develAsset = latestPre && latestPre.assets.find(a => a.name === asset)

  let renderedTemplate = template

  if (!stableAsset && !develAsset) {
    robot.log(`No stable or devel assets found in any releases`)
    return
  }

  if (stableAsset) {
    renderedTemplate = renderedTemplate
      .replace(`\${STABLE_VERSION}`, stableAsset.tag_name)
      .replace(`\${STABLE_URL}`, stableAsset.browser_download_url)
      .replace(`\${STABLE_SHA256}`, await hashUrl(stableAsset.browser_download_url))
  }

  if (develAsset) {
    renderedTemplate = renderedTemplate
      .replace(`\${DEVEL_VERSION}`, develAsset.tag_name)
      .replace(`\${DEVEL_URL}`, develAsset.browser_download_url)
      .replace(`\${DEVEL_SHA256}`, await hashUrl(develAsset.browser_download_url))
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
