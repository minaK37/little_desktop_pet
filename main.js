const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 300,
        height: 300,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        resizable: false,
        hasShadow: false,
        webPreferences: {
            preload: path.join(__dirname, 'js/preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });
    mainWindow.webContents.openDevTools({ mode: 'detach' });

    mainWindow.loadFile('index.html');
});

// メニュー
ipcMain.on('show-context-menu', (event) => {
    const template = [
        {
            label: '表示サイズ - 小',
            click: () => {
                mainWindow.setMinimumSize(0, 0);
                mainWindow.setMaximumSize(10000, 10000);
                mainWindow.setSize(150, 150);
                mainWindow.setMinimumSize(150, 150);
            }
        },
        {
            label: '表示サイズ - 中',
            click: () => {
                mainWindow.setMinimumSize(0, 0);
                mainWindow.setMaximumSize(10000, 10000);
                mainWindow.setSize(300, 300);
                mainWindow.setMinimumSize(300, 300);
            }
        },
        {
            label: '表示サイズ - 大',
            click: () => { mainWindow.setSize(500, 500); }
        },
        { type: 'separator' },
        {
            label: 'アプリを終了',
            click: () => { app.quit(); }
        },
        {
            label: '開発者ツール',
            click: () => { mainWindow.webContents.openDevTools({ mode: 'detach' }); }
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    menu.popup({ window: mainWindow });
});

// ×ボタン
ipcMain.on('close-app', (event) => {
    app.quit();
});

// ドラッグイベント
ipcMain.handle('get-window-bounds', () => {
    return mainWindow.getBounds();
});

ipcMain.on('move-window', (event, { x, y }) => {
    const bounds = mainWindow.getBounds();
    if (typeof x === 'number' && typeof y === 'number') {
        mainWindow.setBounds({
            x,
            y,
            width: bounds.width,
            height: bounds.height
        });
    }
});