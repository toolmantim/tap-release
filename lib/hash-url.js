const crypto = require('crypto')
const request = require('request')

module.exports = async ({ url }) => {
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
