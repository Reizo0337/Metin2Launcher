// comonDefines.js
const path = require('path')

// REIZO GAME LAUNCHER V0.1

// for news.js
const NEWS_URL = 'http://localhost/patcher/news.json'

// for updater.js
const SERVER_URL = 'http://localhost/patcher/'
const UPLOADS_FOLDER = 'uploads/'
const PATCH_LIST_URL = 'http://localhost/patcher/file_list.txt'
const GAME_FOLDER = path.join(__dirname, 'patcher') // for testing purposes after change it to install_path

module.exports = {
  NEWS_URL,
  SERVER_URL,
  UPLOADS_FOLDER,
  PATCH_LIST_URL,
  GAME_FOLDER
}
