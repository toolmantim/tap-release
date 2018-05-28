const nock = require('nock')
const { createRobot } = require('probot')
const { fn } = jest

const { mockError, mockConfig, mockDownloadRedirect, decodeContent, mockContent } = require('./helpers/mock-responses')
const app = require('../index')

nock.disableNetConnect()

describe('tap-release-bot', () => {
  let robot
  let github

  beforeEach(() => {
    robot = createRobot({})
    app(robot)

    github = {
      // Basic mocks, so we can perform `.not.toHaveBeenCalled()` assertions
      repos: {
        getContent: fn(),
        getReleases: fn(),
        updateFile: fn()
      },
      paginate: fn().mockImplementation((promise, fn) => promise.then(fn))
    }

    robot.auth = () => Promise.resolve(github)
  })

  describe('release', () => {
    describe('without a config', () => {
      it('does nothing', async () => {
        github.repos.getContent = fn().mockImplementationOnce(() => mockError(404))
        await robot.receive({ event: 'release', payload: require('./fixtures/release') })
        expect(github.repos.updateFile).not.toHaveBeenCalled()
      })
    })

    describe('with a config', () => {
      describe('with no releases', () => {
        it('does nothing', async () => {
          github.repos.getContent = fn().mockReturnValueOnce(mockConfig('config.yml'))
          github.repos.getReleases = fn().mockReturnValueOnce(Promise.resolve({ data: [] }))
          await robot.receive({ event: 'release', payload: require('./fixtures/release') })
          expect(github.repos.updateFile).not.toHaveBeenCalled()
        })
      })

      describe('with a draft release', () => {
        it('does nothing', async () => {
          github.repos.getContent = fn().mockReturnValueOnce(mockConfig('config.yml'))
          github.repos.getReleases = fn().mockReturnValueOnce(Promise.resolve({
            data: [ require('./fixtures/release-draft').release ]
          }))
          await robot.receive({ event: 'release', payload: require('./fixtures/release') })
          expect(github.repos.updateFile).not.toHaveBeenCalled()
        })
      })

      describe('with a release', () => {
        it('updates the tap with the latest release', async () => {
          const release = require('./fixtures/release').release
          const oldRelease = require('./fixtures/release-old-version').release

          github.repos.getContent = fn()
            .mockReturnValueOnce(mockConfig('config.yml'))
            .mockReturnValueOnce(mockContent('Previous tool.rb content'))
          github.repos.getReleases = fn().mockReturnValueOnce(Promise.resolve({ data: [ oldRelease, release ] }))

          mockDownloadRedirect(release.assets[0].browser_download_url, 'Asset Contents')

          await robot.receive({ event: 'release', payload: require('./fixtures/release') })

          const [ [ updateCall ] ] = github.repos.updateFile.mock.calls
          expect(decodeContent(updateCall.content)).toBe(`class TestTool < Formula
  homepage "https://github.com/toolmantim/tap-release-test-project"
  desc "What a project"

  stable do
    url "https://github.com/toolmantim/tap-release-test-project/releases/download/v1.0.2/giphy.gif"
    version "v1.0.2"
    sha256 "f37fb1777c7a4f92563f0ada49f738804ff4776cde43d2f6bb819d31a169dd7b"
  end

  devel do
    url "$DEVEL_URL"
    version "$DEVEL_VERSION"
    sha256 "$DEVEL_SHA256"
  end
end
`)
          expect(github.repos.updateFile).toBeCalledWith(
            expect.objectContaining({
              'message': 'Updated tool.rb formula',
              'owner': 'org',
              'path': 'tool.rb',
              'repo': 'repo',
              'sha': '65890df7c8cbbbe01cabd746139dba8dd5e5aa84'
            })
          )
        })
      })

      describe('with a pre-release', () => {
        it('updates the tap', async () => {
          const release = require('./fixtures/release-prerelease').release

          github.repos.getContent = fn()
            .mockReturnValueOnce(mockConfig('config.yml'))
            .mockReturnValueOnce(mockContent('Previous tool.rb content'))
          github.repos.getReleases = fn().mockReturnValueOnce(Promise.resolve({ data: [ release ] }))

          mockDownloadRedirect(release.assets[0].browser_download_url, 'Asset Contents')

          await robot.receive({ event: 'release', payload: require('./fixtures/release-prerelease') })

          const [ [ updateCall ] ] = github.repos.updateFile.mock.calls
          expect(decodeContent(updateCall.content)).toBe(`class TestTool < Formula
  homepage "https://github.com/toolmantim/tap-release-test-project"
  desc "What a project"

  stable do
    url "$STABLE_URL"
    version "$STABLE_VERSION"
    sha256 "$STABLE_SHA256"
  end

  devel do
    url "https://github.com/toolmantim/tap-release-test-project/releases/download/v2.0.0-beta/giphy.gif"
    version "v2.0.0-beta"
    sha256 "f37fb1777c7a4f92563f0ada49f738804ff4776cde43d2f6bb819d31a169dd7b"
  end
end
`)
          expect(github.repos.updateFile).toBeCalledWith(
            expect.objectContaining({
              'message': 'Updated tool.rb formula',
              'owner': 'org',
              'path': 'tool.rb',
              'repo': 'repo',
              'sha': '65890df7c8cbbbe01cabd746139dba8dd5e5aa84'
            })
          )
        })
      })
    })
  })

  describe('push', () => {
    describe('to a non-config file', () => {
      it('does nothing', async () => {
        github.repos.getContent = fn().mockReturnValueOnce(mockConfig('config.yml'))
        await robot.receive({ event: 'push', payload: require('./fixtures/push-unrelated-change') })
        expect(github.repos.updateFile).not.toHaveBeenCalled()
      })
    })

    describe('to a non-master branch', () => {
      it('does nothing', async () => {
        github.repos.getContent = fn().mockReturnValueOnce(mockConfig('config.yml'))
        await robot.receive({ event: 'push', payload: require('./fixtures/push-non-master-branch') })
        expect(github.repos.updateFile).not.toHaveBeenCalled()
      })

      describe('when configured with the branch', () => {
        it('updates the tap', async () => {
          const release = require('./fixtures/release').release

          github.repos.getContent = fn()
            .mockReturnValueOnce(mockConfig('config-with-non-master-branch.yml'))
            .mockReturnValueOnce(mockContent('Previous tool.rb content'))
          github.repos.getReleases = fn().mockReturnValueOnce(Promise.resolve({ data: [ release ] }))

          mockDownloadRedirect(release.assets[0].browser_download_url, 'Asset Contents')

          await robot.receive({ event: 'push', payload: require('./fixtures/push-non-master-branch') })

          const [ [ updateCall ] ] = github.repos.updateFile.mock.calls
          expect(decodeContent(updateCall.content)).toBe('A template')
          expect(github.repos.updateFile).toBeCalledWith(
            expect.objectContaining({
              'message': 'Updated tool.rb formula',
              'owner': 'org',
              'path': 'tool.rb',
              'repo': 'repo',
              'sha': '65890df7c8cbbbe01cabd746139dba8dd5e5aa84'
            })
          )
        })
      })
    })

    describe('modifying .github/tap-release.yml', () => {
      it('updates the tap', async () => {
        const release = require('./fixtures/release').release

        github.repos.getContent = fn()
          .mockReturnValueOnce(mockConfig('config.yml'))
          .mockReturnValueOnce(mockContent('Previous tool.rb content'))
        github.repos.getReleases = fn().mockReturnValueOnce(Promise.resolve({ data: [ release ] }))

        mockDownloadRedirect(release.assets[0].browser_download_url, 'Asset Contents')

        await robot.receive({ event: 'push', payload: require('./fixtures/push-config-change') })

        const [ [ updateCall ] ] = github.repos.updateFile.mock.calls
        expect(decodeContent(updateCall.content)).toBe(`class TestTool < Formula
  homepage "https://github.com/toolmantim/tap-release-test-project"
  desc "What a project"

  stable do
    url "https://github.com/toolmantim/tap-release-test-project/releases/download/v1.0.2/giphy.gif"
    version "v1.0.2"
    sha256 "f37fb1777c7a4f92563f0ada49f738804ff4776cde43d2f6bb819d31a169dd7b"
  end

  devel do
    url "$DEVEL_URL"
    version "$DEVEL_VERSION"
    sha256 "$DEVEL_SHA256"
  end
end
`)
        expect(github.repos.updateFile).toBeCalledWith(
          expect.objectContaining({
            'message': 'Updated tool.rb formula',
            'owner': 'org',
            'path': 'tool.rb',
            'repo': 'repo',
            'sha': '65890df7c8cbbbe01cabd746139dba8dd5e5aa84'
          })
        )
      })
    })
  })
})
