const path = require("path");
const electron = require('electron');
const loadDevtool = require('electron-load-devtool');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

app.on('window-all-closed', () => {
  if (process.platform != 'darwin') {
    app.quit();
  }
});

app.on('ready', () => {
  const win = new BrowserWindow({
    width: 480,
    height: 386,
    'node-integration': false,
    //transparent: true,
    //frame: false,
  });

  win.loadURL(`file://${__dirname}/index.html`);

  //win.webContents.openDevTools();

  win.webContents.on('did-finish-load', () => {
  });

  loadDevtool(loadDevtool.REDUX_DEVTOOLS);
  loadDevtool(loadDevtool.REACT_DEVELOPER_TOOLS);
});

app.setPath("appData",  path.join(__dirname, "./.appData"));
app.setPath("userData", path.join(__dirname, "./.userData"));
