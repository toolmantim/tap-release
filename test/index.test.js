const { createRobot } = require('probot')
const app = require('../index')
const payload = require('./fixtures/release')
const draftPayload = require('./fixtures/release-draft')

describe('homebrew-tap-release-bot', () => {
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
              tap: toolmantim/homebrew-tap-release-bot-test-project-tap/some-tool.rb
              template: >
                class TestTool < Formula
                  homepage "https://github.com/toolmantim/bksr"
                  url "\${STABLE_URL}"
                  version "\${STABLE_VERSION}"
                  sha256 "\${STABLE_SHA256}"
              
                  def install
                    prefix.install "giphy.gif"
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
        repo: 'homebrew-tap-release-bot-test-project',
        path: '.github/homebrew-tap-release.yml'
      })
    })
  })

  describe('with a draft release', () => {
    it('ignores it', async () => {
      await robot.receive({ event: 'release', payload: draftPayload })

      expect(github.repos.getContent).toBeCalledWith({
        owner: 'toolmantim',
        repo: 'homebrew-tap-release-bot-test-project',
        path: '.github/homebrew-tap-release.yml'
      })
    })
  })

  describe('with a config', () => {
    it('does something', async () => {
      await robot.receive({ event: 'release', payload })

      expect(github.repos.getContent).toBeCalledWith({
        owner: 'toolmantim',
        repo: 'homebrew-tap-release-bot-test-project',
        path: '.github/homebrew-tap-release.yml'
      })
    })
  })
})
