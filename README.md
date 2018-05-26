<h1 align="center">
  <img src="design/logo.svg" alt="Brew Bot Logo" width="300" />
</h1>

<p align="center">Automatically update <a href="https://docs.brew.sh/Taps">Homebrew taps</a> when you publish new releases to GitHub. Built with <a href="https://github.com/probot/probot">Probot</a>.</p>

## Usage

After installing the Brew Bot GitHub App, add a `.github/brew-bot.yml` file to the repository where you create new releases.

For example, given the following `.github/brew-bot.yml` file:

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

If a new release was published (e.g. `v4.2.0`), containing a `app.zip` asset, Brew Bot would update the tap forumla in the `my-org/homebrew-app` repo as follows:

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

You can configure Brew Bot using the following key in your `.github/brew-bot.yml` file:

|Key|Required|Description|
|-|-|-|
|`asset`|Required|Filename of the asset to use from the release.|<pre><code>asset: app.zip</code></pre>|
|`tap`|Required|The path to the Homebrew tap repository that should be updated.|
|`template`|Required|The template string to use to generate the tap. Use [variables](#variables) to insert the values from the releases.|
|`branches`|Optional|A list of branches that trigger the tap to be updated when the `.github/brew-bot.yml` file is modified. Useful if you want to test the bot on a pull request branch. Default is `"master"`.|

Brew Bot also supports [Probot Config](https://github.com/probot/probot-config), if you want to store your configuration files in a central repository.

## Developing

```sh
# Install dependencies
npm install

# Run the tests
npm test

# Run the bot locally
npm start
```

## Contributing

Third-pary contributions are welcome, and encouraged! If you need help or have a question, create a GitHub issue.

## Deployment

If you want to deploy your own copy of Brew Bot, follow the [Probot Deployment Guide](https://probot.github.io/docs/deployment/).
