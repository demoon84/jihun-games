const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopApi', {
  selectProjectFolder: () => ipcRenderer.invoke('project:select-folder'),
  scanProject: (projectPath) => ipcRenderer.invoke('project:scan', projectPath),
  getWorkspaceRoot: () => ipcRenderer.invoke('project:get-workspace-root'),
  listGameFolders: (projectPath) => ipcRenderer.invoke('project:list-game-folders', projectPath),
  createGameFolder: (payload) => ipcRenderer.invoke('project:create-game-folder', payload),
  deleteGameFolder: (payload) => ipcRenderer.invoke('project:delete-game-folder', payload),
  openPath: (targetPath) => ipcRenderer.invoke('project:open-path', targetPath),
  openExternalUrl: (targetUrl) => ipcRenderer.invoke('project:open-external-url', targetUrl),
  loadProjects: () => ipcRenderer.invoke('projects:load'),
  discoverLocalProjects: () => ipcRenderer.invoke('projects:discover-local'),
  saveProjects: (store) => ipcRenderer.invoke('projects:save', store),
  runProjectScript: (payload) => ipcRenderer.invoke('project:run-script', payload),
  runProjectGemini: (payload) => ipcRenderer.invoke('project:run-gemini', payload),
  deployProjectToVercel: (payload) => ipcRenderer.invoke('project:deploy-vercel', payload),
  createGeminiTerminalSession: (payload) => ipcRenderer.invoke('terminal:create-gemini-session', payload),
  writeGeminiTerminalSession: (payload) => ipcRenderer.invoke('terminal:write', payload),
  resizeGeminiTerminalSession: (payload) => ipcRenderer.invoke('terminal:resize', payload),
  closeGeminiTerminalSession: (payload) => ipcRenderer.invoke('terminal:close', payload),
  onGeminiTerminalData: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('terminal:data', listener);
    return () => ipcRenderer.removeListener('terminal:data', listener);
  },
  onGeminiTerminalExit: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('terminal:exit', listener);
    return () => ipcRenderer.removeListener('terminal:exit', listener);
  },
  onProjectDeployProgress: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('project:deploy-progress', listener);
    return () => ipcRenderer.removeListener('project:deploy-progress', listener);
  },
});
