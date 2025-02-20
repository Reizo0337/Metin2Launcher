const fs = require('fs');
const path = require('path');
const { PATCHER_CONFIG_FILE } = require('../commonDefines.js');

function loadConfig() {
  // 4the moment only getting gamePath 'cause no need to stack nothing more.
  try{
    if (!fs.existsSync(PATCHER_CONFIG_FILE)) {
      return { gamePath: '' };
    }
    const configContent = fs.readFileSync(PATCHER_CONFIG_FILE, 'utf8').trim();
    if (!configContent) {
      return { gamePath: '' };
    }
    return JSON.parse(configContent);;
  }
  catch (error) {
    return { gamePath: '' };
  }
}

function getGameFolder() {
  const config = loadConfig();
  return config.gamePath;
}

module.exports = { getGameFolder, loadConfig };
