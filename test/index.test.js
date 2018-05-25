const { createRobot } = require('probot')
const app = require('../index')
const config = require('./fixtures/config')
const payload = require('./fixtures/release')

describe('brew-bot', () => {
  let robot
  let github

  beforeEach(() => {
    robot = createRobot({})
    app(robot)

    // Default mock values containing no data
    github = {
      repos: {
        getContent: jest.fn().mockImplementationOnce(() => {
          const notFoundError = new Error('Not found')
          notFoundError.code = 404
          return Promise.reject(notFoundError)
        }),
        getReleases: jest.fn().mockReturnValueOnce(Promise.resolve({
          data: []
        })),
        updateFile: jest.fn()
      },
      // This makes a paginate mock return the data given, similar to the
      // original implementation
      paginate: jest.fn().mockImplementation((promise, fn) => promise.then(fn))
    }

    robot.auth = () => Promise.resolve(github)
  })

  describe('release', () => {
    describe('without a config', () => {
      it('does nothing', async () => {
        await robot.receive({ event: 'release', payload })

        expect(github.repos.getContent).toBeCalledWith({
          owner: 'toolmantim',
          repo: 'homebrew-tap-bot-test-project',
          path: '.github/brew-bot.yml'
        })

        expect(github.repos.getReleases).not.toHaveBeenCalled()
        expect(github.repos.updateFile).not.toHaveBeenCalled()
      })
    })

    describe('with a config', () => {
      describe('with no releases', () => {
        it('does nothing', async () => {
          github.repos.getContent = jest.fn().mockReturnValueOnce(Promise.resolve(config))

          await robot.receive({ event: 'release', payload })

          expect(github.repos.getContent).toBeCalledWith({
            owner: 'toolmantim',
            repo: 'homebrew-tap-bot-test-project',
            path: '.github/brew-bot.yml'
          })

          expect(github.repos.getReleases).toHaveBeenCalled()
          expect(github.repos.updateFile).not.toHaveBeenCalled()
        })
      })
      // TODO: with a draft release, does nothing
      // TODO: with a release, updates the formula's stable
      // TODO: with a prerelease, updates the formula's devel
    })
  })
})
