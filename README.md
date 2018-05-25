<h1 align="center">
  <img src="design/logo.svg" alt="Brew Bot Logo" width="300" />
</h1>

<p align="center">Automatically update Homebrew taps when you publish new releases. Built with <a href="https://github.com/probot/probot">Probot</a>.</p>

## Usage

Once you’ve installed the Brew Bot GitHub App, add a `.github/brew-bot.yml` file to the repository which creates the releases. For example:

```yml
asset: app.zip
tap: org/homebrew-app/app.rb
template: >
  class MyTool < Formula
    homepage "https://github.com/org/app"
    url "\${STABLE_URL}"
    version "\${STABLE_VERSION}"
    sha256 "\${STABLE_SHA256}"

    def install
      prefix.install "app"
    end
  end
```

Whenever a new release containing a `app.zip` asset is published, Brew Bot will regenerate the tap’s formula file using the template.

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