const { app, BrowserWindow, Menu, Tray, shell, dialog, nativeImage } = require('electron');
const path = require('path');
let mainWindow, tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200, height: 800, minWidth: 800, minHeight: 600,
    title: 'Mundo Sin Gluten', icon: path.join(__dirname, 'assets', 'icon.png'),
    backgroundColor: '#F5F6FA', show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), nodeIntegration: false, contextIsolation: true },
  });
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  mainWindow.on('close', (e) => { if (!app.isQuitting) { e.preventDefault(); mainWindow.hide(); } });
}

app.whenReady().then(() => {
  createWindow();
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'App', submenu: [
      { label: 'Recargar', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.reload() },
      { type: 'separator' },
      { label: 'Salir', accelerator: 'CmdOrCtrl+Q', click: () => { app.isQuitting = true; app.quit(); } },
    ]},
    { label: 'Ver', submenu: [
      { label: 'Zoom +', accelerator: 'CmdOrCtrl+=', click: () => mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() + 0.5) },
      { label: 'Zoom -', accelerator: 'CmdOrCtrl+-', click: () => mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() - 0.5) },
      { label: 'Pantalla completa', accelerator: 'F11', click: () => mainWindow.setFullScreen(!mainWindow.isFullScreen()) },
    ]},
  ]));
  try {
    tray = new Tray(nativeImage.createFromPath(path.join(__dirname, 'assets', 'icon-256.png')).resize({ width: 16, height: 16 }));
    tray.setToolTip('Mundo Sin Gluten');
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: 'Abrir', click: () => mainWindow.show() },
      { label: 'Salir', click: () => { app.isQuitting = true; app.quit(); } },
    ]));
    tray.on('click', () => mainWindow.show());
  } catch (e) {}
});
app.on('activate', () => { if (mainWindow) mainWindow.show(); });
app.on('window-all-closed', () => {});
