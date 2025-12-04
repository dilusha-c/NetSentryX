const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const path = require("path");

let backendProcess;

function createWindow() {
  const win = new BrowserWindow({
    width: 1300,
    height: 780,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  const indexPath = path.join(__dirname, "..", "dashboard", "dist", "index.html");
  win.loadFile(indexPath);
  win.removeMenu();
}

function startBackend() {
  const apiDir = path.resolve(__dirname, "..");
  backendProcess = spawn("uvicorn", ["api.app:app", "--host", "127.0.0.1", "--port", "8000", "--reload"], {
    cwd: apiDir,
    shell: true,
    env: { ...process.env },
  });
  backendProcess.stdout.on("data", (chunk) => process.stdout.write(chunk));
  backendProcess.stderr.on("data", (chunk) => process.stderr.write(chunk));
  backendProcess.on("close", (code) => console.log(`Backend exited (${code})`));
}

app.whenReady().then(() => {
  startBackend();
  createWindow();
});

app.on("window-all-closed", () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});
