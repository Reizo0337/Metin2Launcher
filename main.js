const { app, BrowserWindow, ipcMain, shell, Notification } = require('electron')
const path = require('path')
const { logInit } = require('./src/js/workers/updater.js')
const { fetchNews } = require('./src/js/news.js')
const { checkOrInstallGame } = require('./src/js/workers/installer.js')
const { checkServerLoad } = require('./src/js/workers/serverChecker.js')
const { SERVER_NAME } = require('./src/js/commonDefines.js')

let win

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

ipcMain.handle('open-external', (event, url) => {
  shell.openExternal(url)
})
