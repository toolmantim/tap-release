<h1 align="center">
  <img src="design/logo.svg" alt="Brew Bot Logo" width="300" />
</h1>

Automatically update your Homebrew tap whenever you cut a new release.

> Built with [probot](https://github.com/probot/probot)

## Usage

In the repo that creates releases, create a `.github/brew-bot.yml` file:

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

Whenever this file is updated, or a new release is published, the formula will be automatically updated based on the template.

## Developing

```sh
# Install dependencies
npm install

# Run the bot
npm start
```
