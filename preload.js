const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  startGoogleLogin: () => ipcRenderer.send('start-google-login'),
  onGoogleAuthSuccess: (callback) => {
    ipcRenderer.on('google-auth-success', (event, data) => callback(data));
  }
});