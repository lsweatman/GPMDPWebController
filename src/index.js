/* var path = require('path');
var electron  = require('electron');*/

const electron = require('electron');
const path = require('path');
const url = require('url');

const BrowserWindow = electron.BrowserWindow;
const app = electron.app;

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    transparent: true,
    frame: false,
    toolbar: false
  });
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, '/static/index.html'),
    protocol: 'file:',
    slashes: true
  }));
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
});
