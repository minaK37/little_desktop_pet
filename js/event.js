let MIN_WAIT = null;
let MAX_WAIT = null;
let DEFAULT_IMG = null;
let DRAG_IMG = null;
let idleImages = [];

let idleTimer = null;
let isDragging = false;

fetch("config/config.json")
    .then(res => res.json())
    .then(config => {
        MAX_WAIT = config.MAX_WAIT;
        DEFAULT_IMG = config.DEFAULT_IMG;
        DRAG_IMG = config.DRAG_IMG;
        idleImages = config.idleImages;
        setupEvents();
        startIdleCycle();
    });

function setupEvents() {
    // window.addEventListener('DOMContentLoaded', () => {
    const menu_button = document.getElementById('menu_button');
    const menu = document.getElementById('menu');
    const mascot = document.getElementById('mascot');
    const app_colse = document.getElementById('app_colse');

    // メニュー
    menu_button.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.electronAPI) {
            window.electronAPI.showContextMenu();
        } else {
            console.error("electronAPI が存在しません");
        }
    });
    // ×ボタン
    app_colse.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.electronAPI) {
            window.electronAPI.closeApp();
        } else {
            console.error("electronAPI が存在しません");
        }
    });


    // ドラッグイベント    
    let offset = { x: 0, y: 0 };
    let windowPos = { x: 0, y: 0 };

    mascot.addEventListener('mousedown', async (e) => {
        if (e.button !== 0) return;

        isDragging = true;
        clearTimeout(idleTimer);
        mascot.src = DRAG_IMG;

        const bounds = await window.electronAPI.getWindowBounds();
        windowPos = { x: bounds.x, y: bounds.y };
        offset = { x: e.screenX - bounds.x, y: e.screenY - bounds.y };

        menu.classList.add("hovered");
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const x = Number(e.screenX - offset.x);
        const y = Number(e.screenY - offset.y);

        if (!isNaN(x) && !isNaN(y)) {
            window.electronAPI.moveWindow({ x, y });
        }
    });

    window.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        mascot.src = DEFAULT_IMG;
        menu.classList.remove("hovered");
        startIdleCycle();
    });
    // });
};

function pickRandomImage() {
    const totalWeight = idleImages.reduce((sum, img) => sum + img.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const img of idleImages) {
        if (rand < img.weight) {
            return img.src;
        }
        rand -= img.weight;
    }
    return DEFAULT_IMG;
}
function startIdleCycle() {
    clearTimeout(idleTimer);
    const wait = MIN_WAIT + Math.random() * (MAX_WAIT - MIN_WAIT);
    idleTimer = setTimeout(() => {
        if (!isDragging) {
            mascot.src = pickRandomImage();
            // 次の切替を再度セット
            startIdleCycle();
        }
    }, wait);
}
