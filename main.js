const { app, BrowserWindow, Menu, ipcMain, MenuItemConstructorOptions } = require('electron');
const path = require('path');
let splashWin;
let win;
const windowStateKeeper = require('electron-window-state');
function createSplash() {
    splashWin = new BrowserWindow({
        frame: false,
        width: 800,
        height: 322,
        transparent: true,
        alwaysOnTop: true,
    });

    splashWin.loadFile('src/splash.html');
}

app.whenReady().then(() => {
    // スプラッシュを最初に表示
    createSplash();
    setTimeout(() => {

        createWindow();
    }, 4000); // フェード終了待ち

})
// ================================
// メインウィンドウ
// ================================
function createWindow() {

    // ① 前回のウィンドウ状態を読み込む
    let state = windowStateKeeper({
        defaultWidth: 1400,
        defaultHeight: 900
    });

    // ② ウィンドウを状態付きで作成
    win = new BrowserWindow({
        x: state.x,
        y: state.y,
        width: state.width,
        height: state.height,
        minWidth: 800,
        minHeight: 600,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'src/preload.js'),
        },
    });
    win.loadFile('src/index.html');

    // ③ 読み込み完了後に表示
    win.webContents.once('did-finish-load', () => {
        // フェードアウトするならここでトリガー
        splashWin.webContents.send('fade-out');
        splashWin.close(); // 消す

        setTimeout(() => {
            if (state.isMaximized) {
                win.maximize();      // 前回最大化状態なら最大化して開く
            }
            win.show();    // メイン表示
        }, 1000); // フェード終了待ち
    });
    // ④ 状態の監視（閉じるたびに自動保存）
    state.manage(win);


    // デベロッパーツール（必要ならONに）
    // win.webContents.openDevTools();

    // ================================
    // メニューバー（AE風：最小構成）
    // ================================
    const template = [
        // -----------------------------
        // macOSのアプリメニュー
        // -----------------------------
        ...(process.platform === 'darwin'
            ? [{
                label: app.name,
                submenu: [
                    { role: 'about' },
                    { type: 'separator' },
                    { role: 'hide' },
                    { role: 'hideothers' },
                    { type: 'separator' },
                    { role: 'quit' }
                ],
            }]
            : []),

        // -----------------------------
        // ファイル (F)
        // -----------------------------
        {
            label: 'ファイル(F)',
            submenu: [
                {
                    label: '動画を開く…',
                    accelerator: 'Ctrl+O',
                    click: () => win.webContents.send('menu-open-video'),
                },
                {
                    label: '字幕を開く（.srv3 / .ass）…',
                    accelerator: 'Ctrl+Shift+O',
                    click: () => win.webContents.send('menu-open-subtitle'),
                },
                { type: 'separator' },
                {
                    label: 'プロジェクト保存',
                    accelerator: 'Ctrl+S',
                    click: () => win.webContents.send('menu-save-project'),
                },
                {
                    label: '字幕を書き出し（SRV3）…',
                    accelerator: 'Ctrl+E',
                    click: () => win.webContents.send('menu-export-srv3'),
                },
                { type: 'separator' },
                { role: 'quit' },
            ],
        },

        // -----------------------------
        // 編集 (E)
        // -----------------------------
        {
            label: '編集(E)',
            submenu: [
                { role: 'undo', accelerator: 'Ctrl+Z', label: '元に戻す' },
                { role: 'redo', accelerator: 'Ctrl+Shift+Z', label: 'やり直す' },
                { label: 'ヒストリー', click: () => win.webContents.send('menu-open-github') },
                { type: 'separator' },
                { role: 'cut', accelerator: 'Ctrl+X', label: 'カット(T)' },
                { role: 'copy', accelerator: 'Ctrl+C', label: 'コピー(C)' },
                { label: 'プロパティリンクと一緒にコピー', accelerator: 'Ctrl+Alt+C', click: () => win.webContents.send('menu-open-github') },
                { label: '相対的なプロパティリンクと一緒にコピー', click: () => win.webContents.send('menu-open-github') },
                { label: 'エクスプレッションのみをコピー', click: () => win.webContents.send('menu-open-github') },
                { role: 'paste', accelerator: 'Ctrl+V', label: 'ペースト(P)' },
                { label: '反転したキーフレームをペースト(P)', click: () => win.webContents.send('menu-open-github') },
                { role: 'delete', accelerator: 'Delete', label: '消去(E)' },
                { type: 'separator' },
                {
                    label: '複製',
                    accelerator: 'Ctrl+D',
                    click: () => win.webContents.send('menu-duplicate-layer'),
                },
            ],
        },

        // -----------------------------
        // コンポジション (C)
        // -----------------------------
        {
            label: 'コンポジション(C)',
            submenu: [
                {
                    label: 'キャンバス設定…',
                    click: () => win.webContents.send('menu-canvas-settings'),
                },
                {
                    label: 'ガイドライン表示',
                    click: () => win.webContents.send('menu-toggle-guides'),
                },
                {
                    label: 'スナップを有効化',
                    click: () => win.webContents.send('menu-toggle-snap'),
                },
            ],
        },

        // -----------------------------
        // レイヤー (L)
        // -----------------------------
        {
            label: 'レイヤー(L)',
            submenu: [
                {
                    label: '新規字幕レイヤー',
                    click: () => win.webContents.send('menu-new-layer'),
                },

                { type: 'separator' },
                {
                    label: '削除',
                    click: () => win.webContents.send('menu-delete-layer'),
                },
                { type: 'separator' },
                {
                    label: '前面へ',
                    click: () => win.webContents.send('menu-bring-front'),
                },
                {
                    label: '背面へ',
                    click: () => win.webContents.send('menu-send-back'),
                },
            ],
        },

        // -----------------------------
        // エフェクト (T)
        // -----------------------------
        {
            label: 'エフェクト(T)',
            submenu: [
                {
                    label: 'フォント設定…',
                    click: () => win.webContents.send('menu-edit-font'),
                },
                {
                    label: '色の設定…',
                    click: () => win.webContents.send('menu-edit-color'),
                },
                {
                    label: 'アウトライン（縁）設定…',
                    click: () => win.webContents.send('menu-edit-outline'),
                },
                {
                    label: 'シャドウ設定…',
                    click: () => win.webContents.send('menu-edit-shadow'),
                },
                {
                    label: '背景ボックス設定…',
                    click: () => win.webContents.send('menu-edit-box'),
                },
            ],
        },

        // -----------------------------
        // アニメーション (A)
        // -----------------------------
        {
            label: 'アニメーション(A)',
            submenu: [
                {
                    label: 'フェードイン',
                    click: () => win.webContents.send('menu-anim-fadein'),
                },
                {
                    label: 'フェードアウト',
                    click: () => win.webContents.send('menu-anim-fadeout'),
                },
                {
                    label: '位置アニメーション',
                    click: () => win.webContents.send('menu-anim-position'),
                },
            ],
        },

        // -----------------------------
        // ビュー (V)
        // -----------------------------
        {
            label: 'ビュー(V)',
            submenu: [
                { role: 'reload', label: 'リロード' },
                { role: 'toggledevtools', label: '開発者ツール' },
                { type: 'separator' },
                {
                    label: '100% 表示',
                    click: () => win.webContents.send('menu-view-100'),
                },
                {
                    label: 'ズームイン',
                    accelerator: 'Ctrl+=',
                    click: () => win.webContents.send('menu-view-zoom-in'),
                },
                {
                    label: 'ズームアウト',
                    accelerator: 'Ctrl+-',
                    click: () => win.webContents.send('menu-view-zoom-out'),
                },
            ],
        },

        // -----------------------------
        // ウィンドウ (W)
        // -----------------------------
        {
            label: 'ウィンドウ(W)',
            submenu: [
                { role: 'minimize', label: '最小化' },
                { role: 'close', label: '閉じる' },
            ],
        },

        // -----------------------------
        // ヘルプ (H)
        // -----------------------------
        {
            label: 'ヘルプ(H)',
            submenu: [
                { role: 'about', label: 'YT Effects について…' },
                {
                    label: 'フォロー', submenu: [
                        { label: 'Twitter (@toki1703)', click: () => { require('electron').shell.openExternal('https://twitter.com/toki1703'); } },
                        { label: 'GitHub (@toki1703)', click: () => { require('electron').shell.openExternal('https://github.com/toki1703'); } },
                        { label: 'Instagram (@toki_1703_)', click: () => { require('electron').shell.openExternal('https://instagram.com/toki_1703_'); } },
                        { label: 'YouTube (@toki1703)', click: () => { require('electron').shell.openExternal('https://www.youtube.com/@toki1703'); } },
                    ]
                },

                { type: 'separator' },
                { label: 'YT Effects ヘルプ…', accelerator: 'F1', click: () => win.webContents.send('menu-open-github') },
                { label: 'アニメーションプリセット…', click: () => win.webContents.send('menu-open-github') },
                { label: 'キーボードショートカット…', click: () => win.webContents.send('menu-open-github') },
                { type: 'separator' },
                { label: 'システムの互換性レポート…', click: () => win.webContents.send('menu-open-github') },
                { label: 'ログを有効にする', click: () => win.webContents.send('menu-open-github') },
                { label: 'ログファイルを表示', click: () => win.webContents.send('menu-open-github') },
                { type: 'separator' },
                { label: 'GitHub Discussion', click: () => win.webContents.send('https://github.com/toki1703/YT-Effects/discussions') },
                { label: 'Issue を報告', click: () => win.webContents.send('menu-open-issue') },
                { type: 'separator' },
                { label: '更新を確認', click: () => win.webContents.send('menu-open-update') },
            ],
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

}

// // ================================
// // アプリ起動
// // ================================
// app.whenReady().then(() => {
//   createWindow();
// });
