module.exports = ({ app, context, message, info }) => {
  const repo = context.payload.repository
  const prefix = repo ? `${repo.owner.login}/${repo.owner.name}: ` : ''
  const logString = `${prefix}${message}`

  if (info) {
    app.log(logString, info)
  } else {
    app.log(logString)
  }
}
