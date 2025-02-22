const { app, BrowserWindow, ipcMain, shell, Notification, Tray, Menu, nativeImage, dialog } = require('electron')
const path = require('path')
const { logInit, downloadPatchList } = require('./src/js/workers/updater.js')
const { fetchNews } = require('./src/js/news.js')
const { installGame, isFirstInstall} = require('./src/js/workers/installer.js')
const { checkServerLoad } = require('./src/js/workers/serverChecker.js')
const { SERVER_NAME, GAME_EXE_NAME, PATCHER_CONFIG_FILE } = require('./src/js/commonDefines.js')
const { loadConfig } = require('./src/js/workers/loadPatchConfig.js')
const fs = require('fs')

const squirrel = require('electron-squirrel-startup');

let win
let tray

let isFirstInstalling = isFirstInstall()

if (squirrel) {
  app.quit();
}

function createWindow () {
  if (isFirstInstalling) { 
    win = new BrowserWindow({
      width: 300,
      height: 400,
      frame: false,
      resizable: false,
      icon: path.join(__dirname, 'img/metin2.ico'),
      title: SERVER_NAME,
      fullscreen: false,
      allowfullscreen: false,
      process: false,
      webPreferences: {
        preload: path.join(__dirname, 'src/js/preload.js'),
        nodeIntegration: false,
        contextIsolation: true
      }
    })

    win.loadFile('src/install.html')
  } else { // game already installed
    win = new BrowserWindow({
      width: 1280,
      height: 720,
      frame: false,
      resizable: false,
      icon: path.join(__dirname, 'img/metin2.ico'),
      title: SERVER_NAME,
      fullscreen: false,
      process: false,
      webPreferences: {
        preload: path.join(__dirname, 'src/js/preload.js'),
        nodeIntegration: false,
        contextIsolation: true
      }
    })

		trayIcon = nativeImage.createFromPath(path.join(__dirname, 'img/metin2.ico'))
		trayIcon = trayIcon.resize({ width: 16, height: 16 })
		
		// working on tray
		tray = new Tray(path.join(__dirname, 'img/metin2.ico'))
		const contextMenu = Menu.buildFromTemplate([
			{ icon: trayIcon, label: SERVER_NAME, enabled: false},
			{ type: 'separator' },
			{ label: 'Check for Updates', click: () => { checkUpdates() } },
			{ label: 'Open App', click: () => { win.show() } },
			{ type: 'separator' },
			{ label: 'Website', click: () => {openWebsite()}},
			{ label: 'Discord', click: () => {openDiscord()}},
			{ type: 'separator' },
			{ label: 'Quit', click: () => { 
					tray.destroy() 
					app.exit();
				} 
			}
		])
		tray.setToolTip(SERVER_NAME + ' Launcher')
		tray.setContextMenu(contextMenu)

		tray.on('click', () => {
			win.show()
		})

		win.webContents.on('did-finish-load', () => {
			// In future..4now is just the necessary. Check if the necessary resources are ready 
			// (For example, check if all images have been loaded)
			win.show();
		});
    
    win.loadFile('src/run.html')
  }

	// prevent 2 same window..
	app.on('second-instance', (event, commandLine, workingDirectory) => {
		// Focus the main window or do something else
		if (win) {
			win.show()
			win.focus()
		}
		event.preventDefault()
	});

	if (!app.requestSingleInstanceLock()) {
		app.quit()
	}
	else{
		app.on('ready', createWindow)
	}


  win.on('close', (event) => {
    event.preventDefault()
    win.hide()
  })
  // working on tray

  win.on('closed', () => {
    win = null
  })

  ipcMain.on('update-progress', (event, percent) => {
    win.webContents.send('progress', percent);
  });

  ipcMain.on('install-progress', (event, text) => {
    win.webContents.send('instText', text);
  });
}

app.on('ready', createWindow)

logInit()

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.exit();
  }
})

app.on('installation-complete', () => {
  relaunchAfterInstall()
})

app.on('before-quit', () => {
  if (tray) {
    tray.destroy(); // Make sure tray is destroyed before quitting
  }
  console.log('Application is quitting...');
});

ipcMain.on('news-fetch', async (event) => {
  const updateNews = (message) => {
    event.reply('update-news', message)
  }

  fetchNews()
    .then((news) => {
      event.reply('newsFetch', news)
      updateNews(news)
    })
    .catch((err) => {
      console.error('Failed to fetch news:', err.message)
      event.reply('newsFetch', [])
    })
})

ipcMain.handle('send-notification', (event, notTitle, message) => {
  const notification = new Notification({
    title: notTitle,
    body: message
  })
  notification.show()
})

ipcMain.on('minimize', (event) => {
  const window = event.sender.getOwnerBrowserWindow()
  if (window) window.minimize()
})

ipcMain.on('close', (event) => {
  const window = event.sender.getOwnerBrowserWindow()
  if (window) window.close()
})

ipcMain.on('open-game', (event) => {
  const window = event.sender.getOwnerBrowserWindow()
  if (window) window.close()
  let configFile = loadConfig()
  exeRoute = configFile.gamePath + '/' + GAME_EXE_NAME
  shell.openPath(exeRoute)
})

ipcMain.handle('open-external', (event, url) => {
  shell.openExternal(url)
})

ipcMain.handle('open-folder-dialog', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  return filePaths[0] || null;
});

ipcMain.handle('install-game', (event, installationDirectory) => {
  console.log('Recv install-game command on ' + installationDirectory)
  installGame(installationDirectory)
})

process.on('unhandledRejection', (err, promise) => {
	console.error("Unhandled Rejection at:", promise, "reason:", err);
	// Optional: You can exit the process if needed
	// process.exit(1);
});

ipcMain.on('check-updates', (event) => {
  const updateStatus = (message) => {
    console.log('Status:', message)
    event.reply('update-status', message)
  }

  // fixed callUpdates and CheckServerLoad -- 20/02/2025 -- There was a little bug. 
  (async () => {
	try {
		const serverOK = await checkServerLoad();
		if (!serverOK) {
			updateStatus("Server is not available..");
			return;
		}
	} catch (err) {
		console.error("Error during server check:", err.message);
		updateStatus("Error checking server status");
		return;
	}

	console.log("Checking updates...");
	updateStatus("Starting update check...");

	startUpdating(event)
})();
})

async function startUpdating(event) {
	updateStatus = (message) => {
    console.log('Status:', message)
    event.reply('update-status', message)
  }

	try {
		await downloadPatchList(updateStatus)
		updateStatus("ok");
	} catch (err) {
		if (err.message === "INVALID_GAME_PATH") {
			// set the new game path or get the option to install again.
			try {
				if (await selectNewGamePath() === true){
					startUpdating(event)
				}
				else {
					updateStatus("Game path not found. Please install the game again.");
				}
			} catch (err) {
				console.error("Failed to select new game path:", err.message);
        updateStatus("Error selecting new game path.");
        return;
			}
			
		}
		else{
			console.error("Failed to fetch updates:", err.message);
			updateStatus("Failed to update.");
		}
	}
}

function selectNewGamePath() {
	// create a dialog to select the new game path
	response = dialog.showMessageBoxSync({
		type: 'warning',
    title: `Unanle find the ${SERVER_NAME} path..`,
    message: "Unable to access the Game Path..\nPlease select a new one.. Or you can also install again the game..",
    buttons: ["Select Path", "Install Again"],
		defaultId: 0,
		cancelId: 0
	})

	if (response === 0){
		newGamePath = dialog.showOpenDialogSync({
			title: "Select the Game Path",
			properties: ["openDirectory"],
		})

		if (newGamePath && newGamePath.length > 0) {
			selectedPath = newGamePath[0]
			// check the path if is correct update game again if not tell the user again to select it.
			if (fs.existsSync(selectedPath) && fs.existsSync(path.join(selectedPath, '/' + GAME_EXE_NAME))) {
				console.log("Path is correct")
				// modify patch config json gamePath
				config = { gamePath : loadConfig() }
				config.gamePath = selectedPath
        fs.writeFileSync(PATCHER_CONFIG_FILE, JSON.stringify(config, null, 2))

        return true;
			}
			else{
				console.log("Path is incorrect")
				selectNewGamePath()
				return false;
			}
		}
	}
	else if (response === 1){
		// start installer just delete patcher_config_file and restart app..
		fs.unlinkSync(PATCHER_CONFIG_FILE)
		app.relaunch()
		app.exit()
		return false;
	}
}

// check if app is already running
function isAlreadyRunning() {
	if (!app.requestSingleInstanceLock()) {
		return true;
	}
	return false; 
}

// listeners
