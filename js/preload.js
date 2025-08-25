const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    showContextMenu: () => ipcRenderer.send('show-context-menu'),
    closeApp: () => ipcRenderer.send('close-app'),
    moveWindow: ({ x, y }) => ipcRenderer.send('move-window', { x, y }),
    getWindowBounds: () => ipcRenderer.invoke('get-window-bounds')
});
