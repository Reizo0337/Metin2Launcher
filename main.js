const { app, BrowserWindow, ipcMain, shell, Notification, Tray, Menu, nativeImage, dialog } = require('electron')
const path = require('path')
const { logInit } = require('./src/js/workers/updater.js')
const { fetchNews } = require('./src/js/news.js')
const { installGame, isFirstInstall} = require('./src/js/workers/installer.js')
const { checkServerLoad } = require('./src/js/workers/serverChecker.js')
const { SERVER_NAME, GAME_EXE_NAME } = require('./src/js/commonDefines.js')

let win
let tray

let isFirstInstalling = isFirstInstall()

function createWindow () {
  if (!isFirstInstalling) { 
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
    
    win.loadFile('src/run.html')
  }

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
        app.quit() 
      } 
    }
  ])
  tray.setToolTip(SERVER_NAME + ' Launcher')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    win.show()
  })
  
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
    app.quit()
  }
})

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
})

function relaunchAfterInstall () {
  console.log('Installation complete, relauching app to updater...');
  app.relaunch()
  app.quit()
}

app.on('installation-complete', () => {
  relaunchAfterInstall()
})

// listeners
// ipcMain.on('check-updates', (event) => {
//   const updateStatus = (message) => {
//     console.log('Status:', message)
//     event.reply('update-status', message)
//   }
//   ( async () => {
//     const serverOK = await checkServerLoad()
//     if (!serverOK) {
//       updateStatus('Error: Server not responding')
//       // return
//     }
//     else {
//       console.log('serverOK')
//       checkOrInstallGame(updateStatus).then(() => {
//         updateStatus('ok')
//       }) .catch((err) => {
//         updateStatus('Error: ' + err.message)
//       })
//     }
//   })()
// })

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
  let exeRoute = getGameFolder()
  exeRoute = exeRoute.gamePath + '/' + GAME_EXE_NAME
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
// listeners
