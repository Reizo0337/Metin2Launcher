const { DEFAULT_GAME_FOLDER, PATCHER_CONFIG_FILE, INSTALLER_URL } = require('../commonDefines.js')
const { loadConfig } = require('./loadPatchConfig.js')
const unzipper = require('unzipper');
const fs = require('fs')
const path = require('path')
const { dialog, ipcMain, app } = require('electron')
const http = require('http')
const https = require('https')

function isGameInstalled(gamePath) {
  return fs.existsSync(path.join(gamePath, 'metin2release.exe'))
}

function isFirstInstall() {
  if (!fs.existsSync(PATCHER_CONFIG_FILE)) {
	console.log('Didnt find patch configuration file')
    return true;
  }

  try {
    const config = loadConfig();
    if (!config.gamePath || !fs.existsSync(config.gamePath) || !isGameInstalled(config.gamePath)) {
		// if gamePath is empty, then it means that it was installed so ask user if it exists to ubicate it.
		console.log('Could not find game, but alreaady installed cause I found config file')
		return false;
    }
  } catch (error) {
    return true;
  }

  return false;
}

function createPatchConfig(gamePath) {
  const config = { gamePath };

  try {
    const dir = path.dirname(PATCHER_CONFIG_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(PATCHER_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    console.log('Patcher config file created successfully:', PATCHER_CONFIG_FILE);
  } catch (error) {
    console.error('Error writing config file:', error);
  }
}

function checkFolderForInstall(route) {
  return new Promise((resolve) => {
    if (!fs.existsSync(route)) {
      fs.mkdirSync(route);  // Create the folder
      resolve(true);
    } else {
      resolve(false);
    }
  });
}

function installGame(route, overwrite = false) {
  if (route === 'default') {
    route = DEFAULT_GAME_FOLDER;
  }

  checkFolderForInstall(route).then((folderCreated) => {
    if (folderCreated) {
      console.log(`Game folder created at ${route}. Installing game.`);
      fetchGame(route);
    } else {
      // Folder exists, show confirmation dialog to overwrite
      dialog.showMessageBox({
        type: 'warning',
        title: 'Warning',
        message: `Game folder already exists at ${route}.\nDo you want to replace it with the default game folder?`,
        buttons: ['Yes', 'No']
      }).then(result => {
        if (result.response === 0) {  // User clicked "Yes"
          console.log(`Replacing existing folder with default game folder at ${DEFAULT_GAME_FOLDER}`);
          checkFolderForInstall(DEFAULT_GAME_FOLDER).then(() => {
            console.log(`Installing game to default folder at ${DEFAULT_GAME_FOLDER}`);
            fetchGame(route);
          });
        } else {
          console.log('User chose not to replace the existing folder');
        }
      }).catch(err => {
        console.error('Error showing dialog:', err);
      });
    }
  }).catch(err => {
    console.error('Error checking folder existence:', err);
  });
}

function unzipInstallation(routetofile) {
  const fileName = '/tempMetin2.zip';
  const filePath = routetofile + fileName;

  if (!fs.existsSync(filePath)) {
    console.error('Error: Game file not found at:', filePath);
    return;
  }

  ipcMain.emit('install-progress', 0, 'Unzipping Game...');

  console.log('Starting unzipping ZIP file:', filePath);

  const readStream = fs.createReadStream(filePath);
  
  readStream
    .pipe(unzipper.Extract({ path: routetofile }))
    .on('close', () => {
      createPatchConfig(routetofile);
      console.log('Game unzipped successfully.');
      ipcMain.emit('update-progress', 0, 100)
      ipcMain.emit('install-progress', 0, 'Game successfully installed..')
      // wait a bit and restart app
      setTimeout(() => {
        app.relaunch({ args: process.argv.slice(1).concat(['--reset-window']) })
        app.exit(0)
      }, 1000)

      fs.unlink(filePath, (err) => {
        if (err) console.error('Error removing ZIP file:', err);
        else console.log('ZIP file removed successfully.');
      });
    })
    .on('error', (err) => {
      console.error('Error extracting game from ZIP:', err);
    });
}

function fetchGame(route) {
  // Fetch game from the server and save it to the specified folder
  return new Promise((resolve, reject) => {
   
    console.log('Fetching game from server to route:', route);
    fileName = '/tempMetin2.zip'
    const file = fs.createWriteStream(route+fileName)

    const protocol = INSTALLER_URL.startsWith('https') ? https : http;

    protocol.get(INSTALLER_URL, (response) => {
      const totalBytes = parseInt(response.headers['content-length'], 10)
      let downloadedBytes = 0
      
      response.on('data', (chunk) => {
        downloadedBytes += chunk.length
        const percent = Math.floor((downloadedBytes / totalBytes) * 80)

        ipcMain.emit('update-progress', 0, percent)
        if (percent >= 1) {
          ipcMain.emit('install-progress', 0, 'Downloading...')
        }
        else{
          ipcMain.emit('install-progress', 0, 'Starting download..')
        }
      })

      response.pipe(file)

      file.on('finish', () => {
        file.close()
        console.log('Game downloaded successfully.')
        // Unzip the downloaded file
        unzipInstallation(route)
        resolve()
      })

      file.on('error', (err) => {
        fs.unlink(route, () => {})
        console.error('Error downloading game:', err)
        reject(err)
      })
    }).on('error', (err) => {
      fs.unlink(route, () => {})
      console.error('Request error:', err)
      reject(err)
    })
  })
}

module.exports = {
  isFirstInstall,
  installGame,
}
