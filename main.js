const { app, BrowserWindow, ipcMain, shell, Notification } = require('electron')
const path = require('path')
const { downloadPatchList, logInit } = require('./src/js/updater.js')
const { fetchNews } = require('./src/js/news.js')

let win

function createWindow () {
  win = new BrowserWindow({
    width: 1280,
    height: 720,
    frame: false,
    resizable: false,
    icon: path.join(__dirname, 'img/metin2.ico'),
    title: 'Reizo Game Launcher',
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
  console.log('Checking updates')

  const updateStatus = (message) => {
    console.log('Status:', message)
    event.reply('update-status', message)
  }

  // updateStatus('Starting update check...')

  downloadPatchList(updateStatus)
    .then(() => {
      updateStatus('ok')
    })
    .catch((err) => {
      updateStatus('Failed to update: ' + err.message)
    })
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

logInit()
