// Keeps the server out of the app bundle entirely: its code, and more to the
// point its native dependencies, have no business on a phone.
const path = require('node:path');

const { getDefaultConfig } = require('expo/metro-config');
const escape = require('escape-string-regexp');

const config = getDefaultConfig(__dirname);
const server = path.resolve(__dirname, 'server');

config.resolver.blockList = [new RegExp(`^${escape(server)}[\\\\/].*$`)];

module.exports = config;
