const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const windowConfigPath = path.join(app.getPath('userData'), 'window_config.json');
function loadConfig() {
    try {
        return JSON.parse(fs.readFileSync(windowConfigPath, 'utf-8'));
    } catch (e) {
        return { MOVE_RANGE: 1.0 };
    }
}

function saveConfig(newData) {
    const dir = path.dirname(windowConfigPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    let current = {};
    try {
        current = JSON.parse(fs.readFileSync(windowConfigPath, 'utf-8'));
    } catch { }

    const merged = { ...current, ...newData };
    fs.writeFileSync(windowConfigPath, JSON.stringify(merged, null, 2));
    return merged;
}

const configPath = path.join(__dirname, "config", "config.json");
const mainConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

function stopWalking() {
    if (walkInterval) {
        clearInterval(walkInterval);
        walkInterval = null;
    }
}

let mainWindow;
let walkInterval = null;
let baseX = null;
let baseY = null;
let MOVE_RANGE_H = mainConfig.MOVE_RANGE_H;
let MOVE_RANGE_V = mainConfig.MOVE_RANGE_V;

app.on('ready', () => {
    const config = loadConfig();

    MOVE_RANGE_H = MOVE_RANGE_H * config.MOVE_RANGE ?? MOVE_RANGE_H;
    MOVE_RANGE_V = MOVE_RANGE_V * config.MOVE_RANGE ?? MOVE_RANGE_V;

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
            preload: path.join(__dirname, 'js', 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
        },
    });
    mainWindow.loadFile('index.html');
    // mainWindow.webContents.openDevTools({ mode: 'detach' });

    mainWindow.on('close', () => {
        stopWalking();
        const bounds = mainWindow.getBounds();
        saveConfig(bounds);
    });

});

// メニュー
ipcMain.on('show-context-menu', (event) => {
    stopWalking();
    const config = loadConfig();
    const template = [
        {
            label: '表示サイズ',
            submenu: [
                {
                    label: '小',
                    type: 'radio',
                    checked: mainWindow.getBounds().width === 150,
                    click: () => {
                        mainWindow.setMinimumSize(0, 0);
                        mainWindow.setMaximumSize(10000, 10000);
                        mainWindow.setSize(150, 150);
                        mainWindow.setMinimumSize(150, 150);
                    }
                },
                {
                    label: '中',
                    type: 'radio',
                    checked: mainWindow.getBounds().width === 300,
                    click: () => {
                        mainWindow.setMinimumSize(0, 0);
                        mainWindow.setMaximumSize(10000, 10000);
                        mainWindow.setSize(300, 300);
                        mainWindow.setMinimumSize(300, 300);
                    }
                },
                {
                    label: '大',
                    type: 'radio',
                    checked: mainWindow.getBounds().width === 500,
                    click: () => { mainWindow.setSize(500, 500); }
                },
            ]
        },
        {
            label: '移動範囲',
            submenu: [
                {
                    label: '小',
                    type: 'radio',
                    checked: config.MOVE_RANGE === 1.0,
                    click: () => {
                        saveConfig({ MOVE_RANGE: 1.0 });
                        MOVE_RANGE_H = mainConfig.MOVE_RANGE_H * 1.0;
                        MOVE_RANGE_V = mainConfig.MOVE_RANGE_V * 1.0;
                    }
                },
                {
                    label: '中',
                    type: 'radio',
                    checked: config.MOVE_RANGE === 1.5,
                    click: () => {
                        saveConfig({ MOVE_RANGE: 1.5 });
                        MOVE_RANGE_H = mainConfig.MOVE_RANGE_H * 1.5;
                        MOVE_RANGE_V = mainConfig.MOVE_RANGE_V * 1.5;
                    }
                },
                {
                    label: '大',
                    type: 'radio',
                    checked: config.MOVE_RANGE === 2.0,
                    click: () => {
                        saveConfig({ MOVE_RANGE: 2.0 });
                        MOVE_RANGE_H = mainConfig.MOVE_RANGE_H * 2.0;
                        MOVE_RANGE_V = mainConfig.MOVE_RANGE_V * 2.0;
                    }
                }
            ]
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
    stopWalking();
    app.quit();
});

// ドラッグイベント
ipcMain.handle('get-window-bounds', () => {
    stopWalking();
    return mainWindow.getBounds();
});

ipcMain.on('move-window', (event, { x, y, width, height }) => {
    stopWalking();
    mainWindow.setBounds({
        x,
        y,
        width,
        height
    });
    baseX = mainWindow.getBounds().x;
    baseY = mainWindow.getBounds().y;
});


ipcMain.on('start-walking', (event, { duration, direction, VA }) => {
    if (!mainWindow) return;
    if (walkInterval) {
        clearInterval(walkInterval);
        walkInterval = null;
    }
    if (baseX === null) {
        baseX = mainWindow.getBounds().x;
    }
    if (baseY === null) {
        baseY = mainWindow.getBounds().y;
    }

    let elapsed = 0;
    let step = 40;
    let speed = 1;
    if (direction == "left" || direction == "down") {
        speed = -1;
    }

    walkInterval = setInterval(() => {
        if (elapsed >= duration) {
            clearInterval(walkInterval);
            walkInterval = null;
            return;
        }
        const bounds = mainWindow.getBounds();
        let newX = bounds.x;
        let newY = bounds.y;
        if (VA == "horizontal") {
            newX += speed;
            if (Math.abs(newX - baseX) <= MOVE_RANGE_H) {
                mainWindow.setBounds({
                    x: newX,
                    y: newY,
                    width: bounds.width,
                    height: bounds.height
                });
            }
        } else if (VA == "vertical") {
            step = 160;
            newY += speed;
            if (Math.abs(newY - baseY) <= MOVE_RANGE_V) {
                mainWindow.setBounds({
                    x: newX,
                    y: newY,
                    width: bounds.width,
                    height: bounds.height
                });
            }
        }

        elapsed += step;
    }, step);
});

ipcMain.on('stop-walking', () => {
    if (walkInterval) {
        clearInterval(walkInterval);
        walkInterval = null;
    }
});
