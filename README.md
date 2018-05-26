<h1 align="center">
  <img src="design/logo.svg" alt="Brew Bot Logo" width="300" />
</h1>

<p align="center">Automatically update Homebrew taps when you publish new releases to GitHub. Built with <a href="https://github.com/probot/probot">Probot</a>.</p>

## Usage

After installing the Brew Bot GitHub App, add a `.github/brew-bot.yml` file to the repository where you create new releases. For example:

```yml
asset: app.zip
tap: org/homebrew-app/app.rb
template: >
  class App < Formula
    homepage "https://github.com/org/app"
    version "$STABLE_VERSION"
    url "$STABLE_ASSET_URL"
    sha256 "$STABLE_ASSET_SHA256"

    def install
      prefix.install "app"
    end
  end
```

Whenever a new release containing a `app.zip` asset is published, Brew Bot will regenerate the tap’s formula file using the template.

## Template variables

You can use any of the following variables in your formula template, and they'll be substituted when the tap is regenerated:

|Variable|Description|
|-|-|
|`$STABLE_VERSION`|The tag name of the latest stable release.|
|`$STABLE_ASSET_URL`|The download URL of the asset from the latest stable release.|
|`$STABLE_ASSET_SHA256`|The SHA256 of the asset from the latest stable release.|
|`$DEVEL_VERSION`|The tag name of the latest pre-release.|
|`$DEVEL_ASSET_URL`|The download URL of the asset from the latest pre-release.|
|`$DEVEL_ASSET_SHA256`|The SHA256 of the asset from the latest pre-release.|

## Configuration options

You can configure Brew Bot using the following key in your `.github/brew-bot.yml` file:

|Key|Required|Description|Example|
|-|-|-|-|
|`asset`|Required|Filename of the asset to use from the release.|<pre><code>asset: app.zip</code></pre>|
|`tap`|Required|The path to the Homebrew tap repository that should be updated.|<pre><code>tap: org/homebrew-app/app.rb</code></pre>|
|`template`|Required|The template string to use to generate the tap. Use [variables](#variables) to insert the values from the releases.|<pre><code>template: ><br>  class App < Formula<br>    version "${STABLE_VERSION}"<br>    url "${STABLE_ASSET_URL}"<br    sha256 "${STABLE_ASSET_SHA256}"<br>end</code>|
|`branches`|Optional|A list of branches that trigger the tap to be updated when the `.github/brew-bot.yml` file is modified. Useful if you want to test the bot on a pull request branch. Default is `"master"`.|<pre><code>branches:<br>  - master<br>  - add-brew-bot</code></pre>|

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