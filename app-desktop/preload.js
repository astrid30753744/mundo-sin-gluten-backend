const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('appInfo', { name: 'Mundo Sin Gluten', version: '1.0.0' });
