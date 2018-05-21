const { createRobot } = require('probot')
const app = require('../index')
const payload = require('./fixtures/release')
const draftPayload = require('./fixtures/release-draft')

describe('homebrew-tap-bot', () => {
  let robot
  let github

  beforeEach(() => {
    robot = createRobot({})
    app(robot)

    github = {
      repos: {
        getContent: jest.fn().mockReturnValueOnce(Promise.resolve({
          data: {
            content: Buffer.from(`
              asset: file.zip
              tap: toolmantim/homebrew-tap-bot-test-project-tap/some-tool.rb
              template: >
                class TestTool < Formula
                  homepage "https://github.com/toolmantim/bksr"
                  url "\${STABLE_URL}"
                  version "\${STABLE_VERSION}"
                  sha256 "\${STABLE_SHA256}"
              
                  def install
                    prefix.install "bksr-macos.zip"
                  end
                end
            `).toString('base64')
          }
        }))
      }
    }

    robot.auth = () => Promise.resolve(github)
  })

  describe('without a config', () => {
    beforeEach(() => {
      const notFoundError = new Error('Not found')
      notFoundError.code = 404
      github.repos.getContent = jest.fn().mockReturnValueOnce(Promise.reject(notFoundError))
    })

    it('does nothing', async () => {
      await robot.receive({ event: 'release', payload })

      expect(github.repos.getContent).toBeCalledWith({
        owner: 'toolmantim',
        repo: 'homebrew-tap-bot-test-project',
        path: '.github/homebrew-tap-release.yml'
      })
    })
  })

  describe('with a draft release', () => {
    it('ignores it', async () => {
      await robot.receive({ event: 'release', payload: draftPayload })

      expect(github.repos.getContent).toBeCalledWith({
        owner: 'toolmantim',
        repo: 'homebrew-tap-bot-test-project',
        path: '.github/homebrew-tap-release.yml'
      })
    })
  })

  describe('with a config', () => {
    it('does something', async () => {
      await robot.receive({ event: 'release', payload })

      expect(github.repos.getContent).toBeCalledWith({
        owner: 'toolmantim',
        repo: 'homebrew-tap-bot-test-project',
        path: '.github/homebrew-tap-release.yml'
      })
    })
  })
})
