const { DEFAULT_GAME_FOLDER, PATCHER_CONFIG_FILE, SERVER_NAME } = require('../commonDefines.js')
const { downloadPatchList } = require('./updater.js')
console.log(downloadPatchList);
const fs = require('fs')
const path = require('path')
const { dialog } = require('electron')

let GAME_FOLDER = DEFAULT_GAME_FOLDER

function ensureConfigFile() {
  const configDir = path.dirname(PATCHER_CONFIG_FILE)

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true })
  }

  if (!fs.existsSync(PATCHER_CONFIG_FILE)) {
    console.log('Config file does not exist, creating it...')
    saveConfig({ gamePath: '' })
  }
}

function loadConfig() {
  ensureConfigFile()
  try {
    const configData = fs.readFileSync(PATCHER_CONFIG_FILE, 'utf8')
    return JSON.parse(configData)
  } catch (error) {
    console.error('Error reading config file:', error)
    return { gamePath: '' }
  }
}

function saveConfig(data) {
  try {
    fs.writeFileSync(PATCHER_CONFIG_FILE, JSON.stringify(data, null, 2), 'utf8')
  } catch (error) {
    console.error('Failed to save config file:', error)
  }
}

function loadGamePath() {
  const config = loadConfig()
  if (config.gamePath && fs.existsSync(config.gamePath)) {
    GAME_FOLDER = config.gamePath
  } else {
    console.warn('Invalid or missing game path in config. Using default.')
  }
}

function saveGamePath(gamePath) {
  const config = loadConfig()
  config.gamePath = gamePath
  saveConfig(config)
}

async function selectGamePath() {
  await dialog.showMessageBox({
    type: 'info',
    buttons: ['OK'],
    title: `${SERVER_NAME} Folder Not Found`,
    message: `The default ${SERVER_NAME} folder could not be found. Please select the game folder manually.`
  })

  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: `Select ${SERVER_NAME} Game Folder`
  })

  if (!result.canceled && result.filePaths.length > 0) {
    const selectedPath = result.filePaths[0]
    if (fs.existsSync(path.join(selectedPath, 'metin2release.exe'))) {
      GAME_FOLDER = selectedPath
      saveGamePath(selectedPath)
      return true
    } else {
      await dialog.showMessageBox({
        type: 'error',
        buttons: ['OK'],
        title: 'Invalid Folder',
        message: 'The selected folder does not contain a valid game installation. Please try again.'
      })
      return false
    }
  }
  return false
}

function isGameInstalled() {
  return fs.existsSync(path.join(GAME_FOLDER, 'metin2release.exe'))
}

async function checkOrInstallGame(updateCallback) {
  updateCallback('Loading game path...')
  loadGamePath()
  console.log('Checking game folder:', GAME_FOLDER)

  if (isGameInstalled()) {
    console.log(`Game found at ${GAME_FOLDER}`)
    updateCallback('Game is already installed, checking for updates...')

    try {
      await downloadPatchList(updateCallback)
      updateCallback('Download and installation completed successfully')
    } catch (err) {
      console.error('Update failed:', err)
      updateCallback(`Failed to update: ${err.message}`)
    }
    return
  }

  updateCallback('Game not found. Asking user to select game folder...')
  const folderSelected = await selectGamePath()

  if (!folderSelected) {
    updateCallback('Game installation was not completed.')
    return
  }

  updateCallback('Starting installation...')
  try {
    await downloadPatchList(updateCallback)
    updateCallback('Download and installation completed successfully')
  } catch (err) {
    console.error('Installation failed:', err)
    updateCallback(`Failed to update: ${err.message}`)
  }
}

module.exports = {
  checkOrInstallGame,
  getGameFolder: () => GAME_FOLDER,
  loadConfig
}
