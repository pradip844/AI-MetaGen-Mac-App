const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const express = require('express');

let mainWindow;
const PORT = 52341;

// ১. লোকাল এক্সপ্রেস সার্ভার চালু (যাতে প্রোটোকল http:// থাকে)
function startLocalServer() {
  const serverApp = express();
  const srcPath = path.join(__dirname, 'src');

  // src ফোল্ডারের সব ফাইল (HTML, CSS, JS, Images) স্ট্যাটিক ভাবে সার্ভ করা
  serverApp.use(express.static(srcPath));
  serverApp.use(express.json());

  // গুগল লগইন রুট
  serverApp.get('/google-login', (req, res) => {
    res.sendFile(path.join(srcPath, 'google-login.html'));
  });

  // গুগল লগইন ব্যাকএন্ড কলব্যাক রিসিভ
  serverApp.post('/auth-callback', (req, res) => {
    const authData = req.body;
    res.json({ success: true });

    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('google-auth-success', authData);
    }
  });

  serverApp.listen(PORT, 'localhost', () => {
  console.log(`App running locally on http://localhost:${PORT}`);
});
}

// ২. মূল অ্যাপ উইন্ডো তৈরি
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1380,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'AI MetaGen Pro',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  });

  // গুরুত্বপূর্ণ: file:// এর বদলে লোকালহোস্ট URL লোড করা হচ্ছে
  mainWindow.loadURL(`http://localhost:${PORT}/index.html`);

  // বাইরের কোনো লিংক ক্লিক করলে মূল ব্রাউজারে খোলা
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      if (!url.includes(`127.0.0.1:${PORT}`)) {
        shell.openExternal(url);
        return { action: 'deny' };
      }
    }
    return { action: 'allow' };
  });
}

// ৩. গুগল লগইন ট্রিগার
ipcMain.on('start-google-login', () => {
  shell.openExternal(`http://localhost:${PORT}/google-login`);
});

app.whenReady().then(() => {
  startLocalServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});