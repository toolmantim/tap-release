module.exports = robot => {
  robot.on('release.published', async context => {
    const { payload: { release: { tag_name: tagName, draft, assets } } } = context

    robot.log(tagName, draft, assets)

    if (draft) {
      robot.log(`Ignoring draft release`)
      return
    }
  })
}
