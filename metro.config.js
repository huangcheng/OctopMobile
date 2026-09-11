const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// react-native-markdown-display → markdown-it requires Node's "punycode".
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  punycode: path.dirname(require.resolve("punycode/package.json")),
};

module.exports = config;
