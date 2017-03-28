/*var path = require('path');
var electron  = require('electron');*/

var electron = require('electron');
var path = require('path');
var url = require('url');

var BrowserWindow = electron.BrowserWindow;
var app = electron.app;

app.on('window-all-closed', function() {
  if (process.platform != 'darwin') {
	app.quit();
  }
});

app.on('ready', function() {
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
	mainWindow.on('closed', function() {
		mainWindow = null;
  });
});