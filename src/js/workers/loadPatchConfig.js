const fs = require('fs');
const path = require('path');
const { DEFAULT_GAME_FOLDER, PATCHER_CONFIG_FILE } = require('../commonDefines.js');

let GAME_FOLDER = DEFAULT_GAME_FOLDER;

function loadConfig() {
  // 4the moment only getting gamePath 'cause no need to stack nothing more.
  try {
    if (fs.existsSync(PATCHER_CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(PATCHER_CONFIG_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error reading config file:', error);
  }
  return { gamePath: '' };
}

function getGameFolder() {
  const config = loadConfig();
  return config.gamePath || GAME_FOLDER;
}

module.exports = { getGameFolder, loadConfig };
