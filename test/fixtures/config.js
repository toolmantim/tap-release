module.exports = {
  data: {
    content: Buffer.from(`
      asset: file.zip
      tap: toolmantim/homebrew-tap-bot-test-project-tap/some-tool.rb
      template: >
        class TestTool < Formula
          homepage "https://github.com/toolmantim/bksr"
          url "\${STABLE_URL}"
          version "\${STABLE_VERSION}"
          sha256 "\${STABLE_SHA256}"
      
          def install
            prefix.install "bksr-macos.zip"
          end
        end
    `).toString('base64')
  }
}
