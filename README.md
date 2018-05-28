<h1 align="center">
  <img src="design/logo.svg" alt="Tap Release Logo" width="400" />
</h1>

<p align="center">Automatically update <a href="https://docs.brew.sh/Taps">Homebrew taps</a> when you publish new releases to GitHub. Built with <a href="https://github.com/probot/probot">Probot</a>.</p>

---

<p align="center"><a href="https://github.com/apps/tap-release"><img src="design/install-button.svg" alt="Install the GitHub App" /></a></p>

---

## Usage

Firstly you’ll need to install the [Tap Release GitHub App](https://github.com/apps/tap-release). This listens out for any releases, or any changes to the configuration.

Secondarly, you add a `.github/tap-release.yml` configuration file to whichver repository has the releases you want to use when updating the tap.

For example, given the following `.github/tap-release.yml` file in a `my-org/app/app.rb` repository:

```yml
asset: app.zip
tap: my-org/homebrew-app/app.rb
template: >
  class App < Formula
    desc     "$REPO_DESCRIPTION"
    homepage "$REPO_WEBITE"
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
  desc     "The best app ever."
  homepage "https://github.com/my-org/app"
  version  "v2.4.0"
  url      "https://github.com/my-org/app/releases/download/v4.2.0/app.zip"
  sha256   "f3832d8966dd39f7ae1316195ebb379cf18aece281bc2f7c43dd799130ebf460"

  def install
    prefix.install "app"
  end
end
```

## Template variables

You can use any of the following variables in your formula template, and they'll be substituted when the tap is regenerated:

|Variable|Description|
|-|-|
|`$REPO_DESCRIPTION`|GitHub repository description.|
|`$REPO_WEBSITE`|GitHub repository website, or URL if there isn't one.|
|`$STABLE_VERSION`|Tag name of the latest stable release.|
|`$STABLE_ASSET_URL`|Download URL of the asset from the latest stable release.|
|`$STABLE_ASSET_SHA256`|SHA256 of the asset from the latest stable release.|
|`$DEVEL_VERSION`|Tag name of the latest pre-release.|
|`$DEVEL_ASSET_URL`|Wownload URL of the asset from the latest pre-release.|
|`$DEVEL_ASSET_SHA256`|SHA256 of the asset from the latest pre-release.|

## Configuration options

You can configure Tap Release using the following key in your `.github/tap-release.yml` file:

|Key|Required|Description|
|-|-|-|
|`asset`|Required|Filename of the asset to use from the release.|<pre><code>asset: app.zip</code></pre>|
|`tap`|Required|The path to the Homebrew tap repository that should be updated.|
|`template`|Required|The template string to use to generate the tap. Use [variables](#variables) to insert the values from the releases.|
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
