// comonDefines.js
const path = require('path')
const os = require('os')

// REIZO GAME LAUNCHER V0.1

// for news.js
const NEWS_URL = 'http://localhost/patcher/news.json'

// for serverChecker.js
const MAX_NUMBER_OF_RETRIES = 3
const TIME_BETWEEN_RETRIES = 30000 // 30 seconds

// for updater.js
const SERVER_NAME = 'SAPPHIRE2'
const GAME_EXE_NAME = 'Metin2Release.exe'
const SERVER_URL = 'http://localhost/patcher/'
const PATCH_LIST_URL = 'http://localhost/patcher/file_list.txt'
const UPLOADS_FOLDER = 'uploads/'
const DEFAULT_GAME_FOLDER = path.join(os.homedir(), 'AppData', 'Roaming', SERVER_NAME)
const PATCHER_PATH_LOG = path.join(os.homedir(), 'AppData', 'Roaming', SERVER_NAME + '/dev/')
const PATCHER_CONFIG_FILE = path.join(os.homedir(), 'AppData', 'Roaming', SERVER_NAME + '/dev/patch_config.json') // storing in %appdata%

// for installer.js
const ZIP_NAME = SERVER_NAME + '.zip'
const INSTALLER_URL = 'http://localhost/patcher/installation/' + ZIP_NAME

// testing
const ENABLE_PARALLEL_DOWNLOADS = true
const MAX_CONCURRENT_DOWNLOADS = 3 // it can be more if better internet connection **NOTE FOR REIZO** Should I check if user have good internet connection, and amply it auto?
// testing 

module.exports = {
  NEWS_URL,
  SERVER_URL,
  UPLOADS_FOLDER,
  PATCH_LIST_URL,
  DEFAULT_GAME_FOLDER,
  PATCHER_CONFIG_FILE,
  SERVER_NAME,
  ENABLE_PARALLEL_DOWNLOADS,
  MAX_CONCURRENT_DOWNLOADS,
  GAME_EXE_NAME,
  PATCHER_PATH_LOG,
  INSTALLER_URL
}
