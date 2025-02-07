const { DEFAULT_GAME_FOLDER, PATCHER_CONFIG_FILE, SERVER_NAME } = require('./commonDefines.js')
const { downloadPatchList } = require('./updater.js')
const fs = require('fs')
const path = require('path')
const { dialog } = require('electron')

let GAME_FOLDER = DEFAULT_GAME_FOLDER

function ensureConfigFile () {
  const configDir = path.dirname(PATCHER_CONFIG_FILE)

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true })
  }

  if (!fs.existsSync(PATCHER_CONFIG_FILE)) {
    console.log('Config file does not exist, creating it...')
    fs.writeFileSync(PATCHER_CONFIG_FILE, JSON.stringify({ gamePath: '' }, null, 2), 'utf8')
  }
}
function loadConfig () {
  ensureConfigFile()
  return JSON.parse(fs.readFileSync(PATCHER_CONFIG_FILE, 'utf8'))
}

function saveConfig (data) {
  fs.writeFileSync(PATCHER_CONFIG_FILE, JSON.stringify(data, null, 2), 'utf8')
}

function loadGamePath () {
  const config = loadConfig()
  if (config.gamePath) {
    GAME_FOLDER = config.gamePath
  }
}

function saveGamePath (gamePath) {
  const config = loadConfig()
  config.gamePath = gamePath
  saveConfig(config)
}

async function selectGamePath () {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Select ' + SERVER_NAME + ' Game Folder'
  })

  if (!result.canceled && result.filePaths.length > 0) {
    GAME_FOLDER = result.filePaths[0]
    saveGamePath(GAME_FOLDER)
  }
}

function isGameInstalled () {
  return fs.existsSync(path.join(GAME_FOLDER, 'metin2release.exe'))
}

async function checkOrInstallGame(updateCallback) {
  updateCallback('Loading game path...')
  loadGamePath()
  console.log(GAME_FOLDER)

  if (isGameInstalled()) {
    console.log('Game is already installed at ' + GAME_FOLDER)
    updateCallback('Game is already installed, checking for updates...')

    // check for updates
    try {
      await downloadPatchList(updateCallback)
      updateCallback('Download and installation completed successfully')
    } catch (err) {
      updateCallback('Failed to update: ' + err.message)
    }
    return
  }

  updateCallback('Game not found. Asking user to select game folder...')
  await selectGamePath()

  if (!isGameInstalled()) {
    updateCallback('No game installation found, starting install...')
    try {
      await downloadPatchList(updateCallback)
      updateCallback('Download and installation completed successfully')
    } catch (err) {
      updateCallback('Failed to update: ' + err.message)
    }
  } else {
    updateCallback('Game found at ' + GAME_FOLDER)
  }
}

module.exports = {
  checkOrInstallGame,
  getGameFolder: () => GAME_FOLDER,
  loadConfig
}
