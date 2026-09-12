cask "resursee" do
  arch arm: "aarch64"

  version "0.1.0"
  sha256 "5ea83309e6ce31ff1a165c4b549edf197dc65f7396d3470264f879e965157df3"

  url "https://github.com/JohnDivina/Resursee/releases/download/v#{version}/Resursee_#{version}_#{arch}.dmg"
  name "Resursee"
  desc "Autonomous AI Hub, real-time IoT hardware telemetry, and client productivity toolbox"
  homepage "https://resursee.vercel.app"

  livecheck do
    url :url
    strategy :github_latest
  end

  auto_updates true
  depends_on macos: ">= :big_sur"

  app "Resursee.app"

  zap trash: [
    "~/Library/Application Support/com.resursee.desktop",
    "~/Library/Caches/com.resursee.desktop",
    "~/Library/Preferences/com.resursee.desktop.plist",
    "~/Library/Saved Application State/com.resursee.desktop.savedState",
  ]
end
