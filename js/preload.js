const { contextBridge, ipcRenderer } = require('electron');

const fs = require("fs");
const confpath = require('path');
const configPath = confpath.join(__dirname, "..", "config", "config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
contextBridge.exposeInMainWorld("appConfig", config);

contextBridge.exposeInMainWorld('electronAPI', {
    showContextMenu: () => ipcRenderer.send('show-context-menu'),
    closeApp: () => ipcRenderer.send('close-app'),
    moveWindow: ({ x, y, width, height }) => ipcRenderer.send('move-window', { x, y, width, height }),
    getWindowBounds: () => ipcRenderer.invoke('get-window-bounds'),
});
