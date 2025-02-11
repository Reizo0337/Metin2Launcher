const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  checkUpdates: () => ipcRenderer.send('check-updates'),
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', (_event, message) => callback(message)),
  // newsThing
  newsFetch: () => ipcRenderer.send('news-fetch'),
  onUpdateNews: (callback) => ipcRenderer.on('update-news', (_event, news) => callback(news)),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  // newsThing
  sendNotification: (notTitle, message, callback) => {
    ipcRenderer.invoke('send-notification', notTitle, message)
      .then(() => {
        callback(notTitle, message)
      })
      .catch((error) => {
        console.error('Error sending notification:', error)
      })
  },
  // close / minimize thing
  closeWindow: () => ipcRenderer.send('close'),
  minimizeWindow: () => ipcRenderer.send('minimize'),
  
  // openGame
  openGame: () => ipcRenderer.send('open-game'),

  //install
  selectFolder: () => ipcRenderer.invoke('open-folder-dialog'),
  backInstallGame: (installationDirectory) => ipcRenderer.invoke('install-game', installationDirectory),
  onProgress: (callback) => ipcRenderer.on('progress', (_event, progress) => callback(progress)),
  sendProgress: (percent) => ipcRenderer.send('update-progress', percent),
  onInstallationProgress: (callback) => ipcRenderer.on('instText', (_event, progress) => callback(progress)),
  sendInstallationProgress: (text) => ipcRenderer.send('install-progress', text),
  restartAppAfterInstall: () => ipcRenderer.send('installation-complete')
})
