const { DEFAULT_GAME_FOLDER, PATCHER_CONFIG_FILE, SERVER_NAME } = require('../commonDefines.js')
const { downloadPatchList } = require('./updater.js')
const { loadConfig } = require('./loadPatchConfig.js');

console.log(downloadPatchList);
const fs = require('fs')
const path = require('path')
const { dialog } = require('electron')

let GAME_FOLDER = DEFAULT_GAME_FOLDER

function isGameInstalled() {
  return fs.existsSync(path.join(GAME_FOLDER, 'metin2release.exe'))
}

function isFirstInstall() {
  // check if already installed
  return!isGameInstalled() && fs.existsSync(PATCHER_CONFIG_FILE)
}

module.exports = {
  isFirstInstall
}
