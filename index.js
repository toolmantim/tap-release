const run = require('./lib/run')
const log = require('./lib/log')
const configName = 'tap-release.yml'

module.exports = app => {
  app.on('release', async context => {
    await run({ app, context, configName })
  })

  app.on('push', async context => {
    const configPath = `.github/${configName}`

    if (context.payload.commits.some(commit => (
      commit.added.includes(configPath) ||
      commit.removed.includes(configPath) ||
      commit.modified.includes(configPath)
    ))) {
      await run({ app, context, configName })
    } else {
      log({ app, context, message: `Ignoring push that didn't modify ${configPath}` })
    }
  })
}
