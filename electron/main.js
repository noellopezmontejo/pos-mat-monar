const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const isDev = false; // Desactivar modo de desarrollo para producción (Cargar dist)

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'PosMatMonar - Punto de Venta'
  })

  if (isDev) {
    win.loadURL('http://localhost:5174')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

ipcMain.on('print-direct', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  win.webContents.print({ 
    silent: true, 
    printBackground: true,
    margins: { marginType: 'none' }
  }, (success, errorType) => {
    if (!success) console.error('Print failed:', errorType)
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
