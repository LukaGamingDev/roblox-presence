import { app, BrowserWindow, ipcMain } from 'electron'
import { resolve } from 'path'
import axios from 'axios'

declare const MAIN_WINDOW_WEBPACK_ENTRY: string
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string
declare const BACKGROUND_WINDOW_WEBPACK_ENTRY: string

const enableDevtools = true

let win: BrowserWindow
let bgWin: BrowserWindow

if (require('electron-squirrel-startup')) {
    app.quit()
}

const createWindow = (): void => {
    win = new BrowserWindow({
        height: 600,
        width: 800,
        backgroundColor: '#232527',
        show: false,
        webPreferences: {
            contextIsolation: true,
            preload: resolve(MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY)
        }
    })

    win.on('ready-to-show', () => {
        win.show()
    })

    win.setMenuBarVisibility(false)
    win.loadURL(MAIN_WINDOW_WEBPACK_ENTRY)

    bgWin = new BrowserWindow({
        show: false,
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false,
            contextIsolation: false
        }
    })
    bgWin.loadURL(BACKGROUND_WINDOW_WEBPACK_ENTRY)

    if (enableDevtools) {
        const devtools = new BrowserWindow()
        devtools.setMenuBarVisibility(false)
        win.webContents.setDevToolsWebContents(devtools.webContents)
        win.webContents.openDevTools({ mode: 'detach' })
    }
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

ipcMain.on('background-port', (e) => {
    const [port] = e.ports

    console.log('main port')

    bgWin.webContents.postMessage('port', '*', [port])
})

ipcMain.handle('axios-get', async (_, url: string, options: Record<string, unknown>) => {
    const result = await axios.get(url, options)
    return result.data
})

ipcMain.handle('axios-post', async (_, url: string, data: unknown, options: Record<string, unknown>) => {
    const result = await axios.post(url, data, options)
    return result.data
})
