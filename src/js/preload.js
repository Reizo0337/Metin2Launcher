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
  minimizeWindow: () => ipcRenderer.send('minimize')
})
