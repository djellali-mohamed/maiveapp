import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDatabase, closeDatabase } from '../src/db/migrate';
import { setupProductHandlers } from './handlers/products.handler';
import { setupSalesHandlers } from './handlers/sales.handler';
import { setupCustomerHandlers } from './handlers/customers.handler';
import { setupReportHandlers } from './handlers/reports.handler';
import { setupPrinterHandlers } from './handlers/printer.handler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 1200,
    minHeight: 700,
    title: 'MAIVÉ Caisse',
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    backgroundColor: '#F5F0E8',
    show: false,
  });

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialize database when app is ready
app.whenReady().then(() => {
  // Initialize database
  try {
    getDatabase();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    dialog.showErrorBox('Database Error', 'Failed to initialize the database. Please check the logs.');
  }

  // Setup IPC handlers
  setupProductHandlers();
  setupSalesHandlers();
  setupCustomerHandlers();
  setupReportHandlers();
  setupPrinterHandlers();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  closeDatabase();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  closeDatabase();
});

// Handle database backup
ipcMain.handle('db:backup', async () => {
  try {
    const db = getDatabase();
    const backupPath = path.join(app.getPath('downloads'), `maive-pos-backup-${Date.now()}.db`);
    db.backup(backupPath);
    return { success: true, path: backupPath };
  } catch (error) {
    console.error('Backup failed:', error);
    return { success: false, error: String(error) };
  }
});

// Handle app version
ipcMain.handle('app:version', () => {
  return app.getVersion();
});
