const { URL } = require('url')
const crypto = require('crypto')
const fs = require('fs')
const nock = require('nock')

const mockError = (code) => {
  const err = new Error('Not found')
  err.code = code
  throw err
}

const encodeContent = (content) => {
  return Buffer.from(content).toString('base64')
}

const decodeContent = (content) => {
  return Buffer.from(content, 'base64').toString('ascii')
}

const mockContent = (content) => {
  return Promise.resolve({
    data: {
      content: Buffer.from(content).toString('base64'),
      sha: crypto.createHash('sha1').update(content).digest('hex')
    }
  })
}

const mockConfig = (yamlFilePath) => {
  return mockContent(fs.readFileSync(`${__dirname}/../fixtures/${yamlFilePath}`))
}

const mockDownloadRedirect = (assetUrl, assetContents) => {
  const url = new URL(assetUrl)

  // GitHub asset downloads to a 302 to the real download URL
  nock(`${url.protocol}//${url.host}`)
    .get(url.pathname)
    .reply(302, 'Redirect', { 'Location': 'https://some.server/download' })

  nock('https://some.server')
    .get('/download')
    .reply(200, assetContents)
}

module.exports = {
  mockError,
  encodeContent,
  decodeContent,
  mockContent,
  mockConfig,
  mockDownloadRedirect
}
