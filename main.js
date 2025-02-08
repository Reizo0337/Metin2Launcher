const { app, BrowserWindow, ipcMain, shell, Notification, Tray, Menu, nativeImage} = require('electron')
const path = require('path')
const { logInit } = require('./src/js/workers/updater.js')
const { fetchNews } = require('./src/js/news.js')
const { checkOrInstallGame } = require('./src/js/workers/installer.js')
const { checkServerLoad } = require('./src/js/workers/serverChecker.js')
const { SERVER_NAME } = require('./src/js/commonDefines.js')

let win
let tray

function createWindow () {
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
}

app.on('ready', createWindow)
logInit()
// loadConfig()

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

// listeners
ipcMain.on('check-updates', (event) => {
  const updateStatus = (message) => {
    console.log('Status:', message)
    event.reply('update-status', message)
  }
  ( async () => {
    const serverOK = await checkServerLoad()
    if (!serverOK) {
      updateStatus('Error: Server not responding')
      // return
    }
    else {
      console.log('serverOK')
      checkOrInstallGame(updateStatus).then(() => {
        updateStatus('ok')
      }) .catch((err) => {
        updateStatus('Error: ' + err.message)
      })
    }
  })()
})

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

ipcMain.handle('open-external', (event, url) => {
  shell.openExternal(url)
})
// listeners
