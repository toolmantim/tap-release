<h1 align="center">
  <img src="design/logo.svg" alt="Tap Release Logo" width="400" />
</h1>

<p align="center">Automatically update <a href="https://docs.brew.sh/Taps">Homebrew taps</a> when you publish new releases to GitHub. Built with <a href="https://github.com/probot/probot">Probot</a>.</p>

---

<p align="center"><a href="https://github.com/apps/tap-release"><img src="design/install-button.svg" alt="Install the GitHub App" /></a></p>

---

[![NPM package](https://img.shields.io/npm/v/tap-release-github-app.svg)](https://www.npmjs.com/package/tap-release-github-app)

## Usage

Firstly, you’ll need to install the [Tap Release GitHub App](https://github.com/apps/tap-release). This listens out for any releases, or any changes to the configuration.

Then, add a `.github/tap-release.yml` configuration file to the GitHub repository where you publish new releases to.

For example, given the following `.github/tap-release.yml` file in a `my-org/app/app.rb` repository:

```yml
asset: app.zip
tap: my-org/homebrew-app/app.rb
template: |
  class App < Formula
    desc     "$REPO_DESCRIPTION"
    homepage "$REPO_WEBSITE"
    version  "$STABLE_VERSION"
    url      "$STABLE_ASSET_URL"
    sha256   "$STABLE_ASSET_SHA256"

    def install
      prefix.install "app"
    end
  end
```

When a new release is published to `my-org/app` (e.g. `v4.2.0`), containing a `app.zip` asset, Tap Release would push a commit to the tap formula in the `my-org/homebrew-app` repository updating it to:

```rb
class App < Formula
  desc     "The best app ever"
  homepage "https://github.com/my-org/app"
  version  "v2.4.0"
  url      "https://github.com/my-org/app/releases/download/v4.2.0/app.zip"
  sha256   "f3832d8966dd39f7ae1316195ebb379cf18aece281bc2f7c43dd799130ebf460"

  def install
    prefix.install "app"
  end
end
```

If you don't use release assets, you can also just use a URL pattern. For example, given the following template for a [Node style tap](https://docs.brew.sh/Node-for-Formula-Authors):

```yml
url: "https://registry.npmjs.org/app/-/app-$VERSION_NUMBER.tgz"
tap: my-org/homebrew-app/app.rb
template: |
  class App < Formula
    desc     "$REPO_DESCRIPTION"
    homepage "$REPO_WEBSITE"
    version  "$STABLE_VERSION"
    url      "$STABLE_ASSET_URL"
    sha256   "$STABLE_ASSET_SHA256"

    # ...
  end
```

When a new release is published (e.g. `v4.2.0`), Tap Release would push a commit to the tap formula in the `my-org/homebrew-app` repository updating it to:

```rb
class App < Formula
  desc     "The best app ever"
  homepage "https://github.com/my-org/app"
  version  "v4.2.0"
  url      "https://registry.npmjs.org/app/-/app-4.2.0.tgz"
  sha256   "f3832d8966dd39f7ae1316195ebb379cf18aece281bc2f7c43dd799130ebf460"

  # ...
end
```

## Template variables

You can use any of the following variables in your formula template, and they'll be substituted when the tap is regenerated:

|Variable|Description|
|-|-|
|`$REPO_DESCRIPTION`|GitHub repository description.|
|`$REPO_WEBSITE`|GitHub repository website, or URL if there isn't one.|
|`$STABLE_VERSION`|Tag name of the latest stable release (e.g. `v1.0.2`).|
|`$STABLE_VERSION_NUMBER`|Tag name of the latest stable release, without any preceding `v` (e.g. `1.0.2`).|
|`$STABLE_ASSET_URL`|Download URL of the asset from the latest stable release.|
|`$STABLE_ASSET_SHA256`|SHA256 of the asset from the latest stable release.|
|`$DEVEL_VERSION`|Tag name of the latest pre-release (e.g. `v2.0.0-beta.1`).|
|`$DEVEL_VERSION_NUMBER`|Tag name of the latest pre-release, without any preceding `v` (e.g. `2.0.0-beta.1`).|
|`$DEVEL_ASSET_URL`|Download URL of the asset from the latest pre-release.|
|`$DEVEL_ASSET_SHA256`|SHA256 of the asset from the latest pre-release.|

## Asset & URL variables

You can use any of the following variables in the `asset` and `url` options, and they'll be substituted for each stable and development release when searching for assets or generating URLs:

|Variable|Description|
|-|-|
|`$VERSION`|The version (e.g. `v1.0.2`).|
|`$VERSION_NUMBER`|The version without the preceding `v` (e.g. `1.0.2`).|

## Configuration options

You can configure Tap Release using the following key in your `.github/tap-release.yml` file:

|Key|Required|Description|
|-|-|-|
|`tap`|Required|The path to the Homebrew tap repository that should be updated.|
|`template`|Required|The template string to use to generate the tap. Use [variables](#variables) to insert the values from the releases.|
|`asset`|Optional|Filename of the asset to use from the release.|
|`url`|Optional|URL pattern to generate the download URLs. Use [URL variables](#url-variables) to insert the values from the release.|
|`branches`|Optional|A list of branches that trigger the tap to be updated when the `.github/tap-release.yml` file is modified. Useful if you want to test the app on a pull request branch. Default is `"master"`.|

Tap Release also supports [Probot Config](https://github.com/probot/probot-config), if you want to store your configuration files in a central repository.

## Developing

If you have Node v8+ installed locally, you can run the tests, and a local app, using the following commands:

```sh
# Install dependencies
yarn

# Run the tests
npm test

# Run the app locally
npm start
```

If you don't have Node installed, you can use [Docker Compose](https://docs.docker.com/compose/):

```sh
# Run the tests
docker-compose run --rm app npm test
```

## Contributing

Third-pary contributions are welcome! 🙏🏼 See [CONTRIBUTING.md](CONTRIBUTING.md) for step-by-step instructions.

If you need help or have a question, let me know via a GitHub issue.

## Deployment

If you want to deploy your own copy of Tap Release, follow the [Probot Deployment Guide](https://probot.github.io/docs/deployment/).

## Releasing

Run the following command:

```bash
git checkout master && git pull && npm version [major | minor | patch]
```

The command does the following:

* Ensures you’re on master and don't have local, un-commited changes
* Bumps the version number in [package.json](package.json) based on major, minor or patch
* Runs the `postversion` npm script in [package.json](package.json), which:
  * Pushes the tag to GitHub
  * Publishes the npm release
  * Opens the GitHub releases page so you can publish the release notes
