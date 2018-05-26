const fs = require('fs')
const { createRobot } = require('probot')
const app = require('../index')

const mockError = (code) => {
  const err = new Error('Not found')
  err.code = code
  throw err
}

const mockConfig = (yamlFilePath) => {
  const config = fs.readFileSync(`${__dirname}/fixtures/${yamlFilePath}`)
  return Promise.resolve({
    data: {
      content: Buffer.from(config).toString('base64')
    }
  })
}

describe('brew-bot', () => {
  let robot
  let github

  beforeEach(() => {
    robot = createRobot({})
    app(robot)

    // Default mock values containing no data
    github = {
      repos: {
        getContent: jest.fn().mockImplementationOnce(() => mockError(404)),
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
        await robot.receive({ event: 'release', payload: require('./fixtures/release') })

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
          github.repos.getContent = jest.fn().mockImplementationOnce(() => mockConfig('config.yml'))

          await robot.receive({ event: 'release', payload: require('./fixtures/release') })

          expect(github.repos.getContent).toBeCalledWith({
            owner: 'toolmantim',
            repo: 'homebrew-tap-bot-test-project',
            path: '.github/brew-bot.yml'
          })
          expect(github.repos.getReleases).toHaveBeenCalled()
          expect(github.repos.updateFile).not.toHaveBeenCalled()
        })
      })

      describe('with no releases', () => {
        it('does nothing', async () => {
          github.repos.getContent = jest.fn().mockImplementationOnce(() => mockConfig('config.yml'))

          await robot.receive({ event: 'release', payload: require('./fixtures/release') })

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

  describe('push', () => {
    describe('to a non-config file', () => {
      it('does nothing', async () => {
        await robot.receive({ event: 'push', payload: require('./fixtures/push-unrelated-change') })

        expect(github.repos.getContent).not.toHaveBeenCalled()
        expect(github.repos.getReleases).not.toHaveBeenCalled()
        expect(github.repos.updateFile).not.toHaveBeenCalled()
      })
    })

    describe('to a non-master branch', () => {
      it('does nothing', async () => {
        await robot.receive({ event: 'push', payload: require('./fixtures/push-non-master-branch') })

        expect(github.repos.getContent).toBeCalledWith({
          owner: 'toolmantim',
          repo: 'homebrew-tap-bot-test-project',
          path: '.github/brew-bot.yml'
        })
        expect(github.repos.getReleases).not.toHaveBeenCalled()
        expect(github.repos.updateFile).not.toHaveBeenCalled()
      })

      describe('when configured with the branch', () => {
        it('updates the tap', async () => {
          github.repos.getContent = jest.fn().mockImplementationOnce(() => mockConfig('config-with-non-master-branch.yml'))

          await robot.receive({ event: 'push', payload: require('./fixtures/push-non-master-branch') })

          expect(github.repos.getContent).toBeCalledWith({
            owner: 'toolmantim',
            repo: 'homebrew-tap-bot-test-project',
            path: '.github/brew-bot.yml'
          })
          expect(github.repos.getReleases).toHaveBeenCalled()
          expect(github.repos.updateFile).not.toHaveBeenCalled()
        })
      })
    })

    describe('modifying .github/brew-bot.yml', () => {
      it('updates the tap', async () => {
        await robot.receive({ event: 'push', payload: require('./fixtures/push-config-change') })

        expect(github.repos.getContent).toBeCalledWith({
          owner: 'toolmantim',
          repo: 'homebrew-tap-bot-test-project',
          path: '.github/brew-bot.yml'
        })
        expect(github.repos.getReleases).not.toHaveBeenCalled()
        expect(github.repos.updateFile).not.toHaveBeenCalled()
      })
    })
  })
})
