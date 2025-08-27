const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const configPath = path.join(app.getPath('userData'), 'window_config.json');
function loadConfig() {
    try {
        return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch (e) {
        return {};
    }
}
function saveConfig(config) {
    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

let mainWindow;

app.on('ready', () => {
    const config = loadConfig();
    mainWindow = new BrowserWindow({
        x: config.x ?? undefined,
        y: config.y ?? undefined,
        width: config.width ?? 300,
        height: config.height ?? 300,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        resizable: false,
        hasShadow: false,
        webPreferences: {
            preload: path.join(__dirname, 'js','preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
        },        
    });
    mainWindow.loadFile('index.html');

    mainWindow.on('close', () => {
        const bounds = mainWindow.getBounds();
        saveConfig(bounds);
    });
    
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

ipcMain.on('move-window', (event, { x, y, width, height }) => {
    mainWindow.setBounds({
        x,
        y,
        width,
        height
    });
});
