const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Exclude @clerk/express temp directories from Metro's watcher
// These temp dirs are created/removed by the server package and cause ENOENT errors
config.resolver.blockList = [
  /node_modules\/.pnpm\/@clerk\+express[^/]*\/node_modules\/@clerk\/express_tmp_.*/,
];

module.exports = config;
