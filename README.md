<h1 align="center">
  <img src="design/logo.svg" alt="Brew Bot Logo" width="300" />
</h1>

<p align="center">Automatically update your Homebrew tap whenever you cut a new release. Built with <a href="https://github.com/probot/probot">probot</a></p>

## Usage

Once you’ve installed the Brew Bot GitHub App, add a `.github/brew-bot.yml` file to the repository which creates the releases. For example:

```yml
asset: my-tool.zip
tap: my-org/homebrew-my-tool/my-rool.rb
template: >
  class MyTool < Formula
    homepage "https://github.com/my-org/my-tool"
    url "\${STABLE_URL}"
    version "\${STABLE_VERSION}"
    sha256 "\${STABLE_SHA256}"

    def install
      prefix.install "my-tool"
    end
  end
```

Whenever a new release containing a my-tool.zip asset is published to GitHub, the given tap will be updated based on the template given.

## Developing

```sh
# Install dependencies
npm install

# Run the tests
npm test

# Run the bot
npm start
```

## License

See [LICENSE.md]