contextBridge.exposeInMainWorld("electronAPI", {
  onFadeOut: (callback) => ipcRenderer.on("fade-out", callback),
});